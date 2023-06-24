import { getEVMCompatibleSigners, createMockPlayers, deployContracts_wStandalones } from './utils/helpers';
import { setupListeners } from './utils/listener';
import * as gameflow from './utils/gameflow';
import { deployContracts, sleep, setupSignersAndPlayers } from './utils/helpers';
import { Wallet, Contract } from 'ethers';
import { TestGame, SecureAdd, StandaloneShuffle } from '../typechain-types';
import { ethers } from 'hardhat';
import hre from 'hardhat';
import { config as dotEnvConfig } from "dotenv";
import { MockPlayer } from './utils/MockPlayer';
import { sign } from 'crypto';

dotEnvConfig();

// abi
const standaloneShuffleArtifact = require("../artifacts/contracts/StandaloneShuffle.sol/StandaloneShuffle.json");  
const secureAddArtifact = require("../artifacts/contracts/SecureAdd.sol/SecureAdd.json");  
const testgameArtifact = require("../artifacts/contracts/TestGame.sol/TestGame.json");  

/* Help demo the game together with the web3 side */


// the main flow and loop 
async function main() {

    const [node_url, signers, players, nPlayers] = await setupSignersAndPlayers();
    const owner = signers[0];

    // const testGame = await deployContracts(signers);

    /**/ 
    // const [testGame, standaloneShuffle, secureAdd] = await deployContracts_wStandalones(signers);    
    // /* 

    const standaloneShuffleAddress = '0x910D9A237E41D5e5D3F2198802F40167a3e5D2a4';
    const standaloneShuffle = 
        new Contract(standaloneShuffleAddress, 
                     JSON.stringify(standaloneShuffleArtifact.abi), 
                     owner) as any as StandaloneShuffle;

    const secureAddAddress = '0x82A90a2bB096eb58441337D9fCB070c49EF01cad';
    const secureAdd = 
        new Contract(secureAddAddress, 
                     JSON.stringify(secureAddArtifact.abi), 
                     owner) as any as SecureAdd;

    const gameContractAddress = '0x954120C042f4a4f3654957362D8D3A69D31E22ed';
    const testGame = 
        new Contract(gameContractAddress, JSON.stringify(testgameArtifact.abi), owner) as any as TestGame;   

    /**/ 

    // await setupListeners(node_url);

    const demoWeb3 = true;

    await gameflow.lobby(testGame, owner, players, demoWeb3);

    // console.log('ss state = ', await standaloneShuffle.connect(signers[1]).gameState());
    // console.log('ss playeraddresses = ', await standaloneShuffle.connect(signers[1]).getPlayerAddresses());

    // await sleep(4000);

    await gameflow.startGame(testGame, owner, nPlayers);

    // console.log('ss state = ', await standaloneShuffle.connect(signers[1]).gameState());
    // console.log('ss playeraddresses = ', await standaloneShuffle.connect(signers[1]).getPlayerAddresses());

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



    // const sleep = (ms: any) => new Promise(r => setTimeout(r, ms));
    // await sleep(4000);
}


main()
    .then(() => process.exit(0))    
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });


