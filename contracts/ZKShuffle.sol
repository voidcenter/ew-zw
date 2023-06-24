// // SPDX-License-Identifier: GPL-3.0

// pragma solidity ^0.8.18;
// pragma experimental ABIEncoderV2;

// import "@openzeppelin/contracts/utils/Strings.sol";

// import "./GameDefs.sol";
// import "./GameStorage.sol";


// // meant to be called using delegate call

// contract ZKShuffle is GameStorage {

//     /*
//         zkshuffle: key aggregation
//      */ 

//     // A player aggregates the key
//     function playerAggregateKey(KeyAggregationProof calldata _proof) public {

//         address playerAddress = msg.sender;
//         require(playerAddress == playerAddresses[nKeysAggregated], string.concat(
//             "You are not the next player who needs to aggregate the key! The next player in turn is",
//             Strings.toHexString(uint256(uint160(playerAddresses[nKeysAggregated])), 20),
//             "  index ", 
//             Strings.toString(nKeysAggregated)));

//         require(_proof.prevAggKey == aggPubKey);  // The prevAggKey match. 

//         // Validate the off-chain key aggregation
//         uint[3] memory pubData = [_proof.newAggKey, _proof.playerPubKey, _proof.prevAggKey];
//         // require(zkshuffleAggregateKeyVerifier.verifyProof(_proof.a, _proof.b, _proof.c, pubData),
//         //     "Invalid proof (aggregateKey)!"
//         // );

//         // Update key aggregation state.
//         aggPubKey = _proof.newAggKey;
//         emit PlayerAggregatedKey(nKeysAggregated, _proof.prevAggKey, _proof.playerPubKey, aggPubKey);
//         nKeysAggregated++;
        
//         // this is important, record this so that later we can use this to snark the player
//         playerPubKeyMapping[playerAddress] = _proof.playerPubKey;  
//         playerPubKeys.push(_proof.playerPubKey);

//         if (nKeysAggregated < nPlayers) {
//             emit NextPlayerToAggregateKey(nKeysAggregated, aggPubKey);

//         // Once all players aggregated key, shuffle.
//         } else {
//             gameState = GameState.SHUFFLE;
//             emit EnterShufflePhase();
//             emit NextPlayerToEncryptAndShuffle (nPlayers_encryptedAndShuffled);
//         }
//     }


//     /*
//         zkshuffle: encrypt and shuffle 
//      */ 
//     function zkshuffle_encryptAndShuffle(EncryptAndShuffleProof calldata _proof) public {

//         // checking invariants 
//         require(gameState == GameState.SHUFFLE, "Not in the shuffle stage!");

//         address playerAddress = msg.sender;
//         require(playerAddress == playerAddresses[nPlayers_encryptedAndShuffled], string.concat(
//             "You are not the next player who needs to encrypt and shuffle! The next player in turn is",
//             Strings.toHexString(uint256(uint160(playerAddresses[nPlayers_encryptedAndShuffled])), 20)));

//         require(_proof.deckToMask.length == nPlayers, "#cards != nPlayers");
//         require(_proof.maskedDeck.length == nPlayers, "#cards != nPlayers");
        
//         for (uint i=0; i<nPlayers; i++) {
//             require(deck[i][0] == _proof.deckToMask[i][0] && deck[i][1] == _proof.deckToMask[i][1], 
//                 "card to mask does not align!");
//         }


//         // validate proof
//         if (nPlayers == 5) {
//             uint[21] memory publicSignals;

//             for (uint i=0; i < nPlayers; i++) {
//                 publicSignals[i*2] = _proof.maskedDeck[i][0];
//                 publicSignals[i*2+1] = _proof.maskedDeck[i][1];
//             }
//             uint k = nPlayers * 2;
//             publicSignals[k] = _proof.aggPubKey;
//             for (uint i=0; i < nPlayers; i++) {
//                 publicSignals[k + 1 + i*2] = _proof.deckToMask[i][0];
//                 publicSignals[k + 1 + i*2+1] = _proof.deckToMask[i][1];
//             }

//             require(zkshuffleEncryptAndShuffle5Verifier.verifyProof(_proof.a, _proof.b, _proof.c, publicSignals),
//                 "Invalid proof (encryptAndShuffle)!"
//             );
//         }


//         // Update deck
//         for (uint i=0; i<nPlayers; i++) {
//             deck[i][0] = _proof.maskedDeck[i][0];
//             deck[i][1] = _proof.maskedDeck[i][1];
//         }

//         emit PlayerEncryptedAndShuffled(nPlayers_encryptedAndShuffled);
//         nPlayers_encryptedAndShuffled ++;

//         if (nPlayers_encryptedAndShuffled < nPlayers) {
//             emit NextPlayerToEncryptAndShuffle(nPlayers_encryptedAndShuffled);
//         } else {
//             gameState = GameState.DECRYPT;
//             emit EnterDecryptPhase();
//             emit NextPlayerToDecrypt(nPlayers_decrypted);
//         }
//     }


//     /*
//      * zkshuffle: decrypt 
//      */
//     function zkshuffle_decrypt (DecryptProof calldata _proof) public {

//         // checking invariants 
//         require(gameState == GameState.DECRYPT, "Not in the decrypt phase!");

//         address playerAddress = msg.sender;
//         require(playerAddress == playerAddresses[nPlayers_decrypted], string.concat(
//             "You are not the next player who needs to decrypt! The next player in turn is",
//             Strings.toHexString(uint256(uint160(playerAddresses[nPlayers_decrypted])), 20)));

//         require(_proof.deckToUnmask.length == nPlayers - 1, "#cards != nPlayers - 1");
//         require(_proof.unmaskedDeck.length == nPlayers - 1, "#cards != nPlayers - 1");
//         require(_proof.playerPubKey == playerPubKeyMapping[playerAddress], "player public key mismatch!");
        
//         // validate proof
//         if (nPlayers == 5) {
//             uint[17] memory publicSignals;   // n-1 cards

//             publicSignals[0] = _proof.playerPubKey;
//             for (uint i=0; i < nPlayers-1; i++) {
//                 publicSignals[1 + i*2] = _proof.unmaskedDeck[i][0];
//                 publicSignals[1 + i*2+1] = _proof.unmaskedDeck[i][1];
//             }
//             uint k = (nPlayers - 1) * 2 + 1;
//             for (uint i=0; i < nPlayers-1; i++) {
//                 publicSignals[k + i*2] = _proof.deckToUnmask[i][0];
//                 publicSignals[k + i*2+1] = _proof.deckToUnmask[i][1];
//             }

//             require(zkshuffleDecrypt5Verifier.verifyProof(_proof.a, _proof.b, _proof.c, publicSignals),
//                 "Invalid proof (decrypt)!"
//             );
//         }

//         // update deck
//         uint deckIndex = 0;
//         for (uint i=0; i<nPlayers-1; ) {
//             if (i == nPlayers_decrypted) {  // skip player's card
//                 deckIndex++;
//             }

//             // for simplicity, here we put deck updating and invariant checking together
//             require(deck[deckIndex][0] == _proof.deckToUnmask[i][0] && 
//                     deck[deckIndex][1] == _proof.deckToUnmask[i][1], 
//                 "card to unmask does not align!");

//             deck[deckIndex][0] = _proof.unmaskedDeck[i][0];
//             deck[deckIndex][1] = _proof.unmaskedDeck[i][1];

//             i++;
//             deckIndex++;
//         }

//         emit PlayerDecrypted(nPlayers_decrypted);
//         nPlayers_decrypted++;

//         if (nPlayers_decrypted < nPlayers) {
//             emit NextPlayerToDecrypt(nPlayers_decrypted);
//         } else {
//             gameState = GameState.DAY_VOTE;
//             emit EnterDayVote();

//             // DEBUG: debug for wincheck
//             gameState = GameState.DAY_WINCHECK_CREATE;
//             nPlayers_submittedShares = 0;

//             // pub keys and deck are ready 
//             delete secureAddShares1;
//             delete secureAddShares2;
//             delete playerSubmittedShares;

//             // pre-allocate, as players can submit shares in parallel
//             secureAddShares1 = new uint256[2][][](nPlayers);
//             secureAddShares2 = new uint256[2][][](nPlayers);
//             playerSubmittedShares = new bool[](nPlayers);
//             emit EnterDayWincheckCreatePhase();
        
//         }
//     }


// }

