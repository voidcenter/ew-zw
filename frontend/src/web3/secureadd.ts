
import { GameState, gameStateArray, GameStateStrings, 
    provider, signer, myPlayerIndex, player, gameContract, gameContractWithSigner,
    shuffleContract, shuffleContractWithSigner, secureAddContract, secureAddContractWithSigner 
  } from '../modules/context';
  
  import { refreshState  } from "./refresh";
  
  import { MockPlayer, AggregateKeyProof, EncryptAndShuffleProof, DecryptProof, 
      WinCheck_CreateShares_Proof, WinCheck_AggregateShares_Proof } from '../player/MockPlayer';
  
  

export async function wincheck_create(state: any) {

    console.log('wincheck create');

    player.setPlayerPublicKeys((await gameContract.getPlayerPubKeys()).map((x) => BigInt(x)));
    const offset = BigInt(await secureAddContract.getShareValueOffset());

    let proof: WinCheck_CreateShares_Proof = await player.winCheck_createShares(state.nPlayers, offset);
    console.log('proof = ', proof);

    const r = await secureAddContractWithSigner.wincheck_submit_shares(proof,
        { gasLimit: 3_000_000 }
    );
    const rr = await r.wait();
    console.log('r = ', r, 'rr = ', rr);    
    
}


export async function wincheck_aggregate(state: any) {

    console.log('wincheck aggregate');

    let shares1 = await secureAddContract.getShares1();
    let shares2 = await secureAddContract.getShares2();
    const myIndex = state.myPlayerIndex;
    const sc1 = shares1.map(row => [BigInt(row[myIndex][0]), BigInt(row[myIndex][1])]);
    const sc2 = shares2.map(row => [BigInt(row[myIndex][0]), BigInt(row[myIndex][1])]);

    let proof: WinCheck_AggregateShares_Proof = await player.winCheck_aggregateShares(sc1, sc2);
    console.log('proof = ', proof);

    const r = await secureAddContractWithSigner.wincheck_aggregate_shares(proof,
        { gasLimit: 3_000_000 }
    );
    const rr = await r.wait();
    console.log('r = ', r, 'rr = ', rr);    

}

