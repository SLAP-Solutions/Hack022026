import { ethers } from "hardhat";

async function main() {
    // Load deployed contract address from deployment.json
    const fs = require('fs');
    const path = require('path');
    const deploymentPath = path.join(__dirname, "../../src/lib/contract/deployment.json");
    
    if (!fs.existsSync(deploymentPath)) {
        throw new Error("❌ Contract not deployed! Run: npx hardhat run scripts/deploy.ts --network coston2");
    }
    
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    const contractAddress = deployment.address;
    
    const [signer] = await ethers.getSigners();
    console.log("Checking from account:", signer.address);
    console.log("Contract address:", contractAddress);
    
    const ClaimPayments = await ethers.getContractFactory("ClaimPayments");
    const contract = ClaimPayments.attach(contractAddress);
    
    // Get total payments
    const total = await contract.getTotalPayments();
    console.log("\nTotal payments on contract:", Number(total));
    
    // List all payments
    for (let i = 0; i < Number(total); i++) {
        try {
            const payment = await contract.getClaimPayment(i);
            console.log(`\nPayment ${i}:`);
            console.log("  Payer:", payment.payer);
            console.log("  Receiver:", payment.receiver);
            console.log("  Amount:", Number(payment.usdAmount) / 100, "USD");
            console.log("  Executed:", payment.executed);
        } catch (err: any) {
            console.log(`  Error fetching payment ${i}:`, err.message);
        }
    }
}

main().catch(console.error);
