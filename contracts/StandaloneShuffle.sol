// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.18;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "./GameDefs.sol";

import "./interfaces/IZkshuffleAggregateKeyVerifier.sol";
import "./interfaces/IZkshuffleEncryptAndShuffle5Verifier.sol";
import "./interfaces/IZkshuffleDecrypt5Verifier.sol";


/*
    Contract dedicated to zk shuffle

    Start state: Lobby
        -> agg -> ens -> decrypt 
        -> day_vote  done 

    Input: player addresses and everyone's input
    Output: deck 

 */

contract StandaloneShuffle is Ownable {

    // The address and interface of the contract that validates the off-chain key aggregation computation 
    IZkshuffleAggregateKeyVerifier zkshuffleAggregateKeyVerifier; 
    IZkshuffleEncryptAndShuffle5Verifier zkshuffleEncryptAndShuffle5Verifier;
    IZkshuffleDecrypt5Verifier zkshuffleDecrypt5Verifier;

    // Game state and the list of players
    GameState public gameState;
    address[] public playerAddresses;
    uint public nPlayers;   

    // Key aggregation
    mapping(address => uint256) public playerPubKeyMapping;   
    uint256[] public playerPubKeys; 
    uint256 public aggPubKey;
    uint256 public nKeysAggregated;
    uint256 public nPlayers_encryptedAndShuffled;
    uint256 public nPlayers_decrypted;
    
    // deck
    uint[2][] public deck;

    event EnterAggregateKey(uint nPlayers, address[] playerAddresses);   // enter key aggregation phase 
    event NextPlayerToAggregateKey(uint playerIndex, uint currentAggKey);
    event PlayerAggregatedKey(uint playerIndex, uint prevAggKey, uint playerPubKey, uint newAggKey);

    event EnterEncryptAndShuffle();
    event NextPlayerToEncryptAndShuffle(uint playerIndex);
    event PlayerEncryptedAndShuffled(uint playerIndex);

    event EnterDecrypt();
    event NextPlayerToDecrypt(uint playerIndex);
    event PlayerDecrypted(uint playerIndex);

    event ZKShuffleDone();


    // The contructor mostly set up the ZK verifiers.
    constructor(address _zkshuffleAggregateKeyVerifier, 
                address _zkshuffleEncryptAndShuffle5Verifier,
                address _zkshuffleDecrypt5Verifier) {

        zkshuffleAggregateKeyVerifier = IZkshuffleAggregateKeyVerifier(_zkshuffleAggregateKeyVerifier);
        zkshuffleEncryptAndShuffle5Verifier = IZkshuffleEncryptAndShuffle5Verifier(_zkshuffleEncryptAndShuffle5Verifier);
        zkshuffleDecrypt5Verifier = IZkshuffleDecrypt5Verifier(_zkshuffleDecrypt5Verifier);

        // not a real lobby, just a dummy state 
        gameState = GameState.LOBBY;
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

    // get player's index given its address
    function getPlayerIndex(address playerAddress) public view returns (uint) {
        for (uint i=0; i<nPlayers; i++) {
            if (playerAddresses[i] == playerAddress) {
                return i;
            }
        }
        require(false, "Player not found!");
    }

    function getNPlayers() public view returns (uint) {
        return nPlayers;
    }


    function returnToLobby() public onlyOwner {
        gameState = GameState.LOBBY;
        delete playerAddresses;
    }

    /*
     * lobby
     */
    // The owner can reset the game. Later we should expand this to multiple games in parallel.
    function startShuffle(address[] calldata _playerAddresses) public onlyOwner {

        gameState = GameState.KEY_AGGREGATION;
    
        nPlayers = _playerAddresses.length;
        delete playerAddresses;
        playerAddresses = new address[](nPlayers);
        for (uint i=0; i< nPlayers; i++) {
            playerAddresses[i] = _playerAddresses[i];
        }

        delete playerPubKeys;
        nKeysAggregated = 0;
        nPlayers_encryptedAndShuffled = 0;
        nPlayers_decrypted = 0;
        aggPubKey = 1;         // initial El Gamal public key

        deck = new uint[2][](nPlayers);        
        for (uint i=0; i<nPlayers; i++) {
            deck[i][0] = 1;
            deck[i][1] = 1;
        }
        // set the first card to be mafia
        // if we have more than 5 players, maybe more than 1 mafia card is needed
        // TODO
        deck[0][1] = 2; 

        emit EnterAggregateKey(nPlayers, playerAddresses);
        emit NextPlayerToAggregateKey(nKeysAggregated, aggPubKey);
    }


    /*
        zkshuffle: key aggregation
     */ 

    // A player aggregates the key
    function aggregateKey(KeyAggregationProof calldata _proof) public {

        address playerAddress = msg.sender;
        require(playerAddress == playerAddresses[nKeysAggregated], string.concat(
            "You are not the next player who needs to aggregate the key! The next player in turn is",
            Strings.toHexString(uint256(uint160(playerAddresses[nKeysAggregated])), 20),
            "  index ", 
            Strings.toString(nKeysAggregated)));

        require(_proof.prevAggKey == aggPubKey);  // The prevAggKey match. 

        // Validate the off-chain key aggregation
        uint[3] memory pubData = [_proof.newAggKey, _proof.playerPubKey, _proof.prevAggKey];
        require(zkshuffleAggregateKeyVerifier.verifyProof(_proof.a, _proof.b, _proof.c, pubData),
            "Invalid proof (aggregateKey)!"
        );

        // Update key aggregation state.
        aggPubKey = _proof.newAggKey;
        emit PlayerAggregatedKey(nKeysAggregated, _proof.prevAggKey, _proof.playerPubKey, aggPubKey);
        nKeysAggregated++;
        
        // this is important, record this so that later we can use this to snark the player
        playerPubKeyMapping[playerAddress] = _proof.playerPubKey;  
        playerPubKeys.push(_proof.playerPubKey);

        if (nKeysAggregated < nPlayers) {
            emit NextPlayerToAggregateKey(nKeysAggregated, aggPubKey);

        // Once all players aggregated key, shuffle.
        } else {
            gameState = GameState.SHUFFLE;
            emit EnterEncryptAndShuffle();
            emit NextPlayerToEncryptAndShuffle (nPlayers_encryptedAndShuffled);
        }
    }



    /*
        zkshuffle: encrypt and shuffle 
     */ 
    function encryptAndShuffle(EncryptAndShuffleProof calldata _proof) public {

        // checking invariants 
        require(gameState == GameState.SHUFFLE, "Not in the shuffle stage!");

        address playerAddress = msg.sender;
        require(playerAddress == playerAddresses[nPlayers_encryptedAndShuffled], string.concat(
            "You are not the next player who needs to encrypt and shuffle! The next player in turn is",
            Strings.toHexString(uint256(uint160(playerAddresses[nPlayers_encryptedAndShuffled])), 20)));

        require(_proof.deckToMask.length == nPlayers, "#cards != nPlayers");
        require(_proof.maskedDeck.length == nPlayers, "#cards != nPlayers");
        
        for (uint i=0; i<nPlayers; i++) {
            require(deck[i][0] == _proof.deckToMask[i][0] && deck[i][1] == _proof.deckToMask[i][1], 
                "card to mask does not align!");
        }


        // validate proof
        if (nPlayers == 5) {
            uint[21] memory publicSignals;

            for (uint i=0; i < nPlayers; i++) {
                publicSignals[i*2] = _proof.maskedDeck[i][0];
                publicSignals[i*2+1] = _proof.maskedDeck[i][1];
            }
            uint k = nPlayers * 2;
            publicSignals[k] = _proof.aggPubKey;
            for (uint i=0; i < nPlayers; i++) {
                publicSignals[k + 1 + i*2] = _proof.deckToMask[i][0];
                publicSignals[k + 1 + i*2+1] = _proof.deckToMask[i][1];
            }

            require(zkshuffleEncryptAndShuffle5Verifier.verifyProof(_proof.a, _proof.b, _proof.c, publicSignals),
                "Invalid proof (encryptAndShuffle)!"
            );
        }


        // Update deck
        for (uint i=0; i<nPlayers; i++) {
            deck[i][0] = _proof.maskedDeck[i][0];
            deck[i][1] = _proof.maskedDeck[i][1];
        }

        emit PlayerEncryptedAndShuffled(nPlayers_encryptedAndShuffled);
        nPlayers_encryptedAndShuffled ++;

        if (nPlayers_encryptedAndShuffled < nPlayers) {
            emit NextPlayerToEncryptAndShuffle(nPlayers_encryptedAndShuffled);
        } else {
            gameState = GameState.DECRYPT;
            emit EnterDecrypt();
            emit NextPlayerToDecrypt(nPlayers_decrypted);
        }
    }


    /*
     * zkshuffle: decrypt 
     */
    function decrypt (DecryptProof calldata _proof) public {

        // checking invariants 
        require(gameState == GameState.DECRYPT, "Not in the decrypt phase!");

        address playerAddress = msg.sender;
        require(playerAddress == playerAddresses[nPlayers_decrypted], string.concat(
            "You are not the next player who needs to decrypt! The next player in turn is",
            Strings.toHexString(uint256(uint160(playerAddresses[nPlayers_decrypted])), 20)));

        require(_proof.deckToUnmask.length == nPlayers - 1, "#cards != nPlayers - 1");
        require(_proof.unmaskedDeck.length == nPlayers - 1, "#cards != nPlayers - 1");
        require(_proof.playerPubKey == playerPubKeyMapping[playerAddress], "player public key mismatch!");
        
        // validate proof
        if (nPlayers == 5) {
            uint[17] memory publicSignals;   // n-1 cards

            publicSignals[0] = _proof.playerPubKey;
            for (uint i=0; i < nPlayers-1; i++) {
                publicSignals[1 + i*2] = _proof.unmaskedDeck[i][0];
                publicSignals[1 + i*2+1] = _proof.unmaskedDeck[i][1];
            }
            uint k = (nPlayers - 1) * 2 + 1;
            for (uint i=0; i < nPlayers-1; i++) {
                publicSignals[k + i*2] = _proof.deckToUnmask[i][0];
                publicSignals[k + i*2+1] = _proof.deckToUnmask[i][1];
            }

            require(zkshuffleDecrypt5Verifier.verifyProof(_proof.a, _proof.b, _proof.c, publicSignals),
                "Invalid proof (decrypt)!"
            );
        }

        // update deck
        uint deckIndex = 0;
        for (uint i=0; i<nPlayers-1; ) {
            if (i == nPlayers_decrypted) {  // skip player's card
                deckIndex++;
            }

            // for simplicity, here we put deck updating and invariant checking together
            require(deck[deckIndex][0] == _proof.deckToUnmask[i][0] && 
                    deck[deckIndex][1] == _proof.deckToUnmask[i][1], 
                "card to unmask does not align!");

            deck[deckIndex][0] = _proof.unmaskedDeck[i][0];
            deck[deckIndex][1] = _proof.unmaskedDeck[i][1];

            i++;
            deckIndex++;
        }

        emit PlayerDecrypted(nPlayers_decrypted);
        nPlayers_decrypted++;

        if (nPlayers_decrypted < nPlayers) {
            emit NextPlayerToDecrypt(nPlayers_decrypted);
        } else {
            gameState = GameState.DAY_VOTE;
            emit ZKShuffleDone();
        }
    }
}

