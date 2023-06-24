pragma circom 2.0.0;

include "./wincheck_aggregate_shares.circom";

component main {public [share_ciphertexts_1, share_ciphertexts_2]} 
    = Wincheck_Aggregate_Shares(3, 5, 254);

