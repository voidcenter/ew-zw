// // SPDX-License-Identifier: GPL-3.0

// pragma solidity ^0.8.18;
// pragma experimental ABIEncoderV2;

// import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/utils/Strings.sol";

// import "./GameDefs.sol";
// import "./GameStorage.sol";


// // meant to be called using delegate call

// contract GameLobby is GameStorage {

//     /*
//      * lobby
//      */
//     // The owner can reset the game. Later we should expand this to multiple games in parallel.
//     function returnToLobby() public {
//         gameState = GameState.LOBBY;

//         // require(false, 'test');

//         // clean up the mappings
//         for (uint i=0; i<nPlayers; i++) {
//             address player = playerAddresses[i];
//             playerPubKeyMapping[player] = 0;
//             playerInGame[player] = false;
//         }
//         delete playerPubKeys;
//         nPlayers = 0;

//         // clean up player list
//         delete playerAddresses;   // delete its elements  
//         emit ReturnToLobby();
//     }

//     // A new player joins the game
//     function joinGame() public {
//         require(gameState == GameState.LOBBY, "You can only join at the LOBBY phase!");

//         address player = msg.sender;
//         require(playerInGame[player] == false, "You can only join this game once!");    

//         playerAddresses.push(player);
//         playerInGame[player] = true;
//         nPlayers = playerAddresses.length;
//         emit PlayerJoined(player, nPlayers);
//     }

//     // Initialize a game. 
//     function startGame() public {
//         require(gameState == GameState.LOBBY, "You can only start the game from the LOBBY state!");

//         gameState = GameState.KEY_AGGREGATION;
//         nPlayers = playerAddresses.length;
//         nKeysAggregated = 0;
//         nPlayers_encryptedAndShuffled = 0;
//         nPlayers_decrypted = 0;
//         aggPubKey = 1;         // initial El Gamal public key

//         deck = new uint[2][](nPlayers);        
//         for (uint i=0; i<nPlayers; i++) {
//             deck[i][0] = 1;
//             deck[i][1] = 1;
//         }
//         // set the first card to be mafia
//         // if we have more than 5 players, maybe more than 1 mafia card is needed
//         // TODO
//         deck[0][1] = 2; 

//         emit StartGame(nPlayers, playerAddresses);
//         emit NextPlayerToAggregateKey(nKeysAggregated, aggPubKey);


//         // DEBUG:  for wincheck
//         // gameState = GameState.DAY_WINCHECK_CREATE;
//         // require(nPlayers = 5, "nplayers needs to be 5 for testing");

//         // deck has everyone's encrypted roles
//         // pubkeys are here


//         // TODO: nplayers, player pub keys
//         // TODO: shares

//     }

// }
