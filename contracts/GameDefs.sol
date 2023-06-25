// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.18;

enum GameState { LOBBY, 
                    KEY_AGGREGATION, SHUFFLE, DECRYPT, 
                    DAY_VOTE,  //4
                    DAY_WINCHECK_CREATE, DAY_WINCHECK_AGGREGATE,   
                    NIGHT_VOTE_CREATE, NIGHT_VOTE_AGGREGATE, //7
                    NIGHT_WINCHECK_CREATE, NIGHT_WINCHECK_AGGREGATE,  
                    VILLAGER_WON, MAFIA_WON  //11
                }  



// This is the Groth16 proof data with public witnesses  (prevAggKey, newAggKey, playerPubKey)
struct KeyAggregationProof {
    uint[2] a;                 
    uint[2][2] b;
    uint[2] c;
    uint newAggKey;
    uint playerPubKey;
    uint prevAggKey;
}

struct EncryptAndShuffleProof {
    uint[2] a;                 
    uint[2][2] b;
    uint[2] c;
    uint[2][] maskedDeck;
    uint aggPubKey;
    uint[2][] deckToMask;
}

struct DecryptProof {
    uint[2] a;                 
    uint[2][2] b;
    uint[2] c;
    uint playerPubKey;
    uint[2][] unmaskedDeck;
    uint[2][] deckToUnmask;
}

struct WincheckCreateProof {
    uint[2] a;                 
    uint[2][2] b;
    uint[2] c;
    uint[2][] shareCiphertexts1;
    uint[2][] shareCiphertexts2;
    uint[2] cardToUnmask;
    uint shareValueOffset;
    uint[] pks;
}

struct WincheckAggregateProof {
    uint[2] a;                 
    uint[2][2] b;
    uint[2] c;
    uint sum1;
    uint sum2;
    uint[2][] shareCiphertexts1;
    uint[2][] shareCiphertexts2;
}

