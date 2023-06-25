import { ethers } from "ethers";
import { strict as assert } from 'assert';

import { GameState, gameStateArray, GameStateStrings, 
  provider, signer, myPlayerIndex, player, gameContract, gameContractWithSigner,
  shuffleContract, shuffleContractWithSigner, secureAddContract, secureAddContractWithSigner 
} from '../modules/context';

import { Role } from "../player/MockPlayer";


export async function refreshState (setState: any)  {
  // const provider = new ethers.providers.Web3Provider(window.ethereum)
  const accounts = await provider.send("eth_requestAccounts", []);
  const balance = await provider.getBalance(accounts[0]);
  const balanceInEther = ethers.utils.formatEther(balance);
  const block = await provider.getBlockNumber();

  // Game 
  const gameState = await gameContract.gameState();
  const nPlayers = Number(await gameContract.nPlayers());
  const nPlayersStillInGame = Number(await gameContract.nPlayersStillInGame());
  const playerAddresses = (await gameContract.getPlayerAddresses()).map((a: string) => a.toLocaleLowerCase());
  const stillInGame = (await gameContract.getPlayerStillInGame());    
  const myAddress = accounts[0];
  const gameJoined = playerAddresses.includes(myAddress);

  // Shuffle 
  const shuffleState = await shuffleContract.gameState();
  const playerPubKeys = await shuffleContract.getPlayerPubKeys();
  const nKeysAggregated = await shuffleContract.nKeysAggregated();
  assert(nKeysAggregated == playerPubKeys.length);
  const nPlayers_encryptedAndShuffled = Number(await shuffleContract.nPlayers_encryptedAndShuffled());
  const nPlayers_decrypted = Number(await shuffleContract.nPlayers_decrypted());
  const deck = (await shuffleContract.getDeck()).map(([card0, card1]) => [ BigInt(card0), BigInt(card1)]);

  // Day vote 
  const dayVotes = (await gameContract.getDayVotes()).map((v) => BigInt(v));

  // Win check 
  const secureAddState = await secureAddContract.state();
  const nPlayer_created_shares = Number(await secureAddContract.nPlayers_submittedShares());
  const nPlayer_aggregated_shares = Number(await secureAddContract.nPlayers_aggregatedShares());
  const sum1 = Number(await gameContract.sum1());
  const sum2 = Number(await gameContract.sum2());


  let myRole = undefined;
  if (nPlayers_decrypted == nPlayers) {
    myRole = await player.decryptMyCard(deck[myPlayerIndex]);
    // if (!shuffleFinishedTime) {
    //   setShuffleFinishedTime(Date.now());
    // }
    if (myRole != Role.VILLAGER && myRole != Role.MAFIA) {
      myRole = Role.UNDEFINED;
    }
  }

  const state = { myAddress: accounts[0], balance: balanceInEther, block, 

                  gameState, 
                  nPlayers, myPlayerIndex, playerAddresses, gameJoined, stillInGame, nPlayersStillInGame,

                  shuffleState,
                  playerPubKeys, nPlayers_encryptedAndShuffled, nPlayers_decrypted, deck,
                  myRole,

                  dayVotes, 
                
                  secureAddState, 
                  nPlayer_created_shares, nPlayer_aggregated_shares, sum1, sum2,

                };
  // console.log(state)
  setState(state);
};

