
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./GameDefs.sol";

import "./interfaces/IStandaloneShuffle.sol";
import "./interfaces/ISecureAdd.sol";


abstract contract GameStorage is Ownable {

    // Game modules 
    IStandaloneShuffle zkShuffle;
    ISecureAdd secureAdd;

    // Game state and the list of players
    GameState public gameState;
    GameState public stateToGoAfterWincheck;

    address[] public playerAddresses;
    mapping(address => bool) public playerInGame;
    uint public nPlayers;   
    uint public nPlayersStillInGame;

    // Key aggregation
    mapping(address => uint256) public playerPubKeyMapping;   
    uint256[] public playerPubKeys; 
    
    // deck
    uint[2][] public deck;

    bool[] public playerStillInGame;
    uint[] public dayVotes;

    uint public sum1;
    uint public sum2;


    event ReturnToLobby();
    event PlayerJoined(uint index, address player, uint nPlayers);
    event StartGame(uint nPlayers, address[] playerAddresses);   // enter key aggregation phase 

    event EnterDayVote();
    event PlayerDayVote(uint playerId, uint vote);
    event PlayerEliminated(uint playerId, uint[] votes);

    event StartWinCheck();
    event Wincheck_done(uint sum1, uint sum2);

    event EnterNightVote();

    event VillagerWon();
    event MafiaWon();

    event Debug(uint d, address p);
}

