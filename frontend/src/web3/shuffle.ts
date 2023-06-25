
import { GameState, gameStateArray, GameStateStrings, 
  provider, signer, myPlayerIndex, player, gameContract, gameContractWithSigner,
  shuffleContract, shuffleContractWithSigner, secureAddContract, secureAddContractWithSigner 
} from '../modules/context';

import { MockPlayer, AggregateKeyProof, EncryptAndShuffleProof, DecryptProof, 
    WinCheck_CreateShares_Proof, WinCheck_AggregateShares_Proof } from '../player/MockPlayer';


 
export async function aggregateKey()  {
    const aggKey = BigInt(await shuffleContract.aggPubKey());
    let proof: AggregateKeyProof = await player.aggregatePubKey(aggKey);
    console.log(proof);
  
    const r = await shuffleContractWithSigner.aggregateKey(proof);
    const rr = await r.wait();
    console.log('r = ', r, 'rr = ', rr);
}
  
// this is why we need redux 
export async function ens(state: any) {
    const aggKey = BigInt(await shuffleContract.aggPubKey());
  
    let proof: EncryptAndShuffleProof = await player.encryptAndShuffleDeck(aggKey, state.deck, state.nPlayers);
    console.log('proof = ', proof);
  
    const r = await shuffleContractWithSigner.encryptAndShuffle(proof);
    const rr = await r.wait();
    console.log('r = ', r, 'rr = ', rr);
  }
  
export async function decrypt(state: any) {
    
    const deckToD = state.deck.slice();
    deckToD.splice(state.myPlayerIndex, 1);
    console.log('deckToD = ', deckToD);
  
    let proof: DecryptProof = await player.decryptDeck(deckToD, state.nPlayers);
    console.log('proof = ', proof);
    
    const r = await shuffleContractWithSigner.decrypt(proof);
    const rr = await r.wait();
    console.log('r = ', r, 'rr = ', rr);
}

