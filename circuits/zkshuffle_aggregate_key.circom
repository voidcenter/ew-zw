pragma circom 2.0.0;

// copied from https://github.com/sigmachirality/empty-house

include "./algebra.circom";

template GeneratePublicKey(generator, num_bits) {
    signal input sk;        
    signal input old_aggk;
    signal output new_aggk;
    signal output pk;

    component KeyExp = Pow(num_bits);
    KeyExp.exponent <== sk;
    KeyExp.base <== generator;
    pk <== KeyExp.out;

    new_aggk <== old_aggk * pk;
}


component main {public [old_aggk]} = GeneratePublicKey(3, 254);

