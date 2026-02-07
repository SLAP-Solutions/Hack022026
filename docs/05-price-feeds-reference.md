# Price Feeds Reference

## Available FTSO Feeds

Flare's FTSO v2 provides 60+ cryptocurrency price feeds updated every ~1.8 seconds by 100+ independent data providers. This reference lists the feeds supported by ClaimPayments.

## Demo Mode (Coston2 Testnet)

The demo contract uses **ETH/USD** and **BTC/USD** feeds for realistic price calculations but pays amounts in FLR. FLR/USD is omitted from testing as it requires ~1,000 FLR collateral for a $10 payment ($0.03 per FLR).

## Recommended Feeds

| Name | Feed ID (bytes21) | Use Case | Notes |
|------|------------------|----------|-------|
| **ETH/USD** | `0x014554482f55534400000000000000000000000000` | Demo Default | ~$2,000, realistic amounts |
| **BTC/USD** | `0x014254432f55534400000000000000000000000000` | Large Claims | ~$70,000, smaller fractions |
| ~~FLR/USD~~ | ~~`0x01464c522f55534400000000000000000000000000`~~ | ~~Native Token~~ | ⚠️ Too expensive for testing |

## Additional Major Cryptocurrencies

| Name | Feed ID | Price Range | Stability |
|------|---------|-------------|-----------|
| **XRP/USD** | `0x015852502f55534400000000000000000000000000` | ~$0.50 | 🟢 Stable |
| **SOL/USD** | `0x01534f4c2f55534400000000000000000000000000` | ~$100 | 🟢 Stable |
| **AVAX/USD** | `0x01415641582f555344000000000000000000000000` | ~$30 | 🟢 Stable |
| **DOT/USD** | `0x01444f542f55534400000000000000000000000000` | ~$6 | 🟡 Moderate |
| **ATOM/USD** | `0x0141544f4d2f555344000000000000000000000000` | ~$7 | 🟡 Moderate |
| **ADA/USD** | `0x014144412f55534400000000000000000000000000` | ~$0.40 | 🟢 Stable |

## Layer 2 / Scaling Tokens

| Name | Feed ID | Stability |
|------|---------|-----------|
| **ARB/USD** | `0x014152422f55534400000000000000000000000000` | 🟡 Moderate |
| **OP/USD** | `0x014f502f5553440000000000000000000000000000` | 🟡 Moderate |
| **POL/USD** | `0x01504f4c2f55534400000000000000000000000000` | 🟢 Stable |

## Stablecoins

| Name | Feed ID | Notes |
|------|---------|-------|
| **USDC/USD** | `0x01555344432f555344000000000000000000000000` | Always ~$1.00 |
| **USDT/USD** | `0x01555344542f555344000000000000000000000000` | Always ~$1.00 |
| **USDS/USD** | `0x01555344532f555344000000000000000000000000` | Always ~$1.00 |

## DeFi Tokens

| Name | Feed ID | Stability |
|------|---------|-----------|
| **UNI/USD** | `0x01554e492f55534400000000000000000000000000` | 🟡 Moderate |
| **AAVE/USD** | `0x01414156452f555344000000000000000000000000` | 🟢 Stable |
| **LINK/USD** | `0x014c494e4b2f555344000000000000000000000000` | 🟢 Stable |

## Alternative Layer 1s

| Name | Feed ID | Stability |
|------|---------|-----------|
| **BNB/USD** | `0x01424e422f55534400000000000000000000000000` | 🟢 Stable |
| **TRX/USD** | `0x015452582f55534400000000000000000000000000` | 🟢 Stable |
| **TON/USD** | `0x01544f4e2f55534400000000000000000000000000` | 🟢 Stable |

## Feed ID Format

Feed IDs are **bytes21** (21 bytes = 42 hex characters + 0x prefix).

### Structure
```
0x | 01 | 4254432f555344 | 00000000000000000000
│    │    │               │
│    │    │               └─ Padding zeros
│    │    └───────────────── "BTC/USD" in ASCII hex
│    └────────────────────── Category (01 = Crypto)
└─────────────────────────── Prefix
```

### How to Convert

```javascript
// Feed name to bytes21
function nameToFeedId(name) {
    const category = '01'; // Crypto category
    const nameHex = Buffer.from(name, 'utf8').toString('hex');
    const padding = '0'.repeat(42 - 2 - 2 - nameHex.length);
    return '0x' + category + nameHex + padding;
}

// Example
nameToFeedId('BTC/USD'); 
// Returns: 0x014254432f55534400000000000000000000000000

// bytes21 to feed name
function feedIdToName(feedId) {
    const nameHex = feedId.slice(4, feedId.indexOf('00', 4));
    return Buffer.from(nameHex, 'hex').toString('utf8');
}

// Example
feedIdToName('0x014254432f55534400000000000000000000000000');
// Returns: "BTC/USD"
```

## Using Feed IDs in Smart Contract

### Solidity

```solidity
// Define feed IDs as constants
bytes21 constant BTC_USD = 0x014254432f55534400000000000000000000000000;
bytes21 constant ETH_USD = 0x014554482f55534400000000000000000000000000;
bytes21 constant FLR_USD = 0x01464c522f55534400000000000000000000000000;

// Use in function
function createBtcPayment(
    address receiver,
    uint256 usdAmount,
    uint256 stopLoss,
    uint256 takeProfit
) external payable {
    createClaimPayment(
        receiver,
        usdAmount,
        BTC_USD,  // Use constant
        stopLoss,
        takeProfit,
        30
    );
}
```

### JavaScript/TypeScript

```typescript
// Define feed IDs
export const FEED_IDS = {
    'BTC/USD': '0x014254432f55534400000000000000000000000000',
    'ETH/USD': '0x014554482f55534400000000000000000000000000',
    'FLR/USD': '0x01464c522f55534400000000000000000000000000',
    'XRP/USD': '0x015852502f55534400000000000000000000000000',
    'SOL/USD': '0x01534f4c2f55534400000000000000000000000000',
} as const;

// Use in UI
const selectedFeed = 'BTC/USD';
const feedId = FEED_IDS[selectedFeed];

await contract.createClaimPayment(
    receiver,
    usdAmount,
    feedId,  // Use from constant
    stopLoss,
    takeProfit,
    expiryDays
);
```

## Feed Decimals

Each feed returns its own decimal precision.

### Common Decimals

| Feed | Typical Decimals | Example Value | Actual Price |
|------|-----------------|---------------|--------------|
| BTC/USD | 2 | 7000000 | $70,000.00 |
| ETH/USD | 2 | 350000 | $3,500.00 |
| FLR/USD | 5 | 2500 | $0.02500 |
| XRP/USD | 4 | 6000 | $0.6000 |

### Handling Decimals

```javascript
// Get price from FTSO
const [value, decimals, timestamp] = await contract.getCurrentPrice(feedId);

// Calculate actual price
const actualPrice = Number(value) / Math.pow(10, Number(decimals));

// Example: BTC/USD
// value = 7000000
// decimals = 2
// actualPrice = 7000000 / 10^2 = 70000.00
```

### Price Input Conversion

```javascript
// User enters: $70,000
const userPrice = 70000;
const decimals = 2; // BTC/USD decimals

// Convert to contract format
const contractPrice = userPrice * Math.pow(10, decimals);
// contractPrice = 7000000

// Use in contract
await contract.createClaimPayment(
    receiver,
    usdAmount,
    feedId,
    60000 * 100,  // Stop loss: $60,000
    75000 * 100,  // Take profit: $75,000
    30
);
```

## Feed Update Frequency

FTSO v2 feeds update at **block latency** (~1.8 seconds on Flare).

### Characteristics

- **Fast:** New price every block
- **Free:** No oracle fees for queries
- **Accurate:** 100 independent data providers
- **Secure:** Cryptographic verification

### Querying Current Price

```solidity
// Smart contract
(uint256 price, int8 decimals, uint64 timestamp) = 
    ftsoV2.getFeedById(feedId);
```

```javascript
// JavaScript
const [price, decimals, timestamp] = 
    await contract.getCurrentPrice(feedId);

console.log({
    price: price.toString(),
    decimals: decimals,
    timestamp: new Date(Number(timestamp) * 1000),
    actualPrice: Number(price) / Math.pow(10, Number(decimals))
});
```

## Feed Stability Indicators

### 🟢 Stable (Green)
- High liquidity
- Multiple data sources
- Low volatility
- Recommended for production

### 🟡 Moderate (Yellow)
- Good liquidity
- Some volatility
- Use with caution
- Monitor closely

### 🔴 High Risk (Red)
- Low liquidity
- High volatility
- Not recommended for large amounts

## Custom Feeds

FTSO v2 also supports custom feeds for:
- Liquid Staked Tokens (LSTs)
- Project-specific tokens
- Custom data sources

See [FIP.13](https://proposals.flare.network/FIP/FIP_13.html) for details on creating custom feeds.

## Complete Feed List

For the full list of 60+ available feeds, visit:
https://dev.flare.network/ftso/feeds

## Testing on Coston2

All feeds available on mainnet are also available on Coston2 testnet with the same feed IDs.

```javascript
// Same feed ID works on both networks
const BTC_USD = '0x014254432f55534400000000000000000000000000';

// Coston2
const coston2Contract = new Contract(coston2Address, abi, coston2Provider);
const [price1] = await coston2Contract.getCurrentPrice(BTC_USD);

// Mainnet Flare
const mainnetContract = new Contract(mainnetAddress, abi, mainnetProvider);
const [price2] = await mainnetContract.getCurrentPrice(BTC_USD);
```

## Next Steps

- [Read contract API reference](./06-contract-api-reference.md)
- [Explore example use cases](./07-examples-use-cases.md)
- [Return to main docs](./README.md)
