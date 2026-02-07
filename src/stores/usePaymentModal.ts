import { create } from 'zustand';

interface PaymentModalStore {
    isOpen: boolean;
    claimId: string | null;
    openModal: (claimId: string) => void;
    closeModal: () => void;
}

export const usePaymentModal = create<PaymentModalStore>((set) => ({
    isOpen: false,
    claimId: null,
    openModal: (claimId: string) => set({ isOpen: true, claimId }),
    closeModal: () => set({ isOpen: false, claimId: null }),
}));
