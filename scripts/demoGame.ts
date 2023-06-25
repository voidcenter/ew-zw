
import * as gameflow from './utils/gameflow';
import { deployContracts, sleep, setupSignersAndPlayers } from './utils/helpers';
import { config as dotEnvConfig } from "dotenv";

dotEnvConfig();

/* Help demo the game together with the web3 side */


// the main flow and loop 
async function main() {

    const [node_url, signers, players, nPlayers] = await setupSignersAndPlayers();
    const owner = signers[0];

    const [testGame, standaloneShuffle, secureAdd] = await deployContracts_wStandalones(signers);    

    const demoWeb3 = true;

    await gameflow.lobby(testGame, owner, players, demoWeb3);
    await gameflow.startGame(testGame, owner, nPlayers);


    await gameflow.aggregateKey(standaloneShuffle, players, demoWeb3);
    await gameflow.encryptAndShufle(standaloneShuffle, players, demoWeb3);
    await gameflow.decrypt(standaloneShuffle, players, demoWeb3);
    await gameflow.drawCards(standaloneShuffle, players, demoWeb3);
    await gameflow.shuffleDone(testGame, owner);

    const roleCards = [];
    const sks = [];
    for (let i=0; i<nPlayers; i++) {
        roleCards.push(players[i].roleCardBeforeDecryption);
        sks.push(players[i].privateKey);
    }
    console.log('role cards = ', roleCards);
    console.log('sks = ', sks);

    await gameflow.dayVote(testGame, players, demoWeb3);
    console.log('game state = ', await testGame.gameState());
    
    const playerStillInGame = await testGame.getPlayerStillInGame();
    await gameflow.wincheck_create(secureAdd, players, playerStillInGame, demoWeb3);
    await gameflow.wincheck_aggregate(secureAdd, players, demoWeb3);
    await gameflow.wincheck_done(testGame, owner);
    console.log('game state = ', await testGame.gameState());

}


main()
    .then(() => process.exit(0))    
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });


