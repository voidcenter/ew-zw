
import { GameState, gameStateArray, GameStateStrings, 
    provider, signer, myPlayerIndex, player, gameContract, gameContractWithSigner,
    shuffleContract, shuffleContractWithSigner, secureAddContract, secureAddContractWithSigner 
} from '../modules/context';
  

export async function joinGame() {
    const r = await gameContractWithSigner.joinGame();
    const rr = await r.wait();
    console.log('r = ', r, 'rr = ', rr);
}

export async function dayVote(vote: number) {

    console.log('voting for ', vote);
    const r = await gameContractWithSigner.dayVote(vote);
    const rr = await r.wait();
    console.log('r = ', r, 'rr = ', rr);

}

