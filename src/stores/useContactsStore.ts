import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Contact } from '@/types/contact';
import contactsData from '@/data/contacts.json';

interface ContactsStore {
    contacts: Contact[];
    addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateContact: (id: string, contact: Partial<Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>>) => void;
    deleteContact: (id: string) => void;
    getContact: (id: string) => Contact | undefined;
}

export const useContactsStore = create<ContactsStore>()(
    persist(
        (set, get) => ({
            contacts: contactsData as Contact[],

            addContact: (contact) => {
                const newContact: Contact = {
                    ...contact,
                    id: `CNT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                set((state) => ({
                    contacts: [...state.contacts, newContact],
                }));
            },

            updateContact: (id, updates) => {
                set((state) => ({
                    contacts: state.contacts.map((contact) =>
                        contact.id === id
                            ? { ...contact, ...updates, updatedAt: new Date().toISOString() }
                            : contact
                    ),
                }));
            },

            deleteContact: (id) => {
                set((state) => ({
                    contacts: state.contacts.filter((contact) => contact.id !== id),
                }));
            },

            getContact: (id) => {
                return get().contacts.find((c) => c.id === id);
            },
        }),
        {
            name: 'contacts-storage',
        }
    )
);
