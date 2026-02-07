"use client";

import { useState, useEffect } from "react";
import { useContract } from "@/hooks/useContract";
import { FEED_IDS } from "@/lib/contract/constants";
import { ethers } from "ethers";
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
import { Info } from "lucide-react";

export function CreatePaymentForm() {
    const { createClaimPayment, getCurrentPrice, isLoading } = useContract();
    const [receiver, setReceiver] = useState("");
    const [usdAmount, setUsdAmount] = useState("10");
    const [feed, setFeed] = useState<keyof typeof FEED_IDS>("ETH/USD");
    const [stopLossPercent, setStopLossPercent] = useState(-5);
    const [takeProfitPercent, setTakeProfitPercent] = useState(5);
    const [collateralRatio, setCollateralRatio] = useState(150);
    const [expiryDays, setExpiryDays] = useState(30);
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    const [decimals, setDecimals] = useState<number>(3);

    useEffect(() => {
        getCurrentPrice(feed).then(data => {
            setCurrentPrice(data.price);
            setDecimals(data.decimals);
        }).catch(console.error);
    }, [feed]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPrice) return;

        const usdCents = Math.floor(parseFloat(usdAmount) * 100);
        const stopLoss = BigInt(Math.floor(currentPrice * (1 + stopLossPercent / 100)));
        const takeProfit = BigInt(Math.floor(currentPrice * (1 + takeProfitPercent / 100)));
        
        const collateralInEth = calculateRequiredCollateral(stopLoss);

        try {
            await createClaimPayment(receiver, usdCents, feed, stopLoss, takeProfit, expiryDays, collateralInEth.toString());
            alert("Payment created successfully!");
            setReceiver("");
            setUsdAmount("");
        } catch (error) {
            console.error(error);
            alert("Failed to create payment. Check console for details.");
        }
    };

    const stopLossPrice = currentPrice ? currentPrice * (1 + stopLossPercent / 100) : 0;
    const takeProfitPrice = currentPrice ? currentPrice * (1 + takeProfitPercent / 100) : 0;

    const calculateRequiredCollateral = (stopLoss: bigint) => {
        if (!usdAmount || stopLoss <= BigInt(0)) return 0;
        
        const usdCents = parseFloat(usdAmount) * 100;
        const decimalsMultiplier = Math.pow(10, decimals);
        const maxCryptoNeeded = (usdCents * 1e18 * decimalsMultiplier) / (Number(stopLoss) * 100);
        const collateral = (maxCryptoNeeded * collateralRatio) / 100;
        
        return collateral;
    };

    const calculatePayout = (price: number) => {
        if (!usdAmount || !price) return 0;
        const usdCents = parseFloat(usdAmount) * 100;
        const decimalsMultiplier = Math.pow(10, decimals);
        return (usdCents * 1e18 * decimalsMultiplier) / (price * 100);
    };

    const requiredCollateralWei = calculateRequiredCollateral(BigInt(Math.floor(stopLossPrice)));
    const requiredCollateralEth = ethers.formatEther(requiredCollateralWei.toString());
    
    const payoutAtStopLoss = calculatePayout(stopLossPrice);
    const payoutAtCurrent = calculatePayout(currentPrice || 0);
    const payoutAtTakeProfit = calculatePayout(takeProfitPrice);
    
    const savingsAtTakeProfit = ((payoutAtStopLoss - payoutAtTakeProfit) / payoutAtStopLoss) * 100;

    return (
        <div className="space-y-4">
            <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-md">
                <div className="flex gap-3">
                    <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Demo Mode:</strong> Calculates {feed.split('/')[0]} amount based on real {feed} price, 
                        but pays that same amount in FLR. This demonstrates USD-optimization using real oracle prices on Coston2 testnet.
                    </p>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="receiver">Recipient Address</Label>
                    <Input
                        id="receiver"
                        type="text"
                        value={receiver}
                        onChange={(e) => setReceiver(e.target.value)}
                        placeholder="0x..."
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="amount">Payment Amount (USD)</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
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
                        Contract calculates {feed.split('/')[0]} amount, but pays equivalent in FLR
                    </p>
                </div>

                {currentPrice && (
                    <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                        <p className="text-sm font-semibold">
                            Current {feed} Price: <span className="text-primary">${(currentPrice / Math.pow(10, decimals)).toFixed(decimals === 3 ? 2 : 0)}</span>
                        </p>
                    </div>
                )}

                <div className="space-y-2">
                    <Label>
                        Stop Loss: {stopLossPercent.toFixed(1)}% 
                        <span className="text-red-600 font-semibold ml-2">
                            ${(stopLossPrice / Math.pow(10, decimals)).toFixed(decimals === 3 ? 2 : 0)}
                        </span>
                    </Label>
                    <input
                        type="range"
                        min="-20"
                        max="-0.1"
                        step="0.1"
                        value={stopLossPercent}
                        onChange={(e) => setStopLossPercent(parseFloat(e.target.value))}
                        className="w-full accent-primary"
                    />
                    <p className="text-xs text-muted-foreground">
                        Execute if price drops here (limit losses from volatile markets)
                    </p>
                </div>

                <div className="space-y-2">
                    <Label>
                        Take Profit: +{takeProfitPercent.toFixed(1)}%
                        <span className="text-green-600 font-semibold ml-2">
                            ${(takeProfitPrice / Math.pow(10, decimals)).toFixed(decimals === 3 ? 2 : 0)}
                        </span>
                    </Label>
                    <input
                        type="range"
                        min="0.1"
                        max="20"
                        step="0.1"
                        value={takeProfitPercent}
                        onChange={(e) => setTakeProfitPercent(parseFloat(e.target.value))}
                        className="w-full accent-primary"
                    />
                    <p className="text-xs text-muted-foreground">
                        Execute when price reaches here (pay less crypto, capture savings)
                    </p>
                </div>

                <div className="space-y-2">
                    <Label>Collateral Ratio: {collateralRatio}%</Label>
                    <input
                        type="range"
                        min="110"
                        max="200"
                        step="5"
                        value={collateralRatio}
                        onChange={(e) => setCollateralRatio(parseInt(e.target.value))}
                        className="w-full accent-primary"
                    />
                    <p className="text-xs text-muted-foreground">
                        Safety buffer (150% recommended for moderate volatility)
                    </p>
                </div>

                {usdAmount && currentPrice && (
                    <div className="bg-muted/50 p-4 rounded-lg border space-y-2">
                        <h3 className="font-semibold text-sm">Payment Breakdown</h3>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-muted-foreground">Collateral Required:</span>
                            <span className="font-semibold text-right">
                                {parseFloat(requiredCollateralEth).toFixed(6)} FLR
                            </span>

                            <span className="text-muted-foreground">If Stop Loss Hits:</span>
                            <span className="text-right">
                                {ethers.formatEther(payoutAtStopLoss.toString()).substring(0, 10)} FLR
                            </span>

                            <span className="text-muted-foreground">If Current Price:</span>
                            <span className="text-right">
                                {ethers.formatEther(payoutAtCurrent.toString()).substring(0, 10)} FLR
                            </span>

                            <span className="text-green-600 font-semibold">If Take Profit Hits:</span>
                            <span className="text-right font-semibold text-green-600">
                                {ethers.formatEther(payoutAtTakeProfit.toString()).substring(0, 10)} FLR
                            </span>
                        </div>

                        {savingsAtTakeProfit > 0 && (
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
                    {isLoading ? "Creating Payment..." : `Lock ${requiredCollateralEth.substring(0, 8)} FLR Collateral`}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                    Demo: Calculates ${usdAmount || '0'} USD as {feed.split('/')[0]} amount, pays that amount in FLR. Unused collateral refunded.
                </p>
            </form>
        </div>
    );
}
