
import { GameState, gameStateArray, GameStateStrings, 
    provider, signer, myPlayerIndex, player, gameContract, gameContractWithSigner,
    shuffleContract, shuffleContractWithSigner, secureAddContract, secureAddContractWithSigner, 
    gameContractInterface, shuffleContractInterface, secureAddContractInterface
  } from './context';
  

import { refreshState } from '../web3/refresh';
import * as gameplay from '../web3/gameplay';
import * as triggers from './triggers';

import { Role } from '../player/MockPlayer';
import { render_log_msg, Command, System, Name, Player_Names, My_Name } from '../web3/msgRenderer';


import Terminal, { ColorMode, TerminalOutput, TerminalInput } from '../components/terminal';
import { socket } from './socket';



let eventList = [];
export let chatList: string[] = [];


gameContract.on("*", (event) => {
  const p = gameContractInterface.parseLog(event)
  // console.log(p);
  eventList.push(p);
  return () => {
    gameContract.removeAllListeners();
  };
})

shuffleContract.on("*", async (event) => {
  const p = shuffleContractInterface.parseLog(event)
  // console.log(p);
  eventList.push(p);
  return () => {
    shuffleContract.removeAllListeners();
  };
})

secureAddContract.on("*", async (event) => {
  const p = secureAddContractInterface.parseLog(event)
  // console.log(p);
  eventList.push(p);
  return () => {
    secureAddContract.removeAllListeners();
  };
})




export async function eventAndChat_daemonListner (state, setState, pushMsgs, opacitySwitchers) {

    await refreshState(setState);
    console.log('state = ', state);

    // triggers.refresh_and_triggers(state, setState);
    if (eventList.length > 0) {
      const renderL = eventList.slice();
      eventList = [];

      // if there is a delay in getting role, wait for later to display the message
      // otherwise it will say the role is undefined
      // it takes some time for the consensual value to be propagated to our read path 
      if (state.myRole != Role.MAFIA && state.myRole != Role.VILLAGER) {
        const xindex = renderL.findIndex(e => e.name == 'ZKShuffleDone');
        if (xindex >= 0) {
          eventList.push(renderL[xindex]);
          renderL.splice(xindex, 1);
        }
      }

      const msgs = renderL.map((p) => render_log_msg(p, state)).filter((msg) => msg);

      console.log(msgs);
      console.log(renderL);
      pushMsgs(msgs.map((msg) => <TerminalOutput>{msg}</TerminalOutput>));
    }

    if (chatList.length > 0) {
      const renderC = chatList.slice();
      chatList = [];

      pushMsgs(renderC.map((msg) => {
        const playerName = msg.split(':')[0];
        const text = msg.split(':')[1].trim();
        return playerName == My_Name 
               ? undefined 
               : <TerminalOutput><Name>{playerName}</Name>: {text}</TerminalOutput>;
      }).filter(e => e))    
    }

    //triggers
    await triggers.check_triggers(state, pushMsgs);

}




export async function sendMessage (e, _msg: string, state, setInput, pushMsgs, opacitySwitchers) {

    e.preventDefault();
    setInput('');
    console.log('msg = ', _msg);
    socket.emit('chat message', _msg);

    const msg = _msg.trim().toLowerCase();

    if (msg == 'join game' && state.gameState == GameState.LOBBY) {
      pushMsgs([
        <TerminalInput><Command>{msg}</Command></TerminalInput>,
        <TerminalOutput><System>Joining game ... </System></TerminalOutput>
      ]);
      await gameplay.joinGame();
      opacitySwitchers.goToDay();

    } else if (msg.split(' ')[0] == 'vote' && state.gameState == GameState.DAY_VOTE) {
      const votee = msg.split(' ')[1];
      const x = Player_Names.findIndex(e => e.toLowerCase() == votee);
      if (x < 0) {
        pushMsgs([
          <TerminalInput><Command>{msg}</Command></TerminalInput>,
          <TerminalOutput>Unknown player: <Name>{votee}</Name></TerminalOutput>
        ]);
      } else {  
        pushMsgs([
          <TerminalInput><Command>{msg}</Command></TerminalInput>,
          <TerminalOutput><System>Voting for <Name>{Player_Names[x]}</Name> ... </System></TerminalOutput>
        ]);
        await gameplay.dayVote(x);
      }
      
    } else {
      pushMsgs([
        <TerminalOutput><Name>{My_Name}</Name>: {msg}</TerminalOutput>
      ]);
      socket.emit('chat', `${My_Name}: ${msg}`);
    }
}

