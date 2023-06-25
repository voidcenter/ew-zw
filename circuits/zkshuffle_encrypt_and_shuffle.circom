pragma circom 2.0.0;

// copied from https://github.com/sigmachirality/empty-house

include "./algebra.circom";
include "./el_gamal.circom";

template EncryptAndShuffle(generator, num_cards, bit_length) {

    signal input  agg_pk;
    signal input  deck[num_cards][2];           
    signal input  randomness[num_cards];        
    signal input  permutation_matrix[num_cards][num_cards]; 
    signal output masked_deck[num_cards][2];    

    component PermutationConstraint = PermutationConstraint(num_cards);
    for (var i = 0; i < num_cards; i++) {
        for (var j = 0; j < num_cards; j++) {
            PermutationConstraint.permutation_matrix[i][j] <== permutation_matrix[i][j];
        }
    }

    component ElGamalEncrypter[num_cards];
    for (var i = 0; i < num_cards; i++) {
        ElGamalEncrypter[i] = ElGamalEncrypter(generator, bit_length);
        ElGamalEncrypter[i].pk <== agg_pk;
        ElGamalEncrypter[i].message[0] <== deck[i][0];
        ElGamalEncrypter[i].message[1] <== deck[i][1];
        ElGamalEncrypter[i].random_factor <== randomness[i];
    }

    component DeckShuffler = ScalarMatrixMul(num_cards, num_cards, 2);
    for (var i = 0; i < num_cards; i++) {
        for (var j = 0; j < num_cards; j++) {
            DeckShuffler.A[i][j] <== permutation_matrix[i][j];
        }
    }

    for (var n = 0; n < num_cards; n++) {
        DeckShuffler.B[n][0] <== ElGamalEncrypter[n].ciphertext[0];
        DeckShuffler.B[n][1] <== ElGamalEncrypter[n].ciphertext[1];
    }

    for (var m = 0; m < num_cards; m++) {
        masked_deck[m][0] <== DeckShuffler.AB[m][0];
        masked_deck[m][1] <== DeckShuffler.AB[m][1];
    }
}

