# Slapsure - Smart Crypto Payment Optimization

> **ETH Oxford 2026 Hackathon** | Built on Flare Network | FTSO-Powered

## 👥 Team

**Team Size:** 3 members (Ben, Rafe & George)

**Note:** This repository shows 4 contributors due to one team member using an additional GitHub account after exhausting Copilot credits.

## 💡 The Idea

Businesses and individuals need to make payments in volatile crypto (ETH, SOL, BTC) but want to lock in stable USD or USDC values. As crypto prices fluctuate, the amount needed to pay the same USD value changes dramatically. **Slapsure lets you pay invoices when crypto prices are favorable, minimizing the amount of crypto spent.**

Similar to how escrow accounts hold funds in high-interest accounts to maximize returns before release, **Slapsure holds payment obligations until market conditions are optimal** - but instead of earning interest, you save crypto by paying at the best price.

### Real Impact

**Without Slapsure:**
- Pay $1,000 invoice immediately when ETH = $2,000 → Costs **0.5 ETH**
- If you had waited for ETH = $2,100 → Would only cost **0.476 ETH**
- You spent **0.024 ETH more** ($50) by paying at the wrong time!

**With Slapsure:**
- Create $1,000 invoice with triggers: pay when ETH ≥ $2,100 (take profit) or ETH ≤ $1,900 (stop loss)
- Price hits $2,100 → Auto-execute → Costs **0.476 ETH**
- **Saved 0.024 ETH ($50)** by waiting for optimal price
- Recipient gets full $1,000 USD value, you pay less crypto

### Who Benefits?

- **Businesses** - Pay invoices, salaries, contractors when rates are favorable
- **Freelancers** - Optimize payment timing for client invoices
- **DAOs** - Execute treasury payments at best market conditions
- **Anyone** - Hold payment obligations and release at optimal prices

### 🤝 Trust & Web2 Business Benefits

Slapsure isn't just for crypto-native users. It provides fundamental improvements for traditional Web2 business operations:

- **Verifiable Proof of Funds**: Locking collateral acts as a "Proof of Payment Capability." Recipients can see the funds are secured by code, eliminating payment uncertainty.
- **Cheaper International Fees**: Bypass traditional bank wire markups and SWIFT fees by settling on the Flare network.
- **Definite Promise to Pay**: Unlike a credit card authorization or check, a Slapsure payment is a cryptographically secured guarantee of settlement.
- **24/7 Settlement**: Automated execution triggers can settle payments on weekends or holidays, instantly.

## 🎯 How It Works

1. **Create Invoice/Payment** - Enter USD amount owed, choose payment crypto (ETH, BTC, etc.)
2. **Set Triggers** - Define upper bound (take profit) and lower bound (stop loss) prices
3. **Lock Collateral** - Smart contract holds crypto collateral (150% ratio for security)
4. **Monitor Prices** - Flare FTSO provides real-time decentralized price feeds (~1.8s updates)
5. **Auto-Execute** - When price hits your trigger, payment executes automatically
6. **Get Refund** - Excess collateral returned instantly, recipient gets exact USD value

**Instant Payments:** Need to pay now? Skip triggers and execute immediately at current price.

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

✅ **USD-Denominated** - Define invoices in familiar fiat amounts (USD, USDC)  
✅ **Dynamic Calculation** - Crypto amount calculated at execution time  
✅ **Trigger-Based** - Stop loss and take profit automation  
✅ **Instant Payments** - Option to pay immediately at current price  
✅ **Over-Collateralized** - Secure payments with automatic refunds  
✅ **Decentralized Prices** - Flare FTSO (100+ data providers, updates ~1.8s)  
✅ **Contact Management** - Save recipients for easy repeat payments  
✅ **Transaction History** - Complete on-chain payment records  
✅ **Real-time PNL** - See savings vs. creation price in real-time  
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

### 🔄 Deploying New Contract

When you deploy a new contract, update the GitHub secret:

1. Deploy contract: `cd hardhat && npx hardhat run scripts/deploy.ts --network coston2`
2. Copy new address from `src/lib/contract/deployment.json`
3. Go to **GitHub repo → Settings → Secrets and variables → Actions**
4. Update `CONTRACT_ADDRESS` secret with the new address
5. Redeploy keeper (GitHub Actions will use the new address)

⚠️ **Important:** The keeper requires `CONTRACT_ADDRESS` in GitHub Secrets to connect to the deployed contract.

## 💰 Real Savings Example

**Scenario:** You owe a contractor $1,000 USD, want to pay in ETH

| ETH Price | ETH Needed | Savings vs. $2,000 |
|-----------|-----------|--------------------|
| $1,900 | 0.5263 ETH | **Costs $50 more** |
| $2,000 | 0.5000 ETH | Baseline |
| $2,100 | 0.4762 ETH | **Save $50 (5%)** |
| $2,200 | 0.4545 ETH | **Save $100 (10%)** |

**Strategy:**
- Set take profit: $2,100 (pay when ETH is high → save crypto)
- Set stop loss: $1,950 (pay before it gets worse)
- Lock 0.75 ETH collateral (150% of worst case)
- Wait for optimal execution

**Result:** Contractor receives exactly $1,000 USD value, you saved ~5% in ETH by waiting for the right price. Like earning interest on escrow, but through market timing instead.

## 🏆 Flare Hackathon Requirements

✅ **FTSO Integration** - Uses Flare Time Series Oracle for price feeds  
✅ **Real-World Problem** - Solves crypto payment optimization for businesses, freelancers, and consumers  
✅ **Decentralized** - No centralized price oracle dependencies  
✅ **Production Ready** - Battle-tested over-collateralization pattern  
✅ **Impactful** - Enables anyone to optimize payment timing, not just institutions  

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
