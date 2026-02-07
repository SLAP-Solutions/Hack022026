# Contract Overview

## What is ClaimPayments?

ClaimPayments is a smart contract deployed on Flare Network that enables insurance companies to create crypto-based claim payments with dynamic execution based on real-time market prices from Flare's FTSO (Time Series Oracle).

## The Problem

Insurance companies often hold cryptocurrency reserves but need to pay claims denominated in fiat currency (USD). The challenge is:

- **Crypto volatility** causes the amount of crypto needed to fluctuate
- **Paying at wrong time** can be expensive
- **Manual monitoring** is inefficient and error-prone

### Example Scenario

```
Insurance Company Assets: 10 BTC
Outstanding Claim: $1,000 USD owed to Alice

Day 1: BTC = $50,000
  → Needs: $1,000 ÷ $50,000 = 0.02 BTC to pay claim
  
Day 5: BTC = $70,000
  → Needs: $1,000 ÷ $70,000 = 0.0143 BTC to pay claim
  → SAVES: 0.0057 BTC worth ~$400!
```

## The Solution

ClaimPayments contract allows insurance companies to:

1. **Create a payment** with USD value and price triggers
2. **Lock collateral** in the smart contract
3. **Set execution range** (stop loss / take profit)
4. **Automatic execution** when FTSO price enters optimal range
5. **Dynamic calculation** of crypto amount at execution time

## Key Concepts

### Stop Loss (Lower Price Limit)

**When:** Price drops to this level  
**Action:** Execute payment to prevent paying even more crypto if price continues falling  
**Example:** Set stop loss at $60,000. If BTC drops here, execute to pay 0.0167 BTC before it gets worse

### Take Profit (Upper Price Limit)

**When:** Price rises to this level  
**Action:** Execute payment to pay minimal crypto at optimal rate  
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
