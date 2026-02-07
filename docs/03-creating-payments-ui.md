# Creating Payments via UI

## Prerequisites

### 1. Install MetaMask
- Download from: https://metamask.io/
- Create a wallet or import existing one
- Secure your seed phrase

### 2. Connect to Flare Coston2 Testnet

**Add Network Manually:**
- Network Name: `Flare Testnet Coston2`
- RPC URL: `https://coston2-api.flare.network/ext/C/rpc`
- Chain ID: `114`
- Currency Symbol: `C2FLR`
- Block Explorer: `https://coston2-explorer.flare.network/`

### 3. Get Testnet Tokens
- Visit: https://faucet.flare.network/coston2
- Enter your wallet address
- Receive test C2FLR tokens
- Wait for confirmation

## Step-by-Step: Creating a Payment

### Step 1: Connect Your Wallet

1. Visit the ClaimPayments dApp
2. Click **"Connect Wallet"** button
3. MetaMask popup appears
4. Select your account
5. Click **"Connect"**
6. Confirm you're on Coston2 network

**What you'll see:**
```
✅ Connected: 0x1234...5678
Network: Coston2
Balance: 1000 C2FLR
```

### Step 2: Navigate to Create Payment

1. Click **"Create Payment"** in navigation
2. You'll see the payment creation form

### Step 3: Fill Payment Details

#### Receiver Address
```
Field: Receiver Wallet Address
Example: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5
Description: Beneficiary who will receive the payment
```

**Tips:**
- ✅ Copy exact address from recipient
- ✅ Verify address on Coston2 explorer
- ⚠️ Double-check - transactions are irreversible

#### USD Amount
```
Field: Payment Amount (USD)
Example: 1000
Description: How much USD value to pay (e.g., $1,000)
```

**Tips:**
- Enter amount in dollars (not cents)
- System converts to cents internally
- Minimum: $1.00

#### Select Cryptocurrency
```
Field: Payment Crypto
Options:
  • BTC/USD - Bitcoin
  • ETH/USD - Ethereum
  • FLR/USD - Flare
  • XRP/USD - Ripple
```

**Example:** Select `BTC/USD` if you want to pay in BTC

#### Stop Loss Price
```
Field: Stop Loss (Lower Limit)
Example: 60000
Description: If price drops to $60,000, execute to prevent paying more crypto
```

**Tips:**
- Set below current price
- Acts as safety net if price falls
- Consider market volatility

#### Take Profit Price
```
Field: Take Profit (Upper Limit)
Example: 75000
Description: If price rises to $75,000, execute to pay minimal crypto
```

**Tips:**
- Set above current price
- Your target optimal rate
- Must be higher than stop loss

#### Collateral Amount
```
Field: Collateral (C2FLR)
Example: 0.03
Description: Native FLR to lock in contract (over-collateralize for safety)
```

**How to calculate:**
```javascript
// Worst case: price at stop loss
maxCryptoNeeded = usdAmount / stopLossPrice
// Example: $1000 / $60,000 = 0.0167 BTC

// Add 50-100% buffer for safety
recommendedCollateral = maxCryptoNeeded * 1.5
// Example: 0.0167 * 1.5 = 0.025 BTC worth of FLR
```

**Tips:**
- Over-collateralize by 50-100%
- Excess is refunded after execution
- Better safe than underfunded

#### Expiry Days
```
Field: Expiry (Days)
Example: 30
Description: Payment expires and can be cancelled after this many days
```

**Tips:**
- Standard: 30-90 days
- Prevents indefinite locking
- Can cancel after expiry

### Step 4: Review Your Payment

**Summary shown:**
```
═══════════════════════════════════════
Payment Summary
═══════════════════════════════════════
Receiver:     0x742d...bEb5
USD Amount:   $1,000.00
Pay with:     BTC/USD
Stop Loss:    $60,000
Take Profit:  $75,000
Collateral:   0.03 C2FLR
Expires:      March 9, 2026

Current BTC Price: $65,320
Estimated payout:  0.0153 BTC

Execution Range: $60,000 - $75,000
Status: Price in range ✅
═══════════════════════════════════════
```

### Step 5: Submit Transaction

1. Click **"Create Payment"** button
2. MetaMask popup appears with transaction details

**MetaMask shows:**
```
───────────────────────────────────
ClaimPayments
───────────────────────────────────
From: 0x1234...5678
To: 0xA35b...71f3 (Contract)
Value: 0.03 C2FLR
Gas Fee: ~0.001 C2FLR

Total: 0.031 C2FLR
───────────────────────────────────
[Reject] [Confirm]
```

3. Review gas fee and amount
4. Click **"Confirm"**
5. Wait for transaction

### Step 6: Transaction Processing

**UI shows:**
```
⏳ Creating payment...
   Transaction: 0xabc...def
   
   [View on Explorer]
```

**Wait for confirmation** (usually 5-10 seconds)

### Step 7: Success!

```
✅ Payment Created Successfully!

Payment ID: #42
Transaction: 0xabc...def

Your payment is now active and monitoring BTC/USD price.
You will be notified when execution is possible.

[View Payment Details] [Create Another]
```

## After Creation: What Happens Next?

### Monitoring Phase

Your payment is now active and:
- ✅ Stored on-chain permanently
- ✅ Collateral locked in contract
- ✅ Monitoring FTSO price feeds
- ✅ Waiting for price to enter range

**You can:**
1. **View Status** - Check current price vs. trigger range
2. **Cancel** - Recover collateral if needed (before execution)
3. **Execute** - Trigger payment when price in range
4. **Share** - Send payment ID to others to monitor

### Price Scenarios

```
Scenario 1: Price Below Range
├─ Current: $58,000
├─ Stop Loss: $60,000
├─ Take Profit: $75,000
└─ Status: ⏳ Waiting for price to rise

Scenario 2: Price In Range
├─ Current: $67,000
├─ Stop Loss: $60,000  ✅
├─ Take Profit: $75,000  ✅
└─ Status: 🎯 Executable! Click to execute

Scenario 3: Price Above Range
├─ Current: $78,000
├─ Stop Loss: $60,000
├─ Take Profit: $75,000
└─ Status: ⏳ Waiting for price to drop
```

## Executing Your Payment

### When Payment Becomes Executable

**UI shows:**
```
═══════════════════════════════════════
Payment #42 - EXECUTABLE ✅
═══════════════════════════════════════
Current Price: $68,500
Trigger Range: $60,000 - $75,000

Estimated Payout: 0.0146 BTC
Collateral: 0.03 C2FLR
Will Refund: 0.0154 C2FLR

[Execute Payment Now]
═══════════════════════════════════════
```

### Execute the Payment

1. Click **"Execute Payment Now"**
2. MetaMask prompts for approval
3. Confirm transaction (only gas fee, no additional cost)
4. Wait for execution
5. Success! Payment completed

**Result:**
- ✅ Receiver gets calculated crypto amount
- ✅ You get refunded excess collateral
- ✅ Payment marked as executed
- ✅ Transaction recorded on-chain

## Cancelling a Payment

### Before Execution

If you need to cancel before execution:

1. Go to **"My Payments"**
2. Find the payment
3. Click **"Cancel Payment"**
4. Confirm in MetaMask
5. Receive full collateral refund

**Requirements:**
- ⚠️ Only payer can cancel
- ⚠️ Cannot cancel if already executed
- ✅ Full collateral refunded

## Common Issues & Solutions

### Issue: Transaction Failed
```
Error: "Insufficient funds"
Solution: Ensure you have enough C2FLR for collateral + gas
```

### Issue: Price Not in Range
```
Status: Cannot execute - price outside range
Solution: Wait for price to move into trigger range
```

### Issue: Payment Expired
```
Status: Payment expired
Solution: Cancel and create new payment with updated expiry
```

### Issue: Wrong Network
```
Error: "Wrong network"
Solution: Switch MetaMask to Coston2 (Chain ID: 114)
```

## Best Practices

### ✅ DO:
- Double-check receiver address
- Over-collateralize by 50-100%
- Set realistic trigger ranges
- Monitor gas prices
- Save payment ID for reference

### ❌ DON'T:
- Use random addresses
- Under-collateralize
- Set impossible price ranges
- Share private keys
- Reuse expired addresses

## Next Steps

- [Learn to query all your payments](./04-querying-transactions.md)
- [Explore price feeds](./05-price-feeds-reference.md)
- [Read contract API](./06-contract-api-reference.md)
