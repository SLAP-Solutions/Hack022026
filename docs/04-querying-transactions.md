# Querying Transactions

This guide explains how to retrieve and display claim payment data from the blockchain.

## Overview

All claim payments are stored on-chain and can be queried through:
1. **Direct contract calls** - Read specific payment by ID
2. **Event filtering** - Query historical events
3. **Batch queries** - Load multiple payments at once

## Method 1: Query Specific Payment

### Using Web UI

```typescript
// In your React component
import { useContract } from '@/hooks/useContract';

function PaymentDetail({ paymentId }) {
    const { contract } = useContract();
    const [payment, setPayment] = useState(null);

    useEffect(() => {
        async function loadPayment() {
            const paymentData = await contract.getClaimPayment(paymentId);
            setPayment(paymentData);
        }
        loadPayment();
    }, [paymentId]);

    return (
        <div>
            <h2>Payment #{payment?.id}</h2>
            <p>Receiver: {payment?.receiver}</p>
            <p>USD Amount: ${payment?.usdAmount / 100}</p>
            <p>Status: {payment?.executed ? 'Executed' : 'Pending'}</p>
        </div>
    );
}
```

### Using Ethers.js

```javascript
import { Contract, JsonRpcProvider } from 'ethers';
import contractABI from './abi.json';

const provider = new JsonRpcProvider('https://coston2-api.flare.network/ext/C/rpc');
const contract = new Contract(contractAddress, contractABI, provider);

// Get specific payment by ID
const payment = await contract.getClaimPayment(42);

console.log({
    id: payment.id.toString(),
    payer: payment.payer,
    receiver: payment.receiver,
    usdAmount: (Number(payment.usdAmount) / 100).toFixed(2),
    executed: payment.executed,
    createdAt: new Date(Number(payment.createdAt) * 1000)
});
```

## Method 2: Query All Payments

### Get Total Count

```typescript
// Get total number of payments
const totalPayments = await contract.getTotalPayments();
console.log(`Total payments: ${totalPayments}`);
```

### Load All Payments

```typescript
async function loadAllPayments() {
    const totalCount = await contract.getTotalPayments();
    const payments = [];

    for (let i = 0; i < totalCount; i++) {
        const payment = await contract.getClaimPayment(i);
        payments.push({
            id: Number(payment.id),
            payer: payment.payer,
            receiver: payment.receiver,
            usdAmount: Number(payment.usdAmount) / 100,
            executed: payment.executed,
            createdAt: Number(payment.createdAt),
            // ... other fields
        });
    }

    return payments;
}
```

### Optimized Batch Loading

```typescript
async function loadPaymentsBatch(startId: number, count: number) {
    // Load multiple payments in parallel
    const promises = [];
    
    for (let i = startId; i < startId + count; i++) {
        promises.push(contract.getClaimPayment(i));
    }

    const results = await Promise.all(promises);
    return results.map((payment, index) => ({
        id: startId + index,
        ...formatPayment(payment)
    }));
}

// Usage
const batch1 = await loadPaymentsBatch(0, 10);   // Load payments 0-9
const batch2 = await loadPaymentsBatch(10, 10);  // Load payments 10-19
```

## Method 3: Query by Events

Events are more efficient for filtering and historical queries.

### Query ClaimPaymentCreated Events

```typescript
// Get all created payment events
const filter = contract.filters.ClaimPaymentCreated();
const events = await contract.queryFilter(filter);

const payments = events.map(event => ({
    paymentId: Number(event.args.paymentId),
    payer: event.args.payer,
    receiver: event.args.receiver,
    usdAmount: Number(event.args.usdAmount) / 100,
    cryptoFeedId: event.args.cryptoFeedId,
    stopLossPrice: Number(event.args.stopLossPrice),
    takeProfitPrice: Number(event.args.takeProfitPrice),
    expiresAt: new Date(Number(event.args.expiresAt) * 1000),
    blockNumber: event.blockNumber,
    transactionHash: event.transactionHash
}));

console.log(`Found ${payments.length} payments`);
```

### Filter Events by User

```typescript
// Get only payments where user is the payer
const userAddress = "0x1234...5678";
const filter = contract.filters.ClaimPaymentCreated(null, userAddress);
const userEvents = await contract.queryFilter(filter);

console.log(`User has created ${userEvents.length} payments`);
```

### Filter Events by Receiver

```typescript
// Get payments where user is the receiver
const filter = contract.filters.ClaimPaymentCreated(null, null, receiverAddress);
const receivedEvents = await contract.queryFilter(filter);

console.log(`User will receive ${receivedEvents.length} payments`);
```

### Query Executed Payments

```typescript
// Get all executed payment events
const filter = contract.filters.ClaimPaymentExecuted();
const executedEvents = await contract.queryFilter(filter);

const executedPayments = executedEvents.map(event => ({
    paymentId: Number(event.args.paymentId),
    executor: event.args.executor,
    executedPrice: Number(event.args.executedPrice),
    paidAmount: event.args.paidAmount.toString(),
    refundedAmount: event.args.refundedAmount.toString(),
    timestamp: new Date(Number(event.args.timestamp) * 1000),
    transactionHash: event.transactionHash
}));
```

## Method 4: Paginated Queries

For UIs with pagination:

```typescript
interface PaginationParams {
    page: number;      // Current page (0-indexed)
    pageSize: number;  // Items per page
}

async function getPaymentsPaginated({ page, pageSize }: PaginationParams) {
    const totalPayments = await contract.getTotalPayments();
    const startIndex = page * pageSize;
    const endIndex = Math.min(startIndex + pageSize, Number(totalPayments));
    
    const payments = [];
    for (let i = startIndex; i < endIndex; i++) {
        const payment = await contract.getClaimPayment(i);
        payments.push(formatPayment(payment));
    }

    return {
        payments,
        currentPage: page,
        pageSize,
        totalPayments: Number(totalPayments),
        totalPages: Math.ceil(Number(totalPayments) / pageSize),
        hasMore: endIndex < Number(totalPayments)
    };
}

// Usage
const page1 = await getPaymentsPaginated({ page: 0, pageSize: 10 });
const page2 = await getPaymentsPaginated({ page: 1, pageSize: 10 });
```

## Method 5: Filter by Status

```typescript
async function getPaymentsByStatus(status: 'pending' | 'executed' | 'expired') {
    const totalPayments = await contract.getTotalPayments();
    const payments = [];

    for (let i = 0; i < totalPayments; i++) {
        const payment = await contract.getClaimPayment(i);
        
        const isExpired = Date.now() / 1000 > Number(payment.expiresAt);
        const isExecuted = payment.executed;
        
        if (status === 'executed' && isExecuted) {
            payments.push(formatPayment(payment));
        } else if (status === 'expired' && isExpired && !isExecuted) {
            payments.push(formatPayment(payment));
        } else if (status === 'pending' && !isExecuted && !isExpired) {
            payments.push(formatPayment(payment));
        }
    }

    return payments;
}

// Usage
const pendingPayments = await getPaymentsByStatus('pending');
const executedPayments = await getPaymentsByStatus('executed');
```

## Complete React Hook Example

```typescript
// hooks/usePayments.ts
import { useState, useEffect } from 'react';
import { useContract } from './useContract';

export function usePayments(userAddress?: string) {
    const { contract } = useContract();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadPayments() {
            try {
                setLoading(true);

                // Option 1: Query by events (faster for filtering)
                if (userAddress) {
                    const filter = contract.filters.ClaimPaymentCreated(
                        null,
                        userAddress
                    );
                    const events = await contract.queryFilter(filter);
                    
                    // Load full payment data for each event
                    const paymentPromises = events.map(event => 
                        contract.getClaimPayment(event.args.paymentId)
                    );
                    const paymentData = await Promise.all(paymentPromises);
                    
                    setPayments(paymentData.map(formatPayment));
                } else {
                    // Option 2: Load all payments
                    const totalCount = await contract.getTotalPayments();
                    const paymentPromises = [];
                    
                    for (let i = 0; i < totalCount; i++) {
                        paymentPromises.push(contract.getClaimPayment(i));
                    }
                    
                    const paymentData = await Promise.all(paymentPromises);
                    setPayments(paymentData.map(formatPayment));
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        if (contract) {
            loadPayments();
        }
    }, [contract, userAddress]);

    return { payments, loading, error };
}

// Helper function to format payment data
function formatPayment(payment: any) {
    return {
        id: Number(payment.id),
        payer: payment.payer,
        receiver: payment.receiver,
        usdAmount: Number(payment.usdAmount) / 100,
        cryptoFeedId: payment.cryptoFeedId,
        stopLossPrice: Number(payment.stopLossPrice),
        takeProfitPrice: Number(payment.takeProfitPrice),
        collateralAmount: payment.collateralAmount.toString(),
        createdAt: new Date(Number(payment.createdAt) * 1000),
        expiresAt: new Date(Number(payment.expiresAt) * 1000),
        executed: payment.executed,
        executedAt: payment.executedAt > 0 
            ? new Date(Number(payment.executedAt) * 1000) 
            : null,
        executedPrice: Number(payment.executedPrice),
        paidAmount: payment.paidAmount.toString()
    };
}
```

## Using the Hook in Components

```typescript
// components/MyPayments.tsx
import { usePayments } from '@/hooks/usePayments';
import { useWallet } from '@/hooks/useWallet';

export function MyPayments() {
    const { address } = useWallet();
    const { payments, loading, error } = usePayments(address);

    if (loading) return <div>Loading payments...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h2>My Payments ({payments.length})</h2>
            {payments.map(payment => (
                <PaymentCard key={payment.id} payment={payment} />
            ))}
        </div>
    );
}
```

## Real-Time Updates with Events

Listen for new payments in real-time:

```typescript
useEffect(() => {
    if (!contract) return;

    // Listen for new payments
    const onPaymentCreated = (paymentId, payer, receiver, ...args) => {
        console.log('New payment created:', paymentId);
        // Refresh payments list
        loadPayments();
    };

    // Listen for executions
    const onPaymentExecuted = (paymentId, executor, ...args) => {
        console.log('Payment executed:', paymentId);
        // Update payment status
        updatePaymentStatus(paymentId, 'executed');
    };

    contract.on('ClaimPaymentCreated', onPaymentCreated);
    contract.on('ClaimPaymentExecuted', onPaymentExecuted);

    // Cleanup
    return () => {
        contract.off('ClaimPaymentCreated', onPaymentCreated);
        contract.off('ClaimPaymentExecuted', onPaymentExecuted);
    };
}, [contract]);
```

## Query Performance Tips

### ✅ Best Practices

1. **Use events for filtering** - Faster than loading all payments
2. **Batch queries** - Use `Promise.all()` for parallel requests
3. **Cache results** - Store in state/context to avoid re-fetching
4. **Pagination** - Don't load all payments at once
5. **Indexed fields** - Use indexed event parameters for efficient filtering

### ⚠️ Avoid

1. Loading hundreds of payments sequentially
2. Querying every block for updates
3. Not caching results
4. Filtering in JavaScript instead of using event filters

## Next Steps

- [Explore available price feeds](./05-price-feeds-reference.md)
- [Read complete contract API](./06-contract-api-reference.md)
- [See example use cases](./07-examples-use-cases.md)
