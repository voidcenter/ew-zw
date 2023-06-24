
const path = require('path');
require('dotenv').config();
import { ethers } from 'hardhat';


export enum LogEvent {
    ReturnToLobby           = "ReturnToLobby",
    PlayerJoin              = "PlayerJoin",
}

export const LogEventsMapping = {
    '0x7d3fe89838f5362d6f9e6143f660b2d075444d4d8457d71c7bc610fcc83b1c53': LogEvent.ReturnToLobby,
    '0x3330a6773675f31f62070870f40379f8c6d42e3761410011a4dfc42b18043d2f': LogEvent.PlayerJoin,

}



/*
    listeners and state transitions
 */

// if you want state, get the contract
export async function setupListeners(
    providerUrl: string = "HTTP://127.0.0.1:7545", 
    address: string[] = []) {

    const hhprovider = new ethers.JsonRpcProvider(providerUrl);
    hhprovider.on("block", (blockNumber) => {
        console.log('listener: new block ', blockNumber);
    });

    // This filter could also be generated with the Contract or
    // Interface API. If address is not specified, any address
    // matches and if topics is not specified, any log matches
    const filter = {
        address,
        topics: [ 
            null 
        ]
    }
    hhprovider.on(filter, (log, event) => {
        console.log('event coming in: ', log, event);
    })

    hhprovider.on("error", (error) => {
        console.log('error coming in: ', error);
    })

}
