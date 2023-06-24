import { config as dotEnvConfig } from "dotenv";
import { Configuration, OpenAIApi, ChatCompletionRequestMessageRoleEnum} from "openai"
import { sleep } from "../scripts/utils/helpers";

dotEnvConfig();



type Msg = {
    role: ChatCompletionRequestMessageRoleEnum,
    content: string;
}

export type LocalMsg = {
    player: string,
    msg: string
}

const configuration = new Configuration({
    apiKey: process.env.OPENAI_KEY,
});

const openai = new OpenAIApi(configuration);



function formatMsg(msg: LocalMsg) {
    return `${msg.player}: ${msg.msg}`
}


async function chatgpt(msgs: Msg[]): string {

    const r = await openai.createChatCompletion({
        model: "gpt-3.5-turbo-0613",
        messages: msgs,
    });

    let rt = r.data.choices[0].message?.content;

    if (rt?.includes("\n")) {
        rt = rt.split("\n")[0];
    }

    if (rt?.includes(":")) {
        rt = rt.substring(rt.indexOf(':')+1);
    }

    return rt;
}



function getLobbySystemMsg(name: string) {

    return `
        You are about to play a mafia game with a few other players. 
        You name is ${name}. You are now in the lobby. Please casually
        chat with the other players to know each other as they are joining.
        Don't let people know that you an a AI. Pretend to be a person.  
        Be succint. Use no more than 20 words. Don't keep saying 
        "Nice to meet you all", say something unique and new. 
    `;
}


function get_dayVoting_systemMsg(name: string, role: string, dayNo: number, nPlayers: number, 
                      playerNamesStr: string, suspect: string, confidence: string, 
                      str: string = 'day'): string {
                

    const motivation = {
        'Villager': `
            As a villager, you don't know any other player's role. Your goal is to make your 
            best judgement on who might be the mafia and give the vote to that player.
            Please discuss with everyone to find out! The safety of the villager is depending 
            on you!
            `,

        'Mafia': `
            As a werewolf, your goal is to disguis as a villager and avoid being eliminated. 
            You will discuss with everyone as if you are a villager and try to steer everyone to
            cast their elimination vote on a villager, therefore eliminating the villager.
            You can do it!
            `
    }

    const suspicion = (!suspect || suspect.toLowerCase() == name.toLowerCase())
        ? ''
        : `given the information so far, you suspect that {suspect} is the mafia.
           your confidence level is {confidence}.`


    const gameRules = `
        You are a player in a multi-person game. In this case each player has a secret role. It
        can only be villeager or mafia. Yeah it is the mafia game! Usually there will be more 
        villagers than mafia. Because there is a similar game called werewolf, we will use the
        word mafia and the word werewolf interchangably in thie game. 
        
        Your name is ${name}, your role is {role}. 
        
        Now is the ${dayNo}-th day.
        
        Now is the day round. In the day round, everyone will discuss to figure out who 
        the mafia is. The true mafias will try to disguise as a villager to avoid being 
        eliminated. The villagers will try to find out who the mafia is and eliminate. 
        The elimination works through a vote. Each player will give a vote to a player they 
        considered most likely to be a mafia. The player who got the most votes will be 
        eliminated. Mafias usually give the vote to a villager. 
        
        ${motivation}
        
        ${suspicion}
        
        Try to not say general remarks. Instead focus on specific players and analyze why
        they are suspicious or innocent. Focus on specific players.
        
        Note that there are {nPlayers} in total, they are ${playerNamesStr}.
        Don't mentione any other players.
        
        Only say what you want to say. Don't say anything on behalf of other players.
        
        Every player's words will be prefixed by their name like player 0, player 1, etc. 
        You don't need to prefix your words like this. Just say what you want to say.
        `

    return gameRules;                        
}


function get_dayVoting_syspect_systemMsg (playerNamesStr: string, myName: string) {
    return `
        given the current conversation, who do you think is the most likely to 
        be the mafia. you must pick one player from 
        ${playerNamesStr}.

        If you are not sure, just make a guess. You are ${myName}.
        Don't pick yourself as the mafia.

        reply with a single word which is the suspicious player's name. 
        Don't say anything else.
    `;
}


// given the list of messages so far and my name, return the new msg
export async function lobbyChat(msgs: LocalMsg[], myName: string): Promise<LocalMsg> {
    if (msgs.length == 0) {
        return {
            player: myName,
            msg: "hello everyone, nice to meet you all!"
        };
    }

    const systemMsg= getLobbySystemMsg(myName);
    const trail = [{role: "system" as ChatCompletionRequestMessageRoleEnum, content: systemMsg }, 
                   ...buildMsgTrail(msgs, myName) ] 
    const response = await chatgpt(trail)

    return { player: myName, msg: response };
}


export async function dayVoteChat(
        msgs: LocalMsg[], myName: string, myRole: string,
        nPlayers: number, playerNamesStr: string   
    ): Promise<{ msg: LocalMsg, suspect: string }> {
    
    if (msgs.length == 0) {
        return {
            msg: {
                player: myName,
                msg: "hello everyone, who looks suspicious?"    
            }, 
            suspect: ''
        };
    }

    const systemMsg= get_dayVoting_systemMsg(myName, myRole, 0, nPlayers, playerNamesStr, null, null);
    const trail = [{role: "system" as ChatCompletionRequestMessageRoleEnum, content: systemMsg }, 
                   ...buildMsgTrail(msgs, myName) ] 
    const response = await chatgpt(trail);
    const msg = { player: myName, msg: response };

    const suspect_systemMsg = get_dayVoting_syspect_systemMsg(playerNamesStr, myName);
    const trailx = [...trail, 
                    {role: "system" as ChatCompletionRequestMessageRoleEnum, content: suspect_systemMsg } ] 
    const suspect = await chatgpt(trail);

    return { msg, suspect };
}



function buildMsgTrail(msgs: LocalMsg[], currentPlayer: string): Msg[] {
    return msgs.map((msg) => {
        return msg.player == currentPlayer 
            ? { role: 'assistant' as ChatCompletionRequestMessageRoleEnum, content: msg.msg }
            : { role: 'user' as ChatCompletionRequestMessageRoleEnum, content: formatMsg(msg) }
    });
} 




// the main flow and loop 
async function main() {

    const playerRoles = ['Villager', 'Villager', 'Mafia', 'Villager', 'Villager']
    const playerNames = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve']
    const nPlayers = playerRoles.length;
    const playerNamesStr = playerNames.join(', ')

    const nRounds = 3

    
    // const initialMsg = "hello everyone, it's a good day! who might be the mafia?"
    const initialMsg = "hello everyone, nice to meet you all!"
    const msgs = [ { player: playerNames[nPlayers-1], msg: initialMsg } ]
    console.log(formatMsg(msgs[0]))

    const dayNo = 0;
    for (let round=0; round <nRounds; round++) {
        for (let i=0; i<nPlayers; i++) {
            const myName = playerNames[i]

            /* chat */
            // const systemMsg= getSystemMsg(myName, playerRoles[i], dayNo, nPlayers, playerNamesStr, null, null);
            const systemMsg= getLobbySystemMsg(myName);

            // console.log('sys: ', systemMsg)
            // print()

            const trail = [{role: "system" as ChatCompletionRequestMessageRoleEnum, content: systemMsg }, 
                           ...buildMsgTrail(msgs, playerNames[i]) ] 
            const response = await chatgpt(trail)

            const msg = { player: playerNames[i], msg: response };
            msgs.push(msg);
            console.log(formatMsg(msg))

            /* think */ 
            const trailx = trail.slice();
            trailx.push({ role: 'system', content: get_dayVoting_syspect_systemMsg(playerNamesStr, myName) });
                
            const suspect = await chatgpt(trailx)
            console.log('suspect ', suspect);

            await sleep(1000);
        }
    } 

}


// main()
//     .then(() => process.exit(0))    
//     .catch((error) => {
//         console.error(error);
//         process.exitCode = 1;
//     });


