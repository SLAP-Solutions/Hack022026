import { create } from 'zustand';

interface ClaimModalStore {
    isOpen: boolean;
    openModal: () => void;
    closeModal: () => void;
}

export const useClaimModal = create<ClaimModalStore>((set) => ({
    isOpen: false,
    openModal: () => set({ isOpen: true }),
    closeModal: () => set({ isOpen: false }),
}));
