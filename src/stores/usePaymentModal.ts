import { create } from 'zustand';

interface PaymentModalStore {
    isOpen: boolean;
    invoiceId: string | null;
    openModal: (invoiceId: string) => void;
    closeModal: () => void;
    // Backward compatibility
    claimId: string | null;
}

export const usePaymentModal = create<PaymentModalStore>((set) => ({
    isOpen: false,
    invoiceId: null,
    claimId: null, // Deprecated, kept for backward compatibility
    openModal: (invoiceId: string) => set({ isOpen: true, invoiceId, claimId: invoiceId }),
    closeModal: () => set({ isOpen: false, invoiceId: null, claimId: null }),
}));
