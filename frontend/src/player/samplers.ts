// import { randomBytes, toBigInt } from "ethers";
import { utils, BigNumber } from "ethers";
import { ZqField } from "ffjavascript";

// circom Z/pZ modulo https://docs.circom.io/circom-language/basic-operators/
export const R = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

export const ZqZr = new ZqField(R);
const RANDOMNESS_STRING_LEN = 8;

// Generate a random number from 2 to R in bigint
const sampleFieldElement = () => {
    // syntax for earlier version of ethers
    const randomHex = utils.randomBytes(8);
    const randomNum = BigNumber.from(randomHex).toBigInt();
    
    const fe = ZqZr.e(randomNum) satisfies BigInt;
    return fe;
}

export const sampleRandomness = (nPlayers: number) => {
    return Array.from({length: nPlayers}, sampleFieldElement) as BigInt[];
}
  
function generateIdentityMatrix (nPlayers: number): number[][] {
    return [...Array(nPlayers).keys()].map((i: number) => {
        const one_hot = Array<number>(nPlayers).fill(0);
        one_hot[i] = 1;
        return one_hot;
    });
}

export function samplePermutationMatrix (nPlayers: number): number[][] {
    const matrix = generateIdentityMatrix (nPlayers);
    for (let j = nPlayers - 1; j > 0; j--) {
      let i = Math.floor(Math.random() * j);
      [matrix[j], matrix[i]] = [matrix[i], matrix[j]];
    }
    return matrix;
}

