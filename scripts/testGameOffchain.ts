import { config as dotEnvConfig } from "dotenv";
import { createMockPlayers } from "./utils/helpers";
import { AggregateKeyProof } from "./utils/MockPlayer";

// import AggregateKey from "../circuits/aggregate_key.wasm";
// import AggregateKeyZKey from "../circuits/aggregate_key.zkey";

dotEnvConfig();

// Test multiplayers each generate a pk/sk and aggregate pks into agg key

// This is the main test off chain 

async function main() {

    const nPlayers = 5;
    const players = createMockPlayers(nPlayers, false);

    let aggKey = 1n;
    for (let player of players) {
        let proof : AggregateKeyProof = await player.aggregatePubKey(aggKey);
        aggKey = proof.newAggKey as bigint;

        console.log('player sk   = ', player.privateKey.toString());
        console.log('player pk   = ', proof.playerPubKey.toString());
        console.log('new agg key = ', aggKey.toString());
        console.log();
    }
}

main()
    .then(() => process.exit(0))    
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });

