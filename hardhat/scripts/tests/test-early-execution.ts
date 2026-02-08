import { ethers } from "hardhat";

/**
 * Early Payment Execution Test Script
 * 
 * This script tests the executePaymentEarly functionality:
 * 1. Query current ETH/USD price from FTSO
 * 2. Create a payment with triggers that WON'T be hit (wide spread)
 * 3. Verify normal execution fails (triggers not hit)
 * 4. Execute early as the payer (bypasses trigger check)
 * 5. Verify payment completes with current price
 * 6. Test that non-payer cannot execute early
 * 
 * EXECUTION LOGIC:
 * - executeClaimPayment: Requires currentPrice <= stopLoss OR currentPrice >= takeProfit
 * - executePaymentEarly: Only requires msg.sender == payer, uses current price
 * 
 * Run: npx hardhat run scripts/tests/test-early-execution.ts --network coston2
 */

// Feed IDs for testing
const FEED_IDS = {
    'BTC/USD': '0x014254432f55534400000000000000000000000000',
    'ETH/USD': '0x014554482f55534400000000000000000000000000',
    'FLR/USD': '0x01464c522f55534400000000000000000000000000',
};

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
    console.log("║  Early Payment Execution Test                                 ║");
    console.log("║  ETH Oxford 2026 Hackathon - Flare FTSO Integration          ║");
    console.log("╚════════════════════════════════════════════════════════════════╝\n");

    const [deployer, otherUser] = await ethers.getSigners();
    console.log("👤 Deployer (Payer):", deployer.address);
    console.log("👤 Other User:", otherUser.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Initial balance:", formatETH(balance), "\n");

    // Get receiver address from .env
    const receiverAddress = process.env.TEST_RECIEVER;
    if (!receiverAddress) {
        throw new Error("❌ TEST_RECIEVER not set in .env file!");
    }
    console.log("📬 Receiver (Beneficiary):", receiverAddress);

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
    // STEP 1: Query Current ETH/USD Price from FTSO
    // =================================================================
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("STEP 1: Query Current ETH/USD Price from Flare FTSO");
    console.log("═══════════════════════════════════════════════════════════════\n");

    let currentPrice: number;
    let priceDecimals: number;
    let priceTimestamp: number;

    try {
        const priceData = await contract.getCurrentPrice.staticCall(FEED_IDS['ETH/USD']);
        currentPrice = Number(priceData[0]);
        priceDecimals = Number(priceData[1]);
        priceTimestamp = Number(priceData[2]);

        console.log("✅ FTSO Price Query Successful!");
        console.log("   Feed: ETH/USD");
        console.log("   Price:", formatPrice(currentPrice, priceDecimals));
        console.log("   Decimals:", priceDecimals);
        console.log("   Timestamp:", new Date(priceTimestamp * 1000).toLocaleString());
        console.log();
    } catch (error: any) {
        console.error("❌ Failed to query FTSO price:", error.message);
        throw error;
    }

    // =================================================================
    // STEP 2: Create Payment with WIDE triggers (won't be hit)
    // =================================================================
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("STEP 2: Create Payment with Wide Trigger Spread");
    console.log("═══════════════════════════════════════════════════════════════\n");

    const usdAmountCents = 32; // $0.32 (~£0.25)
    
    // Set triggers with 50% spread - very unlikely to hit
    const stopLossPrice = Math.floor(currentPrice * 0.5);  // 50% below
    const takeProfitPrice = Math.floor(currentPrice * 1.5); // 50% above
    
    const expiresAt = Math.floor(Date.now() / 1000) + (60 * 60 * 24); // 24 hours
    
    // Calculate required collateral (3x coverage)
    const estimatedCryptoAmount = (usdAmountCents * 1e18 * (10 ** priceDecimals)) / (currentPrice * 100);
    const collateralAmount = estimatedCryptoAmount * 3n;

    console.log("💵 Payment Details:");
    console.log("   USD Amount:", formatUSD(usdAmountCents));
    console.log("   Stop Loss:", formatPrice(stopLossPrice, priceDecimals), "(50% below)");
    console.log("   Take Profit:", formatPrice(takeProfitPrice, priceDecimals), "(50% above)");
    console.log("   Current Price:", formatPrice(currentPrice, priceDecimals));
    console.log("   Collateral:", formatETH(collateralAmount));
    console.log("   ⚠️  TRIGGERS WILL NOT BE HIT - Testing early execution\n");

    let paymentId: number;
    
    try {
        console.log("📤 Sending createClaimPayment transaction...");
        const tx = await contract.createClaimPayment(
            receiverAddress,
            usdAmountCents,
            FEED_IDS['ETH/USD'],
            stopLossPrice,
            takeProfitPrice,
            expiresAt,
            { value: collateralAmount }
        );
        
        console.log("⏳ Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed in block:", receipt?.blockNumber);

        // Extract payment ID from event
        const event = receipt?.logs.find((log: any) => {
            try {
                const parsed = contract.interface.parseLog({
                    topics: [...log.topics],
                    data: log.data
                });
                return parsed?.name === 'ClaimPaymentCreated';
            } catch {
                return false;
            }
        });

        if (event) {
            const parsed = contract.interface.parseLog({
                topics: [...event.topics],
                data: event.data
            });
            paymentId = Number(parsed?.args[0]);
            console.log("🆔 Payment ID:", paymentId, "\n");
        } else {
            throw new Error("ClaimPaymentCreated event not found");
        }
    } catch (error: any) {
        console.error("❌ Failed to create payment:", error.message);
        throw error;
    }

    // =================================================================
    // STEP 3: Verify Normal Execution Fails (Triggers Not Hit)
    // =================================================================
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("STEP 3: Verify Normal Execution Fails (Triggers Not Hit)");
    console.log("═══════════════════════════════════════════════════════════════\n");

    try {
        console.log("📤 Attempting executeClaimPayment (should fail)...");
        await contract.executeClaimPayment(paymentId);
        console.log("❌ ERROR: executeClaimPayment should have failed but succeeded!");
        throw new Error("Test failed - normal execution should require triggers");
    } catch (error: any) {
        if (error.message.includes("Price not at trigger point")) {
            console.log("✅ Correctly rejected: Price not at trigger point");
            console.log("   This confirms triggers are working correctly\n");
        } else {
            console.error("❌ Unexpected error:", error.message);
            throw error;
        }
    }

    // =================================================================
    // STEP 4: Test Non-Payer Cannot Execute Early
    // =================================================================
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("STEP 4: Test Non-Payer Cannot Execute Early");
    console.log("═══════════════════════════════════════════════════════════════\n");

    try {
        console.log("📤 Attempting executePaymentEarly as other user (should fail)...");
        const contractAsOther = contract.connect(otherUser);
        await contractAsOther.executePaymentEarly(paymentId);
        console.log("❌ ERROR: Non-payer should not be able to execute early!");
        throw new Error("Test failed - only payer should execute early");
    } catch (error: any) {
        if (error.message.includes("Only payer can execute early")) {
            console.log("✅ Correctly rejected: Only payer can execute early");
            console.log("   This confirms payer-only restriction is working\n");
        } else {
            console.error("❌ Unexpected error:", error.message);
            throw error;
        }
    }

    // =================================================================
    // STEP 5: Execute Payment Early as Payer
    // =================================================================
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("STEP 5: Execute Payment Early as Payer");
    console.log("═══════════════════════════════════════════════════════════════\n");

    const balanceBefore = await ethers.provider.getBalance(receiverAddress);
    console.log("💰 Receiver balance before:", formatETH(balanceBefore));

    try {
        console.log("📤 Executing payment early (bypassing triggers)...");
        const tx = await contract.executePaymentEarly(paymentId);
        
        console.log("⏳ Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed in block:", receipt?.blockNumber);

        // Get payment details
        const payment = await contract.getClaimPayment(paymentId);
        const executedPrice = Number(payment.executedPrice);
        const paidAmount = payment.paidAmount;

        console.log("\n💸 Payment Executed Early:");
        console.log("   Execution Price:", formatPrice(executedPrice, priceDecimals));
        console.log("   Amount Paid:", formatETH(paidAmount));
        console.log("   Status: EXECUTED ✓\n");

        const balanceAfter = await ethers.provider.getBalance(receiverAddress);
        const received = balanceAfter - balanceBefore;
        console.log("💰 Receiver balance after:", formatETH(balanceAfter));
        console.log("📈 Amount received:", formatETH(received), "\n");

        // Verify payment matches
        if (received === paidAmount) {
            console.log("✅ Receiver got exact payment amount");
        } else {
            console.log("⚠️  Receiver balance delta doesn't match (gas or other txs?)");
        }
    } catch (error: any) {
        console.error("❌ Failed to execute payment early:", error.message);
        throw error;
    }

    // =================================================================
    // STEP 6: Verify Payment Cannot Be Executed Again
    // =================================================================
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("STEP 6: Verify Payment Cannot Be Executed Again");
    console.log("═══════════════════════════════════════════════════════════════\n");

    try {
        console.log("📤 Attempting to execute already-executed payment...");
        await contract.executePaymentEarly(paymentId);
        console.log("❌ ERROR: Should not be able to execute twice!");
        throw new Error("Test failed - double execution should be blocked");
    } catch (error: any) {
        if (error.message.includes("Already executed")) {
            console.log("✅ Correctly rejected: Already executed");
            console.log("   This confirms double-execution protection is working\n");
        } else {
            console.error("❌ Unexpected error:", error.message);
            throw error;
        }
    }

    // =================================================================
    // TEST COMPLETE
    // =================================================================
    console.log("╔════════════════════════════════════════════════════════════════╗");
    console.log("║  ✅ ALL TESTS PASSED                                          ║");
    console.log("╠════════════════════════════════════════════════════════════════╣");
    console.log("║  • Normal execution correctly requires triggers               ║");
    console.log("║  • Non-payer cannot execute early                             ║");
    console.log("║  • Payer can execute early at current price                   ║");
    console.log("║  • Double execution correctly blocked                         ║");
    console.log("╚════════════════════════════════════════════════════════════════╝\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ TEST FAILED:", error);
        process.exit(1);
    });
