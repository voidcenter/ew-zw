
pragma circom 2.0.0;

include "./zkshuffle_decrypt.circom";

component main {public [deck_to_unmask]} = ZKShuffleDecryptDeck(3, 4, 254);

