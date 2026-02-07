import { ethers } from "hardhat";

/**
 * Multi-Feed Demo Test
 * 
 * Demonstrates how the system works with ALL THREE feed options:
 * - BTC/USD
 * - ETH/USD  
 * - FLR/USD
 * 
 * Uses instant execution to guarantee completion
 * Shows how the same $10 USD results in different crypto amounts
 * but payment is always made in FLR
 * 
 * Run: npx hardhat run scripts/test-all-feeds.ts --network coston2
 */

// Feed IDs (FLR/USD removed - too expensive for testing)
const FEED_IDS = {
    'BTC/USD': '0x014254432f55534400000000000000000000000000',
    'ETH/USD': '0x014554482f55534400000000000000000000000000',
};

const FEED_NAMES: Record<string, string> = {
    '0x014254432f55534400000000000000000000000000': 'BTC/USD',
    '0x014554482f55534400000000000000000000000000': 'ETH/USD',
};

function formatUSD(cents: number): string {
    return '$' + (cents / 100).toFixed(2);
}

function formatFLR(wei: bigint): string {
    return ethers.formatEther(wei) + ' FLR';
}

function formatCrypto(wei: bigint, symbol: string): string {
    return ethers.formatEther(wei) + ' ' + symbol;
}

function formatPrice(price: number, decimals: number): string {
    return '$' + (price / (10 ** decimals)).toFixed(2);
}

async function testFeed(
    contract: any,
    feedId: string,
    feedName: string,
    receiverAddress: string,
    usdAmountCents: number
) {
    console.log("\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║  Testing Feed: " + feedName.padEnd(47) + " ║");
    console.log("╚════════════════════════════════════════════════════════════════╝\n");

    // Get current price
    const priceData = await contract.getCurrentPrice.staticCall(feedId);
    const currentPrice = Number(priceData[0]);
    const decimals = Number(priceData[1]);
    const timestamp = Number(priceData[2]);

    console.log("📊 Market Data:");
    console.log("   Feed:", feedName);
    console.log("   Price:", formatPrice(currentPrice, decimals));
    console.log("   Updated:", new Date(timestamp * 1000).toLocaleTimeString());

    // Calculate how much crypto we'd need
    const cryptoSymbol = feedName.split('/')[0]; // BTC, ETH, or FLR
    const cryptoAmount = (BigInt(usdAmountCents) * BigInt(10 ** 18) * BigInt(10 ** decimals)) 
                        / (BigInt(currentPrice) * BigInt(100));

    console.log("\n💰 $10 USD Payment Calculation:");
    console.log("   USD Amount:", formatUSD(usdAmountCents));
    console.log("   " + cryptoSymbol + " Price:", formatPrice(currentPrice, decimals));
    console.log("   Calculated " + cryptoSymbol + " Amount:", formatCrypto(cryptoAmount, cryptoSymbol));
    console.log("   🎯 FLR to Send:", formatFLR(cryptoAmount) + " ← DEMO MODE");

    // Calculate collateral (120% for instant payment)
    const collateral = (cryptoAmount * BigInt(120)) / BigInt(100);
    
    console.log("\n🔒 Collateral:");
    console.log("   Required (120%):", formatFLR(collateral));

    // Get receiver balance before
    const receiverBalanceBefore = await ethers.provider.getBalance(receiverAddress);

    console.log("\n⚡ Creating instant payment...");

    try {
        const tx = await contract.createAndExecutePayment(
            receiverAddress,
            usdAmountCents,
            feedId,
            { value: collateral }
        );

        console.log("📤 Transaction:", tx.hash);
        const receipt = await tx.wait();

        // Parse payment ID
        const createdEvent = receipt?.logs.find((log: any) => {
            try {
                const parsed = contract.interface.parseLog({
                    topics: [...log.topics],
                    data: log.data
                });
                return parsed?.name === "ClaimPaymentCreated";
            } catch { return false; }
        });

        let paymentId = 0;
        if (createdEvent) {
            const parsed = contract.interface.parseLog({
                topics: [...createdEvent.topics],
                data: createdEvent.data
            });
            if (parsed) paymentId = Number(parsed.args.paymentId);
        }

        console.log("✅ Payment Executed!");
        console.log("   Payment ID:", paymentId);
        console.log("   Block:", receipt!.blockNumber);
        console.log("   Gas:", receipt!.gasUsed.toString());

        // Get payment details
        const payment = await contract.getClaimPayment(paymentId);

        console.log("\n💸 Execution Details:");
        console.log("   Feed Used:", feedName);
        console.log("   Execution Price:", formatPrice(Number(payment.executedPrice), decimals));
        console.log("   " + cryptoSymbol + " Calculated:", formatCrypto(payment.paidAmount, cryptoSymbol));
        console.log("   FLR Actually Sent:", formatFLR(payment.paidAmount) + " ✅");
        console.log("   Refunded to Payer:", formatFLR(collateral - payment.paidAmount));

        // Verify receiver got paid
        const receiverBalanceAfter = await ethers.provider.getBalance(receiverAddress);
        const received = receiverBalanceAfter - receiverBalanceBefore;

        console.log("\n📬 Receiver Verification:");
        console.log("   Before:", formatFLR(receiverBalanceBefore));
        console.log("   After:", formatFLR(receiverBalanceAfter));
        console.log("   Received:", formatFLR(received) + " ✅");

        console.log("\n✅ Success! Feed " + feedName + " works correctly");
        console.log("   • Queried " + feedName + " from FTSO");
        console.log("   • Calculated amount in " + cryptoSymbol);
        console.log("   • Paid that amount in FLR");
        console.log("   • Refunded excess collateral");

        return true;

    } catch (error: any) {
        console.error("\n❌ Failed:", error.message);
        return false;
    }
}

async function main() {
    console.log("\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║           Multi-Feed Demo - BTC & ETH Price Feeds            ║");
    console.log("║  Shows BTC/USD, ETH/USD calculate different amounts          ║");
    console.log("║  but all pay in FLR                                          ║");
    console.log("╚════════════════════════════════════════════════════════════════╝\n");

    const [deployer] = await ethers.getSigners();
    const receiverAddress = process.env.TEST_RECIEVER;
    if (!receiverAddress) throw new Error("❌ TEST_RECIEVER not set!");

    console.log("👤 Payer:", deployer.address);
    console.log("📬 Receiver:", receiverAddress);

    const initialBalance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Payer balance:", formatFLR(initialBalance));

    // Get contract
    const fs = require('fs');
    const path = require('path');
    const deployment = JSON.parse(fs.readFileSync(
        path.join(__dirname, "../../src/lib/contract/deployment.json"), 'utf8'
    ));
    
    const ClaimPayments = await ethers.getContractFactory("ClaimPayments");
    const contract = ClaimPayments.attach(deployment.address);
    console.log("📄 Contract:", deployment.address);

    const usdAmountCents = 1000; // $10.00 USD

    // Test both feeds
    const results = {
        'BTC/USD': false,
        'ETH/USD': false,
    };

    // Test BTC/USD
    results['BTC/USD'] = await testFeed(
        contract, 
        FEED_IDS['BTC/USD'], 
        'BTC/USD', 
        receiverAddress, 
        usdAmountCents
    );

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test ETH/USD
    results['ETH/USD'] = await testFeed(
        contract, 
        FEED_IDS['ETH/USD'], 
        'ETH/USD', 
        receiverAddress, 
        usdAmountCents
    );

    // Final summary
    console.log("\n\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║                      Test Summary                             ║");
    console.log("╚════════════════════════════════════════════════════════════════╝\n");

    console.log("📊 Results:");
    for (const [feed, success] of Object.entries(results)) {
        console.log("   " + feed + ":", success ? "✅ PASSED" : "❌ FAILED");
    }

    const allPassed = Object.values(results).every(r => r);

    if (allPassed) {
        console.log("\n🎉 All feeds working correctly!");
    } else {
        console.log("\n⚠️  Some feeds failed");
    }

    console.log("\n💡 Key Takeaway:");
    console.log("   • Same $10 USD input");
    console.log("   • Different price feeds (BTC, ETH)");
    console.log("   • Different calculated crypto amounts");
    console.log("   • All payments made in FLR (native token)");
    console.log("   • Demonstrates Demo Mode working with any feed");
    console.log("   • Note: FLR/USD omitted (requires ~1,000 FLR collateral)");

    const finalBalance = await ethers.provider.getBalance(deployer.address);
    console.log("\n💰 Final Balance:", formatFLR(finalBalance));
    console.log("   Total Cost:", formatFLR(initialBalance - finalBalance), "(includes gas)");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Error:", error);
        process.exit(1);
    });
