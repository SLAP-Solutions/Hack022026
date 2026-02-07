# Contract API Reference

Complete reference for all ClaimPayments contract functions.

## Contract Address

**Coston2 Testnet:** `0xA35b0D8b4cADaE0B58E47333532958A73f2671f3`

## State Variables

### `ftsoV2`
```solidity
FtsoV2Interface internal ftsoV2
```
Interface to Flare's FTSO v2 oracle for price feeds.

### `claimPayments`
```solidity
mapping(uint256 => ClaimPayment) public claimPayments
```
Mapping of payment ID to ClaimPayment struct.

### `paymentCounter`
```solidity
uint256 public paymentCounter
```
Counter for generating unique payment IDs. Also represents total payments created.

## Structs

### `ClaimPayment`
```solidity
struct ClaimPayment {
    uint256 id;
    address payer;
    address receiver;
    uint256 usdAmount;
    bytes21 cryptoFeedId;
    uint256 stopLossPrice;
    uint256 takeProfitPrice;
    uint256 collateralAmount;
    uint256 createdAt;
    uint256 expiresAt;
    bool executed;
    uint256 executedAt;
    uint256 executedPrice;
    uint256 paidAmount;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | uint256 | Unique payment identifier |
| `payer` | address | Who created and funded the payment |
| `receiver` | address | Who will receive the payment |
| `usdAmount` | uint256 | USD value in cents ($1000 = 100000) |
| `cryptoFeedId` | bytes21 | FTSO feed ID for payment crypto |
| `stopLossPrice` | uint256 | Lower price trigger (in feed decimals) |
| `takeProfitPrice` | uint256 | Upper price trigger (in feed decimals) |
| `collateralAmount` | uint256 | FLR locked in contract (in wei) |
| `createdAt` | uint256 | Creation timestamp (Unix seconds) |
| `expiresAt` | uint256 | Expiry timestamp (Unix seconds) |
| `executed` | bool | Whether payment has been completed |
| `executedAt` | uint256 | Execution timestamp (0 if not executed) |
| `executedPrice` | uint256 | Price at execution (0 if not executed) |
| `paidAmount` | uint256 | Crypto amount paid (0 if not executed) |

## Functions

### `constructor()`
```solidity
constructor()
```

Initializes the contract and connects to Flare's FTSO v2.

**Called:** Automatically on deployment  
**Access:** N/A (one-time execution)

---

### `createClaimPayment()`
```solidity
function createClaimPayment(
    address _receiver,
    uint256 _usdAmount,
    bytes21 _cryptoFeedId,
    uint256 _stopLossPrice,
    uint256 _takeProfitPrice,
    uint256 _expiryDays
) external payable returns (uint256 paymentId)
```

Creates a new claim payment with price triggers.

**Parameters:**
- `_receiver` - Beneficiary address who will receive payment
- `_usdAmount` - USD value in cents (e.g., 100000 = $1,000)
- `_cryptoFeedId` - FTSO feed ID (e.g., BTC/USD)
- `_stopLossPrice` - Lower price limit (in feed decimals)
- `_takeProfitPrice` - Upper price limit (in feed decimals)
- `_expiryDays` - Days until payment expires

**Returns:**
- `paymentId` - Unique identifier for the created payment

**Payable:** Yes - send collateral as `msg.value`

**Requirements:**
- Receiver address must be non-zero
- USD amount must be positive
- Take profit must be > stop loss
- Must send collateral (msg.value > 0)
- Expiry days must be positive

**Emits:** `ClaimPaymentCreated`

**Example:**
```javascript
const tx = await contract.createClaimPayment(
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5",  // receiver
    100000,                                          // $1,000
    "0x014254432f55534400000000000000000000000000", // BTC/USD
    6000000,                                         // $60k stop loss
    7500000,                                         // $75k take profit
    30,                                              // 30 days
    { value: ethers.parseEther("0.03") }           // 0.03 FLR collateral
);
const receipt = await tx.wait();
console.log("Payment ID:", receipt.logs[0].args.paymentId);
```

---

### `executeClaimPayment()`
```solidity
function executeClaimPayment(uint256 _paymentId) external
```

Executes a claim payment if price conditions are met.

**Parameters:**
- `_paymentId` - ID of the payment to execute

**Permissionless:** Anyone can call when conditions are met

**Requirements:**
- Payment must exist (collateral > 0)
- Payment must not be already executed
- Current time must be before expiry
- Current FTSO price must be within trigger range
- Collateral must cover calculated payment amount

**Emits:** `ClaimPaymentExecuted`

**Example:**
```javascript
// Check if executable
const payment = await contract.getClaimPayment(42);
const [currentPrice] = await contract.getCurrentPrice(payment.cryptoFeedId);

if (currentPrice >= payment.stopLossPrice && 
    currentPrice <= payment.takeProfitPrice) {
    // Execute
    const tx = await contract.executeClaimPayment(42);
    await tx.wait();
    console.log("Payment executed!");
}
```

---

### `cancelClaimPayment()`
```solidity
function cancelClaimPayment(uint256 _paymentId) external
```

Cancels a payment and refunds collateral to payer.

**Parameters:**
- `_paymentId` - ID of the payment to cancel

**Requirements:**
- Payment must exist
- Payment must not be executed
- Caller must be the original payer

**Emits:** `ClaimPaymentCancelled`

**Example:**
```javascript
const tx = await contract.cancelClaimPayment(42);
await tx.wait();
console.log("Payment cancelled, collateral refunded");
```

---

### `getClaimPayment()`
```solidity
function getClaimPayment(uint256 _paymentId) 
    external view returns (ClaimPayment memory)
```

Retrieves complete details of a claim payment.

**Parameters:**
- `_paymentId` - ID of the payment to query

**Returns:** Full `ClaimPayment` struct

**View Function:** Yes (no gas cost)

**Example:**
```javascript
const payment = await contract.getClaimPayment(42);
console.log({
    id: payment.id,
    receiver: payment.receiver,
    usdAmount: Number(payment.usdAmount) / 100,
    executed: payment.executed,
    createdAt: new Date(Number(payment.createdAt) * 1000)
});
```

---

### `getCurrentPrice()`
```solidity
function getCurrentPrice(bytes21 _feedId) 
    external returns (uint256 price, int8 decimals, uint64 timestamp)
```

Gets current price for a crypto feed from FTSO v2.

**Parameters:**
- `_feedId` - FTSO feed ID to query

**Returns:**
- `price` - Current feed value (in feed decimals)
- `decimals` - Number of decimal places
- `timestamp` - Unix timestamp of price update

**State-Changing:** Yes (FTSO may charge fees during volatility)

**Example:**
```javascript
const [price, decimals, timestamp] = await contract.getCurrentPrice(
    "0x014254432f55534400000000000000000000000000" // BTC/USD
);

const actualPrice = Number(price) / Math.pow(10, Number(decimals));
console.log(`BTC/USD: $${actualPrice}`);
```

---

### `isPaymentExecutable()`
```solidity
function isPaymentExecutable(uint256 _paymentId) 
    external view returns (bool executable)
```

Checks if a payment is eligible for execution (view-only estimate).

**Parameters:**
- `_paymentId` - ID of the payment to check

**Returns:**
- `executable` - True if not executed and not expired

**View Function:** Yes

**Note:** This doesn't check current price. Actual price validation happens in `executeClaimPayment()`.

**Example:**
```javascript
const canExecute = await contract.isPaymentExecutable(42);
if (canExecute) {
    console.log("Payment is eligible for execution");
} else {
    console.log("Payment cannot be executed");
}
```

---

### `getTotalPayments()`
```solidity
function getTotalPayments() external view returns (uint256)
```

Returns the total number of payments created.

**Returns:** Total count of claim payments

**View Function:** Yes

**Example:**
```javascript
const total = await contract.getTotalPayments();
console.log(`Total payments: ${total}`);

// Load all payments
for (let i = 0; i < total; i++) {
    const payment = await contract.getClaimPayment(i);
    console.log(`Payment #${i}:`, payment);
}
```

---

### `estimatePayoutAmount()`
```solidity
function estimatePayoutAmount(
    uint256 _paymentId,
    uint256 _estimatedPrice,
    int8 _decimals
) external view returns (uint256 estimatedAmount)
```

Calculates potential crypto amount for a payment at a given price.

**Parameters:**
- `_paymentId` - Payment ID to calculate for
- `_estimatedPrice` - Price to use for calculation (in feed decimals)
- `_decimals` - Number of decimals for the price

**Returns:**
- `estimatedAmount` - Calculated crypto amount (in wei)

**View Function:** Yes

**Use Case:** UI can show "If executed at current price, you'd pay X crypto"

**Example:**
```javascript
const [currentPrice, decimals] = await contract.getCurrentPrice(feedId);
const estimated = await contract.estimatePayoutAmount(42, currentPrice, decimals);

console.log(`At current price, would pay: ${ethers.formatEther(estimated)} FLR`);
```

## Events

### `ClaimPaymentCreated`
```solidity
event ClaimPaymentCreated(
    uint256 indexed paymentId,
    address indexed payer,
    address indexed receiver,
    uint256 usdAmount,
    bytes21 cryptoFeedId,
    uint256 stopLossPrice,
    uint256 takeProfitPrice,
    uint256 expiresAt
)
```

Emitted when a new payment is created.

**Indexed Fields:** `paymentId`, `payer`, `receiver`

**Example Query:**
```javascript
// Get all payments created by user
const filter = contract.filters.ClaimPaymentCreated(null, userAddress);
const events = await contract.queryFilter(filter);
```

---

### `ClaimPaymentExecuted`
```solidity
event ClaimPaymentExecuted(
    uint256 indexed paymentId,
    address indexed executor,
    uint256 executedPrice,
    uint256 paidAmount,
    uint256 refundedAmount,
    uint256 timestamp
)
```

Emitted when a payment is successfully executed.

**Indexed Fields:** `paymentId`, `executor`

**Example Query:**
```javascript
// Get all executed payments
const filter = contract.filters.ClaimPaymentExecuted();
const events = await contract.queryFilter(filter);
```

---

### `ClaimPaymentCancelled`
```solidity
event ClaimPaymentCancelled(
    uint256 indexed paymentId,
    address indexed payer,
    uint256 refundedAmount
)
```

Emitted when a payment is cancelled.

**Indexed Fields:** `paymentId`, `payer`

## Error Messages

All errors are prefixed with `"ClaimPayments:"` for clarity:

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid receiver address` | Receiver is zero address | Provide valid address |
| `USD amount must be positive` | Amount is 0 | Enter positive amount |
| `Take profit must be > stop loss` | Invalid price range | Adjust trigger prices |
| `Must provide collateral` | No msg.value sent | Send FLR as collateral |
| `Expiry days must be positive` | Expiry is 0 | Set valid expiry |
| `Already executed` | Payment already completed | Cannot re-execute |
| `Payment does not exist` | Invalid payment ID | Check payment ID |
| `Payment expired` | Past expiry date | Cannot execute expired |
| `Price outside trigger range` | Price not in range | Wait for price movement |
| `Insufficient collateral` | Not enough to cover | Increase collateral |
| `Only payer can cancel` | Wrong caller | Use payer address |

## Next Steps

- [See example use cases](./07-examples-use-cases.md)
- [Learn about price feeds](./05-price-feeds-reference.md)
- [Return to main docs](./README.md)
