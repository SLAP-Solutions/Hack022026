"use client";

import { useState, useRef } from "react";
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
import { Loader2, CheckCircle2, AlertCircle, Bot, ArrowRight } from "lucide-react";

interface CreateClaimModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ProcessingStatus = "idle" | "uploading" | "processing" | "success" | "error";

interface StreamEvent {
    type: "text" | "agent" | "start" | "done" | "error";
    data: Record<string, unknown>;
}

export function CreateInvoiceModal({ isOpen, onClose }: CreateClaimModalProps) {
    const { addInvoice } = useInvoicesStore();
    const { address } = useWallet();
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [claimantName, setClaimantName] = useState("");
    const [type, setType] = useState("");
    const [dateCreated, setDateCreated] = useState("");
    const [mode, setMode] = useState<"manual" | "upload">("manual");
    const [file, setFile] = useState<File | null>(null);

    // Agent processing state
    const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>("idle");
    const [agentResponse, setAgentResponse] = useState<string>("");
    const [streamingText, setStreamingText] = useState<string>("");
    const [processingError, setProcessingError] = useState<string>("");
    
    const [currentAgent, setCurrentAgent] = useState<string>("");
    const [agentHistory, setAgentHistory] = useState<string[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    // Parse SSE events from the stream
    const parseSSE = (chunk: string): StreamEvent[] => {
        const events: StreamEvent[] = [];
        const lines = chunk.split('\n');
        let currentEvent: { type?: string; data?: string } = {};

        for (const line of lines) {
            if (line.startsWith('event: ')) {
                currentEvent.type = line.slice(7);
            } else if (line.startsWith('data: ')) {
                currentEvent.data = line.slice(6);
            } else if (line === '' && currentEvent.type && currentEvent.data) {
                try {
                    events.push({
                        type: currentEvent.type as StreamEvent["type"],
                        data: JSON.parse(currentEvent.data)
                    });
                } catch {
                    // Skip malformed JSON
                }
                currentEvent = {};
            }
        }
        return events;
    };

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        if (!address) {
            alert("Please connect your wallet to process invoices");
            return;
        }

        setIsLoading(true);
        setProcessingStatus("uploading");
        setProcessingError("");
        setAgentResponse("");
        setStreamingText("");
        setCurrentAgent("");
        setAgentHistory([]);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("walletId", address);

        try {
            setProcessingStatus("processing");

            // Call AI agent with streaming
            const response = await fetch("/api/invoices/process", {
                method: "POST",
                body: formData,
                headers: {
                    "Accept": "text/event-stream",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to connect to AI agent");
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("No response body");
            }

            const decoder = new TextDecoder();
            let fullText = "";
            let finalData: Record<string, unknown> | null = null;

            // Read the stream
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const events = parseSSE(chunk);

                for (const event of events) {
                    switch (event.type) {
                        case "start":
                            setCurrentAgent("workflow");
                            break;
                        case "text":
                            if (event.data.content) {
                                fullText += event.data.content as string;
                                setStreamingText(fullText);
                            }
                            break;
                        case "agent":
                            // Track agent switches
                            setCurrentAgent(event.data.to as string);
                            setAgentHistory(prev => [...prev, event.data.to as string]);
                            break;
                        case "done":
                            finalData = event.data;
                            break;
                        case "error":
                            throw new Error(event.data.error as string || "Stream error");
                    }
                }
            }

            // Process final result
            if (finalData) {
                setAgentResponse(finalData.response as string || fullText);
                
                // Parse the response to extract data (you may want to improve this)
                const extractedData = parseAgentResponse(finalData.response as string || fullText, file.name);
                setTitle(extractedData.title || "");
                setDescription(extractedData.description || "");
                setClaimantName(extractedData.claimantName || "");
                setType(extractedData.type || "");
            }

            setProcessingStatus("success");

            // After a short delay, switch to manual mode for review
            setTimeout(() => {
                setMode("manual");
                setFile(null);
                setProcessingStatus("idle");
                setStreamingText("");
                setAgentHistory([]);
            }, 3000);

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

    // Helper function to parse agent response into structured data
    const parseAgentResponse = (response: string, fileName: string) => {
        let title = fileName.split('.')[0] || "Invoice";
        let description = "Extracted from uploaded document";
        let claimantName = "";
        let type = "General";

        if (!response) {
            return { title, description, claimantName, type };
        }

        // Try to extract client/claimant name
        const clientMatch = response.match(/client[:\s]+([A-Za-z\s]+?)(?:\.|,|\n|$)/i) ||
                            response.match(/claimant[:\s]+([A-Za-z\s]+?)(?:\.|,|\n|$)/i) ||
                            response.match(/name[:\s]+([A-Za-z\s]+?)(?:\.|,|\n|$)/i);
        if (clientMatch) {
            claimantName = clientMatch[1].trim();
        }

        // Try to extract type
        const typeMatch = response.match(/type[:\s]+([A-Za-z\s]+?)(?:\.|,|\n|$)/i) ||
                          response.match(/category[:\s]+([A-Za-z\s]+?)(?:\.|,|\n|$)/i);
        if (typeMatch) {
            type = typeMatch[1].trim();
        } else if (response.toLowerCase().includes("medical") || response.toLowerCase().includes("health")) {
            type = "Health";
        } else if (response.toLowerCase().includes("auto") || response.toLowerCase().includes("vehicle")) {
            type = "Auto";
        } else if (response.toLowerCase().includes("home") || response.toLowerCase().includes("property")) {
            type = "Home";
        }

        // Try to extract title
        const titleMatch = response.match(/title[:\s]+([^\n]+?)(?:\.|,|\n|$)/i) ||
                           response.match(/invoice for[:\s]+([^\n]+?)(?:\.|,|\n|$)/i);
        if (titleMatch) {
            title = titleMatch[1].trim();
        } else {
            title = `${type} Invoice`;
        }

        // Use the full response as description if it's reasonable length
        if (response.length < 500) {
            description = response;
        } else {
            const summaryMatch = response.match(/summary[:\s]+([^\n]+)/i) ||
                                response.match(/description[:\s]+([^\n]+)/i);
            if (summaryMatch) {
                description = summaryMatch[1].trim();
            }
        }

        return { title, description, claimantName, type };
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
                walletId: address,
                ...(dateCreated && { dateCreated })
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
        setDateCreated("");
        setMode("manual");
        setFile(null);
        setProcessingStatus("idle");
        setAgentResponse("");
        setStreamingText("");
        setProcessingError("");
        onClose();
    };

    const handleRetry = () => {
        setProcessingStatus("idle");
        setProcessingError("");
        setStreamingText("");
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
                            <Label htmlFor="dateCreated">Date Created (Optional)</Label>
                            <Input
                                id="dateCreated"
                                type="date"
                                value={dateCreated}
                                onChange={(e) => setDateCreated(e.target.value)}
                                placeholder="When was the invoice created?"
                            />
                            <p className="text-xs text-muted-foreground">
                                When was the invoice created? (Leave blank for today)
                            </p>
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
                                processingStatus === "uploading" && "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
                                processingStatus === "processing" && "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
                                processingStatus === "success" && "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
                                processingStatus === "error" && "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                            )}>
                                <div className="flex items-start gap-3">
                                    {processingStatus === "uploading" && (
                                        <>
                                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin mt-0.5" />
                                            <div>
                                                <p className="font-medium text-blue-700 dark:text-blue-300">Uploading document...</p>
                                                <p className="text-sm text-blue-600 dark:text-blue-400">Sending file to AI agent</p>
                                            </div>
                                        </>
                                    )}
                                    {processingStatus === "processing" && (
                                        <>
                                            <Bot className="w-5 h-5 text-amber-500 animate-pulse mt-0.5" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <p className="font-medium text-amber-700">AI Agent Processing...</p>
                                                    {currentAgent && (
                                                        <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                                                            {currentAgent}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {/* Agent history indicator */}
                                                {agentHistory.length > 0 && (
                                                    <div className="flex flex-wrap items-center gap-1 mb-2">
                                                        {agentHistory.map((agent, i) => (
                                                            <span key={i} className="inline-flex items-center gap-1 text-xs">
                                                                {i > 0 && <ArrowRight className="w-3 h-3 text-amber-400" />}
                                                                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                                                                    {agent}
                                                                </span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                {/* Streaming text preview */}
                                                {streamingText && (
                                                    <div className="mt-2 p-2 bg-white/50 rounded border border-amber-200 max-h-32 overflow-y-auto">
                                                        <p className="text-xs text-amber-800 whitespace-pre-wrap">
                                                            {streamingText.slice(-500)}
                                                            <span className="animate-pulse">|</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                    {processingStatus === "success" && (
                                        <>
                                            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-green-700 dark:text-green-300">Processing Complete!</p>
                                                <p className="text-sm text-green-600 dark:text-green-400">Review the extracted data below</p>
                                            </div>
                                        </>
                                    )}
                                    {processingStatus === "error" && (
                                        <>
                                            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="font-medium text-red-700 dark:text-red-300">Processing Failed</p>
                                                <p className="text-sm text-red-600 dark:text-red-400">{processingError}</p>
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
                                    <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                                        <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Agent Response:</p>
                                        <p className="text-xs text-green-600 dark:text-green-400 line-clamp-3">{agentResponse}</p>
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
