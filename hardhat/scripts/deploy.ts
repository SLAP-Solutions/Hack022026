import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("🚀 Deploying ClaimsManager to Coston2...");

    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying with account:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "C2FLR");

    const ClaimsManager = await ethers.getContractFactory("ClaimsManager");
    const claimsManager = await ClaimsManager.deploy();
    await claimsManager.waitForDeployment();

    const contractAddress = await claimsManager.getAddress();
    console.log("✅ ClaimsManager deployed to:", contractAddress);
    console.log("🔍 View on explorer: https://coston2-explorer.flare.network/address/" + contractAddress);

    // Export ABI for frontend
    const artifactPath = path.join(__dirname, "../artifacts/contracts/ClaimsManager.sol/ClaimsManager.json");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    const outputDir = path.join(__dirname, "../../src/lib/contract");
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
        path.join(outputDir, "abi.json"),
        JSON.stringify(artifact.abi, null, 2)
    );

    const deploymentInfo = {
        address: contractAddress,
        chainId: 114,
        network: "coston2",
        deployedAt: new Date().toISOString(),
    };

    fs.writeFileSync(
        path.join(outputDir, "deployment.json"),
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("📦 ABI exported to: src/lib/contract/abi.json");
    console.log("\n🎉 Deployment complete!");
    console.log("📋 Copy this address for your frontend:");
    console.log("   " + contractAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
