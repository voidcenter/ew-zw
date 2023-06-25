// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IZkshuffleDecrypt5Verifier {
    /// @return r  bool true if proof is valid
    function verifyProof(
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[17] memory input
        ) external view returns (bool r);
}

