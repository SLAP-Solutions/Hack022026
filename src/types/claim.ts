import { Payment } from './payment';

/**
 * Claim model - represents an insurance claim with associated payments
 */
export interface Claim {
    id: string;
    title: string;
    description: string;
    claimantName: string;
    lineOfBusiness: string;         // e.g., "Auto", "Health", "Property"
    status: ClaimStatus;
    totalCost: number;              // Sum of all payment costs in USD
    dateCreated: Date | string;     // When the claim was created
    dateSettled?: Date | string;    // When the claim was settled (optional, only if settled)
    payments: Payment[];            // List of associated payments
}

/**
 * Claim status types
 */
export type ClaimStatus = "pending" | "approved" | "rejected" | "processing" | "settled";

/**
 * Display-friendly claim data (for UI)
 */
export interface ClaimDisplay extends Omit<Claim, 'dateCreated' | 'dateSettled' | 'payments'> {
    dateCreated: string;            // Formatted date string
    dateSettled?: string;           // Formatted date string
    paymentCount: number;           // Number of payments
    executedPayments: number;       // Number of executed payments
}

/**
 * Input for creating a new claim
 */
export interface CreateClaimInput {
    title: string;
    description: string;
    claimantName: string;
    lineOfBusiness: string;
}

/**
 * Claim summary for list views
 */
export interface ClaimSummary {
    id: string;
    title: string;
    claimantName: string;
    status: ClaimStatus;
    totalCost: number;
    dateCreated: string;
    paymentCount: number;
}