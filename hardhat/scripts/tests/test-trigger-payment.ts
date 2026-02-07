import { ethers } from "hardhat";

/**
 * Trigger-Based Payment Test Script
 * 
 * This script demonstrates the FULL TRIGGER-BASED payment flow:
 * 1. Create a $10 USD payment with ETH/USD price feed
 * 2. Set stop loss (e.g., -5%) and take profit (e.g., +5%) triggers
 * 3. Show calculated ETH amount at different price points
 * 4. Execute payment when trigger is hit
 * 5. Verify actual FLR payout amount
 * 
 * DEMO MODE: Calculates amount in ETH, pays that amount in FLR
 * 
 * Run: npx hardhat run scripts/test-trigger-payment.ts --network coston2
 */

// Feed IDs (FLR/USD removed - too expensive for testing)
const FEED_IDS = {
    'BTC/USD': '0x014254432f55534400000000000000000000000000',
    'ETH/USD': '0x014554482f55534400000000000000000000000000',
};

// Helper functions
function formatUSD(cents: number): string {
    return '$' + (cents / 100).toFixed(2);
}

function formatFLR(wei: bigint): string {
    return ethers.formatEther(wei) + ' FLR';
}

function formatETH(wei: bigint): string {
    return ethers.formatEther(wei) + ' ETH';
}

function formatPrice(price: number, decimals: number): string {
    return '$' + (price / (10 ** decimals)).toFixed(2);
}

function calculatePayoutAmount(usdCents: number, priceUsd: number, decimals: number): bigint {
    // Formula: (usdAmount * 1e18 * 10^decimals) / (currentPrice * 100)
    const numerator = BigInt(usdCents) * BigInt(10 ** 18) * BigInt(10 ** decimals);
    const denominator = BigInt(priceUsd) * BigInt(100);
    return numerator / denominator;
}

async function main() {
    console.log("\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║  Trigger-Based Payment Test - Demo Mode                      ║");
    console.log("║  $10 USD → ETH Calculation → FLR Payment                      ║");
    console.log("╚════════════════════════════════════════════════════════════════╝\n");

    const [deployer] = await ethers.getSigners();
    console.log("👤 Payer:", deployer.address);

    const initialBalance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Initial balance:", formatFLR(initialBalance), "\n");

    // Get receiver address
    const receiverAddress = process.env.TEST_RECIEVER;
    if (!receiverAddress) {
        throw new Error("❌ TEST_RECIEVER not set in .env file!");
    }
    console.log("📬 Receiver:", receiverAddress);

    const receiverInitialBalance = await ethers.provider.getBalance(receiverAddress);
    console.log("💰 Receiver initial balance:", formatFLR(receiverInitialBalance), "\n");

    // Get deployed contract
    const fs = require('fs');
    const path = require('path');
    const deploymentPath = path.join(__dirname, "../../src/lib/contract/deployment.json");
    
    let contractAddress: string;
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
    // STEP 1: Query Current ETH/USD Price
    // =================================================================
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("STEP 1: Query Current ETH/USD Price from FTSO");
    console.log("═══════════════════════════════════════════════════════════════\n");

    let currentPrice: number;
    let priceDecimals: number;
    let priceTimestamp: number;

    try {
        const priceData = await contract.getCurrentPrice.staticCall(FEED_IDS['ETH/USD']);
        currentPrice = Number(priceData[0]);
        priceDecimals = Number(priceData[1]);
        priceTimestamp = Number(priceData[2]);

        console.log("✅ Current Market Data:");
        console.log("   Feed: ETH/USD");
        console.log("   Price:", formatPrice(currentPrice, priceDecimals));
        console.log("   Decimals:", priceDecimals);
        console.log("   Updated:", new Date(priceTimestamp * 1000).toLocaleString());
    } catch (error: any) {
        console.error("❌ Failed to query price:", error.message);
        return;
    }

    // =================================================================
    // STEP 2: Calculate Trigger Prices and Payouts
    // =================================================================
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("STEP 2: Calculate Trigger Prices & Expected Payouts");
    console.log("═══════════════════════════════════════════════════════════════\n");

    const usdAmountCents = 1000; // $10.00 USD
    const stopLossPercent = -5;   // 5% below current price
    const takeProfitPercent = 5;  // 5% above current price

    // Calculate trigger prices
    const stopLossPrice = Math.floor(currentPrice * (1 + stopLossPercent / 100));
    const takeProfitPrice = Math.floor(currentPrice * (1 + takeProfitPercent / 100));

    console.log("💰 Payment Configuration:");
    console.log("   USD Amount:", formatUSD(usdAmountCents));
    console.log("   Feed: ETH/USD (calculates ETH amount, pays FLR)");
    console.log("   Stop Loss: " + stopLossPercent + "% →", formatPrice(stopLossPrice, priceDecimals));
    console.log("   Take Profit: +" + takeProfitPercent + "% →", formatPrice(takeProfitPrice, priceDecimals));

    // Calculate expected payouts at different price points
    const payoutAtStopLoss = calculatePayoutAmount(usdAmountCents, stopLossPrice, priceDecimals);
    const payoutAtCurrent = calculatePayoutAmount(usdAmountCents, currentPrice, priceDecimals);
    const payoutAtTakeProfit = calculatePayoutAmount(usdAmountCents, takeProfitPrice, priceDecimals);

    console.log("\n📊 Calculated Payout Scenarios:");
    console.log("   At Stop Loss (" + formatPrice(stopLossPrice, priceDecimals) + "):");
    console.log("      ETH calculation: " + formatETH(payoutAtStopLoss));
    console.log("      FLR payment: " + formatFLR(payoutAtStopLoss) + " ← DEMO MODE");
    console.log("\n   At Current Price (" + formatPrice(currentPrice, priceDecimals) + "):");
    console.log("      ETH calculation: " + formatETH(payoutAtCurrent));
    console.log("      FLR payment: " + formatFLR(payoutAtCurrent) + " ← DEMO MODE");
    console.log("\n   At Take Profit (" + formatPrice(takeProfitPrice, priceDecimals) + "):");
    console.log("      ETH calculation: " + formatETH(payoutAtTakeProfit));
    console.log("      FLR payment: " + formatFLR(payoutAtTakeProfit) + " ← DEMO MODE");

    // Calculate savings
    const savingsVsStopLoss = payoutAtStopLoss - payoutAtTakeProfit;
    const savingsPercent = Number(savingsVsStopLoss * BigInt(10000) / payoutAtStopLoss) / 100;

    console.log("\n💡 Potential Savings:");
    console.log("   If take profit executes: SAVE " + formatFLR(savingsVsStopLoss));
    console.log("   Savings vs stop loss: " + savingsPercent.toFixed(2) + "%");

    // Calculate required collateral (150% ratio)
    const requiredCollateral = (payoutAtStopLoss * BigInt(150)) / BigInt(100);
    console.log("\n🔒 Collateral Required (150% ratio):");
    console.log("   Minimum: " + formatFLR(requiredCollateral));

    // =================================================================
    // STEP 3: Create Trigger-Based Payment
    // =================================================================
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("STEP 3: Create Trigger-Based Payment");
    console.log("═══════════════════════════════════════════════════════════════\n");

    const collateralAmount = requiredCollateral + ethers.parseEther("0.001"); // Add buffer
    const expiresIn = 3600; // 1 hour

    console.log("📝 Creating payment with triggers...");
    console.log("   Collateral: " + formatFLR(collateralAmount));
    console.log("   Expires in: " + expiresIn + " seconds\n");

    let paymentId: number;
    let createTxHash: string;

    try {
        const tx = await contract.createClaimPayment(
            receiverAddress,
            usdAmountCents,
            FEED_IDS['ETH/USD'],
            stopLossPrice,
            takeProfitPrice,
            expiresIn,
            { value: collateralAmount }
        );

        createTxHash = tx.hash;
        console.log("📤 Transaction sent:", createTxHash);
        console.log("⏳ Waiting for confirmation...\n");

        const receipt = await tx.wait();

        // Parse payment ID from events
        const createdEvent = receipt?.logs.find((log: any) => {
            try {
                const parsed = contract.interface.parseLog({
                    topics: [...log.topics],
                    data: log.data
                });
                return parsed && parsed.name === "ClaimPaymentCreated";
            } catch {
                return false;
            }
        });

        if (createdEvent) {
            const parsedLog = contract.interface.parseLog({
                topics: [...createdEvent.topics],
                data: createdEvent.data
            });
            
            if (parsedLog) {
                paymentId = Number(parsedLog.args.paymentId);
                console.log("✅ Payment Created Successfully!");
                console.log("   Payment ID:", paymentId);
                console.log("   Block:", receipt!.blockNumber);
            }
        }

    } catch (error: any) {
        console.error("\n❌ Failed to create payment:", error.message);
        return;
    }

    // =================================================================
    // STEP 4: Verify Payment is Pending
    // =================================================================
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("STEP 4: Verify Payment State (Should be PENDING)");
    console.log("═══════════════════════════════════════════════════════════════\n");

    try {
        const payment = await contract.getClaimPayment(paymentId!);
        
        console.log("📋 Payment Details:");
        console.log("   ID:", payment.id.toString());
        console.log("   USD Amount:", formatUSD(Number(payment.usdAmount)));
        console.log("   Feed: ETH/USD");
        console.log("   Status:", payment.executed ? "✅ EXECUTED" : "⏳ PENDING");
        console.log("   Collateral Locked:", formatFLR(payment.collateralAmount));
        console.log("   Stop Loss:", formatPrice(Number(payment.stopLossPrice), priceDecimals));
        console.log("   Take Profit:", formatPrice(Number(payment.takeProfitPrice), priceDecimals));
        console.log("   Expires:", new Date(Number(payment.expiresAt) * 1000).toLocaleString());

    } catch (error: any) {
        console.error("❌ Failed to query payment:", error.message);
        return;
    }

    // =================================================================
    // STEP 5: Check if Trigger Conditions are Met
    // =================================================================
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("STEP 5: Check Current Price vs Triggers");
    console.log("═══════════════════════════════════════════════════════════════\n");

    // Get latest price
    const latestPriceData = await contract.getCurrentPrice.staticCall(FEED_IDS['ETH/USD']);
    const latestPrice = Number(latestPriceData[0]);

    console.log("📊 Current Market Status:");
    console.log("   Current Price:", formatPrice(latestPrice, priceDecimals));
    console.log("   Stop Loss:", formatPrice(stopLossPrice, priceDecimals));
    console.log("   Take Profit:", formatPrice(takeProfitPrice, priceDecimals));

    const canExecute = latestPrice <= stopLossPrice || latestPrice >= takeProfitPrice;
    
    if (canExecute) {
        const triggerType = latestPrice <= stopLossPrice ? "STOP LOSS" : "TAKE PROFIT";
        console.log("\n✅ Trigger Active! Price hit " + triggerType);
        console.log("   Ready to execute payment");
    } else {
        const toStopLoss = ((stopLossPrice - latestPrice) / latestPrice * 100).toFixed(2);
        const toTakeProfit = ((takeProfitPrice - latestPrice) / latestPrice * 100).toFixed(2);
        console.log("\n⏳ No Trigger Hit Yet");
        console.log("   Price needs to move " + toStopLoss + "% down to stop loss");
        console.log("   Price needs to move +" + toTakeProfit + "% up to take profit");
    }

    // =================================================================
    // STEP 6: Execute Payment (if trigger hit)
    // =================================================================
    if (canExecute) {
        console.log("\n═══════════════════════════════════════════════════════════════");
        console.log("STEP 6: Execute Payment (Trigger Hit)");
        console.log("═══════════════════════════════════════════════════════════════\n");

        console.log("⚡ Executing payment...\n");

        try {
            const executeTx = await contract.executeClaimPayment(paymentId!);
            console.log("📤 Execution transaction sent:", executeTx.hash);
            console.log("⏳ Waiting for confirmation...\n");

            const executeReceipt = await executeTx.wait();

            console.log("✅ Payment Executed Successfully!");
            console.log("   Block:", executeReceipt!.blockNumber);
            console.log("   Gas used:", executeReceipt!.gasUsed.toString());

            // Get updated payment details
            const executedPayment = await contract.getClaimPayment(paymentId!);

            console.log("\n💸 Execution Details:");
            console.log("   Execution Price:", formatPrice(Number(executedPayment.executedPrice), priceDecimals));
            console.log("   ETH Calculated:", formatETH(executedPayment.paidAmount));
            console.log("   FLR Paid:", formatFLR(executedPayment.paidAmount) + " ← DEMO MODE");
            console.log("   Refunded:", formatFLR(collateralAmount - executedPayment.paidAmount));

            // Verify balances
            const finalReceiverBalance = await ethers.provider.getBalance(receiverAddress);
            const actualReceived = finalReceiverBalance - receiverInitialBalance;

            console.log("\n💰 Receiver Balance Change:");
            console.log("   Before:", formatFLR(receiverInitialBalance));
            console.log("   After:", formatFLR(finalReceiverBalance));
            console.log("   Received:", formatFLR(actualReceived));

            // Calculate actual savings
            if (latestPrice >= takeProfitPrice) {
                const actualSavings = payoutAtStopLoss - executedPayment.paidAmount;
                const actualSavingsPercent = Number(actualSavings * BigInt(10000) / payoutAtStopLoss) / 100;
                console.log("\n🎉 SAVINGS ACHIEVED!");
                console.log("   Saved:", formatFLR(actualSavings));
                console.log("   Savings:", actualSavingsPercent.toFixed(2) + "% vs stop loss scenario");
            }

        } catch (error: any) {
            console.error("\n❌ Failed to execute payment:", error.message);
            console.log("\nNote: If error says 'Price not at trigger point', the price moved");
            console.log("      between our check and execution. This is expected in live markets.");
        }
    } else {
        console.log("\n═══════════════════════════════════════════════════════════════");
        console.log("STEP 6: Cannot Execute (No Trigger Hit)");
        console.log("═══════════════════════════════════════════════════════════════\n");
        
        console.log("⏸️  Payment remains PENDING until:");
        console.log("   • ETH price drops to " + formatPrice(stopLossPrice, priceDecimals) + " or below, OR");
        console.log("   • ETH price rises to " + formatPrice(takeProfitPrice, priceDecimals) + " or above");
        console.log("\n💡 To test execution:");
        console.log("   1. Set tighter triggers (e.g., ±1%)");
        console.log("   2. Wait for FTSO price to move");
        console.log("   3. Run: npx hardhat run scripts/execute-payment.ts --network coston2");
    }

    // =================================================================
    // Summary
    // =================================================================
    console.log("\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║  🎉 Test Complete - Demo Mode Demonstrated                   ║");
    console.log("╚════════════════════════════════════════════════════════════════╝\n");

    console.log("✅ What We Demonstrated:");
    console.log("   1. Queried real ETH/USD price from Flare FTSO");
    console.log("   2. Created $10 USD payment with trigger conditions");
    console.log("   3. Calculated ETH amounts at different price points");
    console.log("   4. Locked FLR collateral in smart contract");
    if (canExecute) {
        console.log("   5. Executed payment when trigger hit");
        console.log("   6. Paid calculated FLR amount (ETH-equivalent)");
        console.log("   7. Automatically refunded excess collateral");
    } else {
        console.log("   5. Payment pending until price triggers hit");
    }

    console.log("\n💡 Demo Mode Summary:");
    console.log("   • Input: $10 USD");
    console.log("   • Feed: ETH/USD from FTSO v2");
    console.log("   • Calculation: Amount in ETH");
    console.log("   • Payment: Same amount in FLR");
    console.log("   • Result: Demonstrates savings when ETH price increases");

    console.log("\n📊 Key Metrics:");
    console.log("   Payment ID:", paymentId!);
    console.log("   Create Tx:", createTxHash!);
    console.log("   Status:", canExecute ? "Executed" : "Pending");
    console.log("   USD Amount:", formatUSD(usdAmountCents));
    console.log("   Current ETH Price:", formatPrice(latestPrice, priceDecimals));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Test failed:", error);
        process.exit(1);
    });
