"use client";

import { useState, useEffect } from "react";
import { useContactModal } from "@/stores/useContactModal";
import { useContactsStore } from "@/stores/useContactsStore";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ContactModal() {
    const { isOpen, closeModal, contactId } = useContactModal();
    const { addContact, updateContact, getContact } = useContactsStore();
    const [name, setName] = useState("");
    const [receiverAddress, setReceiverAddress] = useState("");

    const isEditing = !!contactId;

    // Load contact data when editing
    useEffect(() => {
        if (isEditing && contactId) {
            const contact = getContact(contactId);
            if (contact) {
                setName(contact.name);
                setReceiverAddress(contact.receiverAddress);
            }
        } else {
            setName("");
            setReceiverAddress("");
        }
    }, [contactId, isEditing, getContact]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!name || !receiverAddress) {
            alert("Please fill in all fields");
            return;
        }

        // Validate Ethereum address format (basic validation)
        if (!/^0x[a-fA-F0-9]{40}$/.test(receiverAddress)) {
            alert("Please enter a valid Ethereum address (0x followed by 40 hex characters)");
            return;
        }

        if (isEditing && contactId) {
            updateContact(contactId, { name, receiverAddress });
        } else {
            addContact({ name, receiverAddress });
        }

        handleClose();
    };

    const handleClose = () => {
        setName("");
        setReceiverAddress("");
        closeModal();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                        {isEditing ? "Edit Contact" : "Create New Contact"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update the contact details below."
                            : "Add a new contact with their name and receiver address."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Name Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g., John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        {/* Receiver Address Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="receiverAddress">Receiver Address</Label>
                            <Input
                                id="receiverAddress"
                                placeholder="0x..."
                                value={receiverAddress}
                                onChange={(e) => setReceiverAddress(e.target.value)}
                                required
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter a valid Ethereum address (0x followed by 40 hex characters)
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                        >
                            {isEditing ? "Update Contact" : "Create Contact"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
