import { ethers } from 'hardhat';
import { getEVMCompatibleSigners } from './utils/helpers';
import hre from 'hardhat';
import { config as dotEnvConfig } from "dotenv";

dotEnvConfig();

// ** Test **
// Set up 10 wallets, let 9 of them send ETH to the remaining wallet 

async function main() {
    // const signers = getGenacheSigners();

    const node_urls = {
        ganache: "HTTP://127.0.0.1:7545",
        mumbai: `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_MUMBAI_KEY}`,
    };
    const network_name = hre.network.name;
    const node_url = (node_urls as any)[network_name];
    const signers = getEVMCompatibleSigners(10, node_url);

    const provider = new ethers.JsonRpcProvider(node_url);
    for (let signer of signers) {
        console.log(signer.getAddress(), await provider.getBalance(signer.getAddress()));
    }

    await signers[9].sendTransaction({
            to: "0x2f67063537216E1F50e54d192572BCa967530673",
            value: ethers.parseEther("80") // 1 ether
          });
    

    // const target = "0x2f67063537216E1F50e54d192572BCa967530673";
    // for (let i=0; i<signers.length; i++) {
    //     await signers[i].sendTransaction({
    //         to: target,
    //         value: ethers.parseEther("0.18") // 1 ether
    //       });
    //     console.log(signers[i].address, '->', target, ' 0.2 MATIC');
    // }

    // send $ 
    // const source = signers[0];
    // for (let i=10; i<signers.length; i++) {
    //     const tx = await source.sendTransaction({
    //         to: signers[i].address,
    //         value: ethers.parseEther("1") // 1 ether
    //       });
    //     await tx.wait();
    //     console.log(source.address, '->', signers[i].address, ' 1 ETH');
    // }

    // const target = signers[0];
    // for (let i=1; i<signers.length; i++) {
    //     await signers[i].sendTransaction({
    //         to: target.address,
    //         value: ethers.parseEther("1") // 1 ether
    //       });
    //     console.log(signers[i].address, '->', target.address, ' 1 ETH');
    // }

    console.log('ready to exit');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))    
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });


