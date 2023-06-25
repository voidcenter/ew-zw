
pragma circom 2.0.0;

include "./zkshuffle_decrypt.circom";
include "./el_gamal.circom";

component main {public [ciphertext]} = ElGamalDecrypter(3, 254);

