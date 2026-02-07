import { create } from 'zustand';
import { Claim } from '@/types/claim';
import { Payment } from '@/types/payment';
import claimsData from '@/data/claims.json';

interface ClaimsStore {
    claims: Claim[];
    getClaim: (id: string) => Claim | undefined;
    addPayment: (claimId: string, payment: Payment) => void;
    updatePaymentStatus: (claimId: string, paymentId: string | bigint, status: 'pending' | 'executed' | 'expired') => void;
}

export const useClaimsStore = create<ClaimsStore>((set, get) => ({
    // Initialize with data from JSON, casting to Claim[] since JSON imports are sometimes loose
    claims: claimsData as unknown as Claim[],

    getClaim: (id: string) => {
        return get().claims.find(c => c.id === id);
    },

    addPayment: (claimId: string, payment: Payment) => {
        set((state) => ({
            claims: state.claims.map((claim) => {
                if (claim.id === claimId) {
                    return {
                        ...claim,
                        payments: [...claim.payments, payment],
                    };
                }
                return claim;
            }),
        }));
    },

    updatePaymentStatus: (claimId: string, paymentId: string | bigint, status: 'pending' | 'executed' | 'expired') => {
        set((state) => ({
            claims: state.claims.map((claim) => {
                if (claim.id === claimId) {
                    return {
                        ...claim,
                        payments: claim.payments.map((p) => {
                            if (p.id.toString() === paymentId.toString()) {
                                return {
                                    ...p,
                                    status,
                                    executedAt: status === 'executed' ? BigInt(Math.floor(Date.now() / 1000)) : p.executedAt
                                };
                            }
                            return p;
                        })
                    };
                }
                return claim;
            }),
        }));
    },
}));
