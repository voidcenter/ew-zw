
pragma circom 2.0.0;

include "./zkshuffle_encrypt_and_shuffle.circom";

component main {public [agg_pk, deck]} = EncryptAndShuffle(3, 5, 254);

