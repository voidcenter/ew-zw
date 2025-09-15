pragma circom 2.0.0;

// copied from https://github.com/sigmachirality/empty-house

include "../node_modules/circomlib/circuits/comparators.circom";
include "./algebra.circom";

// Card El Gamal encryption 
// https://en.wikipedia.org/wiki/ElGamal_encryption
// The encryption needs the public key and a random factor 
// Each card's encrypted ciphertext is repesented by a tuple of two elements (c1, c2)
// For a plain message m, it can be represented as (c1=1, c2=m) before the encryption
template ElGamalEncrypter(generator, bit_length){  
    signal input  pk;               // aggregate public key h
    signal input  message[2];       // [1, m] for plain message, [c1, c2] for previously El Gamal encrypted ciphertext
    signal input  random_factor;    // random masking factor y
    signal output ciphertext[2];    

    // g^y 
    component exp1 = Pow(bit_length);
    exp1.exponent <== random_factor;
    exp1.base <== generator;

    // s = h^y = g^{\sum xi}^y
    component exp2 = Pow(bit_length);
    exp2.exponent <== random_factor;
    exp2.base <== pk;
    
    // c1 = c1 * g^y
    ciphertext[0] <== message[0] * exp1.out;     
    
    // Q: why do we need this? should we assert this before computing [0]?
    // assert(ciphertext[0] != 0); 
    component iz = IsZero();
    iz.in <== ciphertext[0];
    iz.out === 0;                       
    
    // c2 = c2 * h^y, adding g^{\sum xi}^y
    ciphertext[1] <== message[1] * exp2.out;     // 
}


template ElGamalDecrypter(generator, num_bits){
    signal input ciphertext[2]; 
    signal input sk; 
    signal output pk; 
    signal output message[2];  // [c1, c2] for ciphertext that needs further decryption and [c1, m] for decrypted message

    // sk -> pk
    component KeyExp = Pow(num_bits);
    KeyExp.exponent <== sk;
    KeyExp.base <== generator;
    pk <== KeyExp.out;

    // Apply partial decryption using the current player's secret key
    component CardExp = Pow(num_bits);
    CardExp.exponent <== sk;
    CardExp.base <== ciphertext[0];

    // c1 stays the same
    message[0] <== ciphertext[0];

    // multiply masked_card[1] with the inverse of CardExp.out
    // this removes player's sk factoring in everyone's randomness
    message[1] <-- ciphertext[1] / CardExp.out; 

    // this line is needed because having <== in the previous line introduces a non-linear constraint. 
    // see https://docs.electronlabs.org/reference/intro-to-circom
    message[1] * CardExp.out === ciphertext[1]; 
}

