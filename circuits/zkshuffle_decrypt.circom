pragma circom 2.0.0;

include "./algebra.circom";
include "./el_gamal.circom";

// Encrypt cards and shuffle them
template ZKShuffleDecryptDeck(generator, num_cards, bit_length) {

    signal input  deck_to_unmask[num_cards][2];
    signal input  sk;  
    signal output pk;  
    signal output unmasked_deck[num_cards][2];   

    // Encrypt cards
    component ElGamalDecrypter[num_cards];
    for (var i = 0; i < num_cards; i++) {
        ElGamalDecrypter[i] = ElGamalDecrypter(generator, bit_length);
        ElGamalDecrypter[i].sk <== sk;
        ElGamalDecrypter[i].ciphertext[0] <== deck_to_unmask[i][0];
        ElGamalDecrypter[i].ciphertext[1] <== deck_to_unmask[i][1];
        unmasked_deck[i][0] <== ElGamalDecrypter[i].message[0];
        unmasked_deck[i][1] <== ElGamalDecrypter[i].message[1];
    }

    pk <== ElGamalDecrypter[0].pk;
}
