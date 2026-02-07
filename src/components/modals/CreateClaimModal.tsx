"use client";

import { useState } from "react";
import { useClaimsStore } from "@/stores/useClaimsStore";
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
import { Textarea } from "@/components/ui/textarea";

interface CreateClaimModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateClaimModal({ isOpen, onClose }: CreateClaimModalProps) {
    const { addClaim } = useClaimsStore();
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [claimantName, setClaimantName] = useState("");
    const [lineOfBusiness, setLineOfBusiness] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !description || !claimantName || !lineOfBusiness) {
            alert("Please fill in all fields");
            return;
        }

        try {
            setIsLoading(true);
            await addClaim({
                title,
                description,
                claimantName,
                lineOfBusiness
            });
            handleClose();
        } catch (error) {
            console.error(error);
            alert("Failed to create claim");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        // Reset form
        setTitle("");
        setDescription("");
        setClaimantName("");
        setLineOfBusiness("");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Create New Claim</DialogTitle>
                    <DialogDescription>
                        Enter the details for the new insurance claim.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Claim Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Vehicle Accident"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="claimantName">Claimant Name</Label>
                        <Input
                            id="claimantName"
                            placeholder="e.g. John Doe"
                            value={claimantName}
                            onChange={(e) => setClaimantName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="lineOfBusiness">Line of Business</Label>
                        <Input
                            id="lineOfBusiness"
                            placeholder="e.g. Auto, Home, Health"
                            value={lineOfBusiness}
                            onChange={(e) => setLineOfBusiness(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Detailed description of the claim..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            className="min-h-[100px]"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create Claim"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
