/**
 * Payment model - matches Solidity PaymentOrder struct
 * Represents a single payment within an insurance claim
 */
export interface Payment {
    id: bigint;                     // Unique payment identifier
    payer: string;                  // Insurance company creating the payment (address)
    receiver: string;               // Beneficiary receiving the payment (address)
    usdAmount: number;              // USD value to pay (stored as decimal: $1000.50 = 1000.50)
    cryptoFeedId: string;           // FTSO feed ID for payment crypto (e.g., BTC/USD) - bytes21 as hex string
    stopLossPrice: number;          // Lower limit: execute if price drops to this (stored as decimal)
    takeProfitPrice: number;        // Upper limit: execute when price reaches this (stored as decimal)
    collateralAmount: bigint;       // Native FLR locked as collateral & gas reserve
    createdAt: bigint;              // Block timestamp when payment was created
    expiresAt: bigint;              // Deadline timestamp - payment cannot execute after this
    executed: boolean;              // Whether payment has been completed
    executedAt: bigint;             // Block timestamp when payment was executed (0 if not executed)
    executedPrice: bigint;          // Crypto price at execution time (0 if not executed)
    paidAmount: bigint;             // Actual crypto amount paid to receiver (0 if not executed)
    originalAmount?: number;        // Original USD amount (for comparison)
}

/**
 * Payment status derived from the payment data
 */
export type PaymentStatus = "pending" | "executed" | "expired";

/**
 * Helper type for creating new payments (before blockchain submission)
 */
export interface CreatePaymentInput {
    receiver: string;
    usdAmount: number;              // In dollars (will be converted to cents)
    cryptoFeedId: string;
    stopLossPrice: number;          // In USD
    takeProfitPrice: number;        // In USD
    collateralAmount: string;       // In FLR (as string for parseEther)
    expiresAt: Date | number;       // Can accept Date or timestamp
}

/**
 * Display-friendly payment data (with converted values)
 */
export interface PaymentDisplay {
    id: string;
    payer: string;
    receiver: string;
    usdAmount: number;              // Converted from cents to dollars
    cryptoSymbol: string;           // e.g., "BTC", "ETH"
    stopLossPrice: number;          // Converted to readable number
    takeProfitPrice: number;        // Converted to readable number
    collateralAmount: string;       // Formatted FLR amount
    createdAt: Date;
    expiresAt: Date;
    status: PaymentStatus;
    executedAt?: Date;
    executedPrice?: number;
    paidAmount?: string;            // Formatted crypto amount
}
