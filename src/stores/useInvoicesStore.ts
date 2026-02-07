import { create } from 'zustand';
import { Invoice, CreateInvoiceInput } from '@/types/invoice';
import { Payment } from '@/types/payment';

interface InvoicesStore {
    invoices: Invoice[];
    isLoading: boolean;
    error: string | null;
    fetchInvoices: (walletId?: string) => Promise<void>;
    addInvoice: (invoice: CreateInvoiceInput) => Promise<void>;
    getInvoice: (id: string) => Invoice | undefined;
    addPayment: (invoiceId: string, payment: Payment) => Promise<void>;
    updatePaymentStatus: (invoiceId: string, paymentId: string | bigint, status: 'pending' | 'committed' | 'executed' | 'expired') => Promise<void>;
}

export const useInvoicesStore = create<InvoicesStore>((set, get) => ({
    invoices: [],
    isLoading: false,
    error: null,

    fetchInvoices: async (walletId?: string) => {
        set({ isLoading: true, error: null });
        try {
            const url = walletId ? `/api/invoices?walletId=${walletId}` : '/api/invoices';
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch invoices');

            const text = await response.text();

            const reviver = (key: string, value: any) => {
                const bigIntKeys = ['id', 'collateralAmount', 'createdAt', 'expiresAt', 'executedAt', 'executedPrice', 'paidAmount'];
                if (bigIntKeys.includes(key) && typeof value === 'string' && /^\d+$/.test(value)) {
                    return BigInt(value);
                }
                return value;
            };

            const invoices = JSON.parse(text, reviver);
            set({ invoices, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            console.error('Error fetching invoices:', error);
        }
    },

    getInvoice: (id: string) => {
        return get().invoices.find(inv => inv.id === id);
    },

    addInvoice: async (invoiceInput: CreateInvoiceInput) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoiceInput),
            });

            if (!response.ok) throw new Error('Failed to create invoice');

            const newInvoice = await response.json();

            set((state) => ({
                invoices: [...state.invoices, newInvoice],
                isLoading: false,
            }));
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            console.error('Error creating invoice:', error);
            throw error;
        }
    },

    addPayment: async (invoiceId: string, payment: Payment) => {
        set({ isLoading: true, error: null });
        try {
            const invoice = get().invoices.find(inv => inv.id === invoiceId);
            if (!invoice) throw new Error('Invoice not found');

            const updatedInvoice = {
                ...invoice,
                payments: [...(invoice.payments || []), payment],
            };

            const replacer = (key: string, value: any) => {
                if (typeof value === 'bigint') {
                    return value.toString();
                }
                return value;
            };

            const response = await fetch(`/api/invoices/${invoiceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedInvoice, replacer),
            });

            if (!response.ok) throw new Error('Failed to update invoice with new payment');

            const result = await response.json();

            set((state) => ({
                invoices: state.invoices.map((inv) =>
                    inv.id === invoiceId ? result : inv
                ),
                isLoading: false,
            }));
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            console.error('Error adding payment:', error);
            throw error;
        }
    },

    updatePaymentStatus: async (invoiceId: string, paymentId: string | bigint, status: 'pending' | 'committed' | 'executed' | 'expired') => {
        set({ isLoading: true, error: null });
        try {
            const invoice = get().invoices.find(inv => inv.id === invoiceId);
            if (!invoice) throw new Error('Invoice not found');

            const updatedPayments = invoice.payments.map((p) => {
                if (p.id.toString() === paymentId.toString()) {
                    return {
                        ...p,
                        status,
                        executedAt: status === 'executed' ? BigInt(Math.floor(Date.now() / 1000)) : p.executedAt
                    };
                }
                return p;
            });

            const updatedInvoice = {
                ...invoice,
                payments: updatedPayments,
            };

            const replacer = (key: string, value: any) => {
                if (typeof value === 'bigint') {
                    return value.toString();
                }
                return value;
            };

            const response = await fetch(`/api/invoices/${invoiceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedInvoice, replacer),
            });

            if (!response.ok) throw new Error('Failed to update payment status');

            const result = await response.json();

            set((state) => ({
                invoices: state.invoices.map((inv) =>
                    inv.id === invoiceId ? result : inv
                ),
                isLoading: false,
            }));
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            console.error('Error updating payment status:', error);
            throw error;
        }
    },
}));

// Legacy export for backward compatibility
export const useClaimsStore = useInvoicesStore;
