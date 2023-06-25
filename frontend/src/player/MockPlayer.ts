import { Wallet } from "ethers";
import { groth16 } from "snarkjs";
import { exportSolidityCallDataGroth16 as exportSolidityCallData } from "./helpers";
import { samplePermutationMatrix } from "./samplers";
import { strict as assert } from 'assert';

const MIN_PRIVATE_KEY = 3;
// const MAX_PRIVATE_KEY = 8;   // can be much bigger, like p = 21888242871839275222246405745257275088548364400416034343698204186575808495617  https://docs.circom.io/circom-language/basic-operators/
const MAX_PRIVATE_KEY = 65536;   // can be much bigger, like p = 21888242871839275222246405745257275088548364400416034343698204186575808495617  https://docs.circom.io/circom-language/basic-operators/

const MIN_RANDOM_FACTOR = 3;
const MAX_RANDOM_FACTOR = 65536;

export type Tuple2n = [bigint, bigint];

export interface AggregateKeyProof {
    a: Tuple2n;
    b: [Tuple2n, Tuple2n];
    c: Tuple2n;
    newAggKey: bigint; 
    playerPubKey: bigint; 
    prevAggKey: bigint; 
}

export interface EncryptAndShuffleProof {
    a: Tuple2n;
    b: [Tuple2n, Tuple2n];
    c: Tuple2n;
    maskedDeck: bigint[][];
    aggPubKey: bigint;
    deckToMask: bigint[][];
}

export interface DecryptProof {
    a: Tuple2n;
    b: [Tuple2n, Tuple2n];
    c: Tuple2n;
    playerPubKey: bigint;
    unmaskedDeck: bigint[][];  
    deckToUnmask: bigint[][];
}

export interface WinCheck_CreateShares_Proof {
    a: Tuple2n;
    b: [Tuple2n, Tuple2n];
    c: Tuple2n;
    shareCiphertexts1: Tuple2n[];
    shareCiphertexts2: Tuple2n[];
    cardToUnmask: Tuple2n;
    shareValueOffset: bigint;
    pks: bigint[];
}

export interface WinCheck_AggregateShares_Proof {
    a: Tuple2n;
    b: [Tuple2n, Tuple2n];
    c: Tuple2n;
    sum1: bigint;
    sum2: bigint;
    shareCiphertexts1: Tuple2n[];
    shareCiphertexts2: Tuple2n[];
}


export enum Role {
    UNDEFINED = 0,
    VILLAGER = 1,
    MAFIA = 2
}


import AggKeyWasm from "../../../../circuits/zkshuffle_aggregate_key.wasm";
import AggKeyZkey from "../../../../circuits/zkshuffle_aggregate_key.zkey";
import EnSWasm from '../../../../circuits/zkshuffle_encrypt_and_shuffle_5.wasm';
import EnSZkey from '../../../../circuits/zkshuffle_encrypt_and_shuffle_5.zkey';
import DecryptWasm from '../../../../circuits/zkshuffle_decrypt_5.wasm';
import DecryptZkey from '../../../../circuits/zkshuffle_decrypt_5.zkey';
import DecryptSelfWasm from '../../../../circuits/zkshuffle_decrypt_self.wasm';
import DecryptSelfZkey from '../../../../circuits/zkshuffle_decrypt_self.zkey';


import WincheckCreateWasm from `../../../../circuits/wincheck_create_shares_5.wasm`;
import WincheckCreateZkey from `../../../../circuits/wincheck_create_shares_5.zkey`;
import WincheckAggWasm from `../../../../circuits/wincheck_aggregate_shares_5.wasm`;
import WincheckAggZkey from `../../../../circuits/wincheck_aggregate_shares_5.zkey`;



export function getRoleName(role: Role) {
    return role == Role.VILLAGER 
    ? "Villager" 
    : (role == Role.MAFIA
        ? "Werewolf" : "Undefined");
}


// intersting, how to create n shares adding up to v + n * offset, such that 
// all shares are positive ?   v is positive 
//
// here, value is either 0 or 1             offset should a large number
// for all shares except the last one, abs(share - offset) < offset/n
// this way, the last share can be simply   offset + value - sum(previous shares),
// and the last share is guaranteed to be in (0, offset * 2 + value), 
// given that value is non-negative 
function createShares(value: bigint, nShares: number, offset: bigint): bigint[] {
    const randomRange = Math.floor(Number(offset) / nShares);

    let shares: bigint[] = [];
    let sum = 0n;
    for (let i=0; i<nShares - 1; i++) {
        const share = BigInt(Math.floor(Math.random() * randomRange * 2) - randomRange);
        shares.push(share);
        sum = sum + share;
    }

    const share = value - sum;
    shares.push(share);

    return shares.map(x => x + offset);
}

function createRandomness(n: number): bigint[] {
    return Array.from({length: n}, 
        () => Math.floor(Math.random() * (MAX_RANDOM_FACTOR - MIN_RANDOM_FACTOR)) + MIN_RANDOM_FACTOR)
        .map(x => BigInt(x));
}


export class MockPlayer {
    privateKey: number;
    publicKey: BigInt = 1n;
    signer?: Wallet;
    role: number = Role.VILLAGER;
    myPlayderIndex: number;
    roleCardBeforeDecryption: Tuple2n = [1n, 1n];
    playerPublicKeys: bigint[] = [];
    
    constructor(_myPlayerIndex: number, _signer?: Wallet, _privateKey?: number) {
        this.myPlayderIndex = _myPlayerIndex;

        if (_signer) {
            this.signer = _signer;
        }

        if (_privateKey) {
            this.privateKey = _privateKey;
        } else {
            this.privateKey = Math.floor(Math.random() * (MAX_PRIVATE_KEY - MIN_PRIVATE_KEY)) + MIN_PRIVATE_KEY;
        }
    }

    getSigner() {
        return this.signer;
    }


    /*
        role assignment  --  zk shuffle
     */

    // Run aggkey circuit locally, generate witness and proof
    async aggregatePubKey(prevAggKey: bigint): Promise<AggregateKeyProof> {

        console.log(' = ', this.privateKey, prevAggKey);

        const groth16PO = await exportSolidityCallData(
            await groth16.fullProve({ 
                sk: this.privateKey, 
                old_aggk: prevAggKey    // without tobigint() it errors somehow
            }, 
            // "../../../../circuits/zkshuffle_aggregate_key.wasm",  "../../../../circuits/zkshuffle_aggregate_key.zkey")
            AggKeyWasm, AggKeyZkey)
            // these path are relative to the execution path
        );

        const [newAggKey, playerPubKey] = groth16PO.publicSignals;

        this.publicKey = playerPubKey;
        return {
            ...groth16PO,
            newAggKey: newAggKey as bigint, 
            playerPubKey: playerPubKey as bigint, 
            prevAggKey,     
        } as any;      // bigint BigInt hell 
    }

    // after agg key, store everyone's public keys
    setPlayerPublicKeys(_playerPublicKeys: bigint[]) {
        this.playerPublicKeys = _playerPublicKeys;
    }


    // Run encryptAndShuffle circuit locally, generate witness and proof
    // randomness doesn't need to be stored as El Gamal allows them to cancel out during decryption
    async encryptAndShuffleDeck(aggKey: bigint, deckToMask: bigint[][], nPlayers: number): Promise<EncryptAndShuffleProof> {

        const randomness = createRandomness(nPlayers);
        const permutation_matrix = samplePermutationMatrix(nPlayers);

        const groth16PO = await exportSolidityCallData(
            await groth16.fullProve({ 
                agg_pk: aggKey, 
                deck: deckToMask, 
                randomness,
                permutation_matrix
            }, EnSWasm, EnSZkey)
        );

        // reshape [2*nPlayers] -> [nPlayers][2]
        const maskedDeck = [];
        // assert(groth16PO.publicSignals.length = 2 * nPlayers);
        // if it is public signals, then why is it 2*nplayers?  it should be 4*nplayers+1
        // Q: 
        for (let i = 0; i< nPlayers; i++) {
            maskedDeck.push(groth16PO.publicSignals.splice(0,2));
        }

        return {
            ...groth16PO,
            maskedDeck,
            aggPubKey: aggKey,
            deckToMask: deckToMask
        } as EncryptAndShuffleProof;
    }


    // deckToUnmask should have nPlayers - 1 cards with player's card removed
    async decryptDeck(deckToUnmask: bigint[][], nPlayers: number): Promise<DecryptProof> {

        const groth16PO = await exportSolidityCallData(
            await groth16.fullProve({ 
                sk: this.privateKey, 
                deck_to_unmask: deckToUnmask, 
            }, DecryptWasm, DecryptZkey)
        );
        console.log('public signals length = ', groth16PO.publicSignals.length);

        // reshape [2*nPlayers] -> [nPlayers][2]
        const unmaskedDeck = [];
        const playerPubKey = groth16PO.publicSignals.splice(0,1)[0];
        // assert(playerPubKey == this.publicKey);
        for (let i = 0; i< nPlayers - 1; i++) {
            unmaskedDeck.push(groth16PO.publicSignals.splice(0,2));
        }

        return {            // note, only nPlayers - 1 card are here! 
            ...groth16PO,
            playerPubKey,           // output
            unmaskedDeck,           // output
            deckToUnmask            // public input
        } as DecryptProof;
    }


    // The last step in zkshuffle, everyone decrypt their own card 
    async decryptMyCard(cardToUnmask: bigint[]): Promise<Role> {

        this.roleCardBeforeDecryption = [cardToUnmask[0], cardToUnmask[1]];

        const groth16PO = await exportSolidityCallData(
            await groth16.fullProve({ 
                sk: this.privateKey, 
                ciphertext: cardToUnmask, 
            }, DecryptSelfWasm, DecryptSelfZkey)
        );

        const [ MAX_RANDOM_FACTOR, _, unmaskedCardC2 ] = groth16PO.publicSignals;
        // console.log(myPubKey, this.publicKey);
        // assert(myPubKey == this.publicKey);

        this.role = Number(unmaskedCardC2);
        return this.role;
    }


    /*
        winning condition check  --  secure add
     */
    async winCheck_createShares(nPlayers: number, shareValueOffset: bigint): Promise<WinCheck_CreateShares_Proof> {

        // prep data
        const vote1 = (this.role == Role.VILLAGER) ? 1n : 0n;
        const vote2 = (this.role == Role.MAFIA) ? 1n : 0n;
        
        console.log('role ', this.role, 'vote: ', vote1, vote2);

        const shares1 = createShares(vote1, nPlayers, shareValueOffset);
        const shares2 = createShares(vote2, nPlayers, shareValueOffset);
        
        const randomness1 = createRandomness(nPlayers);
        const randomness2 = createRandomness(nPlayers);

        const data = { 
            sk: this.privateKey, 
            card_to_unmask: this.roleCardBeforeDecryption,
            share_value_offset: shareValueOffset,
            shares1,
            shares2,
            randomness1,
            randomness2,
            pks: this.playerPublicKeys
        };
        // console.log(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));

        console.log('win check create data = ', data);

        const groth16PO = await exportSolidityCallData(
            await groth16.fullProve(data, WincheckCreateWasm, WincheckCreateZkey)
        );
        console.log('public signals length = ', groth16PO.publicSignals.length);

        // gather and return proof
        const shareCiphertexts1: Tuple2n[] = [];
        const shareCiphertexts2: Tuple2n[] = [];
        // console.log('role = ', groth16PO.publicSignals[0]);
        for (let i = 0; i< nPlayers; i++) {
            shareCiphertexts1.push(groth16PO.publicSignals.splice(0,2) as Tuple2n);
        }
        for (let i = 0; i< nPlayers; i++) {
            shareCiphertexts2.push(groth16PO.publicSignals.splice(0,2) as Tuple2n);
        }

        return {
            ...groth16PO,
            shareCiphertexts1,
            shareCiphertexts2,
            cardToUnmask: this.roleCardBeforeDecryption,
            shareValueOffset: BigInt(shareValueOffset),
            pks: this.playerPublicKeys
        } as WinCheck_CreateShares_Proof;
    }


    // aggreagte the secret shares 
    async winCheck_aggregateShares( shareCiphertexts1: Tuple2n[], 
                                    shareCiphertexts2: Tuple2n[]): Promise<WinCheck_AggregateShares_Proof> {

        const data = { 
            sk: this.privateKey, 
            share_ciphertexts_1: shareCiphertexts1,
            share_ciphertexts_2: shareCiphertexts2
        };
        // console.log(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));

        console.log('win check aggregate data = ', data);

        const groth16PO = await exportSolidityCallData(
            await groth16.fullProve(data, WincheckAggWasm, WincheckAggZkey)
        );   
        console.log('public signals length = ', groth16PO.publicSignals.length);

        // console.log('decrypted 1 = ', groth16PO.publicSignals.splice(2, nPlayers));
        // console.log('decrypted 2 = ', groth16PO.publicSignals.splice(2, nPlayers));
                
        return {
            ...groth16PO,
            sum1: groth16PO.publicSignals[0],
            sum2: groth16PO.publicSignals[1],
            shareCiphertexts1,
            shareCiphertexts2       
        } as WinCheck_AggregateShares_Proof;
    }
    
}
