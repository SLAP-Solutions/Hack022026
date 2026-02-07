"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/hooks/use-modal-store";
import { useWallet } from "@/hooks/useWallet";
import { Contract, parseEther } from "ethers";
import { CONTRACT_ADDRESS, FEED_IDS } from "@/lib/contract/constants";
import ABI from "@/lib/contract/abi.json";
import { Loader2 } from "lucide-react";

export default function ClaimModal() {
    const { isOpen, onClose, type, data } = useModalStore();
    const { isConnected, provider } = useWallet();
    const [isProcessing, setIsProcessing] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const isModalOpen = isOpen && type === "claim-payment";
    const { policy } = data;

    const handleClose = () => {
        onClose();
        setTxHash(null);
        setError(null);
        setIsProcessing(false);
    }

    const handlePurchase = async () => {
        if (!isConnected || !provider || !policy) {
            setError("Please connect wallet and try again");
            return;
        }

        try {
            setIsProcessing(true);
            setError(null);

            const signer = await provider.getSigner();
            const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);

            const feedId = FEED_IDS[policy.market as keyof typeof FEED_IDS];
            if (!feedId) throw new Error("Invalid market feed");

            const tx = await contract.createClaim(
                feedId,
                BigInt(Math.floor(policy.triggerPrice * 100000)), // 5 decimals
                policy.isPriceAbove,
                { value: parseEther(policy.amount) }
            );

            setTxHash(tx.hash);
            await tx.wait();

            setIsProcessing(false);
            // Optional: Close modal after success or keep open to show success?
            // Let's keep open to show details/success message.
        } catch (err: any) {
            console.error("Purchase failed:", err);
            setError(err.reason || err.message || "Transaction failed");
            setIsProcessing(false);
        }
    };

    if (!policy) return null;

    return (
        <Dialog open={isModalOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100">
                <DialogHeader>
                    <DialogTitle>Confirm Purchase</DialogTitle>
                    <DialogDescription>
                        Review the policy details before confirming your purchase.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Policy</span>
                            <span className="font-semibold">{policy.title}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Market</span>
                            <span className="font-semibold">{policy.market}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Trigger</span>
                            <span className="font-semibold">
                                {policy.isPriceAbove ? "> " : "< "} ${policy.triggerPrice.toLocaleString()}
                            </span>
                        </div>
                        <div className="border-t border-slate-200 dark:border-slate-800 my-2 pt-2 flex justify-between">
                            <span className="text-muted-foreground">Cost</span>
                            <span className="font-bold text-primary">{policy.cost} C2FLR</span>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded dark:bg-red-900/20">
                            {error}
                        </div>
                    )}

                    {txHash && (
                        <div className="p-3 text-sm text-green-600 bg-green-50 rounded dark:bg-green-900/20 break-all">
                            <p className="font-bold mb-1">Transaction Sent!</p>
                            Tx: {txHash}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handlePurchase}
                        disabled={isProcessing || !!txHash}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : txHash ? (
                            "Success"
                        ) : (
                            `Confirm (${policy.cost} FLR)`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
