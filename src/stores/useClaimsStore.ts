import { create } from 'zustand';
import { Claim } from '@/types/claim';
import { Payment } from '@/types/payment';
import claimsData from '@/data/claims.json';

interface ClaimsStore {
    claims: Claim[];
    getClaim: (id: string) => Claim | undefined;
    addPayment: (claimId: string, payment: Payment) => void;
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
                        // Update total cost if needed, though for now just adding to list is fine
                        // totalCost: claim.totalCost + Number(payment.usdAmount) / 100 
                    };
                }
                return claim;
            }),
        }));
    },
}));
