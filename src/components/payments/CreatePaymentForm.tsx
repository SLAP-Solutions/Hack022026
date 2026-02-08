"use client";

import { useState, useEffect } from "react";
import { useContract } from "@/hooks/useContract";
import { useContactsStore } from "@/stores/useContactsStore";
import { FEED_IDS } from "@/lib/contract/constants";
import { ethers } from "ethers";
import { useInvoicesStore } from "@/stores/useInvoicesStore";
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
import { Info, Activity } from "lucide-react";
import { PriceHistoryModal } from "./PriceHistoryModal";

type PaymentMode = "trigger" | "instant";

interface CreatePaymentFormProps {
    onSuccess?: () => void;
    invoiceId?: string;
}

export function CreatePaymentForm({ onSuccess, invoiceId }: CreatePaymentFormProps) {
    const { createClaimPayment, createInstantPayment, getCurrentPrice, isLoading } = useContract();
    const { contacts, fetchContacts } = useContactsStore();
    const { addPayment } = useInvoicesStore();

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    // Form mode
    const [mode, setMode] = useState<PaymentMode>("trigger");

    // Common fields
    const [receiver, setReceiver] = useState("");
    const [usdAmount, setUsdAmount] = useState("10");
    const [feed, setFeed] = useState<keyof typeof FEED_IDS>("ETH/USD");

    // Trigger-based fields
    const [stopLossPercent, setStopLossPercent] = useState(-5);
    const [takeProfitPercent, setTakeProfitPercent] = useState(5);
    const [stopLossInput, setStopLossInput] = useState("");
    const [takeProfitInput, setTakeProfitInput] = useState("");
    const [collateralRatio, setCollateralRatio] = useState(150);
    const [expiryDays, setExpiryDays] = useState(30);

    // Price data
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    const [decimals, setDecimals] = useState<number>(3);
    const [showGraphModal, setShowGraphModal] = useState(false);

    useEffect(() => {
        getCurrentPrice(feed).then(data => {
            setCurrentPrice(data.price);
            setDecimals(data.decimals);

            // Initialize inputs when price is first loaded
            const humanPrice = data.price / Math.pow(10, data.decimals);
            setStopLossInput((humanPrice * (1 + stopLossPercent / 100)).toFixed(2));
            setTakeProfitInput((humanPrice * (1 + takeProfitPercent / 100)).toFixed(2));
        }).catch(console.error);
    }, [feed]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPrice) {
            alert("Waiting for price data...");
            return;
        }

        const usdCents = Math.floor(parseFloat(usdAmount) * 100);

        try {
            if (mode === "instant") {
                const collateralWei = calculateInstantCollateral();
                const collateralEth = ethers.formatEther(collateralWei.toString());

                await createInstantPayment(receiver, usdCents, feed, collateralEth);
                alert("✅ Instant payment executed successfully!");
            } else {
                const stopLoss = BigInt(Math.floor(currentPrice * (1 + stopLossPercent / 100)));
                const takeProfit = BigInt(Math.floor(currentPrice * (1 + takeProfitPercent / 100)));
                const collateralWei = calculateRequiredCollateral(stopLoss);
                const collateralEth = ethers.formatEther(collateralWei.toString());

                const txHash = await createClaimPayment(receiver, usdCents, feed, stopLoss, takeProfit, expiryDays, collateralEth);

                // If we have an invoiceId, link this payment in the store
                if (invoiceId) {
                    const newPayment = {
                        id: BigInt(Date.now()), // Mock ID for UI, in reality would use contract events or ID
                        payer: "You", // Connected wallet
                        receiver: receiver,
                        usdAmount: parseFloat(usdAmount),
                        cryptoFeedId: FEED_IDS[feed],
                        stopLossPrice: Number(stopLossInput),
                        takeProfitPrice: Number(takeProfitInput),
                        collateralAmount: BigInt(ethers.parseEther(collateralEth)),
                        createdAt: BigInt(Math.floor(Date.now() / 1000)),
                        expiresAt: BigInt(Math.floor(Date.now() / 1000) + (expiryDays * 86400)),
                        executed: false,
                        executedAt: BigInt(0),
                        executedPrice: BigInt(0),
                        paidAmount: BigInt(0),
                        originalAmount: parseFloat(usdAmount),
                        status: 'pending' as const
                    };
                    addPayment(invoiceId, newPayment);
                }

                alert("✅ Trigger-based payment created successfully!");
            }

            // Reset form
            setReceiver("");
            setUsdAmount("10");

            // Call success callback if provided
            onSuccess?.();
        } catch (error: any) {
            console.error(error);
            alert(`Failed: ${error.message || "Unknown error"}`);
        }
    };

    const stopLossPrice = currentPrice ? currentPrice * (1 + stopLossPercent / 100) : 0;
    const takeProfitPrice = currentPrice ? currentPrice * (1 + takeProfitPercent / 100) : 0;

    const calculateRequiredCollateral = (stopLoss: bigint) => {
        if (!usdAmount || stopLoss <= BigInt(0)) return BigInt(0);

        const usdCents = parseFloat(usdAmount) * 100;
        const decimalsMultiplier = Math.pow(10, decimals);

        const maxCryptoNeeded = (usdCents * 1e18 * decimalsMultiplier) / (Number(stopLoss) * 100);
        const collateral = (maxCryptoNeeded * collateralRatio) / 100;

        return BigInt(Math.floor(collateral));
    };

    const calculateInstantCollateral = () => {
        if (!usdAmount || !currentPrice) return BigInt(0);

        const usdCents = parseFloat(usdAmount) * 100;
        const decimalsMultiplier = Math.pow(10, decimals);

        const cryptoNeeded = (usdCents * 1e18 * decimalsMultiplier) / (currentPrice * 100);
        const collateral = (cryptoNeeded * 110) / 100;

        return BigInt(Math.floor(collateral));
    };

    const calculatePayout = (price: number) => {
        if (!usdAmount || !price) return BigInt(0);
        const usdCents = parseFloat(usdAmount) * 100;
        const decimalsMultiplier = Math.pow(10, decimals);
        return BigInt(Math.floor((usdCents * 1e18 * decimalsMultiplier) / (price * 100)));
    };

    const requiredCollateralWei = mode === "instant"
        ? calculateInstantCollateral()
        : calculateRequiredCollateral(BigInt(Math.floor(stopLossPrice)));
    const requiredCollateralEth = ethers.formatEther(requiredCollateralWei.toString());

    const payoutAtStopLoss = calculatePayout(stopLossPrice);
    const payoutAtCurrent = calculatePayout(currentPrice || 0);
    const payoutAtTakeProfit = calculatePayout(takeProfitPrice);

    const savingsAtTakeProfit = (currentPrice && takeProfitPrice > currentPrice)
        ? (1 - (currentPrice / takeProfitPrice)) * 100
        : 0;

    const ticker = feed.split('/')[0];

    return (
        <div className="space-y-4">
            {/* Mode selector */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <Button
                    type="button"
                    variant={mode === "trigger" ? "default" : "ghost"}
                    onClick={() => setMode("trigger")}
                    className="flex-1"
                >
                    Trigger-Based
                </Button>
                <Button
                    type="button"
                    variant={mode === "instant" ? "default" : "ghost"}
                    onClick={() => setMode("instant")}
                    className="flex-1"
                >
                    Instant
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Receiver address */}
                {/* Receiver address */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="receiver">Recipient Address</Label>
                        {contacts.length > 0 && (
                            <Select onValueChange={setReceiver}>
                                <SelectTrigger className="w-[180px] h-7 text-xs">
                                    <SelectValue placeholder="Select contact..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {contacts.map(contact => (
                                        <SelectItem key={contact.id} value={contact.receiverAddress}>
                                            {contact.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <Input
                        id="receiver"
                        type="text"
                        value={receiver}
                        onChange={(e) => setReceiver(e.target.value)}
                        placeholder="0x..."
                        required
                    />
                </div>

                {/* USD amount */}
                <div className="space-y-2">
                    <Label htmlFor="amount">Payment Amount (USD)</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1.75 text-muted-foreground">$</span>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={usdAmount}
                            onChange={(e) => setUsdAmount(e.target.value)}
                            className="pl-7"
                            placeholder="10.00"
                            required
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Recipient will receive exactly this USD value in crypto
                    </p>
                </div>

                {/* Price feed selector */}
                <div className="space-y-2">
                    <Label>Price Feed</Label>
                    <Select value={feed} onValueChange={(value) => setFeed(value as keyof typeof FEED_IDS)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ETH/USD">ETH/USD (Recommended)</SelectItem>
                            <SelectItem value="BTC/USD">BTC/USD</SelectItem>
                            <SelectItem value="FLR/USD">FLR/USD</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        Contract calculates {ticker} amount, but pays equivalent in FLR
                    </p>
                </div>

                {/* Current price display */}
                {currentPrice && (
                    <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                        <p className="text-sm font-semibold">
                            Current {feed} Price: <span className="text-primary">${(currentPrice / Math.pow(10, decimals)).toFixed(decimals === 3 ? 2 : 0)}</span>
                        </p>
                    </div>
                )}

                {/* Trigger-based settings */}
                {mode === "trigger" && (
                    <>
                        <div className="flex justify-between items-center pb-2">
                            <h3 className="font-semibold text-sm">Trigger Settings</h3>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowGraphModal(true)}
                                disabled={!currentPrice}
                                className="h-8"
                            >
                                <Activity className="w-3.5 h-3.5 mr-2" />
                                Set Graphically
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="stopLoss">Stop Loss Price ($)</Label>
                                <div className="space-y-1">
                                    <Input
                                        id="stopLoss"
                                        type="number"
                                        step="0.01"
                                        value={stopLossInput}
                                        onChange={(e) => {
                                            setStopLossInput(e.target.value);
                                            const price = parseFloat(e.target.value);
                                            if (currentPrice && !isNaN(price) && price > 0) {
                                                const currentPriceHuman = currentPrice / Math.pow(10, decimals);
                                                setStopLossPercent(((price - currentPriceHuman) / currentPriceHuman) * 100);
                                            }
                                        }}
                                        className="font-mono"
                                        placeholder="0.00"
                                    />
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] text-red-600 font-medium">{stopLossPercent.toFixed(1)}% from current</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground leading-tight">
                                    Execute if price drops to this level
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="takeProfit">Take Profit Price ($)</Label>
                                <div className="space-y-1">
                                    <Input
                                        id="takeProfit"
                                        type="number"
                                        step="0.01"
                                        value={takeProfitInput}
                                        onChange={(e) => {
                                            setTakeProfitInput(e.target.value);
                                            const price = parseFloat(e.target.value);
                                            if (currentPrice && !isNaN(price) && price > 0) {
                                                const currentPriceHuman = currentPrice / Math.pow(10, decimals);
                                                setTakeProfitPercent(((price - currentPriceHuman) / currentPriceHuman) * 100);
                                            }
                                        }}
                                        className="font-mono"
                                        placeholder="0.00"
                                    />
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] text-green-600 font-medium">+{takeProfitPercent.toFixed(1)}% from current</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground leading-tight">
                                    Execute if price reaches this level
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex justify-between">
                                <span>Collateral Ratio:</span>
                                <span className="font-mono text-primary">{collateralRatio}%</span>
                            </Label>
                            <input
                                type="range"
                                min="110"
                                max="200"
                                step="5"
                                value={collateralRatio}
                                onChange={(e) => setCollateralRatio(parseInt(e.target.value))}
                                className="w-full accent-primary h-1.5 rounded-lg appearance-none bg-muted cursor-pointer"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Safety buffer (150% recommended)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex justify-between">
                                <span>Expiry:</span>
                                <span className="font-mono text-primary">{expiryDays} days</span>
                            </Label>
                            <input
                                type="range"
                                min="1"
                                max="90"
                                step="1"
                                value={expiryDays}
                                onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                                className="w-full accent-primary h-1.5 rounded-lg appearance-none bg-muted cursor-pointer"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Deadline for execution
                            </p>
                        </div>
                    </>
                )}

                {/* Payment breakdown */}
                {usdAmount && currentPrice && (
                    <div className="bg-muted/50 p-4 rounded-lg border space-y-2">
                        <h3 className="font-semibold text-sm">Payment Breakdown</h3>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-muted-foreground">Collateral Required:</span>
                            <span className="font-semibold text-right">
                                {parseFloat(requiredCollateralEth).toFixed(6)} FLR
                            </span>

                            {mode === "trigger" && (
                                <>
                                    <span className="text-muted-foreground">If Stop Loss Hits:</span>
                                    <span className="text-right">
                                        {ethers.formatEther(payoutAtStopLoss.toString()).substring(0, 10)} {ticker}
                                    </span>

                                    <span className="text-muted-foreground">If Current Price:</span>
                                    <span className="text-right">
                                        {ethers.formatEther(payoutAtCurrent.toString()).substring(0, 10)} {ticker}
                                    </span>

                                    <span className="text-green-600 font-semibold">If Take Profit Hits:</span>
                                    <span className="text-right font-semibold text-green-600">
                                        {ethers.formatEther(payoutAtTakeProfit.toString()).substring(0, 10)} {ticker}
                                    </span>
                                </>
                            )}
                        </div>

                        {mode === "trigger" && savingsAtTakeProfit > 0 && (
                            <div className="pt-2 border-t">
                                <p className="text-sm font-semibold text-green-600">
                                    Potential Savings: {savingsAtTakeProfit.toFixed(1)}% if take profit executes
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={isLoading || !currentPrice}
                    className="w-full"
                    size="lg"
                >
                    {isLoading
                        ? (mode === "instant" ? "Executing Payment..." : "Creating Payment...")
                        : (mode === "instant"
                            ? `Pay ${requiredCollateralEth.substring(0, 8)} FLR Now`
                            : `Lock ${requiredCollateralEth.substring(0, 8)} FLR Collateral`
                        )
                    }
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                    Unused collateral refunded.
                </p>
            </form>
            {/* Graph Modal */}
            {showGraphModal && currentPrice && (
                <PriceHistoryModal
                    isOpen={showGraphModal}
                    onClose={() => setShowGraphModal(false)}
                    ticker={ticker}
                    currentPrice={currentPrice / Math.pow(10, decimals)}
                    initialTp={takeProfitPrice / Math.pow(10, decimals)}
                    initialSl={stopLossPrice / Math.pow(10, decimals)}
                    onSave={(tp, sl) => {
                        const current = currentPrice / Math.pow(10, decimals);
                        const newTpPercent = ((tp - current) / current) * 100;
                        const newSlPercent = ((sl - current) / current) * 100;

                        setTakeProfitPercent(parseFloat(newTpPercent.toFixed(1)));
                        setStopLossPercent(parseFloat(newSlPercent.toFixed(1)));

                        // Also update string inputs
                        setTakeProfitInput(tp.toFixed(2));
                        setStopLossInput(sl.toFixed(2));

                        setShowGraphModal(false);
                    }}
                />
            )}
        </div>
    );
}
