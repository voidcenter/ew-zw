import { batchWaitTxs, sleep } from './helpers';
import { AggregateKeyProof, DecryptProof, EncryptAndShuffleProof, MockPlayer, Tuple2n, WinCheck_CreateShares_Proof, WinCheck_AggregateShares_Proof, getRoleName } from "./MockPlayer";
import { TestGame, StandaloneShuffle, SecureAdd } from '../../typechain-types';
import { strict as assert } from 'assert';
import { Wallet } from "ethers";
import { LocalMsg, dayVoteChat, lobbyChat } from '../../gpt/chat';
import { chat_msgs, socket } from './socket';

export const Player_Names = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve'];


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

const Talkativeness = 0.4;


// Test multiplayers each generate a pk/sk and aggregate pks into agg key, onchain

export async function lobby(testGame: TestGame, owner: Wallet, players: MockPlayer[], 
                            demoWeb3: boolean) {

    console.log("** Player joining **");

    // Lobby
    await (await testGame.connect(owner).returnToLobby(
        // { nonce: (await owner.getNonce())  }
        { gasLimit: 500_000 }
    )).wait();
    console.log('Game state = ', await testGame.gameState());
    // stateBox.gameState = GameState.Lobby;

    // Players join
    const nPlayers = players.length;

    // if we demo web3, then there is a web3 player joinin from the frontend,
    // in that case, there are only nPlayers - 1 script mock players 
    const nJoining = nPlayers - (demoWeb3 ? 1 : 0);

    // We always assume that the web3 players is the last player
    // if we have 5 players, web3 player is players[4]
    for (let i=0; i<nJoining; i++) {
        const player = players[i];
        console.log(await player.signer?.getAddress(), ' joining ...');
        await (await testGame.connect(player.getSigner()).joinGame(
            { gasLimit: 500_000 }
        )).wait();
        console.log('Game state = ', await testGame.gameState(), 'nPlayers = ', (await testGame.nPlayers()).toString());
    }

    console.log('waiting for everyone to join ...');
    

    // Wait for listner to update the game state upon receiving the log event from contract 
    while ((await testGame.nPlayers()) != BigInt(nPlayers)) {

        if (chat_msgs.length > 40) {
            await sleep(1000);    
            continue;
        }

        // if (false) 
        {
            for (let i=0; i<nJoining; i++) {

                if (Math.random() < Talkativeness) {
                    const playerName = Player_Names[i];
                    const new_msg = await lobbyChat(chat_msgs, playerName);
                    chat_msgs.push(new_msg);
                    // console.log(msgs);
                    const formattedMsg = `${new_msg.player}: ${new_msg.msg}`
                    console.log (formattedMsg);
        
                    socket.emit('chat', formattedMsg);    
                } 

                await sleep(1000);    
            }
        }
    } 


    console.log('Game state = ', await testGame.gameState(), 'nPlayers = ', (await testGame.nPlayers()).toString());
    console.log('players = ', await testGame.getPlayerAddresses());
}

export async function startGame(testGame: TestGame, owner: Wallet, nPlayers: number) {

    console.log();
    console.log("** Game starting **");

    // Start the game
    await (await testGame.connect(owner).startGame(
        { gasLimit: 1_000_000 }
    )).wait();
    console.log('Game state = ', await testGame.gameState());
    console.log(', nplayers = ', (await testGame.nPlayers()).toString());

    assert(Number (await testGame.nPlayers()) === nPlayers);
    for (let i = 0; i < nPlayers; i++) {
        const address = await testGame.playerAddresses(i)
        console.log(i, '-th player is ', address, 'its index is ', await testGame.getPlayerIndex(address));
    }     
}

export async function aggregateKey(standaloneShuffle: StandaloneShuffle, 
                                   players: MockPlayer[], demoWeb3: boolean) {

    console.log();
    console.log("** Key aggregation **");

    console.log('agg key = ', await standaloneShuffle.aggPubKey());

    const nPlayers = players.length;
    const nAgging = nPlayers - (demoWeb3 ? 1 : 0);
    
    // Aggregate key
    let aggKey = 1n;
    for (let i=0; i<nAgging; i++) {
        const player = players[i];
        let proof: AggregateKeyProof = await player.aggregatePubKey(aggKey);
        aggKey = proof.newAggKey as bigint;

        console.log();
        console.log('player ', player.getSigner()?.address, ' aggregating key ...');
        console.log('player sk   = ', player.privateKey.toString());
        console.log('player pk   = ', proof.playerPubKey.toString());
        console.log('prev agg key = ', (await standaloneShuffle.aggPubKey()).toString());
        console.log('new agg key = ', aggKey.toString());

        await (await standaloneShuffle.connect(player.getSigner()).aggregateKey(proof
            ,{ gasLimit: 1_000_000 }
            )).wait(5);
    }

    console.log('waiting for everyone to aggregate key ...');

    // Wait for listner to update the game state upon receiving the log event from contract 
    while (Number((await standaloneShuffle.gameState())) == GameState.KEY_AGGREGATION) {
        sleep(1000);    
    } 

    // store everyone's pub keys
    const _playerPubKeys: bigint[] = await standaloneShuffle.getPlayerPubKeys();
    const playerPubKeys = [];
    for (let i=0; i<nPlayers; i++) {        
        // convert Result to [], other solidity will complain about 
        //    Cannot assign to read only property '0' of object '[object Array]'
        // down the road
        playerPubKeys.push(_playerPubKeys[i]);
    }
    for (let player of players) {
        player.setPlayerPublicKeys(playerPubKeys);
    }
}


export async function encryptAndShufle(standaloneShuffle: StandaloneShuffle, 
                                       players: MockPlayer[], demoWeb3: boolean) {

    console.log();
    console.log("** Encrypt and shuffling **");
    const nPlayers = players.length;
    const aggkey = await standaloneShuffle.aggPubKey();

    const nEnSing = nPlayers - (demoWeb3 ? 1 : 0);
    
    for (let i=0; i<nEnSing; i++) {
        const player = players[i];
        let deck = (await standaloneShuffle.getDeck()).map(subResult => Array.from(subResult));
        // console.log('deck = ', deck, 'type ', typeof deck);
        let proof: EncryptAndShuffleProof = await player.encryptAndShuffleDeck(aggkey, deck, nPlayers);

        console.log();
        console.log('player ', player.getSigner()?.address, ' encrypt and shuffle ...');
        console.log('masked deck = ', proof.maskedDeck);
        // console.log('proof = ', proof);

        await (await standaloneShuffle.connect(player.getSigner()).encryptAndShuffle(proof as any,
            { gasLimit: 1_000_000 }
        )).wait();
   }

   console.log('waiting for everyone to encrypt and shuffle ...');

   // Wait for listner to update the game state upon receiving the log event from contract 
   while (Number((await standaloneShuffle.gameState())) == GameState.SHUFFLE) {
       sleep(1000);    
   } 
}

export async function decrypt(standaloneShuffle: StandaloneShuffle, 
                              players: MockPlayer[], demoWeb3: boolean) {

    console.log();
    console.log("** Decrypt **");
    const nPlayers = players.length;
    const nDecrypting = nPlayers - (demoWeb3 ? 1 : 0);

    for (let i=0; i<nDecrypting; i++) {
        const player = players[i];

        let deck = (await standaloneShuffle.getDeck()).map(subResult => Array.from(subResult));
        // console.log('deck = ', deck, 'type ', typeof deck);

        deck.splice(i, 1);
        let proof: DecryptProof = await player.decryptDeck(deck, nPlayers);

        console.log();
        console.log('player ', player.getSigner()?.address, ' decrypt ...');
        console.log('unmasked deck = ', proof.unmaskedDeck);
        // console.log('proof = ', proof);

        await (await standaloneShuffle.connect(player.getSigner()).decrypt(proof as any,
            { gasLimit: 1_000_000 }
        )).wait();
   }

   console.log('waiting for everyone to decrypt ...');

   // Wait for listner to update the game state upon receiving the log event from contract 
   while (Number((await standaloneShuffle.gameState())) == GameState.DECRYPT) {
       sleep(1000);    
   } 
}

export async function drawCards(standaloneShuffle: StandaloneShuffle, 
                                players: MockPlayer[], demoWeb3: boolean) {

    console.log();
    console.log("** Assigning roles to players **");
    const nPlayers = players.length;
    const nDrawing = nPlayers - (demoWeb3 ? 1 : 0);

    let deck = (await standaloneShuffle.getDeck()).map(subResult => Array.from(subResult));

    for (let i=0; i<nDrawing; i++) {
        const player = players[i];

        player.roleCardBeforeDecryption = [deck[i][0], deck[i][1]];
        const role = await player.decryptMyCard(deck[i]);
        player.role = role;

        console.log(`player ${i}'s roles is `, role);
    }
}

export async function shuffleDone(testGame: TestGame, owner: Wallet) {
    await (await testGame.connect(owner).zkShuffle_done()).wait(2);

    console.log('testgame deck = ', await testGame.getDeck());
    console.log('testgame pub keys = ', await testGame.getPlayerPubKeys());
    console.log('testgame state = ', await testGame.gameState());
}

export async function dayVote(testGame: TestGame, players: MockPlayer[], demoWeb3: boolean) {

    // TODO: make this gpt

    console.log();
    console.log("** Day voting **");
    const nPlayers = players.length;
    const nVoting = nPlayers - (demoWeb3 ? 1 : 0);

    const playerStillInGame = await testGame.getPlayerStillInGame();
    const nPlayersStillInGame = Number(await testGame.nPlayersStillInGame());
    
    const remainingPlayerNames = [...Array(nPlayers).keys()]
        .map(i => playerStillInGame[i] ? Player_Names[i] : undefined)
        .filter(e => e)
        .join(', ');


    const letAllRemainingPlayersTalk = async () => {
        for (let i=0; i<nVoting; i++) {

            // elimiated player can't talk
            if (!playerStillInGame[i]) {
                continue;
            }

            if (Math.random() < Talkativeness) {
                const playerName = Player_Names[i];
                const player = players[i];

                const { msg, suspect } = await dayVoteChat(
                    chat_msgs, playerName, getRoleName(player.role), getRoleName(player.role),
                    nPlayersStillInGame, remainingPlayerNames);

                chat_msgs.push(msg);
                // console.log(msgs);
                const formattedMsg = `${msg.player}: ${msg.msg}`
                console.log (formattedMsg, 'suspect = ', suspect);
        
                socket.emit('chat', formattedMsg);
            }

            await sleep(2200);    
        }    
    }

    if (demoWeb3) {
        const nRounds = 2;  // chat 3 rounds before voting
        chat_msgs.length = 0;
        for (let round = 0; round < nRounds; round ++) {
            await letAllRemainingPlayersTalk();
        }
    }


    // states
    console.log('testgame. playerAddresses = ', await testGame.getPlayerAddresses());
    console.log('testgame. playerPubKeys = ', await testGame.getPlayerPubKeys());
    console.log('testgame. deck = ', await testGame.getDeck());
    console.log('testgame. playerStillInGame = ', await testGame.getPlayerStillInGame());
    console.log('testgame. nPlayersStillInGame = ', await testGame.nPlayersStillInGame());


    
    let txs = [];
    for (let i=0; i<nVoting; i++) {
        if (!playerStillInGame[i]) {
            continue;
        }

        const player = players[i];

        // vote someone who is not self and is not eliminated 
        let vote = 0;
        do {
            vote = Math.floor(Math.random() * nPlayers);
        } while (vote == i || !playerStillInGame[vote]);
        
        // txs.push(await testGame.connect(player.getSigner()).dayVote(vote,
        //     { gasLimit: 1_000_000 }
        // ));

        // const pv = [4,2,0,1,2];
        // vote = pv[i];

        console.log('before submitting vote to contract ', i, vote);
        await (await testGame.connect(player.getSigner()).dayVote(vote,
            { gasLimit: 1_000_000 }
        )).wait();
        console.log(`player ${i} voted for player ${vote}`);
    }   
    batchWaitTxs(txs);

    console.log('waiting for everyone to vote ...');

    // Wait for listner to update the game state upon receiving the log event from contract 
    while (Number((await testGame.gameState())) == GameState.DAY_VOTE) {

        // await letAllRemainingPlayersTalk();
        sleep(10000);    
    } 

    console.log('player stills in game = ', await testGame.getPlayerStillInGame()); 
}


export async function wincheck_create(
    secureAdd: SecureAdd, players: MockPlayer[], playerStillInGame: boolean[],
    demoWeb3: boolean) {

    console.log();
    console.log("** Wincheck: create **");
    const nPlayers = players.length;
    const nCreating = nPlayers - (demoWeb3 ? 1 : 0);

    let offset = await secureAdd.getShareValueOffset();

    let txs = [];
    for (let i=0; i<nCreating; i++) {
        if (!playerStillInGame[i]) {
            continue;
        }

        const player = players[i];

        let proof: WinCheck_CreateShares_Proof = await player.winCheck_createShares(nPlayers, offset);

        console.log(proof);
        console.log('player ', player.getSigner()?.address, ' submitting shares ...');
        // console.log('proof = ', proof);

        // txs.push(await secureAdd.connect(player.getSigner()).wincheck_submit_shares(proof,
        //     { gasLimit: 3_000_000 }
        // ));
        const r = await (await secureAdd.connect(player.getSigner()).wincheck_submit_shares(proof,
            { gasLimit: 3_000_000 }            
        )).wait();
        // console.log(r);
    }
    batchWaitTxs(txs);

    console.log('wait for everyone to create ...');

    // Wait for listner to update the game state upon receiving the log event from contract 
    while (Number((await secureAdd.state())) == GameState.DAY_WINCHECK_CREATE) {
        sleep(1000);    
    } 

    console.log('all players submitted shares.');
}


export async function wincheck_aggregate(
    secureAdd: SecureAdd, players: MockPlayer[], demoWeb3: boolean) {

    console.log();
    console.log("** Wincheck: aggregate **");
    const nPlayers = players.length;
    const nAggregating = nPlayers - (demoWeb3 ? 1 : 0);

    let shares1 = await secureAdd.getShares1();
    let shares2 = await secureAdd.getShares2();
    
    let txs = [];
    for (let i=0; i<nAggregating; i++) {
        const player = players[i];

        const sc1 = shares1.map(row => [row[i][0], row[i][1]]);
        const sc2 = shares2.map(row => [row[i][0], row[i][1]]);
        let proof: WinCheck_AggregateShares_Proof = await player.winCheck_aggregateShares(nPlayers, sc1, sc2);

        console.log();
        console.log('player ', player.getSigner()?.address, ' aggregating shares ...');
        // console.log('proof = ', proof);

        // const t = await secureAdd.connect(player.getSigner()).wincheck_aggregate_shares(proof);
        // // const t = await secureAdd.connect(player.getSigner()).wiwi(proof);
        // // console.log('t = ', t);

        // const r = await t.wait();
        // // console.log('r = ', r);

        // txs.push(await secureAdd.connect(player.getSigner()).wincheck_aggregate_shares(proof,
        //     { gasLimit: 3_000_000 }
        // ));
        await (await secureAdd.connect(player.getSigner()).wincheck_aggregate_shares(proof,
            { gasLimit: 3_000_000 }
        )).wait();
    }
    batchWaitTxs(txs);


    console.log('wait for everyone to aggregate ...');

    // Wait for listner to update the game state upon receiving the log event from contract 
    while (Number((await secureAdd.state())) == GameState.DAY_WINCHECK_AGGREGATE) {
        sleep(1000);    
    } 

    console.log('all players submitted aggregated sums.');
}

export async function wincheck_done (testGame: TestGame, owner: Wallet) {

    console.log();
    console.log("** Wincheck done **");

    // Start the game
    await (await testGame.connect(owner).wincheck_done(
        { gasLimit: 1_000_000 }
    )).wait();

    console.log('Game state = ', await testGame.gameState());
    console.log(', sum1 = ', (await testGame.sum1()));
    console.log(', sum2 = ', (await testGame.sum2()));
}
