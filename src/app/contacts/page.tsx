"use client";

import { useState, useEffect } from "react";
import { useContactsStore } from "@/stores/useContactsStore";
import { useContactModal } from "@/stores/useContactModal";
import { ContactModal } from "@/components/modals/ContactModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, User, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CopyAddressButton } from "@/components/ui/CopyAddressButton";



export default function ContactsPage() {
    const { contacts, isLoading, fetchContacts, deleteContact } = useContactsStore();
    const { openModal } = useContactModal();
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [contactToDelete, setContactToDelete] = useState<string | null>(null);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    const filteredContacts = contacts.filter((contact) =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.receiverAddress.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDeleteClick = (id: string) => {
        setContactToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (contactToDelete) {
            deleteContact(contactToDelete);
            setContactToDelete(null);
        }
        setDeleteDialogOpen(false);
    };



    return (
        <div className="flex flex-col h-full">
            <PageHeader title="Contacts">
                <Button
                    onClick={() => openModal()}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    size="sm"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Contact
                </Button>
            </PageHeader>

            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="px-6 py-2 flex items-center gap-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search contacts by name or address..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-8"
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex justify-center items-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}

                    {/* Contacts Grid */}
                    {!isLoading && filteredContacts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredContacts.map((contact) => (
                                <Card key={contact.id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                                                    <User className="h-6 w-6 text-primary-foreground" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{contact.name}</CardTitle>
                                                    <CardDescription className="text-xs mt-1">
                                                        Added {new Date(contact.createdAt).toLocaleDateString()}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Receiver Address</p>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-[10px] font-mono bg-muted px-2 py-1 rounded flex-1 break-all">
                                                        {contact.receiverAddress}
                                                    </code>
                                                    <CopyAddressButton address={contact.receiverAddress} />
                                                </div>
                                            </div>

                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openModal(contact.id)}
                                                    className="flex-1"
                                                >
                                                    <Edit className="mr-2 h-3 w-3" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDeleteClick(contact.id)}
                                                    className="flex-1 text-destructive hover:bg-destructive hover:text-white"
                                                >
                                                    <Trash2 className="mr-2 h-3 w-3" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="h-10 w-10 text-primary-foreground" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">
                                {searchQuery ? "No contacts found" : "No contacts yet"}
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                {searchQuery
                                    ? "Try adjusting your search query"
                                    : "Get started by adding your first contact"}
                            </p>
                            {!searchQuery && (
                                <Button
                                    onClick={() => openModal()}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Your First Contact
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Contact Modal */}
                    <ContactModal />

                    {/* Delete Confirmation Dialog */}
                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the contact
                                    from your list.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeleteConfirm}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </div>
    );
}
