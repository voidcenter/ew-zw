import { io } from 'socket.io-client';
import { LocalMsg } from '../../gpt/chat';


// "undefined" means the URL will be computed from the `window.location` object
const URL = 'http://localhost:4000';

export const socket = io(URL);

socket.on("connect", () => {
   console.log("[INFO] connected to chat server at ", URL);
});

socket.on("disconnect", (reason) => {
    console.log("[INFO]: disconnected from chat server, reason: %s", reason);
});


/* chat */

export let chat_msgs: LocalMsg[] = [];

const Real_Player_Name = 'Eve';  //hacky

socket.on('chat', (msg: string) => {
    console.log('socket received chat message: ', msg);
    if (msg.startsWith(Real_Player_Name)) {
        chat_msgs.push({
            player: msg.split(':')[0],
            msg: msg.split(':')[1]
        });
        console.log('socket enqueued chat message: ', chat_msgs[chat_msgs.length-1]);
    }
});

