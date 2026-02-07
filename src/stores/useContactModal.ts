import { create } from 'zustand';

interface ContactModalStore {
    isOpen: boolean;
    contactId: string | null;
    openModal: (contactId?: string) => void;
    closeModal: () => void;
}

export const useContactModal = create<ContactModalStore>((set) => ({
    isOpen: false,
    contactId: null,
    openModal: (contactId) => set({ isOpen: true, contactId: contactId || null }),
    closeModal: () => set({ isOpen: false, contactId: null }),
}));
