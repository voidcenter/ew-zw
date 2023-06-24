import { ConnectButton } from '@rainbow-me/rainbowkit'

import { Account } from './components/Account'
import { Balance } from './components/Balance'
import { NetworkSwitcher } from './components/NetworkSwitcher'
import Terminal, { ColorMode, TerminalOutput, TerminalInput } from 'react-terminal-ui';

import { useState, useEffect, useRef } from 'react';

import { useQuery } from "@tanstack/react-query";
import { useAccount, useContractReads, useContractRead, useContractWrite } from "wagmi";
import { ethers } from "ethers";
import { TerminalController } from './misc';
import { strict as assert } from 'assert';

import gameContractABI from "../../../artifacts/contracts/TestGame.sol/TestGame.json";
// import { MockPlayer, AggregateKeyProof } from '../../../scripts/utils/MockPlayer';

import { MockPlayer, AggregateKeyProof, EncryptAndShuffleProof, DecryptProof } from './player/MockPlayer';


const Game_Contract_Address = "0x17CA95ec053ECE90Fd4a66dfeb5A8DE37d2f8886";


enum GameState {
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

const gameStateArray: GameState[] = [
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

const GameStateStrings = [
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


const privateKey = 872634;   // fix this for now to make it easier to debug 

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner()
// console.log('signer = ', signer);

// 4 is hardcoded here, meaning that this is the last player in a 5 players game for demo
// in practice this number should be auto set 
// signer is not really used so we don't need to care about it
// mockplayer doesn't talk to chain
const myPlayerIndex = 4;
const player = new MockPlayer(myPlayerIndex, signer as any, privateKey);

const gameContract = new ethers.Contract(Game_Contract_Address, gameContractABI.abi, provider);
const gameContractWithSigner = gameContract.connect(signer);





let start_agg_key = false;
let start_ens = false;
let start_decrypt = false;


export function App() {
  const [state, setState] = useState({});
  const [gameJoinTime, setGameJoinTime] = useState(null);
  const [shuffleFinishedTime, setShuffleFinishedTime] = useState(null);
  // const [ player, setPlayer ] = useState(null); 


  const connectToMetamask = async () => {
    // const provider = new ethers.providers.Web3Provider(window.ethereum)
    const accounts = await provider.send("eth_requestAccounts", []);
    const balance = await provider.getBalance(accounts[0]);
    const balanceInEther = ethers.utils.formatEther(balance);
    const block = await provider.getBlockNumber();

    // const signer = provider.getSigner()

    // const gameContract = new ethers.Contract(Game_Contract_Address, gameContractABI.abi, provider);
    const gameState = await gameContract.gameState();
    const nPlayers = Number(await gameContract.nPlayers());
    const playerAddresses = (await gameContract.getPlayerAddresses()).map((a: string) => a.toLocaleLowerCase());
    
    const myAddress = accounts[0];
    const gameJoined = playerAddresses.includes(myAddress);

    const playerPubKeys = await gameContract.getPlayerPubKeys();
    const nKeysAggregated = await gameContract.nKeysAggregated();
    assert(nKeysAggregated == playerPubKeys.length);

    const nPlayers_encryptedAndShuffled = Number(await gameContract.nPlayers_encryptedAndShuffled());
    const nPlayers_decrypted = Number(await gameContract.nPlayers_decrypted());

    const deck = (await gameContract.getDeck()).map(([card0, card1]) => [ BigInt(card0), BigInt(card1)]);
    const dayVotes = (await gameContract.getDayVotes()).map((v) => BigInt(v));
    const eliminated = (await gameContract.getPlayersEliminated());

    let myRole = undefined;
    if (nPlayers_decrypted == nPlayers) {
      myRole = await player.decryptMyCard(deck[myPlayerIndex]);
      if (!shuffleFinishedTime) {
        setShuffleFinishedTime(Date.now());
      }
    }

    const state = { myAddress: accounts[0], balance: balanceInEther, block, 
                    gameState, 
                    nPlayers, myPlayerIndex, playerAddresses, gameJoined, 
                    playerPubKeys, nPlayers_encryptedAndShuffled, nPlayers_decrypted, deck,
                    myRole,
                    dayVotes, eliminated };
    console.log(state)
    setState(state);
  };

  const joinGame = async () => {
    // const provider = new ethers.providers.Web3Provider(window.ethereum);
    // const signer = provider.getSigner()
    // console.log('signer = ', signer);

    // const gameContract = new ethers.Contract(Game_Contract_Address, gameContractABI.abi, provider);
    // const gameContractWithSigner = gameContract.connect(signer);

    const r = await gameContractWithSigner.joinGame();
    const rr = await r.wait();
    console.log('r = ', r, 'rr = ', rr);

    setGameJoinTime(Date.now());
    setShuffleFinishedTime(null);
    
    await connectToMetamask();
  }

  const aggregateKey = async () => {
    const aggKey = BigInt(await gameContract.aggPubKey());
    let proof: AggregateKeyProof = await player.aggregatePubKey(aggKey);
    console.log(proof);

    const r = await gameContractWithSigner.playerAggregateKey(proof);
    const rr = await r.wait();
    console.log('r = ', r, 'rr = ', rr);

    await connectToMetamask();
  }

  const ens = async () => {
    const aggKey = BigInt(await gameContract.aggPubKey());

    let proof: EncryptAndShuffleProof = await player.encryptAndShuffleDeck(aggKey, state.deck, state.nPlayers);
    console.log('proof = ', proof);

    const r = await gameContractWithSigner.zkshuffle_encryptAndShuffle(proof);
    const rr = await r.wait();
    console.log('r = ', r, 'rr = ', rr);

    await connectToMetamask();
  }

  const decrypt = async () => {
    
    const deckToD = state.deck.slice();
    deckToD.splice(state.myPlayerIndex, 1);
    console.log('deckToD = ', deckToD);

    let proof: DecryptProof = await player.decryptDeck(deckToD, state.nPlayers);
    console.log('proof = ', proof);
    
    const r = await gameContractWithSigner.zkshuffle_decrypt(proof);
    const rr = await r.wait();
    console.log('r = ', r, 'rr = ', rr);

    await connectToMetamask();
  }


  const dayVote = async (vote: number) => {
    console.log('voting for ', vote);
    const r = await gameContractWithSigner.dayVote(vote);
    const rr = await r.wait();
    console.log('r = ', r, 'rr = ', rr);
  }


  /* timer */
  const timerRef = useRef(null);
  useEffect(() => {
    timerRef.current = setInterval(
      async () => {
        // pushTermText('tic');
        await connectToMetamask();
        if (state.gameState == GameState.KEY_AGGREGATION && state.playerPubKeys.length == state.myPlayerIndex) {
          if (!start_agg_key) {
            start_agg_key = true;
            await aggregateKey();
          }
        }
        if (state.gameState == GameState.SHUFFLE && state.nPlayers_encryptedAndShuffled == state.myPlayerIndex) {
          if (!start_ens) {
            start_ens = true;
            await ens();
          }
        }
        if (state.gameState == GameState.DECRYPT && state.nPlayers_decrypted == state.myPlayerIndex) {
          if (!start_decrypt) {
            start_decrypt = true;
            await decrypt();
          }
        }
      },
      1000
    )
    return () => {
      clearInterval(timerRef.current)
    }
  })
      

  const render = () => {
    if (!state.myAddress) {
      return (
        <p> Loading ... </p>
      )
    } else {

      console.log(gameJoinTime, shuffleFinishedTime);
      return (
        <div>
          <p>Player {state.myAddress}</p>
          <p>Contract {Game_Contract_Address}</p>
          <p>Your ETH Balance is: {state.balance}</p>
          <p>Current ETH Block is: {state.block}</p>
          <p>Public key: {player.publicKey.toString()}</p>
          <p>Game state is: {GameStateStrings[state.gameState]}</p>
          <p>nPlayers: {state.nPlayers}</p>
          <p>Players:</p>
          <ul>
                {state.playerAddresses.map(function(address, index){
                    return <li key={ index }>{address}</li>;
                  })}
          </ul>
          <p>Public keys:</p>
          <ul>
                {state.playerPubKeys.map(function(pubKey, index){
                    return <li key={ index }>{'player ' + index + ': ' + pubKey}</li>;
                  })}
          </ul>
          <p>nPlayers shuffled: {state.nPlayers_encryptedAndShuffled}</p>
          <p>nPlayers decrypted: {state.nPlayers_decrypted}</p>
          <p>Deck:</p>
          <ul>
                {state.deck.map(function(card, index){
                    return <li key={ index }>{'card ' + index + ': ' + card[0] + ', ' + card[1]}</li>;
                  })}
          </ul>
          {state.myRole && (<p>My role is: {state.myRole == 1 ? 'Villager' : 'Mafia'}</p>)}
          {gameJoinTime && (<p>Game join time: {gameJoinTime}</p>)}
          {shuffleFinishedTime && (<p>Shuffle finished time: {shuffleFinishedTime}</p>)}
          {gameJoinTime && shuffleFinishedTime && (<p>Shuffle took: {(shuffleFinishedTime - gameJoinTime) / 1000.0} seconds.</p>)}
          
          <p> day votes: </p>
          <ul>
                {state.dayVotes.map((vote, index) => (
                    <li key={index} >player {index} voted for player {Number(vote)}</li>
                  )) }
          </ul>

          {/* {state.GameState == GameState.DAY_VOTE && ( */}
            {true && (
              [...Array(state.nPlayers).keys()].filter((i) => (i != state.myPlayerIndex)).map((i, index) => (
              <button key={index} onClick={() => dayVote(index)}>Vote player {i}</button>
            ))

          )}

          <br/>
          <br/>
          {<button disabled={state.gameState != GameState.LOBBY 
                             || state.nPlayers != state.myPlayerIndex} 
                   onClick={() => joinGame()}>join game</button>}

          {/* {<button disabled={state.gameState != GameState.KEY_AGGREGATION 
                             || state.playerPubKeys.length != state.myPlayerIndex} 
                   onClick={() => aggregateKey()}>aggregate key</button>}

          {<button disabled={state.gameState != GameState.SHUFFLE 
                             || state.nPlayers_encryptedAndShuffled != state.myPlayerIndex} 
                   onClick={() => ens()}>encrypt and shuffle</button>}

          {<button disabled={state.gameState != GameState.DECRYPT                          
                             || state.nPlayers_decrypted != state.myPlayerIndex} 
                   onClick={() => decrypt()}>decrypt</button>} */}

        </div>
      );
    }
  }

  return (
    <>
      <h1>ZK-Werewolf</h1>
      <div>
            {render()}
      </div>
    </>
  )
}
