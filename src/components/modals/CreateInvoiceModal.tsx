"use client";

import { useState } from "react";
import { useClaimsStore } from "@/stores/useClaimsStore";
import { cn } from "@/lib/utils";
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

export function CreateInvoiceModal({ isOpen, onClose }: CreateClaimModalProps) {
    const { addClaim } = useClaimsStore();
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [claimantName, setClaimantName] = useState("");
    const [type, setType] = useState("");
    const [mode, setMode] = useState<"manual" | "upload">("manual");
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsLoading(true);

        const formData = new FormData();
        formData.append("file", file);

        try {
            // Call AI agent to process invoice
            const response = await fetch("/api/invoices/process", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to process document");
            }

            const result = await response.json();
            const extractedData = result.data;

            // Populate form with AI-extracted data
            setTitle(extractedData.title || "");
            setDescription(extractedData.description || "");
            setClaimantName(extractedData.claimantName || "");
            setType(extractedData.type || "");

            // Switch to manual mode so user can review/edit
            setMode("manual");
            // Clear file so they can upload again if needed or proceed
            setFile(null);

        } catch (error) {
            console.error("AI Processing Error:", error);
            // Fallback if AI fails: Use filename as title
            setTitle(file.name.split('.')[0]);
            setDescription("Uploaded document processing failed. Please enter details manually.");
            setMode("manual");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !description || !claimantName || !type) {
            alert("Please fill in all fields");
            return;
        }

        try {
            setIsLoading(true);
            await addClaim({
                title,
                description,
                claimantName,
                type
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
        setClaimantName("");
        setType("");
        setMode("manual");
        setFile(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold font-serif">Create New Invoice</DialogTitle>
                    <DialogDescription>
                        Choose how you want to create the invoice.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid w-full grid-cols-2 bg-muted p-1 rounded-lg mb-4">
                    <button
                        type="button"
                        onClick={() => setMode("manual")}
                        className={cn(
                            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            mode === "manual"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                        )}
                    >
                        Manual Entry
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("upload")}
                        className={cn(
                            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            mode === "upload"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                        )}
                    >
                        Upload Document
                    </button>
                </div>

                {mode === "manual" ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Invoice Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g. Vehicle Accident"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="claimantName">Client Name</Label>
                            <Input
                                id="claimantName"
                                placeholder="e.g. John Doe"
                                value={claimantName}
                                onChange={(e) => setClaimantName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Input
                                id="type"
                                placeholder="e.g. Auto, Home, Health"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Detailed description of the invoice..."
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
                                {isLoading ? "Creating..." : "Create Invoice"}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <form onSubmit={handleUploadSubmit} className="space-y-6">
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => document.getElementById('file-upload')?.click()}>
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={handleFileChange}
                            />
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-4xl">📄</span>
                                <h3 className="font-semibold text-lg">
                                    {file ? file.name : "Click to upload document"}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {file ? "Ready to process" : "PDF, PNG, or JPG (max 10MB)"}
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={!file || isLoading}>
                                {isLoading ? "Processing..." : "Process & Create"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
