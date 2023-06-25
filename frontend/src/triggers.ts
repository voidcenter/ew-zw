

import { GameState, gameStateArray, GameStateStrings, 
    provider, signer, myPlayerIndex, player, gameContract, gameContractWithSigner,
    shuffleContract, shuffleContractWithSigner, secureAddContract, secureAddContractWithSigner 
  } from './context';

import { refreshState } from './web3/refresh';

import { MockPlayer, AggregateKeyProof, EncryptAndShuffleProof, DecryptProof, 
      WinCheck_CreateShares_Proof, WinCheck_AggregateShares_Proof } from './player/MockPlayer';
  
import * as shuffle from './web3/shuffle';
import * as secureadd from './web3/secureadd';
      


let start_agg_key = false;
let start_ens = false;
let start_decrypt = false;

let start_wincheck_create = false;
let start_wincheck_aggregate = false;


export function reset_wincheck_trigger_states() {
    start_wincheck_create = false;
    start_wincheck_aggregate = false;    
}


export async function refresh_and_triggers(state: any, setState: any) {
    // pushTermText('tic');
    await refreshState(setState);

    // shuffle 
    if (state.shuffleState == GameState.KEY_AGGREGATION && state.playerPubKeys.length == state.myPlayerIndex) {
      if (!start_agg_key) {
        start_agg_key = true;
        await shuffle.aggregateKey();
      }
    }
    if (state.shuffleState == GameState.SHUFFLE && state.nPlayers_encryptedAndShuffled == state.myPlayerIndex) {
      if (!start_ens) {
        start_ens = true;
        await shuffle.ens(state);
      }
    }
    if (state.shuffleState == GameState.DECRYPT && state.nPlayers_decrypted == state.myPlayerIndex) {
      if (!start_decrypt) {
        start_decrypt = true;
        await shuffle.decrypt(state);
      }
    }

    // wincheck 

    // if it's time to wincheck and I'm still in the game, vote 
    if (state.gameState == GameState.DAY_WINCHECK_CREATE && state.secureAddState == GameState.DAY_WINCHECK_CREATE && state.stillInGame[state.myPlayerIndex]) {
      if (!start_wincheck_create) {
        start_wincheck_create = true;
        await secureadd.wincheck_create(state);
      }
    }

    // if it is time to aggregate, I aggregate even if I'm not in the game  (see SecureAdd.sol)
    if (state.gameState == GameState.DAY_WINCHECK_CREATE && state.secureAddState == GameState.DAY_WINCHECK_AGGREGATE) {
      if (!start_wincheck_aggregate) {
        start_wincheck_aggregate = true;
        await secureadd.wincheck_aggregate(state);
      }
    }

}