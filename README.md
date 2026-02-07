# FlareOptimize - Smart Crypto Payment Optimization

> **ETH Oxford 2026 Hackathon** | Built on Flare Network | FTSO-Powered

## 💡 The Idea

Insurance companies hold crypto reserves but owe claims in USD. As crypto prices fluctuate, the amount needed to pay the same USD value changes dramatically. **FlareOptimize lets them pay claims when crypto prices are high, minimizing the amount of crypto spent.**

### Real Impact

**Without FlareOptimize:**
- Pay $10 claim when ETH = $2,000 → Costs **0.005 ETH**
- Price drops to $1,900 → Would cost **0.0053 ETH** (6% more expensive!)

**With FlareOptimize:**
- Create $10 claim with triggers: execute when ETH ≥ $2,100
- Price hits $2,100 → Auto-execute → Costs **0.0048 ETH**
- **Saved 4% in crypto** by waiting for optimal price

## 🎯 How It Works

1. **Create Payment** - Enter USD amount, set price triggers (stop loss/take profit)
2. **Lock Collateral** - Smart contract holds FLR as collateral (150% ratio)
3. **Monitor Prices** - Flare FTSO provides real-time price feeds
4. **Auto-Execute** - When price hits trigger, payment executes automatically
5. **Get Refund** - Excess collateral returned instantly

## 🚀 Demo Mode (Coston2 Testnet)

Since FLR/USD prices are very small ($0.03), we demonstrate the concept using:
- **Input:** USD amount (e.g., $10)
- **Price Feed:** ETH/USD or BTC/USD from Flare FTSO
- **Calculation:** Amount in chosen crypto (e.g., 0.005 ETH)
- **Payment:** Same numeric value in FLR (0.005 FLR)

This lets us show real savings using authentic market prices while running on testnet.

## 🏗️ Tech Stack

- **Smart Contracts:** Solidity 0.8.25 on Flare Coston2
- **Oracle:** Flare FTSO v2 (decentralized price feeds)
- **Frontend:** Next.js + React + TypeScript
- **Blockchain:** ethers.js v6
- **Automation:** Node.js keeper service

## 📊 Key Features

✅ **USD-Denominated** - Define claims in familiar fiat amounts  
✅ **Dynamic Calculation** - Crypto amount calculated at execution time  
✅ **Trigger-Based** - Stop loss and take profit automation  
✅ **Over-Collateralized** - Secure payments with automatic refunds  
✅ **Decentralized Prices** - Flare FTSO (100+ data providers, updates ~1.8s)  
✅ **Fully On-Chain** - No backend database required  

## 📂 Project Structure

```
/hardhat          - Smart contracts & deployment scripts
/src              - Next.js frontend (payment dashboard)
/keeper           - Autonomous execution bot
/docs             - Complete documentation
```

## 🎮 Quick Start

### 🚀 One-Command Start (Recommended)

Start everything with a single command:

```powershell
.\start-dev.ps1
```

**What it does:**
- ✅ Compiles smart contract
- ✅ Detects changes and deploys if needed
- ✅ Starts keeper bot (background)
- ✅ Starts frontend UI (background)
- ✅ Monitors all services

**Stop all services:**
```powershell
.\stop-dev.ps1
```

**Options:**
```powershell
.\start-dev.ps1 -SkipDeploy  # Skip deployment, just start services
.\start-dev.ps1 -Force       # Force redeployment even if unchanged
```

---

### Manual Setup

If you prefer starting services individually:

#### Deploy Contract
```bash
cd hardhat
npm install
npx hardhat run scripts/deploy.ts --network coston2
```

#### Run Frontend
```bash
cd src
npm install
npm run dev
```

#### Start Keeper (Optional)
```bash
cd keeper
npm install
npm run dev
```

## 📖 Documentation

Comprehensive guides available in `/docs`:
- [Contract Overview](./docs/01-contract-overview.md)
- [How It Works](./docs/02-how-it-works.md)
- [Creating Payments](./docs/03-creating-payments-ui.md)
- [Price Feeds Reference](./docs/05-price-feeds-reference.md)
- [API Reference](./docs/06-contract-api-reference.md)

## 🧪 Test Scripts

```bash
# Test trigger-based payment with $10 USD
npx hardhat run scripts/test-trigger-payment.ts --network coston2

# Test with tight ±1% triggers
npx hardhat run scripts/test-tight-trigger.ts --network coston2

# Test all price feeds (BTC & ETH)
npx hardhat run scripts/test-all-feeds.ts --network coston2
```

## 🌐 Deployed Contract

**Coston2 Testnet:** `0xCe7C24526501401D1A015129314493a74D93b374`  
[View on Explorer](https://coston2-explorer.flare.network/address/0xCe7C24526501401D1A015129314493a74D93b374)

## 💰 Real Savings Example

**Scenario:** Insurance company owes $1,000 USD, holds ETH

| ETH Price | ETH Needed | Difference |
|-----------|-----------|------------|
| $2,000 | 0.5000 ETH | Baseline |
| $2,100 | 0.4762 ETH | **Save 0.0238 ETH ($50)** |
| $1,900 | 0.5263 ETH | **Costs 0.0263 ETH ($50) more** |

By setting take profit at $2,100, the insurance company **automatically saves 5% in crypto** when the price rises.

## 🏆 Flare Hackathon Requirements

✅ **FTSO Integration** - Uses Flare Time Series Oracle for price feeds  
✅ **Real-World Problem** - Solves crypto payment optimization for insurtech  
✅ **Decentralized** - No centralized price oracle dependencies  
✅ **Production Ready** - Battle-tested over-collateralization pattern  

## 📝 Building on Flare Feedback

**What worked well:**
- FTSO v2 API is clean and easy to integrate
- Free oracle queries (no fees!) enable frequent price checks
- Sub-2-second update times perfect for trigger-based execution
- Coston2 testnet reliable for development

**Suggestions:**
- More documentation on FAssets integration patterns
- Example repos for common DeFi primitives (lending, stablecoins)
- Clearer gas estimation guidelines for complex transactions


---

**Built with 💙 for ETH Oxford 2026 on Flare Network**
