// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IStandaloneShuffle {

    function getDeck() external view returns (uint[2][] memory);

    function getPlayerPubKeys() external view returns (uint256[] memory);

    function gameState() external view returns (uint);

    function startShuffle(address[] calldata _playerAddresses) external;

    // function transferOwnership(address newOwner) external;

    function returnToLobby() external;
}

