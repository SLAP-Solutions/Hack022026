"use client";

import { useState } from "react";
import { useInvoicesStore } from "@/stores/useInvoicesStore";
import { useWallet } from "@/hooks/useWallet";
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
import { Loader2, CheckCircle2, AlertCircle, Bot } from "lucide-react";

interface CreateClaimModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ProcessingStatus = "idle" | "uploading" | "processing" | "success" | "error";

export function CreateInvoiceModal({ isOpen, onClose }: CreateClaimModalProps) {
    const { addInvoice } = useInvoicesStore();
    const { address } = useWallet();
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [claimantName, setClaimantName] = useState("");
    const [type, setType] = useState("");
    const [mode, setMode] = useState<"manual" | "upload">("manual");
    const [file, setFile] = useState<File | null>(null);
    
    // Agent processing state
    const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>("idle");
    const [agentResponse, setAgentResponse] = useState<string>("");
    const [processingError, setProcessingError] = useState<string>("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsLoading(true);
        setProcessingStatus("uploading");
        setProcessingError("");
        setAgentResponse("");

        const formData = new FormData();
        formData.append("file", file);

        try {
            setProcessingStatus("processing");
            
            // Call AI agent to process invoice
            const response = await fetch("/api/invoices/process", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || "Failed to process document");
            }

            const extractedData = result.data;
            
            // Store agent response for display
            if (result.agentResponse) {
                setAgentResponse(result.agentResponse);
            }

            // Populate form with AI-extracted data
            setTitle(extractedData.title || "");
            setDescription(extractedData.description || "");
            setClaimantName(extractedData.claimantName || "");
            setType(extractedData.type || "");

            setProcessingStatus("success");
            
            // After a short delay, switch to manual mode for review
            setTimeout(() => {
                setMode("manual");
                setFile(null);
                setProcessingStatus("idle");
            }, 2000);

        } catch (error) {
            console.error("AI Processing Error:", error);
            setProcessingStatus("error");
            setProcessingError(error instanceof Error ? error.message : "Unknown error occurred");
            
            // Fallback if AI fails: Use filename as title
            setTitle(file.name.split('.')[0]);
            setDescription("Uploaded document processing failed. Please enter details manually.");
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

        if (!address) {
            alert("Please connect your wallet to create an invoice");
            return;
        }

        try {
            setIsLoading(true);
            await addInvoice({
                title,
                description,
                claimantName,
                type,
                walletId: address
            });
            handleClose();
        } catch (error) {
            console.error(error);
            alert("Failed to create invoice");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        // Reset form
        setTitle("");
        setDescription("");
        setClaimantName("");
        setType("");
        setMode("manual");
        setFile(null);
        setProcessingStatus("idle");
        setAgentResponse("");
        setProcessingError("");
        onClose();
    };
    
    const handleRetry = () => {
        setProcessingStatus("idle");
        setProcessingError("");
        setMode("upload");
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
                        {/* Processing Status Display */}
                        {processingStatus !== "idle" && (
                            <div className={cn(
                                "rounded-lg p-4 border",
                                processingStatus === "uploading" && "bg-blue-50 border-blue-200",
                                processingStatus === "processing" && "bg-amber-50 border-amber-200",
                                processingStatus === "success" && "bg-green-50 border-green-200",
                                processingStatus === "error" && "bg-red-50 border-red-200"
                            )}>
                                <div className="flex items-start gap-3">
                                    {processingStatus === "uploading" && (
                                        <>
                                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin mt-0.5" />
                                            <div>
                                                <p className="font-medium text-blue-700">Uploading document...</p>
                                                <p className="text-sm text-blue-600">Sending file to AI agent</p>
                                            </div>
                                        </>
                                    )}
                                    {processingStatus === "processing" && (
                                        <>
                                            <Bot className="w-5 h-5 text-amber-500 animate-pulse mt-0.5" />
                                            <div>
                                                <p className="font-medium text-amber-700">AI Agent Processing...</p>
                                                <p className="text-sm text-amber-600">Extracting invoice details from document</p>
                                            </div>
                                        </>
                                    )}
                                    {processingStatus === "success" && (
                                        <>
                                            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-green-700">Processing Complete!</p>
                                                <p className="text-sm text-green-600">Review the extracted data below</p>
                                            </div>
                                        </>
                                    )}
                                    {processingStatus === "error" && (
                                        <>
                                            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="font-medium text-red-700">Processing Failed</p>
                                                <p className="text-sm text-red-600">{processingError}</p>
                                                <Button 
                                                    type="button" 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="mt-2"
                                                    onClick={handleRetry}
                                                >
                                                    Try Again
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                                
                                {/* Agent Response Preview */}
                                {agentResponse && processingStatus === "success" && (
                                    <div className="mt-3 pt-3 border-t border-green-200">
                                        <p className="text-xs font-medium text-green-700 mb-1">Agent Response:</p>
                                        <p className="text-xs text-green-600 line-clamp-3">{agentResponse}</p>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* File Upload Area */}
                        {processingStatus === "idle" && (
                            <div 
                                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:bg-muted/50 transition-colors cursor-pointer" 
                                onClick={() => document.getElementById('file-upload')?.click()}
                            >
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
                                        {file ? "Ready to process with AI agent" : "PDF, PNG, or JPG (max 10MB)"}
                                    </p>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={!file || isLoading || processingStatus !== "idle"}
                                className="gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Bot className="w-4 h-4" />
                                        Process with AI
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
