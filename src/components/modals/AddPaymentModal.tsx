"use client";

import { useState } from "react";
import { usePaymentModal } from "@/stores/usePaymentModal";
import { useClaimsStore } from "@/stores/useClaimsStore";
import { useFTSOPrices } from "@/hooks/useFTSOPrices";
import { FEEDS } from "@/config/feeds";
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
    const { prices } = useFTSOPrices();

    // Form State
    const [receiver, setReceiver] = useState("");
    const [description, setDescription] = useState("");
    const [usdAmount, setUsdAmount] = useState("");
    const [cryptoFeedId, setCryptoFeedId] = useState("");
    const [stopLoss, setStopLoss] = useState("");
    const [takeProfit, setTakeProfit] = useState("");
    // Collateral removed from UI, defaulting to 0
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
            description: description || "Payment",
            usdAmount: parseFloat(usdAmount), // Store as decimal
            cryptoFeedId: cryptoFeedId || "0x...",
            stopLossPrice: BigInt(Math.floor(parseFloat(stopLoss) * 100)),
            takeProfitPrice: BigInt(Math.floor(parseFloat(takeProfit) * 100)),
            collateralAmount: BigInt(0), // Defaulting to 0 since removed from UI
            createdAt: BigInt(Math.floor(Date.now() / 1000)),
            expiresAt: BigInt(Math.floor(Date.now() / 1000) + (parseInt(durationDays) * 86400)),
            executed: false,
            executedAt: BigInt(0),
            executedPrice: BigInt(0),
            paidAmount: BigInt(0),
            originalAmount: (() => {
                if (!cryptoFeedId || !usdAmount) return 0;
                const feed = FEEDS.find((f) => f.id === cryptoFeedId);
                if (!feed) return 0;
                const priceData = prices[feed.name];
                const price = priceData ? parseFloat(priceData.price) : 0;
                return price > 0 ? parseFloat(usdAmount) / price : 0;
            })()
        };

        // Add to store
        // @ts-ignore - JSON serialization of BigInt needs handling in real app, but for UI mock it's fine
        addPayment(claimId, newPayment);

        // Reset and close
        handleClose();
    };

    const handleClose = () => {
        setReceiver("");
        setDescription("");
        setUsdAmount("");
        setCryptoFeedId("");
        setStopLoss("");
        setTakeProfit("");
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

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                placeholder="Payment for..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
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
                        </div>



                        <div className="grid gap-2">
                            <Label htmlFor="feed">Crypto Feed ID (FTSO)</Label>
                            <div className="flex items-center gap-3">
                                <div className="flex-4">
                                    <Select value={cryptoFeedId} onValueChange={setCryptoFeedId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select asset feed" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {FEEDS.map((feed) => (
                                                <SelectItem key={feed.id} value={feed.id}>
                                                    {feed.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {(() => {
                                        if (!cryptoFeedId || !usdAmount) return null;
                                        const feed = FEEDS.find((f) => f.id === cryptoFeedId);
                                        if (!feed) return null;
                                        const priceData = prices[feed.name];
                                        const price = priceData ? parseFloat(priceData.price) : 0;
                                        if (price <= 0) return null;
                                        const amount = parseFloat(usdAmount) / price;
                                        return (
                                            <div className="flex mt-2">
                                                <p className="text-sm text-muted-foreground">
                                                    ≈ {amount.toFixed(6)} {feed.symbol}
                                                </p>
                                            </div>
                                        );
                                    })()}
                                </div>
                                {(() => {
                                    if (!cryptoFeedId) return null;
                                    const feed = FEEDS.find((f) => f.id === cryptoFeedId);
                                    if (!feed) return null;
                                    const priceData = prices[feed.name];
                                    const price = priceData ? parseFloat(priceData.price) : 0;
                                    if (price <= 0) return null;
                                    return (
                                        <div className="flex items-baseline-last gap-4">

                                            <div className="text-4xl font-medium text-center whitespace-nowrap flex-3">
                                                ${price.toFixed(2)}
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Current price</p>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
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
