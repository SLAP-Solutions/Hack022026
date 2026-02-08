import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config();

// ============================================================================
// Configuration
// ============================================================================

const RPC_URL = process.env.RPC_URL || "https://coston2-api.flare.network/ext/C/rpc";
const privateKeyRaw = process.env.KEEPER_PRIVATE_KEY || process.env.PRIVATE_KEY;
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || "15000"); // 15 seconds
const GAS_LIMIT = process.env.GAS_LIMIT || "500000";
const CONTRACT_ADDRESS_ENV = process.env.CONTRACT_ADDRESS;

if (!privateKeyRaw) {
    throw new Error("KEEPER_PRIVATE_KEY or PRIVATE_KEY must be set in .env");
}

const PRIVATE_KEY: string = privateKeyRaw;

// Load contract info
let CONTRACT_ADDRESS: string;
let abi: any;

// Try to get contract address from environment first (for production)
if (CONTRACT_ADDRESS_ENV) {
    console.log("Loading contract address from environment variable");
    CONTRACT_ADDRESS = CONTRACT_ADDRESS_ENV;
    
    // Load ABI from file (copied into Docker image)
    const abiPath = path.join(__dirname, "../../src/lib/contract/abi.json");
    if (!fs.existsSync(abiPath)) {
        throw new Error("ABI file not found at " + abiPath);
    }
    abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));
} else {
    // Fallback to loading from deployment file (for local development)
    console.log("Loading contract from deployment file (local dev mode)");
    const deploymentPath = path.join(__dirname, "../../src/lib/contract/deployment.json");
    const abiPath = path.join(__dirname, "../../src/lib/contract/abi.json");

    if (!fs.existsSync(deploymentPath)) {
        throw new Error("Contract not deployed! Run: cd hardhat && npx hardhat run scripts/deploy.ts --network coston2");
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));
    CONTRACT_ADDRESS = deployment.address;
}

// ============================================================================
// Keeper State
// ============================================================================

const executedPayments = new Set<number>();
const failedAttempts = new Map<number, number>();
const MAX_RETRIES = 3;

// ============================================================================
// Price Formatter
// ============================================================================

function formatPrice(price: bigint, decimals: number = 3): string {
    return "$" + (Number(price) / Math.pow(10, decimals)).toFixed(2);
}

// ============================================================================
// Main Keeper Logic
// ============================================================================

async function runKeeper() {
    console.log("\n");
    console.log("         Payment Keeper - Automated Execution Service          ");
    console.log("           Flare Coston2 Testnet - ETH Oxford 2026            ");
    console.log("\n");

    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

    console.log("  Configuration:");
    console.log("   RPC:", RPC_URL);
    console.log("   Contract:", CONTRACT_ADDRESS);
    console.log("   Keeper Address:", wallet.address);
    console.log("   Poll Interval:", POLL_INTERVAL, "ms\n");

    const balance = await provider.getBalance(wallet.address);
    console.log(" Keeper Balance:", ethers.formatEther(balance), "C2FLR\n");

    if (balance < ethers.parseEther("0.1")) {
        console.warn("  WARNING: Low keeper balance! Get more C2FLR from faucet:\n");
        console.warn("   https://faucet.flare.network/coston2\n");
    }

    console.log(" Starting keeper loop...\n");
    console.log("\n");

    // Main keeper loop
    while (true) {
        try {
            const timestamp = new Date().toLocaleString();
            console.log(`[${timestamp}]  Scanning for executable payments...`);

            // Get total payments
            const totalPayments = await contract.getTotalPayments();
            const total = Number(totalPayments);

            if (total === 0) {
                console.log("   ℹ  No payments in contract yet.\n");
                await sleep(POLL_INTERVAL);
                continue;
            }

            console.log(`    Total payments: ${total}`);

            let pendingCount = 0;
            let readyCount = 0;

            // Check each payment
            for (let i = 0; i < total; i++) {
                // Skip if already executed
                if (executedPayments.has(i)) continue;

                // Skip if too many failed attempts
                const failures = failedAttempts.get(i) || 0;
                if (failures >= MAX_RETRIES) {
                    continue;
                }

                try {
                    const payment = await contract.getClaimPayment(i);

                    // Skip if already executed
                    if (payment.executed) {
                        executedPayments.add(i);
                        continue;
                    }

                    pendingCount++;

                    // Check if expired
                    const now = Math.floor(Date.now() / 1000);
                    if (payment.expiresAt > 0 && now > Number(payment.expiresAt)) {
                        console.log(`    Payment ${i}: EXPIRED (skipping)`);
                        executedPayments.add(i); // Don't retry expired payments
                        continue;
                    }

                    // Get current price
                    const priceData = await contract.getCurrentPrice.staticCall(payment.cryptoFeedId);
                    const currentPrice = priceData[0];
                    const decimals = Number(priceData[1]);

                    const stopLoss = payment.stopLossPrice;
                    const takeProfit = payment.takeProfitPrice;

                    // Check if triggers are met
                    const triggerHit = currentPrice <= stopLoss || currentPrice >= takeProfit;

                    if (triggerHit) {
                        readyCount++;
                        const usdAmount = Number(payment.usdAmount) / 100;
                        
                        console.log(`\n    Payment ${i}: TRIGGER HIT!`);
                        console.log(`      USD Amount: $${usdAmount.toFixed(2)}`);
                        console.log(`      Stop Loss: ${formatPrice(stopLoss, decimals)}`);
                        console.log(`      Current: ${formatPrice(currentPrice, decimals)} `);
                        console.log(`      Take Profit: ${formatPrice(takeProfit, decimals)}`);
                        console.log(`      Trigger: ${currentPrice <= stopLoss ? "STOP LOSS" : "TAKE PROFIT"}`);

                        // Execute payment
                        console.log(`       Executing payment...`);

                        try {
                            const tx = await contract.executeClaimPayment(i, {
                                gasLimit: GAS_LIMIT,
                            });

                            console.log(`       Transaction sent: ${tx.hash}`);
                            const receipt = await tx.wait();

                            if (receipt.status === 1) {
                                console.log(`       EXECUTED! Block: ${receipt.blockNumber}`);
                                console.log(`       https://coston2-explorer.flare.network/tx/${tx.hash}\n`);
                                executedPayments.add(i);
                                failedAttempts.delete(i);
                            } else {
                                console.log(`       Transaction failed!\n`);
                                failedAttempts.set(i, failures + 1);
                            }
                        } catch (execError: any) {
                            console.log(`       Execution error: ${execError.message}\n`);
                            failedAttempts.set(i, failures + 1);
                        }
                    }
                } catch (error: any) {
                    console.log(`     Error checking payment ${i}:`, error.message);
                }
            }

            if (pendingCount === 0) {
                console.log(`    All payments executed or expired.\n`);
            } else if (readyCount === 0) {
                console.log(`    ${pendingCount} pending payment(s) - triggers not yet hit.\n`);
            }

            // Wait before next poll
            await sleep(POLL_INTERVAL);
        } catch (error: any) {
            console.error(" Keeper error:", error.message);
            console.error("   Retrying in", POLL_INTERVAL / 1000, "seconds...\n");
            await sleep(POLL_INTERVAL);
        }
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Start Keeper
// ============================================================================

runKeeper().catch((error) => {
    console.error(" Fatal error:", error);
    process.exit(1);
});
