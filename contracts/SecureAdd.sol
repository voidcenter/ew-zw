// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.18;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "./GameDefs.sol";

import "./interfaces/IWincheckCreateShares5Verifier.sol";
import "./interfaces/IWincheckAggregateShares5Verifier.sol";


/*
    Contract dedicated to zk shuffle

    Start state: Lobby
        -> DAY_WINCHECK_CREATE -> DAY_WINCHECK_AGGREGATE 
        -> VILLAGER_WON  done 

    ^ really hacky, 

    Input: player addresses and everyone's input
    Output: sum1, sum2 


    if there are < n player eligible to vote
    they will vote, then all n players help 
    aggregate. 

    this reaults in nEligible * nPlayers shares
    offset will be offset * nEligible * nPlayers

 */

contract SecureAdd is Ownable {

    // The address and interface of the contract that validates the off-chain key aggregation computation 
    IWincheckCreateShares5Verifier wincheckCreateShares5Verifier;
    IWincheckAggregateShares5Verifier wincheckAggregateShares5Verifier;

    // Game state and the list of players
    GameState public state;
    address[] public playerAddresses;
    uint public nPlayers;   
    bool[] public playerStillInGame;
    uint public nPlayersStillInGame;

    // Key aggregation
    mapping(address => uint256) public playerPubKeyMapping;   
    uint256[] public playerPubKeys; 
    
    // deck
    uint[2][] public deck;

    // wincheck
    uint256 public nPlayers_submittedShares;
    bool[] public playerSubmittedShares;
    uint256[2][][] public secureAddShares1;
    uint256[2][][] public secureAddShares2;

    uint public nPlayers_aggregatedShares;
    bool[] public playerAggregatedShares;
    uint[] public aggregatedSums1;
    uint[] public aggregatedSums2;
    

    event Enter_Wincheck_Create();
    event Wincheck_Create(uint playerIndex);
    event Enter_Wincheck_Aggregate();
    event Wincheck_Aggregate(uint playerIndex, uint sum1, uint sum2);

    event SecureAdd_done();

    // The contructor mostly set up the ZK verifiers.
    constructor(address _wincheckCreateShares5Verifier,
                address _wincheckAggregateShares5Verifier) {

        wincheckCreateShares5Verifier = IWincheckCreateShares5Verifier(_wincheckCreateShares5Verifier);
        wincheckAggregateShares5Verifier = IWincheckAggregateShares5Verifier(_wincheckAggregateShares5Verifier);

        // not a real lobby, just a dummy state 
        state = GameState.LOBBY;
    }
    
    /*
     * getters
     */
    function getDeck() public view returns (uint[2][] memory) {
        return deck;
    }

    function getPlayerAddresses() public view returns (address[] memory) {
        return playerAddresses;
    }

    function getPlayerPubKeys() public view returns (uint256[] memory) {
        return playerPubKeys;
    }

    function getShareValueOffset() public pure returns (uint256) {
        return 100000000;
    }

    // get player's index given its address
    function getPlayerIndex(address playerAddress) public view returns (uint) {
        for (uint i=0; i<nPlayers; i++) {
            if (playerAddresses[i] == playerAddress) {
                return i;
            }
        }
        require(false, "Player not found!");
    }

    function getPlayerSubmittedShares() public view returns (bool[] memory) {
        return playerSubmittedShares;
    }

    function getPlayerAggregatedShares() public view returns (bool[] memory) {
        return playerAggregatedShares;
    }

    function getShares1() public view returns (uint[2][][] memory) {
        return secureAddShares1;
    }

    function getShares2() public view returns (uint[2][][] memory) {
        return secureAddShares2;
    }

    function getNPlayers() public view returns (uint) {
        return nPlayers;
    }

    function getAggregatedSums1() public view returns (uint[] memory) {
        return aggregatedSums1;
    }

    function getAggregatedSums2() public view returns (uint[] memory) {
        return aggregatedSums2;
    }

    function returnToLobby() public onlyOwner {
        state = GameState.LOBBY;
        delete playerAddresses;
        delete playerPubKeys;
        delete deck;
    }

    /*
     * lobby
     */
    // The owner can reset the game. Later we should expand this to multiple games in parallel.
    function startWinCheck(address[] calldata _playerAddresses, 
                            uint[] calldata _playerPubKeys,
                            uint[2][] calldata _deck,
                            bool[] calldata _playerStillInGame, 
                            uint _nPlayersStillInGame) public onlyOwner {
                
        state = GameState.DAY_WINCHECK_CREATE;
    
        nPlayers = _playerAddresses.length;
        nPlayersStillInGame = _nPlayersStillInGame;

        delete playerAddresses;
        playerAddresses = new address[](nPlayers);
        delete playerStillInGame;
        playerStillInGame = new bool[](nPlayers);

        delete playerPubKeys;
        playerPubKeys = new uint[](nPlayers);
        delete deck;
        deck = new uint[2][](nPlayers);

        delete playerSubmittedShares;
        playerSubmittedShares = new bool[](nPlayers);
        delete secureAddShares1;
        secureAddShares1 = new uint[2][][](nPlayers);
        delete secureAddShares2;
        secureAddShares2 = new uint[2][][](nPlayers);

        delete playerAggregatedShares;
        playerAggregatedShares = new bool[](nPlayers);
        delete aggregatedSums1;
        aggregatedSums1 = new uint[](nPlayers);
        delete aggregatedSums2;
        aggregatedSums2 = new uint[](nPlayers);

        uint[2][] memory emptyShares = new uint[2][](nPlayers);
        for (uint i=0; i< nPlayers; i++) {
            emptyShares[i][0] = 0;
            emptyShares[i][1] = 0;
        }

        for (uint i=0; i< nPlayers; i++) {
            playerAddresses[i] = _playerAddresses[i];
            playerStillInGame[i] = _playerStillInGame[i];

            playerPubKeys[i] = _playerPubKeys[i];
            playerPubKeyMapping[playerAddresses[i]] = playerPubKeys[i];  
            deck[i][0] = _deck[i][0];
            deck[i][1] = _deck[i][1];
            playerSubmittedShares[i] = false;
            playerAggregatedShares[i] = false; 

            secureAddShares1[i] = emptyShares;
            secureAddShares2[i] = emptyShares;
        }

        nPlayers_submittedShares = 0;
        nPlayers_aggregatedShares = 0;

        emit Enter_Wincheck_Create();
    }


   /*
     * wincheck: create shares 
     */
    function wincheck_submit_shares (WincheckCreateProof calldata _proof) public {

        // checking invariants 
        require(state == GameState.DAY_WINCHECK_CREATE, "Not in the wincheck_create phase!");

        address playerAddress = msg.sender;
        uint playerIndex = getPlayerIndex(playerAddress);
        require(playerIndex < nPlayers, "Player not in game!");
        require(playerStillInGame[playerIndex], "Player eliminated");

        require(_proof.cardToUnmask[0] == deck[playerIndex][0] &&
                _proof.cardToUnmask[1] == deck[playerIndex][1], 
                "encrypted card in proof is not aligned with the card in record!");

        require(_proof.shareValueOffset == getShareValueOffset(), "share value offset misaligned!");

        for (uint i=0; i<nPlayers; i++) {
            require(playerPubKeys[i] == _proof.pks[i], "player pub key misaligned!");
        }

        require(playerSubmittedShares[playerIndex] == false, "player already submitted shares!");
        require(_proof.shareCiphertexts1.length == nPlayers, "wrong number of shares! (shares ciphertexts 1)");
        require(_proof.shareCiphertexts2.length == nPlayers, "wrong number of shares! (shares ciphertexts 2)");
        

        // prove 
        if (nPlayers == 5) {
            uint[28] memory publicSignals;   // n-1 cards

            for (uint i=0; i < nPlayers; i++) {
                publicSignals[i*2] = _proof.shareCiphertexts1[i][0];
                publicSignals[i*2+1] = _proof.shareCiphertexts1[i][1];
            }

            uint k = nPlayers * 2;
            for (uint i=0; i < nPlayers; i++) {
                publicSignals[k + i*2] = _proof.shareCiphertexts2[i][0];
                publicSignals[k + i*2+1] = _proof.shareCiphertexts2[i][1];
            }

            k = nPlayers * 4;
            publicSignals[k] = _proof.cardToUnmask[0];
            publicSignals[k + 1] = _proof.cardToUnmask[1];
            publicSignals[k + 2] = _proof.shareValueOffset;

            for (uint i=0; i < nPlayers; i++) {
                publicSignals[k + 3 + i] = _proof.pks[i];
            }
            
            require(wincheckCreateShares5Verifier.verifyProof(_proof.a, _proof.b, _proof.c, publicSignals),
                "Invalid proof (wincheck_create)!");

        }

        // update states
        secureAddShares1[playerIndex] = _proof.shareCiphertexts1;
        secureAddShares2[playerIndex] = _proof.shareCiphertexts2;
        playerSubmittedShares[playerIndex] = true;
        nPlayers_submittedShares ++;
        emit Wincheck_Create(playerIndex);

        if (nPlayers_submittedShares == nPlayersStillInGame) {
            state = GameState.DAY_WINCHECK_AGGREGATE;
            emit Enter_Wincheck_Aggregate();
        }
    }

   /*
     * wincheck: create shares 
     */
    function wincheck_aggregate_shares (WincheckAggregateProof memory _proof) public {

        // checking invariants 
        require(state == GameState.DAY_WINCHECK_AGGREGATE, "Not in the wincheck_aggregate phase!");

        address playerAddress = msg.sender;
        uint playerIndex = getPlayerIndex(playerAddress);
        require(playerIndex < nPlayers, "Player not in game!");
        require(!playerAggregatedShares[playerIndex], "no need to aggregate twice");

        require(_proof.shareCiphertexts1.length == nPlayers, "wrong number of shares! (shares ciphertexts 1)");
        require(_proof.shareCiphertexts2.length == nPlayers, "wrong number of shares! (shares ciphertexts 2)");
        
        for (uint i=0; i<nPlayers; i++) {
            // here is player is eliminated, they didn't submit shares
            // their shares will be 0

            require(_proof.shareCiphertexts1[i][0] == secureAddShares1[i][playerIndex][0], "sharesCiphertext mismatch");
            require(_proof.shareCiphertexts1[i][1] == secureAddShares1[i][playerIndex][1], "sharesCiphertext mismatch");
            require(_proof.shareCiphertexts2[i][0] == secureAddShares2[i][playerIndex][0], "sharesCiphertext mismatch");
            require(_proof.shareCiphertexts2[i][1] == secureAddShares2[i][playerIndex][1], "sharesCiphertext mismatch");
        }

        // prove 
        if (nPlayers == 5) {
            uint[22] memory publicSignals;   // n-1 cards

            publicSignals[0] = _proof.sum1;
            publicSignals[1] = _proof.sum2;
            
            for (uint i=0; i < nPlayers; i++) {
                publicSignals[2 + i*2] = _proof.shareCiphertexts1[i][0];
                publicSignals[2 + i*2+1] = _proof.shareCiphertexts1[i][1];
            }

            uint k = nPlayers * 2 + 2;
            for (uint i=0; i < nPlayers; i++) {
                publicSignals[k + i*2] = _proof.shareCiphertexts2[i][0];
                publicSignals[k + i*2+1] = _proof.shareCiphertexts2[i][1];
            }

            require(wincheckAggregateShares5Verifier.verifyProof(_proof.a, _proof.b, _proof.c, publicSignals),
                "Invalid proof (wincheck_create)!");
        }

        // update states
        aggregatedSums1[playerIndex] = _proof.sum1;
        aggregatedSums2[playerIndex] = _proof.sum2;
        playerAggregatedShares[playerIndex] = true;
        nPlayers_aggregatedShares ++;
        emit Wincheck_Aggregate(playerIndex, _proof.sum1, _proof.sum2);

        if (nPlayers_aggregatedShares == nPlayers) {
            state = GameState.VILLAGER_WON;  // hacky
            emit SecureAdd_done();
        }
    }
}

