# Contract Overview

## What is ClaimPayments?

ClaimPayments is a smart contract on Flare Network that enables businesses and individuals to optimize crypto payments for USD-denominated invoices by executing when market prices are favorable. It uses Flare's FTSO (Time Series Oracle) for decentralized real-time price data.

## The Problem

Businesses and individuals need to make payments in volatile crypto (ETH, BTC, SOL) but invoices are denominated in stable currencies (USD, USDC). Crypto volatility creates significant inefficiency:

- **Price volatility** causes the crypto cost of the same USD invoice to vary wildly
- **Paying at suboptimal times** wastes valuable crypto reserves
- **Manual monitoring** is inefficient and error-prone
- **Timing the market** requires constant attention
- **Recipients want USD certainty**, payers want crypto efficiency

### Example Scenario

```
You owe a contractor: $1,000 USD
You want to pay in: BTC

Day 1: BTC = $50,000
  → Cost: $1,000 ÷ $50,000 = 0.02 BTC
  
Day 5: BTC = $70,000
  → Cost: $1,000 ÷ $70,000 = 0.0143 BTC
  → SAVES: 0.0057 BTC worth ~$400!
```

Paying on Day 5 instead of Day 1 saves **28% in crypto** for the exact same USD invoice.

## The Solution

ClaimPayments automates optimal payment execution:

1. **Create Invoice/Payment** - Set USD amount and price triggers
2. **Lock Collateral** - Over-collateralize for security (150% ratio)
3. **Monitor via FTSO** - Flare oracle provides real-time prices
4. **Auto-Execute** - Triggers when price hits stop loss OR take profit
5. **Dynamic Calculation** - Crypto amount calculated at execution (not creation)
6. **Automatic Refunds** - Excess collateral returned instantly
7. **Instant Option** - Can execute immediately instead of waiting for triggers

### Who Can Use This?

- **Businesses** - Pay vendors, contractors, and invoices at optimal rates
- **Freelancers** - Set up client payments that execute when prices are favorable
- **DAOs** - Optimize treasury payments and grants
- **Individuals** - Time personal transfers to minimize crypto spent
- **Anyone** - Hold payment obligations and release at best market conditions

Like escrow accounts that earn interest by holding funds longer, FlareOptimize saves crypto by releasing funds at optimal prices.

## Key Concepts

### USD-Denominated Storage

Payments store the **USD amount in cents** (e.g., 100000 = $1,000 USD). The actual crypto amount is **calculated at execution time** based on current FTSO price, not locked at creation time.

### Stop Loss (Lower Price Limit)

**Purpose:** Protect against falling prices  
**When:** Price drops to/below this level  
**Action:** Execute payment to prevent paying even more crypto  
**Example:** Set stop loss at $60,000. If BTC drops here, execute at 0.0167 BTC before it gets worse

### Take Profit (Upper Price Limit)

**Purpose:** Capture optimal rates  
**When:** Price rises to/above this level  
**Action:** Execute payment to pay minimal crypto  
**Example:** Set take profit at $70,000. If BTC rises here, execute at 0.0143 BTC (saving 28% vs stop loss!)  
**Example:** Set take profit at $75,000. If BTC reaches here, execute to pay only 0.0133 BTC

### Execution Window

The payment can **only** execute when:  
`stopLossPrice ≤ Current FTSO Price ≤ takeProfitPrice`

```
Timeline Example:
┌─────────────────────────────────────────────────┐
│ Payment Created: Owe $1,000, Pay in BTC        │
│ Stop Loss: $60,000  |  Take Profit: $75,000    │
└─────────────────────────────────────────────────┘

Day 1: BTC = $50,000  ❌ Below stop loss
Day 2: BTC = $62,000  ✅ IN RANGE - Can execute!
Day 3: BTC = $70,000  ✅ IN RANGE - Optimal!
Day 4: BTC = $78,000  ❌ Above take profit
```

## Why Use FTSO?

Flare's **FTSO (Flare Time Series Oracle)** provides:

- ✅ **Decentralized** - 100 independent data providers
- ✅ **Fast** - Updates every ~1.8 seconds (block latency)
- ✅ **Free** - No oracle fees for basic queries
- ✅ **Secure** - Enshrined in Flare protocol
- ✅ **Accurate** - Stake-weighted mechanism prevents manipulation

## Contract Benefits

### For Insurance Companies (Payers)
- 💰 **Cost savings** through optimal timing
- 🔒 **Security** - funds locked in auditable smart contract
- ⚡ **Automation** - no manual monitoring required
- 🔄 **Flexibility** - can cancel before execution

### For Beneficiaries (Receivers)
- 💎 **Guaranteed payment** - collateral locked on-chain
- 🌐 **Transparency** - can verify payment status anytime
- ⚖️ **Fair execution** - based on objective oracle prices

### For the Ecosystem
- 🔓 **Permissionless** - anyone can execute when conditions met
- 📊 **On-chain data** - full audit trail via events
- 🌍 **Decentralized** - no trusted intermediaries

## Technical Stack

- **Blockchain:** Flare Network (Coston2 testnet for development)
- **Smart Contract:** Solidity 0.8.25
- **Oracle:** FTSO v2 (Flare Time Series Oracle)
- **Frontend:** Next.js + React
- **Web3 Library:** Ethers.js v6
- **Wallet:** MetaMask integration

## Next Steps

- Learn the [execution flow](./02-how-it-works.md)
- See how to [create payments via UI](./03-creating-payments-ui.md)
- Explore [querying transactions](./04-querying-transactions.md)
