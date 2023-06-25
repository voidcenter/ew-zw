pragma circom 2.0.0;

include "./algebra.circom";
include "./el_gamal.circom";

template Wincheck_Aggregate_Shares(generator, num_players, bit_length) {
    signal input  sk;
    signal input  share_ciphertexts_1[num_players][2];
    signal input  share_ciphertexts_2[num_players][2];
    signal output sum1;
    signal output sum2;

    component elGamalDecrypter1[num_players];
    component elGamalDecrypter2[num_players];
    component adder1 = Adder(num_players);
    component adder2 = Adder(num_players);
    for (var i = 0; i < num_players; i++) {
        elGamalDecrypter1[i] = ElGamalDecrypter(generator, bit_length);
        elGamalDecrypter1[i].sk <== sk;
        elGamalDecrypter1[i].ciphertext[0] <== share_ciphertexts_1[i][0];
        elGamalDecrypter1[i].ciphertext[1] <== share_ciphertexts_1[i][1];
        adder1.numbers[i] <== elGamalDecrypter1[i].message[1];  

        elGamalDecrypter2[i] = ElGamalDecrypter(generator, bit_length);
        elGamalDecrypter2[i].sk <== sk;
        elGamalDecrypter2[i].ciphertext[0] <== share_ciphertexts_2[i][0];
        elGamalDecrypter2[i].ciphertext[1] <== share_ciphertexts_2[i][1];
        adder2.numbers[i] <== elGamalDecrypter2[i].message[1]; 
    }

    sum1 <== adder1.total;
    sum2 <== adder2.total;
}
