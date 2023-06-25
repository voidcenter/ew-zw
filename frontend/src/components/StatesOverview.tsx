

import { GameState, gameStateArray, GameStateStrings, 
    provider, signer, myPlayerIndex, player, gameContract, gameContractWithSigner,
    shuffleContract, shuffleContractWithSigner, secureAddContract, secureAddContractWithSigner 
} from '../modules/context';

import * as gameplay from '../web3/gameplay';



export function StatesOverview(props: any) {

    const state = props.state;
    const dayVote = props.dayVote;

    return (
        <div>
          <p>Player {state.myAddress}</p>
          {/* <p>Contract {Game_Contract_Address}</p> */}
          {/* <p>Your ETH Balance is: {state.balance}</p>
          <p>Current ETH Block is: {state.block}</p> */}
          <p>Public key: {player.publicKey.toString()}</p>
          <p>Game state is: {GameStateStrings[state.gameState]}</p>
          <p>Shuffle state is: {GameStateStrings[state.shuffleState]}</p>
          <p>SecureAdd state is: {GameStateStrings[state.secureAddState]}</p>
          <p>nPlayers / still in game: {state.nPlayers} / {state.nPlayersStillInGame} 
                 || {JSON.stringify(state.stillInGame)}  ||  {state.stillInGame.length > 0 && state.stillInGame[state.myPlayerIndex].toString()}</p>
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
          <p>nPlayers shuffled / decrypted: {state.nPlayers_encryptedAndShuffled} / {state.nPlayers_decrypted}</p>
          <p>Deck:</p>
          <ul>
                {state.deck.map(function(card, index){
                    return <li key={ index }>{'card ' + index + ': ' + card[0] + ', ' + card[1]}</li>;
                  })}
          </ul>
          {state.myRole && (<p>My role is: {state.myRole == 1 ? 'Villager' : (state.myRole == 2 ? 'Mafia': 'Undefined')}</p>)}
          {/* {gameJoinTime && (<p>Game join time: {gameJoinTime}</p>)}
          {shuffleFinishedTime && (<p>Shuffle finished time: {shuffleFinishedTime}</p>)}
          {gameJoinTime && shuffleFinishedTime && (<p>Shuffle took: {(shuffleFinishedTime - gameJoinTime) / 1000.0} seconds.</p>)} */}
          
          <p>nPlayers created / aggregated shares: {state.nPlayer_created_shares} / {state.nPlayer_aggregated_shares}</p>
          <p>Sums: {state.sum1}, {state.sum2}</p>

          <p> day votes: </p>
          <ul>
                {state.dayVotes.map((vote, index) => (
                    <li key={index} >player {index} voted for player {Number(vote)}</li>
                  )) }
          </ul>

          {state.gameState == GameState.DAY_VOTE && (
            // {true && (
              [...Array(state.nPlayers).keys()].filter((i) => (i != state.myPlayerIndex)).map((i, index) => (
              <button key={index} onClick={() => dayVote(index)}>Vote player {i}</button>
            ))

          )}

          <br/>
          <br/>
          {<button disabled={state.gameState != GameState.LOBBY 
                             || state.nPlayers != state.myPlayerIndex} 
                   onClick={() => gameplay.joinGame()}>join game</button>}

        </div>
    );
}
