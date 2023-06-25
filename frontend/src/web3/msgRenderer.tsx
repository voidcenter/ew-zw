import { GameState, gameStateArray, GameStateStrings, 
    provider, signer, myPlayerIndex, player, gameContract, gameContractWithSigner,
    shuffleContract, shuffleContractWithSigner, secureAddContract, secureAddContractWithSigner 
} from '../modules/context';
  
import { Role, getRoleName } from '../player/MockPlayer';

export const Player_Names = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve'];


export const My_Name = 'Eve';  //hacky
// should be Player_Names[state.myPlayerIndex]

const Name_color = '#A7E8BD';
const Command_color = '#8DFDDF';
const Conclusion_color = 'gold';
const Important_color = '#FD7877';
const System_color = "#FD8F59";

export function Name({ children }) {
  return (
    <span style={{color: Name_color}}>{ children }</span>
  );
}

export function Command({ children }) {
  return (
    <span style={{color: Command_color, fontWeight: 'bold'}}>{ children }</span>
  );
}

export function Imp({ children }) {
  return (
    <span style={{color: Important_color}}>{ children }</span>
  )
}

export function Conclusion({ children }) {
  return (
    <span style={{color: Conclusion_color}}>{ children }</span>
  )
}

export function System({ children }) {
  return (
    <span style={{color: System_color}}>{ children }</span>
  )
}

export function Msg({ children }) {
  return (
    <span><System>{ children }</System></span>
  );
}

function getPlayernameAsSubject(index) {
  const name = Player_Names[index];
  return name == "Me" ? "I" : name;
}

export function render_log_msg(p: any, state: any) {

    switch (p.name) {

        /* game play */ 

        case 'ReturnToLobby': {
          return <Msg><System>We are at game lobby, please join the game by typing <Command>join game</Command>. <System>Joining the game requires you to sign a transaction.</System> You name in this game is <Name>{My_Name}</Name></System></Msg>;
        }
        case 'PlayerJoined': {
          return <Msg><Name>{getPlayernameAsSubject(p.args.index)}</Name> joined the game.</Msg>;
        }
        case 'StartGame': {
          return <Msg><br/><System>The game starts! We have {Number(p.args.nPlayers)} players. They are <Name>{Player_Names.join(', ')}</Name></System></Msg>;
        }
        case 'EnterDayVote': {
          return <Msg><br/><System>Day starts! :) Please discuss and cast your vote. You can vote by typing <Command>vote (player-name)</Command>.</System></Msg>;
        }
        case 'PlayerDayVote': {
          return <Msg><Name>{getPlayernameAsSubject(p.args.playerId)}</Name> voted for <Name>{Player_Names[p.args.vote]}</Name>!</Msg>;
        }
        case 'PlayerEliminated': {
          return <Msg><Name>{getPlayernameAsSubject(p.args.playerId)}</Name> got the most votes and is eliminated!</Msg>;
          // TODO: display voting strings
          // TODO: update player lists
        }
        case 'Wincheck_done': {
          return <Msg><System>Winning checking is done. There are <Imp>{Number(p.args.sum1)}</Imp> villagers left and <Imp>{Number(p.args.sum2)}</Imp> werewolves left. <Conclusion>{
            p.args.sum1 <= p.args.sum2 
            ? "Werewolves won!!!" 
            : (p.args.sum2 == 0 
               ? "Villagers won!!!" 
               : ""
              )
          }</Conclusion></System></Msg>;
        }
        case 'EnterNightVote': {
          if (player.role == Role.VILLAGER) {
            return <Msg><br/><System>The night starts! As a <Conclusion>villager</Conclusion>, you just need to sit quiet.</System></Msg>;
          }
          else if (player.role == Role.MAFIA) {
            return <Msg><br/><System>The night starts! As a <Conclusion>werewolf</Conclusion>, please cast your vote by typing <Command>vote (player-name)</Command>.</System></Msg>;
          } else {
            return <Msg><br/><System>The night starts! Your role is undefined, which is strange. Who are you?</System></Msg>;
          }
        }

        /* shuffle */

        case 'EnterAggregateKey': {
            return <Msg><System>[System] Using ZK shuffle to assign roles, first we need to aggregate the public keys. You will need to sign a transaction.</System></Msg>;
        }
        case 'PlayerAggregatedKey': {
          return <Msg><System>[System]</System> <Name>{getPlayernameAsSubject(p.args.playerIndex)}</Name> aggregated public key.</Msg>;
        }
        case 'EnterEncryptAndShuffle': {
          return <Msg><System>[System] Now we need to encrypt and the shuffle the role cards in turn. You will need to sign a transaction.</System></Msg>;
        }
        case 'PlayerEncryptedAndShuffled': {
          return <Msg><System>[System]</System> <Name>{getPlayernameAsSubject(p.args.playerIndex)}</Name> encrypted and shuffled the role cards.</Msg>;
        }
        case 'EnterDecrypt': {
          return <Msg><System>[System] Now we need to decrypt the role cards. You will need to sign a transaction.</System></Msg>;
        }
        case 'PlayerDecrypted': {
          return <Msg><System>[System]</System> <Name>{getPlayernameAsSubject(p.args.playerIndex)}</Name> decrypted the role cards.</Msg>;
        }
        case 'ZKShuffleDone': {
            return <Msg><System>Whew! The role assignment has finished and your secret role is <Conclusion>
                  {getRoleName(state.myRole)}</Conclusion></System></Msg>;
        }

        /* secure add */ 

        case 'Enter_Wincheck_Create': {
          return <Msg><System>[System] We are now checking if any side has won using MPC. First we need everyone to submit their vote in the form of secret shares. You will need to sign a transaction.</System></Msg>;
        }
        case 'Wincheck_Create': {
          return <Msg><System>[System]</System> <Name>{getPlayernameAsSubject(p.args.playerIndex)}</Name> submitted vote in the form of secret shares.</Msg>;
        }
        case 'Enter_Wincheck_Aggregate': {
          return <Msg><System>[System] We now need to aggregate everyone\'s secret shares. You will need to sign a transaction.</System></Msg>;
        }
        case 'Wincheck_Create': {
          return <Msg><System>[System]</System> <Name>{getPlayernameAsSubject(p.args.playerIndex)}</Name> aggregated the secret shares.</Msg>;
        }
        default: {
            return undefined;
        }
    }
}

