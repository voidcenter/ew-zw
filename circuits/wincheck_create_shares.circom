pragma circom 2.0.0;

include "./algebra.circom";
include "./el_gamal.circom";


// Secureadd:
//
// - decrypt role
// - come up with votes
// - validate players' shares   
//   [note, the shares are offsetted by max_share_value]  all shares should -= max_share_value after decrypted 
// - encrypt the shares using the public keys
//
template Wincheck_Create_Shares(generator, num_players, bit_length) {
    signal input  sk;
    signal input  card_to_unmask[2]; 
    signal input  share_value_offset;
    signal input  shares1[num_players];
    signal input  shares2[num_players];
    signal input  randomness1[num_players];
    signal input  randomness2[num_players];
    signal input  pks[num_players];
    
    // signal output roler;
    signal output share_ciphertexts_1[num_players][2];
    signal output share_ciphertexts_2[num_players][2]; 

    component elGamalDecrypter = ElGamalDecrypter(generator, bit_length);
    elGamalDecrypter.sk <== sk;
    elGamalDecrypter.ciphertext[0] <== card_to_unmask[0];
    elGamalDecrypter.ciphertext[1] <== card_to_unmask[1];

    // check that role is 1 or 2:   1 - villager, 2 - mafia
    var role = elGamalDecrypter.message[1];
    // roler <== role;
    0 === (role - 1) * (role - 2);

    // villager has to vote (1,0)
    // mafia has to vote (0,1)
    var vote1 = 2 - role;
    var vote2 = role - 1;
    0 === vote1 * (vote1 - 1);
    0 === vote2 * (vote2 - 1);
    
    // confirm that the shares add up to votes
    component adder1 = Adder(num_players);
    component adder2 = Adder(num_players);
    for (var i=0; i<num_players; i++) {
        adder1.numbers[i] <== shares1[i];
        adder2.numbers[i] <== shares2[i];
    }
    adder1.total - share_value_offset * num_players === vote1;
    adder2.total - share_value_offset * num_players === vote2;

    // encrypt
    component elGamalEncrypter1[num_players];
    component elGamalEncrypter2[num_players];
    for (var i = 0; i < num_players; i++) {
        elGamalEncrypter1[i] = ElGamalEncrypter(generator, bit_length);
        elGamalEncrypter1[i].pk <== pks[i];
        elGamalEncrypter1[i].message[0] <== 1;
        elGamalEncrypter1[i].message[1] <== shares1[i];
        elGamalEncrypter1[i].random_factor <== randomness1[i];
        share_ciphertexts_1[i][0] <== elGamalEncrypter1[i].ciphertext[0];
        share_ciphertexts_1[i][1] <== elGamalEncrypter1[i].ciphertext[1];

        elGamalEncrypter2[i] = ElGamalEncrypter(generator, bit_length);
        elGamalEncrypter2[i].pk <== pks[i];
        elGamalEncrypter2[i].message[0] <== 1;
        elGamalEncrypter2[i].message[1] <== shares2[i];
        elGamalEncrypter2[i].random_factor <== randomness2[i];
        share_ciphertexts_2[i][0] <== elGamalEncrypter2[i].ciphertext[0];
        share_ciphertexts_2[i][1] <== elGamalEncrypter2[i].ciphertext[1];
    }
}


// component main {public [card_to_unmask, share_value_offset, pks]} = SecureAdd_Create_Voting_Shares(3, 5, 254);
