import { create } from 'zustand';
import { Contact } from '@/types/contact';

interface ContactsStore {
    contacts: Contact[];
    isLoading: boolean;
    error: string | null;
    fetchContacts: () => Promise<void>;
    addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateContact: (id: string, contact: Partial<Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
    deleteContact: (id: string) => Promise<void>;
    getContact: (id: string) => Contact | undefined;
}

export const useContactsStore = create<ContactsStore>((set, get) => ({
    contacts: [],
    isLoading: false,
    error: null,

    fetchContacts: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/contacts');
            if (!response.ok) throw new Error('Failed to fetch contacts');
            const contacts = await response.json();
            set({ contacts, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            console.error('Error fetching contacts:', error);
        }
    },

    addContact: async (contact) => {
        set({ isLoading: true, error: null });
        try {
            // Check for duplicate receiver address
            const existingContact = get().contacts.find(
                c => c.receiverAddress.toLowerCase() === contact.receiverAddress.toLowerCase()
            );
            
            if (existingContact) {
                throw new Error(`A contact with this address already exists: ${existingContact.name}`);
            }

            const newContact = {
                ...contact,
                id: `CNT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            };

            const response = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newContact),
            });

            if (!response.ok) throw new Error('Failed to create contact');

            const createdContact = await response.json();
            set((state) => ({
                contacts: [...state.contacts, createdContact],
                isLoading: false,
            }));
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            console.error('Error creating contact:', error);
            throw error;
        }
    },

    updateContact: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
            const existingContact = get().contacts.find((c) => c.id === id);
            if (!existingContact) throw new Error('Contact not found');

            // If updating receiver address, check for duplicates
            if (updates.receiverAddress) {
                const duplicate = get().contacts.find(
                    c => c.id !== id && 
                    c.receiverAddress.toLowerCase() === updates.receiverAddress!.toLowerCase()
                );
                
                if (duplicate) {
                    throw new Error(`A contact with this address already exists: ${duplicate.name}`);
                }
            }

            const updatedContact = {
                ...existingContact,
                ...updates,
            };

            const response = await fetch(`/api/contacts/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedContact),
            });

            if (!response.ok) throw new Error('Failed to update contact');

            const result = await response.json();
            set((state) => ({
                contacts: state.contacts.map((contact) =>
                    contact.id === id ? result : contact
                ),
                isLoading: false,
            }));
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            console.error('Error updating contact:', error);
            throw error;
        }
    },

    deleteContact: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`/api/contacts/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete contact');

            set((state) => ({
                contacts: state.contacts.filter((contact) => contact.id !== id),
                isLoading: false,
            }));
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            console.error('Error deleting contact:', error);
            throw error;
        }
    },

    getContact: (id) => {
        return get().contacts.find((c) => c.id === id);
    },
}));
