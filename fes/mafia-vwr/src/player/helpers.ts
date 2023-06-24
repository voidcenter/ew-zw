
import { groth16 } from "snarkjs";

/*
    snark helpers 
 */

    interface Groth16ProofOutput {
        a: [bigint, bigint];
        b: [[bigint, bigint], [bigint, bigint]];
        c: [bigint, bigint];
        publicSignals: bigint[];   // this should be publicSignals [ ...all outputs, all public inputs ]
    }
    
    export async function exportSolidityCallDataGroth16(proof: { proof: any; publicSignals: any}): Promise<Groth16ProofOutput> {
    
        const rawCallData: string = await groth16.exportSolidityCallData(proof.proof, proof.publicSignals);
      
        const tokens = rawCallData
          .replace(/["[\]\s]/g, "")
          .split(",")
          .map(BigInt);   // into big number
      
        const [a1, a2, b1, b2, b3, b4, c1, c2, ...publicSignals] = tokens;
      
        const a = [a1, a2] satisfies [bigint, bigint];
        const b = [
          [b1, b2],
          [b3, b4],
        ] satisfies [[bigint, bigint], [bigint, bigint]];
        const c = [c1, c2] satisfies [bigint, bigint];
    
        return {
            a, b, c,
            publicSignals
        } as Groth16ProofOutput;
    }
    
    