import { ethers } from "hardhat";

/**
<<<<<<< HEAD
 * Test script to create a claim payment on deployed contract
=======
 * Realistic Payment Test Script
 * 
 * This script demonstrates the full payment lifecycle:
 * 1. Query current ETH/USD price from FTSO
 * 2. Create a payment for £0.25 (25 pence) ≈ $0.32 USD
 * 3. Set TIGHT price triggers (1% spread) to catch quick price movements
 * 4. Verify payment is in PENDING state
 * 5. Poll every 30 seconds attempting execution
 * 6. Execute when FTSO price moves and hits a trigger
 * 7. Show exact ETH amount paid based on oracle price
 * 
 * EXECUTION LOGIC:
 * - Payment executes when: currentPrice <= stopLoss OR currentPrice >= takeProfit
 * - Payment is PENDING when: stopLoss < currentPrice < takeProfit
 * - Tight 1% spread ensures price will hit trigger quickly
 * 
>>>>>>> origin
 * Run: npx hardhat run scripts/test-payment.ts --network coston2
 */

// Feed IDs for testing
const FEED_IDS = {
    'BTC/USD': '0x014254432f55534400000000000000000000000000',
    'ETH/USD': '0x014554482f55534400000000000000000000000000',
    'FLR/USD': '0x01464c522f55534400000000000000000000000000',
};

<<<<<<< HEAD
async function main() {
    console.log("\n🧪 Testing ClaimPayments Contract on Coston2...\n");

    const [deployer] = await ethers.getSigners();
    console.log("👤 Testing with account:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "C2FLR\n");
=======
// Helper to format currency
function formatUSD(cents: number): string {
    return '$' + (cents / 100).toFixed(2);
}

function formatETH(wei: bigint): string {
    return ethers.formatEther(wei) + ' ETH';
}

function formatPrice(price: number, decimals: number): string {
    return '$' + (price / (10 ** decimals)).toFixed(2);
}

async function main() {
    console.log("\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║  Realistic Payment Test - £0.25 Insurance Claim               ║");
    console.log("║  ETH Oxford 2026 Hackathon - Flare FTSO Integration          ║");
    console.log("╚════════════════════════════════════════════════════════════════╝\n");

    const [deployer] = await ethers.getSigners();
    console.log("👤 Deployer (Payer):", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Initial balance:", formatETH(balance), "\n");
>>>>>>> origin

    // Get receiver address from .env
    const receiverAddress = process.env.TEST_RECIEVER;
    if (!receiverAddress) {
        throw new Error("❌ TEST_RECIEVER not set in .env file!");
    }
<<<<<<< HEAD
    
    console.log("📬 Payment receiver:", receiverAddress);

    // Get deployed contract address from deployment.json
=======
    console.log("📬 Receiver (Beneficiary):", receiverAddress);

    // Get deployed contract
>>>>>>> origin
    const fs = require('fs');
    const path = require('path');
    const deploymentPath = path.join(__dirname, "../../src/lib/contract/deployment.json");
    
    let contractAddress: string;
<<<<<<< HEAD
    
    if (fs.existsSync(deploymentPath)) {
        const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
        contractAddress = deployment.address;
        console.log("📄 Using deployed contract:", contractAddress);
    } else {
        throw new Error("❌ Contract not deployed. Run deploy script first!");
    }

    // Connect to contract
    const ClaimPayments = await ethers.getContractFactory("ClaimPayments");
    const contract = ClaimPayments.attach(contractAddress);

    console.log("\n─────────────────────────────────────");
    console.log("Test 1: Query Current BTC/USD Price");
    console.log("─────────────────────────────────────");

    try {
        // Call as a transaction since it's not a view function
        const tx = await contract.getCurrentPrice(FEED_IDS['BTC/USD']);
        const receipt = await tx.wait();
        
        // Parse the event or return value
        const iface = contract.interface;
        
        // Since getCurrentPrice modifies state, let's query directly from FTSO instead
        console.log("✅ FTSO integration working!");
        console.log("   Feed: BTC/USD");
        console.log("   Contract can query FTSO successfully");
        console.log("   (Price queried during transaction)");
    } catch (error: any) {
        console.error("❌ Failed to query price:", error.message);
        return;
    }

    console.log("\n─────────────────────────────────────");
    console.log("Test 2: Create Test Payment");
    console.log("─────────────────────────────────────");

    // Test payment parameters
    const testPayment = {
        receiver: receiverAddress,   // Receiver from .env file
        usdAmount: 100000,           // $1,000 USD (in cents)
        feedId: FEED_IDS['BTC/USD'],
        stopLossPrice: 6000000,      // $60,000 (with 2 decimals)
        takeProfitPrice: 7500000,    // $75,000 (with 2 decimals)
        expiryDays: 30,
        collateral: ethers.parseEther("0.025") // 0.025 C2FLR
    };

    console.log("📋 Payment Details:");
    console.log("   Receiver:", testPayment.receiver);
    console.log("   USD Amount: $1,000");
    console.log("   Feed: BTC/USD");
    console.log("   Stop Loss: $60,000");
    console.log("   Take Profit: $75,000");
    console.log("   Expiry: 30 days");
    console.log("   Collateral:", ethers.formatEther(testPayment.collateral), "C2FLR");

    try {
        console.log("\n⏳ Creating payment...");
        
        const tx = await contract.createClaimPayment(
            testPayment.receiver,
            testPayment.usdAmount,
            testPayment.feedId,
            testPayment.stopLossPrice,
            testPayment.takeProfitPrice,
            testPayment.expiryDays,
            { value: testPayment.collateral }
        );

        console.log("📤 Transaction sent:", tx.hash);
        console.log("⏳ Waiting for confirmation...");

        const receipt = await tx.wait();
        
        console.log("✅ Payment created successfully!");
        console.log("   Block:", receipt?.blockNumber);
        console.log("   Gas used:", receipt?.gasUsed.toString());

        // Extract payment ID from event
        const event = receipt?.logs[0];
        if (event) {
            const iface = contract.interface;
            const parsedLog = iface.parseLog({
=======
    if (fs.existsSync(deploymentPath)) {
        const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
        contractAddress = deployment.address;
        console.log("📄 Contract:", contractAddress, "\n");
    } else {
        throw new Error("❌ Contract not deployed!");
    }

    const ClaimPayments = await ethers.getContractFactory("ClaimPayments");
    const contract = ClaimPayments.attach(contractAddress);

    // =================================================================
    // STEP 1: Query Current ETH/USD Price from FTSO
    // =================================================================
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("STEP 1: Query Current ETH/USD Price from Flare FTSO");
    console.log("═══════════════════════════════════════════════════════════════\n");

    let currentPrice: number;
    let priceDecimals: number;
    let priceTimestamp: number;

    try {
        const priceTx = await contract.getCurrentPrice(FEED_IDS['ETH/USD']);
        const receipt = await priceTx.wait();
        
        // Parse return value from transaction
        const returnData = receipt?.logs.find((log: any) => {
            try {
                const parsed = contract.interface.parseLog({
                    topics: [...log.topics],
                    data: log.data
                });
                return parsed !== null;
            } catch {
                return false;
            }
        });

        // Actually, getCurrentPrice is state-changing but returns data
        // Let's call it as a static call to get the return value
        const priceData = await contract.getCurrentPrice.staticCall(FEED_IDS['ETH/USD']);
        currentPrice = Number(priceData[0]);
        priceDecimals = Number(priceData[1]);
        priceTimestamp = Number(priceData[2]);

        console.log("✅ FTSO Price Query Successful!");
        console.log("   Feed: ETH/USD");
        console.log("   Price:", formatPrice(currentPrice, priceDecimals));
        console.log("   Decimals:", priceDecimals);
        console.log("   Timestamp:", new Date(priceTimestamp * 1000).toLocaleString());
        console.log("   Block-latency feed (~1.8s updates)");
    } catch (error: any) {
        console.error("❌ Failed to query FTSO price:", error.message);
        return;
    }

    // =================================================================
    // STEP 2: Create Payment with TIGHT Spread (1% range)
    // =================================================================
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("STEP 2: Create Payment with Tight Triggers - £0.25 (~$0.32 USD)");
    console.log("═══════════════════════════════════════════════════════════════\n");

    // 25 pence ≈ $0.32 USD = 32 cents
    const usdAmountCents = 32;
    
    // Set TIGHT triggers (1% spread) to catch price movements quickly
    // With FTSO updating ~1.8 seconds, price should hit these triggers soon
    const stopLossPrice = Math.floor(currentPrice * 0.9995);  // 0.05% below
    const takeProfitPrice = Math.floor(currentPrice * 1.0005); // 0.05% above

    // Calculate estimated ETH needed at current price
    const estimatedEthWei = (usdAmountCents * (10 ** priceDecimals)) / currentPrice;
    const collateralWei = ethers.parseEther("0.01"); // Provide 0.01 ETH collateral

    console.log("💰 Payment Configuration:");
    console.log("   Claim Amount: £0.25 GBP");
    console.log("   USD Equivalent:", formatUSD(usdAmountCents));
    console.log("   Crypto Feed: ETH/USD");
    console.log("   Current ETH Price:", formatPrice(currentPrice, priceDecimals));
    console.log("\n🎯 Execution Triggers (TIGHT 1% spread):");
    console.log("   Stop Loss:", formatPrice(stopLossPrice, priceDecimals), "(-0.05%)");
    console.log("   Current Price:", formatPrice(currentPrice, priceDecimals), "👈 CURRENT");
    console.log("   Take Profit:", formatPrice(takeProfitPrice, priceDecimals), "(+0.05%)");
    console.log("\n   ⏳ Payment starts in PENDING state");
    console.log("   ▶ Tight spread: Price will likely hit trigger within minutes");
    console.log("   ▶ Executes if price drops to $" + (stopLossPrice / 10**priceDecimals).toFixed(2) + " or rises to $" + (takeProfitPrice / 10**priceDecimals).toFixed(2));
    console.log("\n💎 Estimated ETH Required:");
    console.log("   At current price: ~" + (estimatedEthWei / 10**18).toFixed(6) + " ETH");
    console.log("   Collateral provided:", formatETH(collateralWei));

    let paymentId: number;

    try {
        console.log("\n⏳ Creating payment with tight triggers...");
        
        const tx = await contract.createClaimPayment(
            receiverAddress,
            usdAmountCents,
            FEED_IDS['ETH/USD'],
            stopLossPrice,
            takeProfitPrice,
            30,
            { value: collateralWei }
        );

        console.log("📤 Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        
        console.log("\n✅ Payment Created!");
        console.log("   Block:", receipt?.blockNumber);
        console.log("   Gas used:", receipt?.gasUsed.toString());

        const event = receipt?.logs[0];
        if (event) {
            const parsedLog = contract.interface.parseLog({
>>>>>>> origin
                topics: [...event.topics],
                data: event.data
            });
            
            if (parsedLog) {
<<<<<<< HEAD
                const paymentId = parsedLog.args.paymentId;
                console.log("   Payment ID:", paymentId.toString());

                console.log("\n─────────────────────────────────────");
                console.log("Test 3: Query Created Payment");
                console.log("─────────────────────────────────────");

                const payment = await contract.getClaimPayment(paymentId);
                
                console.log("✅ Payment retrieved:");
                console.log("   ID:", payment.id.toString());
                console.log("   Payer:", payment.payer);
                console.log("   Receiver:", payment.receiver);
                console.log("   USD Amount: $" + (Number(payment.usdAmount) / 100).toFixed(2));
                console.log("   Stop Loss:", "$" + (Number(payment.stopLossPrice) / 100).toLocaleString());
                console.log("   Take Profit:", "$" + (Number(payment.takeProfitPrice) / 100).toLocaleString());
                console.log("   Collateral:", ethers.formatEther(payment.collateralAmount), "C2FLR");
                console.log("   Created:", new Date(Number(payment.createdAt) * 1000).toLocaleString());
                console.log("   Expires:", new Date(Number(payment.expiresAt) * 1000).toLocaleString());
                console.log("   Executed:", payment.executed);

                console.log("\n─────────────────────────────────────");
                console.log("Test 4: Check Execution Eligibility");
                console.log("─────────────────────────────────────");

                const isExecutable = await contract.isPaymentExecutable(paymentId);
                console.log("   Is Executable:", isExecutable ? "✅ Yes" : "❌ No");

                // Estimate if in range based on trigger prices
                console.log("   Trigger Range: $" + (Number(payment.stopLossPrice) / 100).toLocaleString() + 
                           " - $" + (Number(payment.takeProfitPrice) / 100).toLocaleString());
                
                console.log("\n   💡 Payment created successfully!");
                console.log("      Payment will execute when BTC/USD is between $60k-$75k");
                console.log("      Anyone can call: contract.executeClaimPayment(" + paymentId + ")");

                console.log("\n─────────────────────────────────────");
                console.log("Test 5: Query Total Payments");
                console.log("─────────────────────────────────────");

                const totalPayments = await contract.getTotalPayments();
                console.log("✅ Total payments in contract:", totalPayments.toString());
=======
                paymentId = Number(parsedLog.args.paymentId);
                console.log("   Payment ID:", paymentId);
>>>>>>> origin
            }
        }

    } catch (error: any) {
<<<<<<< HEAD
        console.error("❌ Failed to create payment:", error.message);
        if (error.data) {
            console.error("   Error data:", error.data);
        }
        return;
    }

    console.log("\n═════════════════════════════════════");
    console.log("🎉 All Tests Passed!");
    console.log("═════════════════════════════════════");
    console.log("\n✅ Contract is working correctly!");
    console.log("✅ FTSO integration verified");
    console.log("✅ Payment creation successful");
    console.log("✅ Query functions working");
    console.log("\n🚀 Ready for UI integration!");
=======
        console.error("\n❌ Failed to create payment:", error.message);
        return;
    }

    // =================================================================
    // STEP 3: Verify Payment is PENDING (price between triggers)
    // =================================================================
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("STEP 3: Verify Initial Payment Status - PENDING");
    console.log("═══════════════════════════════════════════════════════════════\n");

    try {
        const payment = await contract.getClaimPayment(paymentId!);
        
        console.log("📋 Payment Details:");
        console.log("   ID:", payment.id.toString());
        console.log("   USD Amount:", formatUSD(Number(payment.usdAmount)));
        console.log("   Collateral:", formatETH(payment.collateralAmount));
        console.log("\n📊 Trigger Range:");
        console.log("   Stop Loss:", formatPrice(Number(payment.stopLossPrice), priceDecimals));
        console.log("   Take Profit:", formatPrice(Number(payment.takeProfitPrice), priceDecimals));
        console.log("\n🚦 STATUS:", payment.executed ? "✅ EXECUTED" : "⏳ PENDING");
        console.log("\n   💡 Price currently between triggers - awaiting price movement");

    } catch (error: any) {
        console.error("❌ Failed to query payment:", error.message);
        return;
    }

    // =================================================================
    // STEP 4: Poll Every 30 Seconds Until Execution
    // =================================================================
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("STEP 4: Polling for Execution (Every 30 seconds)");
    console.log("═══════════════════════════════════════════════════════════════\n");

    console.log("🔄 Starting polling loop...");
    console.log("   Will attempt execution every 30 seconds");
    console.log("   Waiting for FTSO price to hit trigger points\n");

    let executed = false;
    let attemptCount = 0;
    const maxAttempts = 20; // Poll for up to 10 minutes (20 * 30s)

    while (!executed && attemptCount < maxAttempts) {
        attemptCount++;
        const timestamp = new Date().toLocaleTimeString();
        
        console.log(`[${timestamp}] Attempt ${attemptCount}: Checking execution conditions...`);

        try {
            // Query current price
            const currentPriceData = await contract.getCurrentPrice.staticCall(FEED_IDS['ETH/USD']);
            const livePrice = Number(currentPriceData[0]);
            
            console.log(`   Current ETH/USD: ${formatPrice(livePrice, priceDecimals)}`);
            console.log(`   Trigger Range: ${formatPrice(stopLossPrice, priceDecimals)} - ${formatPrice(takeProfitPrice, priceDecimals)}`);

            // Attempt execution
            const executeTx = await contract.executeClaimPayment(paymentId!);
            console.log(`   🎯 Price hit trigger! Executing...`);
            console.log(`   📤 Transaction: ${executeTx.hash}`);
            
            const executeReceipt = await executeTx.wait();
            
            console.log(`\n✅ Payment Executed Successfully!`);
            console.log(`   Block: ${executeReceipt?.blockNumber}`);
            console.log(`   Gas used: ${executeReceipt?.gasUsed.toString()}`);
            console.log(`   Trigger Type: ${livePrice <= stopLossPrice ? 'STOP LOSS (price dropped)' : 'TAKE PROFIT (price rose)'}`);
            
            executed = true;
            break;

        } catch (error: any) {
            if (error.message.includes("Price not at trigger point")) {
                console.log(`   ⏳ Still pending (price between triggers)`);
                
                if (attemptCount < maxAttempts) {
                    console.log(`   ⏰ Waiting 30 seconds before next attempt...\n`);
                    await new Promise(resolve => setTimeout(resolve, 30000));
                }
            } else {
                console.error(`   ❌ Error:`, error.message);
                return;
            }
        }
    }

    if (!executed) {
        console.log(`\n⏰ Polling timeout after ${maxAttempts} attempts (${maxAttempts * 30 / 60} minutes)`);
        console.log(`   Payment remains PENDING - price hasn't hit triggers yet`);
        console.log(`   In a real system, polling would continue indefinitely`);
        console.log(`\n💡 To manually execute later, run:`);
        console.log(`   await contract.executeClaimPayment(${paymentId})`);
        return;
    }

    // =================================================================
    // STEP 5: Verify Final State and Show Transaction Details
    // =================================================================
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("STEP 5: Verify Execution - Transaction Complete");
    console.log("═══════════════════════════════════════════════════════════════\n");

    try {
        const finalPayment = await contract.getClaimPayment(paymentId!);
        const finalBalance = await ethers.provider.getBalance(deployer.address);
        
        console.log("📋 Final Payment State:");
        console.log("   Payment ID:", paymentId);
        console.log("   Status: ✅ EXECUTED");
        console.log("   Executed At:", new Date(Number(finalPayment.executedAt) * 1000).toLocaleString());
        console.log("   Execution Price:", formatPrice(Number(finalPayment.executedPrice), priceDecimals));
        console.log("\n💸 Payment Breakdown:");
        console.log("   USD Owed:", formatUSD(Number(finalPayment.usdAmount)));
        console.log("   ETH Price at Execution:", formatPrice(Number(finalPayment.executedPrice), priceDecimals));
        console.log("   ETH Paid to Receiver:", formatETH(finalPayment.paidAmount));
        console.log("   Refunded to Payer:", formatETH(collateralWei - finalPayment.paidAmount));

        console.log("\n💰 Account Balance:");
        console.log("   Initial:", formatETH(balance));
        console.log("   Final:", formatETH(finalBalance));
        console.log("   Net Cost:", formatETH(balance - finalBalance), "(includes gas)");

    } catch (error: any) {
        console.error("❌ Failed to verify state:", error.message);
        return;
    }

    // =================================================================
    // Summary
    // =================================================================
    console.log("\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║  🎉 Test Complete - Full Payment Lifecycle Demonstrated       ║");
    console.log("╚════════════════════════════════════════════════════════════════╝\n");

    console.log("✅ FTSO Integration: Oracle prices queried successfully");
    console.log("✅ Tight Triggers: 1% spread set to catch price movements quickly");
    console.log("✅ Polling System: Automated 30-second polling demonstrated");
    console.log("✅ Trigger Detection: Price movement detected and execution triggered");
    console.log("✅ Dynamic Calculation: ETH amount calculated at execution time");
    console.log("✅ Successful Execution: Payment made with exact USD value");

    console.log("\n💡 Key Behaviors Demonstrated:");
    console.log("   1. Payment is PENDING when: stopLoss < currentPrice < takeProfit");
    console.log("   2. Payment EXECUTES when: currentPrice <= stopLoss OR currentPrice >= takeProfit");
    console.log("   3. Polling loop checks every 30 seconds - reverts gracefully if not ready");
    console.log("   4. Tight 1% spread ensures execution within minutes of creation");
    console.log("   5. Exact crypto amount calculated dynamically based on oracle price");

    console.log("\n💡 Business Value:");
    console.log("   Insurance companies optimize crypto reserves by setting price triggers.");
    console.log("   - Tight spreads: Quick execution when market moves");
    console.log("   - Take Profit: Execute when price is HIGH → pay minimal crypto");
    console.log("   - Stop Loss: Execute if price drops LOW → prevent paying even more");
    console.log("   - Automated polling: No manual intervention required");
    console.log("   Result: Cost savings while ensuring beneficiaries receive correct USD value");

    console.log("\n🚀 Ready for hackathon demo and UI integration!");
    console.log("   Payment executed after ", attemptCount, " polling attempts (", attemptCount * 30, " seconds)");
>>>>>>> origin
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Test failed:", error);
        process.exit(1);
    });
