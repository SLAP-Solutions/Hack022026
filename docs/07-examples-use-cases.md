# Examples & Use Cases

Real-world scenarios demonstrating how to use the ClaimPayments contract.

## Use Case 1: Basic Insurance Claim Payment

### Scenario
Insurance company owes $1,000 to Alice for a approved claim. Company holds BTC and wants to pay when BTC price is favorable.

### Goals
- Pay minimum BTC possible
- Avoid market timing risk
- Automate execution

### Implementation

```javascript
// Create payment
const tx = await contract.createClaimPayment(
    "0xAliceAddress",                               // receiver
    100000,                                         // $1,000 USD
    "0x014254432f55534400000000000000000000000000", // BTC/USD
    6000000,                                        // Stop loss: $60,000
    7500000,                                        // Take profit: $75,000
    30,                                             // 30 days
    { value: ethers.parseEther("0.025") }         // Collateral
);

const receipt = await tx.wait();
const paymentId = receipt.logs[0].args.paymentId;
console.log(`Payment created: #${paymentId}`);
```

### Outcome Scenarios

**Scenario A: BTC rises to $72,000 (optimal)**
```
Execution:
  - Price in range ✅
  - Payment amount: $1,000 / $72,000 = 0.0139 BTC
  - Alice receives: 0.0139 BTC
  - Company refunded: 0.0111 BTC
  - Company saved: ~$200 vs paying at $60k
```

**Scenario B: BTC drops to $61,000 (stop loss)**
```
Execution:
  - Price hit stop loss ✅
  - Payment amount: $1,000 / $61,000 = 0.0164 BTC
  - Alice receives: 0.0164 BTC
  - Company refunded: 0.0086 BTC
  - Protected from further drops
```

**Scenario C: BTC stays at $50,000 (below range)**
```
No Execution:
  - Price below stop loss ❌
  - Payment remains pending
  - After 30 days: Can cancel and recreate
```

---

## Use Case 2: Bulk Claims Processing

### Scenario
Insurance company has 100 approved claims totaling $50,000. Create multiple payments with different price targets.

### Implementation

```javascript
const claims = [
    { receiver: "0xAlice", amount: 500, target: 70000 },
    { receiver: "0xBob", amount: 1000, target: 72000 },
    { receiver: "0xCarol", amount: 750, target: 68000 },
    // ... 97 more claims
];

async function createBulkPayments(claims) {
    const paymentIds = [];
    
    for (const claim of claims) {
        const stopLoss = claim.target * 0.85;   // 15% below target
        const takeProfit = claim.target * 1.05; // 5% above target
        
        const collateral = calculateCollateral(claim.amount, stopLoss);
        
        const tx = await contract.createClaimPayment(
            claim.receiver,
            claim.amount * 100, // Convert to cents
            BTC_USD_FEED,
            stopLoss * 100,     // With decimals
            takeProfit * 100,
            60,                 // 60 days
            { value: collateral }
        );
        
        const receipt = await tx.wait();
        const paymentId = receipt.logs[0].args.paymentId;
        
        paymentIds.push({
            claimId: claim.id,
            paymentId,
            receiver: claim.receiver,
            txHash: receipt.hash
        });
        
        console.log(`Created payment #${paymentId} for ${claim.receiver}`);
    }
    
    return paymentIds;
}

function calculateCollateral(usdAmount, stopLossPrice) {
    const maxCryptoNeeded = usdAmount / stopLossPrice;
    const buffer = maxCryptoNeeded * 0.5; // 50% buffer
    return ethers.parseEther((maxCryptoNeeded + buffer).toFixed(4));
}
```

---

## Use Case 3: Time-Sensitive Payment

### Scenario
Hurricane damage claim must be paid within 7 days. Use narrow price range for quick execution.

### Implementation

```javascript
// Current BTC: $65,000
// Narrow range for fast execution

const tx = await contract.createClaimPayment(
    urgentClaimReceiver,
    200000,          // $2,000 emergency payment
    BTC_USD_FEED,
    6300000,         // $63,000 stop loss (tight)
    6700000,         // $67,000 take profit (tight)
    7,               // 7 days only
    { value: ethers.parseEther("0.05") }
);

// Monitor aggressively
const paymentId = (await tx.wait()).logs[0].args.paymentId;

// Set up polling
const interval = setInterval(async () => {
    const [price] = await contract.getCurrentPrice(BTC_USD_FEED);
    const actualPrice = Number(price) / 100;
    
    console.log(`Current BTC: $${actualPrice}`);
    
    if (actualPrice >= 63000 && actualPrice <= 67000) {
        console.log("Price in range! Executing...");
        await contract.executeClaimPayment(paymentId);
        clearInterval(interval);
    }
}, 10000); // Check every 10 seconds
```

---

## Use Case 4: Multi-Currency Diversification

### Scenario
Spread risk across multiple cryptocurrencies for the same beneficiary.

### Implementation

```javascript
const receiverAddress = "0xBeneficiaryAddress";
const totalUsdAmount = 3000; // $3,000 total
const splitAmount = 1000;    // $1,000 each

// Split across BTC, ETH, and FLR
const payments = [
    {
        feed: "0x014254432f55534400000000000000000000000000", // BTC/USD
        stopLoss: 6000000,
        takeProfit: 7500000,
        collateral: "0.025"
    },
    {
        feed: "0x014554482f55534400000000000000000000000000", // ETH/USD
        stopLoss: 320000,      // $3,200
        takeProfit: 380000,    // $3,800
        collateral: "0.5"
    },
    {
        feed: "0x01464c522f55534400000000000000000000000000", // FLR/USD
        stopLoss: 2000,        // $0.02
        takeProfit: 3000,      // $0.03
        collateral: "50000"
    }
];

for (const payment of payments) {
    await contract.createClaimPayment(
        receiverAddress,
        splitAmount * 100,
        payment.feed,
        payment.stopLoss,
        payment.takeProfit,
        45,
        { value: ethers.parseEther(payment.collateral) }
    );
}

// Benefit: Even if one crypto is unfavorable, others might execute
```

---

## Use Case 5: Automated Execution Bot

### Scenario
Run a keeper bot that monitors all pending payments and executes them when profitable.

### Implementation

```javascript
// keeper-bot.js
import { Contract, JsonRpcProvider } from 'ethers';

class PaymentExecutor {
    constructor(contractAddress, providerUrl, signerKey) {
        this.provider = new JsonRpcProvider(providerUrl);
        this.wallet = new Wallet(signerKey, this.provider);
        this.contract = new Contract(contractAddress, abi, this.wallet);
    }

    async monitorAndExecute() {
        console.log("🤖 Payment Executor Bot Started");
        
        while (true) {
            try {
                await this.checkPendingPayments();
                await new Promise(resolve => setTimeout(resolve, 10000)); // 10s
            } catch (error) {
                console.error("Error:", error);
            }
        }
    }

    async checkPendingPayments() {
        // Get all payment created events
        const filter = this.contract.filters.ClaimPaymentCreated();
        const events = await this.contract.queryFilter(filter);

        for (const event of events) {
            const paymentId = event.args.paymentId;
            await this.tryExecute(paymentId);
        }
    }

    async tryExecute(paymentId) {
        try {
            const payment = await this.contract.getClaimPayment(paymentId);

            // Skip if already executed or expired
            if (payment.executed) return;
            if (Date.now() / 1000 > Number(payment.expiresAt)) return;

            // Get current price
            const [currentPrice] = await this.contract.getCurrentPrice(
                payment.cryptoFeedId
            );

            // Check if in range
            const inRange = currentPrice >= payment.stopLossPrice &&
                           currentPrice <= payment.takeProfitPrice;

            if (inRange) {
                console.log(`✅ Executing payment #${paymentId}...`);
                
                const tx = await this.contract.executeClaimPayment(paymentId);
                const receipt = await tx.wait();
                
                console.log(`✅ Payment #${paymentId} executed!`);
                console.log(`   Transaction: ${receipt.hash}`);
                
                // Could earn rewards for executing
            }
        } catch (error) {
            // Payment might not be executable yet
            if (!error.message.includes("Price outside")) {
                console.error(`Error executing #${paymentId}:`, error.message);
            }
        }
    }
}

// Run bot
const bot = new PaymentExecutor(
    CONTRACT_ADDRESS,
    "https://coston2-api.flare.network/ext/C/rpc",
    process.env.KEEPER_PRIVATE_KEY
);

bot.monitorAndExecute();
```

---

## Use Case 6: Cancellation and Re-creation

### Scenario
Market conditions changed. Cancel payment and recreate with new triggers.

### Implementation

```javascript
async function adjustPaymentTriggers(oldPaymentId, newStopLoss, newTakeProfit) {
    // Get original payment details
    const oldPayment = await contract.getClaimPayment(oldPaymentId);
    
    if (oldPayment.executed) {
        throw new Error("Cannot cancel executed payment");
    }

    // Cancel old payment
    console.log("Cancelling old payment...");
    const cancelTx = await contract.cancelClaimPayment(oldPaymentId);
    await cancelTx.wait();
    console.log("✅ Cancelled, collateral refunded");

    // Create new payment with updated triggers
    console.log("Creating new payment with adjusted triggers...");
    const createTx = await contract.createClaimPayment(
        oldPayment.receiver,
        oldPayment.usdAmount,
        oldPayment.cryptoFeedId,
        newStopLoss,
        newTakeProfit,
        30,
        { value: oldPayment.collateralAmount } // Reuse same collateral
    );

    const receipt = await createTx.wait();
    const newPaymentId = receipt.logs[0].args.paymentId;
    
    console.log(`✅ New payment created: #${newPaymentId}`);
    return newPaymentId;
}

// Example: Adjust to tighter range
await adjustPaymentTriggers(
    42,        // Old payment ID
    6500000,   // New stop loss: $65,000
    7000000    // New take profit: $70,000
);
```

---

## Use Case 7: Dashboard & Analytics

### Scenario
Build a dashboard showing payment performance and savings.

### Implementation

```javascript
async function getPaymentAnalytics(userAddress) {
    // Get all payments for user
    const filter = contract.filters.ClaimPaymentCreated(null, userAddress);
    const createdEvents = await contract.queryFilter(filter);

    const stats = {
        totalPayments: 0,
        pendingPayments: 0,
        executedPayments: 0,
        totalUsdCommitted: 0,
        totalCryptoSaved: 0,
        avgExecutionPrice: 0
    };

    for (const event of createdEvents) {
        const paymentId = event.args.paymentId;
        const payment = await contract.getClaimPayment(paymentId);

        stats.totalPayments++;
        stats.totalUsdCommitted += Number(payment.usdAmount);

        if (payment.executed) {
            stats.executedPayments++;
            
            // Calculate savings vs stop loss
            const worstCaseAmount = payment.usdAmount / payment.stopLossPrice;
            const actualAmount = Number(payment.paidAmount);
            const saved = worstCaseAmount - actualAmount;
            
            stats.totalCryptoSaved += saved;
            stats.avgExecutionPrice += Number(payment.executedPrice);
        } else {
            const now = Date.now() / 1000;
            if (now <= Number(payment.expiresAt)) {
                stats.pendingPayments++;
            }
        }
    }

    if (stats.executedPayments > 0) {
        stats.avgExecutionPrice /= stats.executedPayments;
    }

    return {
        ...stats,
        totalUsdCommitted: stats.totalUsdCommitted / 100,
        avgExecutionPrice: stats.avgExecutionPrice / 100
    };
}

// Display
const analytics = await getPaymentAnalytics(userAddress);
console.log(`
═══════════════════════════════════════
Payment Analytics
═══════════════════════════════════════
Total Payments:     ${analytics.totalPayments}
Pending:            ${analytics.pendingPayments}
Executed:           ${analytics.executedPayments}
USD Committed:      $${analytics.totalUsdCommitted.toFixed(2)}
Crypto Saved:       ${analytics.totalCryptoSaved.toFixed(4)} BTC
Avg Exec Price:     $${analytics.avgExecutionPrice.toFixed(2)}
═══════════════════════════════════════
`);
```

---

## Best Practices Summary

### ✅ DO:
- Over-collateralize by 50-100%
- Set realistic trigger ranges
- Monitor payments regularly
- Use events for efficient querying
- Batch operations when possible
- Cancel and recreate if market changes significantly
- Test on Coston2 before mainnet
- Document payment IDs for accounting

### ❌ DON'T:
- Under-collateralize payments
- Set impossible price ranges
- Ignore expiry dates
- Query all payments sequentially
- Forget to handle failures
- Share private keys
- Use production funds on testnet

## Additional Resources

- [Contract Overview](./01-contract-overview.md)
- [How It Works](./02-how-it-works.md)
- [Creating Payments UI Guide](./03-creating-payments-ui.md)
- [Querying Transactions](./04-querying-transactions.md)
- [Price Feeds Reference](./05-price-feeds-reference.md)
- [Contract API Reference](./06-contract-api-reference.md)

## Community & Support

- **GitHub:** [Submit issues and feature requests](#)
- **Discord:** [Join developer community](#)
- **Hackathon:** ETH Oxford 2026

---

*Last updated: February 7, 2026*
