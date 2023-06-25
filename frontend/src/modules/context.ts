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



  export const standaloneShuffleAddress = '0x0ca1cfB29D969B0Cb881613f1C7D98B85cB8b693';
  export const secureAddAddress = '0x6DCaBdd0B846C211611De50E9315ceEa02AC12A4';
  export const gameContractAddress = '0x0d7CFC9C262De71cf51CfC2C66cBC90391c263Ae';
  
  

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

export const gameContract = new ethers.Contract(gameContractAddress, gameContractABI.abi, provider);
export const gameContractWithSigner = gameContract.connect(signer);

export const shuffleContract = new ethers.Contract(standaloneShuffleAddress, shuffleContractABI.abi, provider);
export const shuffleContractWithSigner = shuffleContract.connect(signer);

export const secureAddContract = new ethers.Contract(secureAddAddress, secureAddContractABI.abi, provider);
export const secureAddContractWithSigner = secureAddContract.connect(signer);



export const gameContractInterface = new ethers.utils.Interface(gameContractABI.abi);
export const shuffleContractInterface = new ethers.utils.Interface(shuffleContractABI.abi);
export const secureAddContractInterface = new ethers.utils.Interface(secureAddContractABI.abi);


