import { create } from 'zustand';
import { Claim, CreateClaimInput } from '@/types/claim';
import { Payment } from '@/types/payment';

interface ClaimsStore {
    claims: Claim[];
    isLoading: boolean;
    error: string | null;
    fetchClaims: () => Promise<void>;
    addClaim: (claim: CreateClaimInput) => Promise<void>;
    getClaim: (id: string) => Claim | undefined;
    addPayment: (claimId: string, payment: Payment) => Promise<void>;
    updatePaymentStatus: (claimId: string, paymentId: string | bigint, status: 'pending' | 'committed' | 'executed' | 'expired') => Promise<void>;
}

export const useClaimsStore = create<ClaimsStore>((set, get) => ({
    claims: [],
    isLoading: false,
    error: null,

    fetchClaims: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/claims');
            if (!response.ok) throw new Error('Failed to fetch claims');

            const text = await response.text();

            const reviver = (key: string, value: any) => {
                const bigIntKeys = ['id', 'collateralAmount', 'createdAt', 'expiresAt', 'executedAt', 'executedPrice', 'paidAmount'];
                if (bigIntKeys.includes(key) && typeof value === 'string' && /^\d+$/.test(value)) {
                    return BigInt(value);
                }
                return value;
            };

            const claims = JSON.parse(text, reviver);
            set({ claims, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            console.error('Error fetching claims:', error);
        }
    },

    getClaim: (id: string) => {
        return get().claims.find(c => c.id === id);
    },

    addClaim: async (claimInput: CreateClaimInput) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/claims', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(claimInput),
            });

            if (!response.ok) throw new Error('Failed to create claim');

            const newClaim = await response.json();

            set((state) => ({
                claims: [...state.claims, newClaim],
                isLoading: false,
            }));
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            console.error('Error creating claim:', error);
            throw error;
        }
    },

    addPayment: async (claimId: string, payment: Payment) => {
        set({ isLoading: true, error: null });
        try {
            const claim = get().claims.find(c => c.id === claimId);
            if (!claim) throw new Error('Claim not found');

            const updatedClaim = {
                ...claim,
                payments: [...(claim.payments || []), payment], // Ensure payments array exists
            };

            const replacer = (key: string, value: any) => {
                if (typeof value === 'bigint') {
                    return value.toString();
                }
                return value;
            };

            const response = await fetch(`/api/claims/${claimId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedClaim, replacer),
            });

            if (!response.ok) throw new Error('Failed to update claim with new payment');

            const result = await response.json();

            set((state) => ({
                claims: state.claims.map((c) =>
                    c.id === claimId ? result : c
                ),
                isLoading: false,
            }));
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            console.error('Error adding payment:', error);
            throw error;
        }
    },

    updatePaymentStatus: async (claimId: string, paymentId: string | bigint, status: 'pending' | 'committed' | 'executed' | 'expired') => {
        set({ isLoading: true, error: null });
        try {
            const claim = get().claims.find(c => c.id === claimId);
            if (!claim) throw new Error('Claim not found');

            const updatedPayments = claim.payments.map((p) => {
                if (p.id.toString() === paymentId.toString()) {
                    return {
                        ...p,
                        status,
                        executedAt: status === 'executed' ? BigInt(Math.floor(Date.now() / 1000)) : p.executedAt
                    };
                }
                return p;
            });

            const updatedClaim = {
                ...claim,
                payments: updatedPayments,
            };

            // Since Payment struct has BigInt, executeAt might be serialized as string or cause JSON error.
            // JSON.stringify handles BigInt? No, it throws TypeError.
            // We need to handle BigInt serialization.
            // A simple replacer function can convert BigInt to string.

            const replacer = (key: string, value: any) => {
                if (typeof value === 'bigint') {
                    return value.toString();
                }
                return value;
            };

            const response = await fetch(`/api/claims/${claimId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedClaim, replacer),
            });

            if (!response.ok) throw new Error('Failed to update payment status');

            const result = await response.json();

            set((state) => ({
                claims: state.claims.map((c) =>
                    c.id === claimId ? result : c
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
