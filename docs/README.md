# ClaimPayments Contract Documentation

Welcome to the ClaimPayments contract documentation. This wiki explains how the insurance claim payment system works and how to interact with it.

## 📚 Documentation Index

1. [Contract Overview](./01-contract-overview.md) - Understanding the core concept
2. [How It Works](./02-how-it-works.md) - Technical explanation and execution flow
3. [Creating Payments via UI](./03-creating-payments-ui.md) - Step-by-step guide for users
4. [Querying Transactions](./04-querying-transactions.md) - How to retrieve payment history
5. [Price Feeds Reference](./05-price-feeds-reference.md) - Available FTSO feeds
6. [Contract API Reference](./06-contract-api-reference.md) - Function documentation
7. [Examples & Use Cases](./07-examples-use-cases.md) - Real-world scenarios

## 🚀 Quick Start

### What is ClaimPayments?

ClaimPayments is a smart contract that allows insurance companies to optimize crypto payments by executing claims when market prices are favorable.

**Problem:** Insurance companies hold crypto reserves but owe claims in USD. When crypto prices fluctuate, the amount of crypto needed to pay the same USD value changes.

**Solution:** Set price triggers (stop loss / take profit) and let the contract automatically execute when optimal conditions are met.

### Key Features

- ✅ **USD-Pegged Payments** - Define payment in USD, pay in crypto
- ✅ **Price Range Triggers** - Set optimal execution window
- ✅ **Flare FTSO Integration** - Real-time decentralized price feeds
- ✅ **Automatic Refunds** - Excess collateral returned to payer
- ✅ **Permissionless Execution** - Anyone can trigger when conditions met
- ✅ **Full Transparency** - All payments stored on-chain with events

## 🎯 Core Concept

```
Insurance Company owes: $1,000 USD
Holds: BTC reserves

Option 1: Pay immediately at BTC = $50,000
  → Must pay 0.02 BTC

Option 2: Wait for better rate at BTC = $70,000
  → Only pay 0.0143 BTC
  → SAVED 0.0057 BTC (~$400)!
```

The ClaimPayments contract automates this optimization by:
1. Creating payment with price triggers
2. Locking collateral in contract
3. Monitoring FTSO oracle prices
4. Executing when price enters optimal range
5. Paying beneficiary calculated crypto amount
6. Refunding excess to insurance company

## 📖 Getting Started

- **For Users:** Start with [Creating Payments via UI](./03-creating-payments-ui.md)
- **For Developers:** Check [Contract API Reference](./06-contract-api-reference.md)
- **For Integration:** See [Querying Transactions](./04-querying-transactions.md)

## 🔗 Useful Links

- Contract Address (Coston2): `0xA35b0D8b4cADaE0B58E47333532958A73f2671f3`
- Flare Documentation: https://dev.flare.network/ftso/getting-started
- FTSO Feeds List: https://dev.flare.network/ftso/feeds
- Coston2 Explorer: https://coston2-explorer.flare.network/

## 🤝 Support

- GitHub Issues: [Report a bug](https://github.com/your-repo/issues)
- Discord: [Join our community](#)
- Hackathon: ETH Oxford 2026
