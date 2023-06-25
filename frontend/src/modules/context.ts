import { ethers } from "ethers";

import shuffleContractABI from "../../../../artifacts/contracts/StandaloneShuffle.sol/StandaloneShuffle.json";
import secureAddContractABI from "../../../../artifacts/contracts/SecureAdd.sol/SecureAdd.json";
import gameContractABI from "../../../../artifacts/contracts/TestGame.sol/TestGame.json";

import { MockPlayer } from '../player/MockPlayer';

export enum GameState {
    LOBBY, // 0
    KEY_AGGREGATION, 
    SHUFFLE, 
    DECRYPT, 
    DAY_VOTE,
    DAY_WINCHECK_CREATE,  //5 
    DAY_WINCHECK_AGGREGATE,  
    NIGHT_VOTE_CREATE, 
    NIGHT_VOTE_AGGREGATE,
    NIGHT_WINCHECK_CREATE, 
    NIGHT_WINCHECK_AGGREGATE,  // 10
    VILLAGER_WON, 
    MAFIA_WIN 
  }
  
  export const gameStateArray: GameState[] = [
    GameState.LOBBY, // 0
    GameState.KEY_AGGREGATION, 
    GameState.SHUFFLE, 
    GameState.DECRYPT, 
    GameState.DAY_VOTE,
    GameState.DAY_WINCHECK_CREATE,  //5 
    GameState.DAY_WINCHECK_AGGREGATE,  
    GameState.NIGHT_VOTE_CREATE, 
    GameState.NIGHT_VOTE_AGGREGATE,
    GameState.NIGHT_WINCHECK_CREATE, 
    GameState.NIGHT_WINCHECK_AGGREGATE,  // 10
    GameState.VILLAGER_WON, 
    GameState.MAFIA_WIN 
  ]
  
  export const GameStateStrings = [
    "LOBBY", // 0
    "KEY_AGGREGATION", 
    "SHUFFLE", 
    "DECRYPT", 
    "DAY_VOTE",
    "DAY_WINCHECK_CREATE",  //5 
    "DAY_WINCHECK_AGGREGATE",  
    "NIGHT_VOTE_CREATE", 
    "NIGHT_VOTE_AGGREGATE",
    "NIGHT_WINCHECK_CREATE", 
    "NIGHT_WINCHECK_AGGREGATE",  // 10
    "VILLAGER_WON", 
    "MAFIA_WIN"
  ]


const Shuffle_Contract_Address = "0x910D9A237E41D5e5D3F2198802F40167a3e5D2a4";
const Secure_Add_Contract_Address = "0x82A90a2bB096eb58441337D9fCB070c49EF01cad";
const Game_Contract_Address = "0x954120C042f4a4f3654957362D8D3A69D31E22ed";


const privateKey = 872634;   // fix this for now to make it easier to debug 

export const provider = new ethers.providers.Web3Provider(window.ethereum);
export const signer = provider.getSigner()
// console.log('signer = ', signer);

// 4 is hardcoded here, meaning that this is the last player in a 5 players game for demo
// in practice this number should be auto set 
// signer is not really used so we don't need to care about it
// mockplayer doesn't talk to chain
export const myPlayerIndex = 4;
export const player = new MockPlayer(myPlayerIndex, signer as any, privateKey);

export const gameContract = new ethers.Contract(Game_Contract_Address, gameContractABI.abi, provider);
export const gameContractWithSigner = gameContract.connect(signer);

export const shuffleContract = new ethers.Contract(Shuffle_Contract_Address, shuffleContractABI.abi, provider);
export const shuffleContractWithSigner = shuffleContract.connect(signer);

export const secureAddContract = new ethers.Contract(Secure_Add_Contract_Address, secureAddContractABI.abi, provider);
export const secureAddContractWithSigner = secureAddContract.connect(signer);



export const gameContractInterface = new ethers.utils.Interface(gameContractABI.abi);
export const shuffleContractInterface = new ethers.utils.Interface(shuffleContractABI.abi);
export const secureAddContractInterface = new ethers.utils.Interface(secureAddContractABI.abi);


