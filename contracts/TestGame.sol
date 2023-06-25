// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.18;
pragma experimental ABIEncoderV2;

import "./GameDefs.sol";
import "./GameStorage.sol";

// import "./GameLobby.sol";
// import "./ZKShuffle.sol";



contract TestGame is GameStorage {


    event Debug_Deck(uint[2][] deck);
    
    // The contructor mostly set up the ZK verifiers.
    constructor(address _zkShuffle, address _secureAdd) {

        zkShuffle = IStandaloneShuffle(_zkShuffle);
        secureAdd = ISecureAdd(_secureAdd);

        gameState = GameState.LOBBY;

        // returnToLobby();

        // // DEBUG: for encrypt and shuffle 
        // gameState = GameState.SHUFFLE;
        // nPlayers = 5;
        // for (uint i=0; i<5; i++) {
        //     playerAddresses.push(address(bytes20(bytes("C38Ce546549722beF0b8aDca4f8ab45790ae66ac"))));
        // }
        // nKeysAggregated = 0;
        // nPlayers_encryptedAndShuffled = 0;
        // nPlayers_decrypted = 0;
        // aggPubKey = 1;         // initial El Gamal public key

        // deck = new uint[2][](nPlayers);        
        // for (uint i=0; i<nPlayers; i++) {
        //     deck[i][0] = 1;
        //     deck[i][1] = 0;
        // }
        // // set the first card to be mafia
        // // if we have more than 5 players, maybe more than 1 mafia card is needed
        // // TODO
        // deck[0][1] = 1; 


        // // DEBUG: for decrypt 
        // gameState = GameState.DECRYPT;
        // nPlayers = 5;
        // nPlayers_decrypted = 0;
        // deck = new uint[2][](nPlayers);        
        // for (uint i=0; i<nPlayers; i++) {
        //     deck[i][0] = 1605106937065224781048844521794496673014105990096508516566456187247802725574;
        //     deck[i][1] = 7939851064773609795459833408678362396742168611109079717998791413919685319094;
        // }

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

    function getPlayerStillInGame() public view returns (bool[] memory) {
        return playerStillInGame;
    }

    function getDayVotes() public view returns (uint[] memory) {
        return dayVotes;
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

    // function getPlayerSubmittedShares() public view returns (bool[] memory) {
    //     return playerSubmittedShares;
    // }

    // function getShares1() public view returns (uint[2][][] memory) {
    //     return secureAddShares1;
    // }

    // function getShares2() public view returns (uint[2][][] memory) {
    //     return secureAddShares2;
    // }

    function getNPlayers() public view returns (uint) {
        return nPlayers;
    }

    function isPlayerInGame(address playerAddress) public view returns (bool) {
        return playerInGame[playerAddress];
    }

    function getZkShuffleAddress() public view returns (address) {
        return address(zkShuffle);
    }

    /*
     * lobby
     */
    // The owner can reset the game. Later we should expand this to multiple games in parallel.
    function returnToLobby() public onlyOwner {
        gameState = GameState.LOBBY;

        // require(false, 'test');

        // clean up the mappings
        for (uint i=0; i<nPlayers; i++) {
            address player = playerAddresses[i];
            playerPubKeyMapping[player] = 0;
            playerInGame[player] = false;
        }
        delete playerPubKeys;
        nPlayers = 0;
        nPlayersStillInGame = 0;
        // nKeysAggregated = 0;
        // nPlayers_encryptedAndShuffled = 0;
        // nPlayers_decrypted = 0;
        delete deck;
        delete playerStillInGame;
        delete dayVotes;

        // clean up player list
        delete playerAddresses;   // delete its elements  
        emit ReturnToLobby();

        zkShuffle.returnToLobby();
        secureAdd.returnToLobby();
    }

    // A new player joins the game
    function joinGame() public {
        require(gameState == GameState.LOBBY, "You can only join at the LOBBY phase!");

        address player = msg.sender;
        require(playerInGame[player] == false, "You can only join this game once!");    

        playerAddresses.push(player);
        playerInGame[player] = true;
        nPlayers = playerAddresses.length;
        nPlayersStillInGame = nPlayers;
        emit PlayerJoined(nPlayers-1, player, nPlayers);
    }

    // Initialize a game. 
    function startGame() public onlyOwner {
        require(gameState == GameState.LOBBY, "You can only start the game from the LOBBY state!");

        gameState = GameState.KEY_AGGREGATION;
        // nKeysAggregated = 0;
        // nPlayers_encryptedAndShuffled = 0;
        // nPlayers_decrypted = 0;
        // aggPubKey = 1;         // initial El Gamal public key

        deck = new uint[2][](nPlayers);        
        for (uint i=0; i<nPlayers; i++) {
            deck[i][0] = 1;
            deck[i][1] = 1;

            playerStillInGame.push(true);
        }
        // set the first card to be mafia
        // if we have more than 5 players, maybe more than 1 mafia card is needed
        // TODO
        deck[0][1] = 2; 

        emit StartGame(nPlayers, playerAddresses);
        // emit NextPlayerToAggregateKey(nKeysAggregated, aggPubKey);


        // TEST: standalone shuffle 
        zkShuffle.startShuffle(playerAddresses);
        // emit NextPlayerToAggregateKey(nKeysAggregated, aggPubKey);
        

        // DEBUG:  for wincheck
        // gameState = GameState.DAY_WINCHECK_CREATE;
        // require(nPlayers = 5, "nplayers needs to be 5 for testing");

        // deck has everyone's encrypted roles
        // pubkeys are here


        // TODO: nplayers, player pub keys
        // TODO: shares

        // DEBUG  day votes 
        // gameState = GameState.DAY_VOTE;
        // delete dayVotes;
        // dayVotes = new uint[](nPlayers);
        // for (uint i=0; i<nPlayers; i++) {
        //     dayVotes[i] = nPlayers * 10000;
        // }

    }


    // function transferSSOwner(address newO) public {
    //     zkShuffle.transferOwnership(newO);
    // }

    function returnStandaloneShuffleToLobby() public onlyOwner {
        zkShuffle.returnToLobby();
    }

    function zkShuffle_done() public onlyOwner() {
        require(gameState == GameState.KEY_AGGREGATION, "not shuffling");
        require(zkShuffle.gameState() == (uint)(GameState.DAY_VOTE), "shuffling not done");

        playerPubKeys = zkShuffle.getPlayerPubKeys();
        deck = zkShuffle.getDeck();

        // load player pub keys into map
        for (uint i=0; i<nPlayers; i++) {
            playerPubKeyMapping[playerAddresses[i]] = playerPubKeys[i];  
        }

        gameState = GameState.DAY_VOTE;
        emit EnterDayVote();

        delete dayVotes;
        dayVotes = new uint[](nPlayers);
        for (uint i=0; i<nPlayers; i++) {
            dayVotes[i] = nPlayers * 10000;
        }
    }


    // day vote

    function dayVote(uint vote) public {
        uint playerIndex = getPlayerIndex(msg.sender);

        emit PlayerDayVote(playerIndex, vote);

        require(gameState == GameState.DAY_VOTE, "not day voting");
        require(playerIndex >= 0 && playerIndex < nPlayers, "player not in game");
        require(playerStillInGame[playerIndex], "eliminated player can't vote");
        require(vote != playerIndex, "can't vote for self");
        require(vote >= 0 && vote < nPlayers, "voted player not in game");
        require(playerStillInGame[vote], "can't vote for eliminated player");

        emit PlayerDayVote(playerIndex, vote);

        dayVotes[playerIndex] = vote;
        emit PlayerDayVote(playerIndex, vote);
        for (uint i = 0; i<nPlayers; i++) {

            // if someone still in game and has not vote, exit to wait for that player
            if (playerStillInGame[i] && dayVotes[i] >= nPlayers) {
                return;
            }
        }

        // voted 
        uint[] memory votes = new uint[](nPlayers);
        for (uint i = 0; i<nPlayers; i++) {
            if (playerStillInGame[i]) {
                votes[dayVotes[i]] ++;
            }
        }
        uint maxv = 0;
        uint maxvi = nPlayers * 100;
        for (uint i = 0; i<nPlayers; i++) {
            if (votes[i] > maxv) {
                maxv = votes[i];
                maxvi = i;
            }
        }
        
        emit PlayerEliminated(maxvi, votes);
        playerStillInGame[maxvi] = false;
        nPlayersStillInGame --;

        // check winning condition
        gameState = GameState.DAY_WINCHECK_CREATE;
        stateToGoAfterWincheck = GameState.NIGHT_VOTE_CREATE;

        // uint[] memory _deck = new uint[](nPlayers*2);
        // for (uint i=0; i<nPlayers; i++) {
        //     _deck[i*2]   = deck[i][0];
        //     _deck[i*2+1] = deck[i][1];
        // }

        secureAdd.startWinCheck
            (playerAddresses, playerPubKeys, deck, playerStillInGame, nPlayersStillInGame);

        emit StartWinCheck();
    }


    // finished win check 

    function wincheck_done() public onlyOwner() {
        require(gameState == GameState.DAY_WINCHECK_CREATE 
                || gameState == GameState.NIGHT_WINCHECK_CREATE, 'not win checking');
        require(secureAdd.state() == (uint)(GameState.VILLAGER_WON), 'win check not done');

        uint[] memory sums1 = secureAdd.getAggregatedSums1();
        uint[] memory sums2 = secureAdd.getAggregatedSums2();

        sum1 = 0;
        sum2 = 0;
        for (uint i=0; i<nPlayers; i++) {
            sum1 = sum1 + sums1[i];
            sum2 = sum2 + sums2[i];            
        }
        
        uint minus = getShareValueOffset() * nPlayers * nPlayersStillInGame;
        sum1 = sum1 - minus;
        sum2 = sum2 - minus;

        emit Wincheck_done(sum1, sum2);

        if (sum2 == 0) {
            gameState = GameState.VILLAGER_WON;
            emit VillagerWon();
            return; 
        }

        if (sum1 == sum2) {
            gameState = GameState.MAFIA_WON;
            emit MafiaWon();
            return; 
        }

        // if neither side won, proceed with the game
        gameState = stateToGoAfterWincheck;
        if (gameState == GameState.NIGHT_VOTE_CREATE) {
            emit EnterNightVote();
        }
    }
}

