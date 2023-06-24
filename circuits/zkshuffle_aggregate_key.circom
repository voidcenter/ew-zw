pragma circom 2.0.0;

// copied from https://github.com/sigmachirality/empty-house

include "./algebra.circom";

// Aggregate the El Gamal public keys from all the players
// Because El Gamal is multiplicative homomorphic and communicative
// One can decrypt in any order

// All numbers a in Z/pZ and all ops are mod p defined in
// https://docs.circom.io/circom-language/basic-operators/ 
template GeneratePublicKey(generator, num_bits) {
    signal input sk;        
    signal input old_aggk;
    signal output new_aggk;
    signal output pk;

    // pk = G ^ sk 
    component KeyExp = Pow(num_bits);
    KeyExp.exponent <== sk;
    KeyExp.base <== generator;
    pk <== KeyExp.out;

    // agg_pk = G ^ {sum of everyone's sk}
    new_aggk <== old_aggk * pk;
}


// Q: why 254, not 256? 
component main {public [old_aggk]} = GeneratePublicKey(3, 254);

