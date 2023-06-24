
pragma circom 2.0.0;

include "./zkshuffle_decrypt.circom";

// for 5 players, each time we only batch decrypt 4 cards 
component main {public [deck_to_unmask]} = ZKShuffleDecryptDeck(3, 4, 254);

