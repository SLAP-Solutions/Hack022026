import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config();

async function test() {
    console.log(" Testing Keeper Setup...\n");

    // Check environment
    const privateKey = process.env.KEEPER_PRIVATE_KEY || process.env.PRIVATE_KEY;
    if (!privateKey) {
        console.error(" KEEPER_PRIVATE_KEY not found in .env");
        process.exit(1);
    }
    console.log(" Private key configured");

    // Check contract files
    const deploymentPath = path.join(__dirname, "../../src/lib/contract/deployment.json");
    const abiPath = path.join(__dirname, "../../src/lib/contract/abi.json");

    if (!fs.existsSync(deploymentPath)) {
        console.error(" Contract not deployed!");
        console.error("   Run: cd hardhat && npx hardhat run scripts/deploy.ts --network coston2");
        process.exit(1);
    }
    console.log(" Contract deployment found");

    if (!fs.existsSync(abiPath)) {
        console.error(" Contract ABI not found!");
        process.exit(1);
    }
    console.log(" Contract ABI found");

    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));
    const contractAddress = deployment.address;

    console.log(" Contract address:", contractAddress);

    // Connect to network
    const rpcUrl = process.env.RPC_URL || "https://coston2-api.flare.network/ext/C/rpc";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    try {
        const network = await provider.getNetwork();
        console.log(" Connected to network:", network.name, `(chainId: ${network.chainId})`);    } catch (error) {
        console.error(" Cannot connect to RPC:", rpcUrl);
        console.error("   Error:", error);
        process.exit(1);
    }

    // Check keeper wallet
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(" Keeper wallet:", wallet.address);

    const balance = await provider.getBalance(wallet.address);
    console.log(" Keeper balance:", ethers.formatEther(balance), "C2FLR");

    if (balance < ethers.parseEther("0.01")) {
        console.warn("\n  WARNING: Low balance! Get testnet tokens:");
        console.warn("   https://faucet.flare.network/coston2\n");
    }

    // Check contract
    const contract = new ethers.Contract(contractAddress, abi, wallet);
    
    try {
        const total = await contract.getTotalPayments();
        console.log(" Contract accessible");
        console.log("   Total payments:", Number(total));

        if (Number(total) > 0) {
            console.log("\n Payment Status:");
            
            let pendingCount = 0;
            let executedCount = 0;

            for (let i = 0; i < Number(total); i++) {
                const payment = await contract.getClaimPayment(i);
                if (payment.executed) {
                    executedCount++;
                } else {
                    pendingCount++;
                    
                    // Check if trigger conditions are met
                    try {
                        const priceData = await contract.getCurrentPrice.staticCall(payment.cryptoFeedId);
                        const currentPrice = priceData[0];
                        const stopLoss = payment.stopLossPrice;
                        const takeProfit = payment.takeProfitPrice;
                        const triggerHit = currentPrice <= stopLoss || currentPrice >= takeProfit;
                        
                        console.log(`   Payment ${i}: ${triggerHit ? " READY TO EXECUTE" : " Pending"}`);
                    } catch (e) {
                        console.log(`   Payment ${i}:  Pending`);
                    }
                }
            }
            
            console.log(`\n   Total: ${total}`);
            console.log(`   Executed: ${executedCount}`);
            console.log(`   Pending: ${pendingCount}`);
        }
    } catch (error: any) {
        console.error(" Error accessing contract:", error.message);
        process.exit(1);
    }

    console.log("\n All checks passed! Keeper is ready to run.");
    console.log("\n Start keeper with: npm start");
}

test().catch((error) => {
    console.error(" Test failed:", error);
    process.exit(1);
});
