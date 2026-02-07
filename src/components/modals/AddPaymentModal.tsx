"use client";

import { useState } from "react";
import { usePaymentModal } from "@/stores/usePaymentModal";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function AddPaymentModal() {
    const { isOpen, claimId, closeModal } = usePaymentModal();
    const { addPayment } = useClaimsStore();

    // Form State
    const [receiver, setReceiver] = useState("");
    const [usdAmount, setUsdAmount] = useState("");
    const [cryptoFeedId, setCryptoFeedId] = useState("");
    const [stopLoss, setStopLoss] = useState("");
    const [takeProfit, setTakeProfit] = useState("");
    const [collateral, setCollateral] = useState("");
    const [durationDays, setDurationDays] = useState("30");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!claimId) return;

        // Create new payment object matching the Payment interface
        // Note: In a real app, this would be a blockchain transaction
        // Here we simulate the creation of a Payment struct
        const newPayment = {
            id: BigInt(Date.now()), // Mock ID
            payer: "0x123...MockPayer",
            receiver: receiver || "0x...",
            usdAmount: BigInt(Math.floor(parseFloat(usdAmount) * 100)), // Convert to cents
            cryptoFeedId: cryptoFeedId || "0x...",
            stopLossPrice: BigInt(Math.floor(parseFloat(stopLoss) * 100)),
            takeProfitPrice: BigInt(Math.floor(parseFloat(takeProfit) * 100)),
            collateralAmount: BigInt(parseFloat(collateral || "0") * 1e18), // Mock FLR conversion
            createdAt: BigInt(Math.floor(Date.now() / 1000)),
            expiresAt: BigInt(Math.floor(Date.now() / 1000) + (parseInt(durationDays) * 86400)),
            executed: false,
            executedAt: BigInt(0),
            executedPrice: BigInt(0),
            paidAmount: BigInt(0)
        };

        // Add to store
        // @ts-ignore - JSON serialization of BigInt needs handling in real app, but for UI mock it's fine
        addPayment(claimId, newPayment);

        // Reset and close
        handleClose();
    };

    const handleClose = () => {
        setReceiver("");
        setUsdAmount("");
        setCryptoFeedId("");
        setStopLoss("");
        setTakeProfit("");
        setCollateral("");
        setDurationDays("30");
        closeModal();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                        Create Payment Order
                    </DialogTitle>
                    <DialogDescription>
                        Configure parameters for the conditional payment.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="receiver">Receiver Address</Label>
                            <Input
                                id="receiver"
                                placeholder="0x..."
                                value={receiver}
                                onChange={(e) => setReceiver(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="amount">Amount (USD)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    placeholder="1000.00"
                                    value={usdAmount}
                                    onChange={(e) => setUsdAmount(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="collateral">Collateral (FLR)</Label>
                                <Input
                                    id="collateral"
                                    type="number"
                                    step="0.1"
                                    placeholder="500"
                                    value={collateral}
                                    onChange={(e) => setCollateral(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="feed">Crypto Feed ID (FTSO)</Label>
                            <Select value={cryptoFeedId} onValueChange={setCryptoFeedId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select asset feed" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0x01...">BTC/USD</SelectItem>
                                    <SelectItem value="0x02...">ETH/USD</SelectItem>
                                    <SelectItem value="0x03...">FLR/USD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="stopLoss">Stop Loss (USD)</Label>
                                <Input
                                    id="stopLoss"
                                    type="number"
                                    step="0.01"
                                    placeholder="Min Price"
                                    value={stopLoss}
                                    onChange={(e) => setStopLoss(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="takeProfit">Take Profit (USD)</Label>
                                <Input
                                    id="takeProfit"
                                    type="number"
                                    step="0.01"
                                    placeholder="Max Price"
                                    value={takeProfit}
                                    onChange={(e) => setTakeProfit(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="duration">Valid For (Days)</Label>
                            <Select value={durationDays} onValueChange={setDurationDays}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Validity period" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">7 Days</SelectItem>
                                    <SelectItem value="15">15 Days</SelectItem>
                                    <SelectItem value="30">30 Days</SelectItem>
                                    <SelectItem value="90">90 Days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                        >
                            Create Order
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
