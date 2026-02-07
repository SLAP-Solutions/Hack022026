import { Payment } from './payment';

/**
 * Invoice model - represents an invoice with associated payments
 */
export interface Invoice {
    id: string;
    title: string;
    description: string;
    claimantName: string;  // Consider renaming to clientName in future
    type: string;         // e.g., "Auto", "Health", "Property"
    walletId?: string;    // The wallet ID this invoice belongs to
    status: InvoiceStatus;
    totalCost: number;              // Sum of all payment costs in USD
    dateCreated: Date | string;     // When the invoice was created
    dateSettled?: Date | string;    // When the invoice was settled (optional, only if settled)
    payments: Payment[];            // List of associated payments
}

/**
 * Invoice status types
 */
export type InvoiceStatus = "pending" | "approved" | "rejected" | "processing" | "settled";

/**
 * Display-friendly invoice data (for UI)
 */
export interface InvoiceDisplay extends Omit<Invoice, 'dateCreated' | 'dateSettled' | 'payments'> {
    dateCreated: string;            // Formatted date string
    dateSettled?: string;           // Formatted date string
    paymentCount: number;           // Number of payments
    executedPayments: number;       // Number of executed payments
}

/**
 * Input for creating a new invoice
 */
export interface CreateInvoiceInput {
    title: string;
    description: string;
    claimantName: string;  // Consider renaming to clientName in future
    type: string;
    walletId: string;
}

/**
 * Invoice summary for list views
 */
export interface InvoiceSummary {
    id: string;
    title: string;
    claimantName: string;
    status: InvoiceStatus;
    totalCost: number;
    dateCreated: string;
    paymentCount: number;
}
