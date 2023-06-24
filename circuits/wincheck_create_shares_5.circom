pragma circom 2.0.0;

include "./wincheck_create_shares.circom";

component main {public [card_to_unmask, share_value_offset, pks]} = Wincheck_Create_Shares(3, 5, 254);

