import { config as dotEnvConfig } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-circom";
import "hardhat-contract-sizer";
// import "@tenderly/hardhat-tenderly";

dotEnvConfig();
const { ALCHEMY_GOERLI_KEY, ACCOUNT_PRIVATE_KEY_DEV1, ACCOUNT_PRIVATE_KEY_DEV2, TENDERLY_ACCESS_KEY } = process.env

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.6.11"
      },
      {
        version: "0.8.18",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      }],
  },

  networks: {
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_GOERLI_KEY}`,      
      accounts: [ACCOUNT_PRIVATE_KEY_DEV1!, ACCOUNT_PRIVATE_KEY_DEV2!]
    },
    hardhat: {
      accounts: {
          count: 10
      }
    },
    ganache: {
      url: `HTTP://127.0.0.1:7545`,  
    }
  },

  circom: {
    // (optional) Base path for input files, defaults to `./circuits/`
    inputBasePath: "./circuits",
    // (required) The final ptau file, relative to inputBasePath, from a Phase 1 ceremony
    ptau: "./ptau/powersOfTau28_hez_final_20.ptau",
    // (required) Each object in this array refers to a separate circuit
    circuits: [
      // { name: "secureadd_create_voting_shares" },

      { name: "wincheck_create_shares_5" },
      { name: "wincheck_aggregate_shares_5" },
      // { name: "zkshuffle_aggregate_key" },
      // { name: "zkshuffle_encrypt_and_shuffle_5" },
      // { name: "zkshuffle_decrypt_self" },
      // { name: "zkshuffle_decrypt_5" },
    ],
  },

  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },

};

export default config;


