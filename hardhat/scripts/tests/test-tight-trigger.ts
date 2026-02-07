import { ethers } from "hardhat";

/**
 * Tight Trigger Test - Shows Actual Execution
 * 
 * Creates a $10 USD payment with VERY TIGHT triggers (±1%)
 * This ensures the triggers will be hit immediately so we can see execution
 * 
 * Run: npx hardhat run scripts/test-tight-trigger.ts --network coston2
 */

// Feed IDs (FLR/USD removed - too expensive for testing)
const FEED_IDS = {
    'BTC/USD': '0x014254432f55534400000000000000000000000000',
    'ETH/USD': '0x014554482f55534400000000000000000000000000',
};

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

async function main() {
    console.log("\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║  Tight Trigger Test - Immediate Execution Demo               ║");
    console.log("║  $10 USD → ETH Calc → FLR Payment (±1% triggers)             ║");
    console.log("╚════════════════════════════════════════════════════════════════╝\n");

    const [deployer] = await ethers.getSigners();
    const receiverAddress = process.env.TEST_RECIEVER;
    if (!receiverAddress) throw new Error("❌ TEST_RECIEVER not set!");

    console.log("👤 Payer:", deployer.address);
    console.log("📬 Receiver:", receiverAddress, "\n");

    const receiverInitialBalance = await ethers.provider.getBalance(receiverAddress);

    // Get contract
    const fs = require('fs');
    const path = require('path');
    const deployment = JSON.parse(fs.readFileSync(
        path.join(__dirname, "../../src/lib/contract/deployment.json"), 'utf8'
    ));
    
    const ClaimPayments = await ethers.getContractFactory("ClaimPayments");
    const contract = ClaimPayments.attach(deployment.address);
    console.log("📄 Contract:", deployment.address, "\n");

    // Get current price
    const priceData = await contract.getCurrentPrice.staticCall(FEED_IDS['ETH/USD']);
    const currentPrice = Number(priceData[0]);
    const decimals = Number(priceData[1]);

    console.log("═══════════════════════════════════════════════════════════════");
    console.log("STEP 1: Current Market Price");
    console.log("═══════════════════════════════════════════════════════════════\n");
    console.log("   ETH/USD:", formatPrice(currentPrice, decimals), "\n");

    // Calculate VERY tight triggers (±1%)
    const stopLossPrice = Math.floor(currentPrice * 0.99);     // 1% below
    const takeProfitPrice = Math.floor(currentPrice * 1.01);   // 1% above

    console.log("═══════════════════════════════════════════════════════════════");
    console.log("STEP 2: Set Tight Triggers (±1%)");
    console.log("═══════════════════════════════════════════════════════════════\n");
    console.log("   Stop Loss (-1%):", formatPrice(stopLossPrice, decimals));
    console.log("   Take Profit (+1%):", formatPrice(takeProfitPrice, decimals));

    // Calculate expected payouts
    const usdCents = 1000; // $10 USD
    const payoutAtStopLoss = (BigInt(usdCents) * BigInt(10 ** 18) * BigInt(10 ** decimals)) 
                            / (BigInt(stopLossPrice) * BigInt(100));
    const payoutAtCurrent = (BigInt(usdCents) * BigInt(10 ** 18) * BigInt(10 ** decimals)) 
                           / (BigInt(currentPrice) * BigInt(100));
    const payoutAtTakeProfit = (BigInt(usdCents) * BigInt(10 ** 18) * BigInt(10 ** decimals)) 
                              / (BigInt(takeProfitPrice) * BigInt(100));

    console.log("\n📊 Calculated Amounts:");
    console.log("   If Stop Loss Hits:");
    console.log("      ETH calc: " + formatETH(payoutAtStopLoss));
    console.log("      FLR paid: " + formatFLR(payoutAtStopLoss));
    console.log("   At Current Price:");
    console.log("      ETH calc: " + formatETH(payoutAtCurrent));
    console.log("      FLR paid: " + formatFLR(payoutAtCurrent));
    console.log("   If Take Profit Hits:");
    console.log("      ETH calc: " + formatETH(payoutAtTakeProfit));
    console.log("      FLR paid: " + formatFLR(payoutAtTakeProfit));

    const savings = payoutAtStopLoss - payoutAtTakeProfit;
    const savingsPercent = Number(savings * BigInt(10000) / payoutAtStopLoss) / 100;
    console.log("\n💰 Potential Savings: " + formatFLR(savings) + " (" + savingsPercent.toFixed(2) + "%)");

    // Create with 150% collateral
    const collateral = (payoutAtStopLoss * BigInt(150)) / BigInt(100);
    
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("STEP 3: Create Payment");
    console.log("═══════════════════════════════════════════════════════════════\n");
    console.log("   USD Amount: $10.00");
    console.log("   Collateral: " + formatFLR(collateral), "\n");

    const createTx = await contract.createClaimPayment(
        receiverAddress,
        usdCents,
        FEED_IDS['ETH/USD'],
        stopLossPrice,
        takeProfitPrice,
        3600, // 1 hour
        { value: collateral }
    );

    console.log("⏳ Creating payment...");
    const createReceipt = await createTx.wait();
    
    const createdEvent = createReceipt?.logs.find((log: any) => {
        try {
            const parsed = contract.interface.parseLog({
                topics: [...log.topics],
                data: log.data
            });
            return parsed?.name === "ClaimPaymentCreated";
        } catch { return false; }
    });

    const paymentId = Number(contract.interface.parseLog({
        topics: [...createdEvent!.topics],
        data: createdEvent!.data
    })!.args.paymentId);

    console.log("✅ Payment ID:", paymentId, "\n");

    console.log("═══════════════════════════════════════════════════════════════");
    console.log("STEP 4: Check if Trigger Hit");
    console.log("═══════════════════════════════════════════════════════════════\n");

    const latestPrice = await contract.getCurrentPrice.staticCall(FEED_IDS['ETH/USD']);
    const price = Number(latestPrice[0]);
    
    console.log("   Current Price:", formatPrice(price, decimals));
    
    const canExecute = price <= stopLossPrice || price >= takeProfitPrice;
    
    if (canExecute) {
        const triggerType = price <= stopLossPrice ? "STOP LOSS" : "TAKE PROFIT";
        console.log("   ✅ " + triggerType + " TRIGGERED!\n");
    } else {
        console.log("   ⏳ No trigger yet (price between bounds)\n");
    }

    console.log("═══════════════════════════════════════════════════════════════");
    console.log("STEP 5: Execute Payment");
    console.log("═══════════════════════════════════════════════════════════════\n");

    try {
        console.log("⚡ Attempting execution...");
        const executeTx = await contract.executeClaimPayment(paymentId);
        console.log("⏳ Executing...");
        const executeReceipt = await executeTx.wait();

        console.log("✅ EXECUTED!\n");

        // Get final payment state
        const payment = await contract.getClaimPayment(paymentId);
        
        console.log("💸 Payment Executed:");
        console.log("   Execution Price:", formatPrice(Number(payment.executedPrice), decimals));
        console.log("   ETH Calculated:", formatETH(payment.paidAmount));
        console.log("   FLR Sent:", formatFLR(payment.paidAmount) + " ← DEMO MODE");
        console.log("   Refunded:", formatFLR(collateral - payment.paidAmount));

        // Verify receiver got paid
        const receiverFinalBalance = await ethers.provider.getBalance(receiverAddress);
        const received = receiverFinalBalance - receiverInitialBalance;

        console.log("\n📬 Receiver Account:");
        console.log("   Before:", formatFLR(receiverInitialBalance));
        console.log("   After:", formatFLR(receiverFinalBalance));
        console.log("   Received:", formatFLR(received));

        // Show savings if take profit hit
        if (Number(payment.executedPrice) >= takeProfitPrice) {
            const actualSavings = payoutAtStopLoss - payment.paidAmount;
            const actualPercent = Number(actualSavings * BigInt(10000) / payoutAtStopLoss) / 100;
            console.log("\n🎉 TAKE PROFIT HIT - SAVINGS REALIZED!");
            console.log("   Saved:", formatFLR(actualSavings));
            console.log("   Percentage:", actualPercent.toFixed(2) + "% vs stop loss");
        }

        console.log("\n╔════════════════════════════════════════════════════════════════╗");
        console.log("║  ✅ SUCCESS - Payment Executed in Demo Mode                  ║");
        console.log("╚════════════════════════════════════════════════════════════════╝\n");

        console.log("Demo Mode Flow:");
        console.log("   1. Input: $10.00 USD");
        console.log("   2. Feed: ETH/USD @ " + formatPrice(Number(payment.executedPrice), decimals));
        console.log("   3. Calculated: " + formatETH(payment.paidAmount) + " (ETH-equivalent)");
        console.log("   4. Paid: " + formatFLR(payment.paidAmount) + " (in FLR)");
        console.log("   5. Receiver got FLR, not ETH");
        console.log("   6. Demonstrates real savings using real FTSO prices\n");

    } catch (error: any) {
        if (error.message.includes("Price not at trigger")) {
            console.log("❌ Trigger not hit - price moved back between bounds");
            console.log("   This is normal in live markets with tight triggers");
            console.log("   The payment is still pending and can be executed later\n");
            
            console.log("💡 What happened:");
            console.log("   • Created payment with ±1% triggers");
            console.log("   • Price was within bounds when we checked");
            console.log("   • Contract requires price outside bounds to execute");
            console.log("   • Payment ID " + paymentId + " is pending in contract\n");
            
            console.log("🔄 To execute:");
            console.log("   1. Wait for ETH price to move ±1%");
            console.log("   2. Run keeper bot to auto-execute");
            console.log("   3. Or manually: npx hardhat run scripts/execute-payment.ts\n");
        } else {
            throw error;
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Error:", error);
        process.exit(1);
    });
