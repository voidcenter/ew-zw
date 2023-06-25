
var HDWalletProvider = require("truffle-hdwallet-provider");
const path = require('path');
require('dotenv').config();
import { ethers } from 'hardhat';
import { MockPlayer } from './MockPlayer';
import { ContractTransactionResponse } from 'ethers';
import { TestGame, StandaloneShuffle, SecureAdd } from '../../typechain-types';
import { Wallet, Contract } from "ethers";
import { groth16 } from "snarkjs";
import { strict as assert } from 'assert';
import hre from 'hardhat';


/*
    snark helpers 
 */

interface Groth16ProofOutput {
    a: [bigint, bigint];
    b: [[bigint, bigint], [bigint, bigint]];
    c: [bigint, bigint];
    publicSignals: bigint[];   // this should be publicSignals [ ...all outputs, all public inputs ]
}

export async function exportSolidityCallDataGroth16(proof: { proof: any; publicSignals: any}): Promise<Groth16ProofOutput> {

    const rawCallData: string = await groth16.exportSolidityCallData(proof.proof, proof.publicSignals);
  
    const tokens = rawCallData
      .replace(/["[\]\s]/g, "")
      .split(",")
      .map(BigInt);   // into big number
  
    const [a1, a2, b1, b2, b3, b4, c1, c2, ...publicSignals] = tokens;
  
    const a = [a1, a2] satisfies [bigint, bigint];
    const b = [
      [b1, b2],
      [b3, b4],
    ] satisfies [[bigint, bigint], [bigint, bigint]];
    const c = [c1, c2] satisfies [bigint, bigint];

    return {
        a, b, c,
        publicSignals
    } as Groth16ProofOutput;
}


/*
    system helpers 
 */

const { LOCAL_TEST_MNEMONIC } = process.env

export function getEVMCompatibleSigners(nSigners: number = 20, node_url = "HTTP://127.0.0.1:7545") {

    // Compared to HDNode.fromMnemonic, the only down side here is that we need to provide provider,
    // but whatever 
    const provider = new HDWalletProvider(LOCAL_TEST_MNEMONIC, node_url, 0, nSigners);
    const hhprovider = new ethers.JsonRpcProvider(node_url);
    return Object.keys(provider.wallets)
        .map(key => new ethers.Wallet(provider.wallets[key]._privKey.toString('Hex'), hhprovider))
}



// Set up signers, node_url, players, all that 
export async function setupSignersAndPlayers(): Promise<[string, Wallet[], MockPlayer[], number]> {
    const node_urls = {
        ganache: "HTTP://127.0.0.1:7545",
        mumbai: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_MUMBAI_KEY}`,
    };
    const network_name = hre.network.name;
    const node_url = (node_urls as any)[network_name];
    const signers = getEVMCompatibleSigners(10, node_url);

    console.log(network_name, node_url);

    for (let signer of signers) {
        console.log(await signer.getAddress(), Number(await signers[0].provider?.getBalance(await signer.getAddress())!) / 1e18);
    }

    /* set up players */
    const owner = signers[0];  console.log('signers[0] nonce = ', await owner.getNonce());
    const nPlayers = 5;
    const players = createMockPlayers(nPlayers, signers);

    return [node_url, signers, players, nPlayers]
}



export async function batchWaitTxs(txs: ContractTransactionResponse[]) {
  for (let tx of txs) {
    await tx.wait();
  }   
} 

export const sleep = (ms: any) => new Promise(r => setTimeout(r, ms));


/*
    deploy contracts  
 */

export async function deployContract(path: string, name: string, deployer: Wallet): Promise<string> {
    const Contract = await ethers.getContractFactory(path);
    const contract = await Contract.connect(deployer).deploy();
    await contract.waitForDeployment();
    const address = await contract.getAddress()
    console.log(`${name} deployed to:`, address);
    return address;
}

export async function deployContracts(signers: Wallet[]): Promise<TestGame> {
    console.log("** Contracts Deployment **");
    
    console.log("deploying verifiers and game modules ... ");
    const contract_map = {
        ZkshuffleKeyAggregationVerifier: "contracts/ZkshuffleAggregateKeyVerifier.sol:Verifier",
        ZkshuffleEncryptAndShuffle_5_Verifier: "contracts/ZkshuffleEncryptAndShuffle5Verifier.sol:Verifier",
        Zkshuffle_Decrypt_5_Verifier: "contracts/ZkshuffleDecrypt5Verifier.sol:Verifier",
        Wincheck_create_5_Verifier: "contracts/WincheckCreateShares5Verifier.sol:Verifier",
        Wincheck_aggregate_5_Verifier: "contracts/WincheckAggregateShares5Verifier.sol:Verifier",
        GameLobby: "GameLobby",
        ZKShuffle: "ZKShuffle",
    }
    
    const keys = Object.keys(contract_map);
    
    const promises = [];
    for (let i = 0; i<keys.length; i++) {
        const key = keys[i];
        const tx = (async () => {
            const address = await deployContract((contract_map as any)[key], key, signers[i]);
            (contract_map as any)[key] = address; 
        })();
        promises.push(tx);
        await sleep(1000);
    }
    await Promise.all(promises);

    console.log(contract_map);

    // await hre.tenderly.persistArtifacts({
    //   name: "agg",
    //   address: contract_map.ZkshuffleKeyAggregationVerifier,
    // })

    console.log("deploying TestGame ... ");
    const TestGame = await ethers.getContractFactory("contracts/TestGame.sol:TestGame");    
    const testGame: TestGame = await TestGame.connect(signers[0]).deploy(
        contract_map.ZkshuffleKeyAggregationVerifier,
        contract_map.ZkshuffleEncryptAndShuffle_5_Verifier,
        contract_map.Zkshuffle_Decrypt_5_Verifier,
        contract_map.Wincheck_create_5_Verifier,
        contract_map.Wincheck_aggregate_5_Verifier,
        contract_map.GameLobby,
        contract_map.ZKShuffle) as any;

    await testGame.waitForDeployment();
    console.log("TestGame deployed to: ", await testGame.getAddress());

    // await setupListeners();

    return testGame;
}


// deploy with standalone shuffle
export async function deployContracts_wStandalones(signers: Wallet[]): 
        Promise<[TestGame, StandaloneShuffle, SecureAdd]> {
    console.log("** Contracts Deployment **");
    
    console.log("deploying verifiers and game modules ... ");
    const contract_map = {
        ZkshuffleKeyAggregationVerifier: "contracts/ZkshuffleAggregateKeyVerifier.sol:Verifier",
        ZkshuffleEncryptAndShuffle_5_Verifier: "contracts/ZkshuffleEncryptAndShuffle5Verifier.sol:Verifier",
        Zkshuffle_Decrypt_5_Verifier: "contracts/ZkshuffleDecrypt5Verifier.sol:Verifier",
        Wincheck_create_5_Verifier: "contracts/WincheckCreateShares5Verifier.sol:Verifier",
        Wincheck_aggregate_5_Verifier: "contracts/WincheckAggregateShares5Verifier.sol:Verifier",
    }
    
    const keys = Object.keys(contract_map);
    
    const promises = [];
    for (let i = 0; i<keys.length; i++) {
        const key = keys[i];
        const tx = (async () => {
            const address = await deployContract((contract_map as any)[key], key, signers[i]);
            (contract_map as any)[key] = address; 
        })();
        promises.push(tx);
        await sleep(1000);
    }
    await Promise.all(promises);

    console.log(contract_map);

    const owner = signers[0];


    console.log("deploying Standalone shuffle ... ");
    const StandaloneShuffle = await ethers.getContractFactory("StandaloneShuffle");
    const standaloneShuffle: StandaloneShuffle = await StandaloneShuffle.connect(owner).deploy(
        contract_map.ZkshuffleKeyAggregationVerifier,
        contract_map.ZkshuffleEncryptAndShuffle_5_Verifier,
        contract_map.Zkshuffle_Decrypt_5_Verifier,
    ) as any;;

    await standaloneShuffle.waitForDeployment();
    console.log("StandaloneShuffle deployed to: ", await standaloneShuffle.getAddress());

    await sleep(1000);

    console.log("deploying Standalone secure add ... ");
    const SecureAdd = await ethers.getContractFactory("SecureAdd");
    const secureAdd: SecureAdd = await SecureAdd.connect(owner).deploy(
        contract_map.Wincheck_create_5_Verifier,
        contract_map.Wincheck_aggregate_5_Verifier
    ) as any;;

    await secureAdd.waitForDeployment();
    console.log("Secure add deployed to: ", await secureAdd.getAddress());

    await sleep(1000);

    console.log("deploying TestGame ... ");
    const TestGame = await ethers.getContractFactory("contracts/TestGame.sol:TestGame");    
    const testGame: TestGame = await TestGame.connect(owner).deploy(
        standaloneShuffle.getAddress(),
        secureAdd.getAddress(),
    ) as any;

    await testGame.waitForDeployment();
    console.log("TestGame deployed to: ", await testGame.getAddress());

    await sleep(1000);

    // await ((await testGame.connect(owner).transferSSOwner(testGame.getAddress())).wait());

    
    // make testGame the owner of standalone shuffle
    console.log("transfering ownership of standalone shuffle to testgame ...");
    await (await standaloneShuffle.connect(owner).transferOwnership(testGame.getAddress())).wait(2);
    console.log('standalone shuffle owner = ', await standaloneShuffle.owner());

    console.log("transfering ownership of standalone secure add to testgame ...");
    await (await secureAdd.connect(owner).transferOwnership(testGame.getAddress())).wait(2);
    console.log('standalone secure add owner = ', await secureAdd.owner());



    // await ((await testGame.connect(owner).transferSSOwner(owner.getAddress())).wait());
    // console.log('standalone shuffle owner = ', await standaloneShuffle.owner());

    // console.log("transfering ownership of standalone shuffle to testgame ...");
    // await ((await standaloneShuffle.connect(owner).transferOwnership(testGame.getAddress())).wait());
    // console.log('standalone shuffle owner = ', await standaloneShuffle.owner());


    return [testGame, standaloneShuffle, secureAdd];
}



/*
    game play 
 */

export function createMockPlayers(nPlayers: number, signers?: Wallet[]) {
    if (signers) {
        assert(nPlayers <= signers.length);        
        return signers.slice(0, nPlayers).map((signer, index) => new MockPlayer(index, signer));
    }

    return Array.from({length: nPlayers}, (_, index) => new MockPlayer(index));
}

