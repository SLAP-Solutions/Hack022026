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

type PaymentMode = "trigger" | "instant";

export function CreatePaymentForm() {
    const { createClaimPayment, createInstantPayment, getCurrentPrice, isLoading } = useContract();
    
    // Form mode
    const [mode, setMode] = useState<PaymentMode>("trigger");
    
    // Common fields
    const [receiver, setReceiver] = useState("");
    const [usdAmount, setUsdAmount] = useState("10");
    const [feed, setFeed] = useState<keyof typeof FEED_IDS>("ETH/USD");
    
    // Trigger-based fields
    const [stopLossPercent, setStopLossPercent] = useState(-5);
    const [takeProfitPercent, setTakeProfitPercent] = useState(5);
    const [collateralRatio, setCollateralRatio] = useState(150);
    const [expiryDays, setExpiryDays] = useState(30);
    
    // Price data
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
        if (!currentPrice) {
            alert("Waiting for price data...");
            return;
        }

        const usdCents = Math.floor(parseFloat(usdAmount) * 100);
        const stopLoss = BigInt(Math.floor(currentPrice * (1 + stopLossPercent / 100)));
        const takeProfit = BigInt(Math.floor(currentPrice * (1 + takeProfitPercent / 100)));
        
        const collateralInEth = calculateRequiredCollateral(stopLoss);

        try {
            if (mode === "instant") {
                // Instant payment: calculate collateral for current price
                const collateralWei = calculateInstantCollateral();
                const collateralEth = ethers.formatEther(collateralWei.toString());
                
                await createInstantPayment(receiver, usdCents, feed, collateralEth);
                alert("✅ Instant payment executed successfully!");
            } else {
                // Trigger-based payment
                const stopLoss = BigInt(Math.floor(currentPrice * (1 + stopLossPercent / 100)));
                const takeProfit = BigInt(Math.floor(currentPrice * (1 + takeProfitPercent / 100)));
                const collateralWei = calculateRequiredCollateral(stopLoss);
                const collateralEth = ethers.formatEther(collateralWei.toString());

                await createClaimPayment(receiver, usdCents, feed, stopLoss, takeProfit, expiryDays, collateralEth);
                alert("✅ Trigger-based payment created successfully!");
            }
            
            // Reset form
            setReceiver("");
            setUsdAmount("10");
        } catch (error: any) {
            console.error(error);
            alert(`Failed: ${error.message || "Unknown error"}`);
        }
    };

    const stopLossPrice = currentPrice ? currentPrice * (1 + stopLossPercent / 100) : 0;
    const takeProfitPrice = currentPrice ? currentPrice * (1 + takeProfitPercent / 100) : 0;

    // Calculate required collateral for trigger-based payment (worst case = stop loss)
    const calculateRequiredCollateral = (stopLoss: bigint) => {
        if (!usdAmount || stopLoss <= BigInt(0)) return BigInt(0);
        
        const usdCents = parseFloat(usdAmount) * 100;
        const decimalsMultiplier = Math.pow(10, decimals);
        
        // Max crypto needed = (usdCents * 10^18 * 10^decimals) / (stopLoss * 100)
        const maxCryptoNeeded = (usdCents * 1e18 * decimalsMultiplier) / (Number(stopLoss) * 100);
        const collateral = (maxCryptoNeeded * collateralRatio) / 100;
        
        return BigInt(Math.floor(collateral));
    };

    // Calculate collateral for instant payment (current price, higher ratio for safety)
    const calculateInstantCollateral = () => {
        if (!usdAmount || !currentPrice) return BigInt(0);
        
        const usdCents = parseFloat(usdAmount) * 100;
        const decimalsMultiplier = Math.pow(10, decimals);
        
        // Crypto needed at current price
        const cryptoNeeded = (usdCents * 1e18 * decimalsMultiplier) / (currentPrice * 100);
        
        // Use slightly higher ratio for instant (110% to handle small price movements)
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
    
    const savingsAtTakeProfit = stopLossPrice > 0 && payoutAtStopLoss > BigInt(0)
        ? ((Number(payoutAtStopLoss - payoutAtTakeProfit)) / Number(payoutAtStopLoss)) * 100
        : 0;

    const ticker = feed.split('/')[0];

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Create Payment</h2>
            
            {/* Demo mode banner */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-blue-700">
                            <strong>Demo Mode:</strong> Calculates {ticker} amount using real FTSO {feed} price, 
                            but pays equivalent value in FLR tokens (Coston2 testnet).
                        </p>
                    </div>
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

            {/* Mode selector */}
            <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
                <button
                    type="button"
                    onClick={() => setMode("trigger")}
                    className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors ${
                        mode === "trigger"
                            ? "bg-white text-blue-600 shadow"
                            : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                    ⏳ Trigger-Based Payment
                </button>
                <button
                    type="button"
                    onClick={() => setMode("instant")}
                    className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors ${
                        mode === "instant"
                            ? "bg-white text-blue-600 shadow"
                            : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                    ⚡ Instant Payment
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Receiver address */}
                <div>
                    <label className="block text-sm font-medium mb-1">Recipient Address</label>
                    <input
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

                {/* USD amount */}
                <div>
                    <label className="block text-sm font-medium mb-1">Payment Amount (USD)</label>
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
                    <p className="text-xs text-gray-500 mt-1">
                        Recipient receives exactly this USD value in crypto
                    </p>
                </div>

                {/* Price feed selector */}
                <div>
                    <label className="block text-sm font-medium mb-1">Price Feed (Calculation Basis)</label>
                    <select
                        value={feed}
                        onChange={(e) => setFeed(e.target.value as keyof typeof FEED_IDS)}
                        className="w-full border rounded px-3 py-2"
                    >
                        <option value="ETH/USD">ETH/USD (Recommended)</option>
                        <option value="BTC/USD">BTC/USD</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        Calculates {ticker} amount, pays equivalent FLR
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

                {/* Current price display */}
                {currentPrice && (
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <p className="text-sm font-semibold text-blue-900">
                            Current {feed} Price: ${(currentPrice / Math.pow(10, decimals)).toFixed(decimals === 3 ? 2 : 0)}
                    <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                        <p className="text-sm font-semibold">
                            Current {feed} Price: <span className="text-primary">${(currentPrice / Math.pow(10, decimals)).toFixed(decimals === 3 ? 2 : 0)}</span>
                        </p>
                    </div>
                )}

                {/* Trigger-based settings */}
                {mode === "trigger" && (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                🔴 Stop Loss: {stopLossPercent.toFixed(1)}% 
                                <span className="text-red-600 font-semibold ml-2">
                                    ${(stopLossPrice / Math.pow(10, decimals)).toFixed(2)}
                                </span>
                            </label>
                            <input
                                type="range"
                                min="-20"
                                max="-0.1"
                                step="0.1"
                                value={stopLossPercent}
                                onChange={(e) => setStopLossPercent(parseFloat(e.target.value))}
                                className="w-full"
                            />
                            <p className="text-xs text-gray-600 mt-1">
                                Execute if price drops here (limit losses in falling market)
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                🟢 Take Profit: +{takeProfitPercent.toFixed(1)}%
                                <span className="text-green-600 font-semibold ml-2">
                                    ${(takeProfitPrice / Math.pow(10, decimals)).toFixed(2)}
                                </span>
                            </label>
                            <input
                                type="range"
                                min="0.1"
                                max="20"
                                step="0.1"
                                value={takeProfitPercent}
                                onChange={(e) => setTakeProfitPercent(parseFloat(e.target.value))}
                                className="w-full"
                            />
                            <p className="text-xs text-gray-600 mt-1">
                                Execute at this price (pay less crypto, capture savings)
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Collateral Ratio: {collateralRatio}%
                            </label>
                            <input
                                type="range"
                                min="110"
                                max="200"
                                step="5"
                                value={collateralRatio}
                                onChange={(e) => setCollateralRatio(parseInt(e.target.value))}
                                className="w-full"
                            />
                            <p className="text-xs text-gray-600 mt-1">
                                Safety buffer (150% recommended for {ticker})
                            </p>
                        </div>
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

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Expiry: {expiryDays} days
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="90"
                                step="1"
                                value={expiryDays}
                                onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                                className="w-full"
                            />
                            <p className="text-xs text-gray-600 mt-1">
                                Payment expires if triggers not hit within this time
                            </p>
                        </div>
                    </>
                )}

                {/* Payment breakdown */}
                {usdAmount && currentPrice && (
                    <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-2">
                        <h3 className="font-semibold text-sm">
                            {mode === "instant" ? "Instant Payment Details" : "Trigger-Based Payment Details"}
                        </h3>
                    <div className="bg-muted/50 p-4 rounded-lg border space-y-2">
                        <h3 className="font-semibold text-sm">Payment Breakdown</h3>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-muted-foreground">Collateral Required:</span>
                            <span className="font-semibold text-right">
                                {parseFloat(requiredCollateralEth).toFixed(6)} FLR
                            </span>

                            {mode === "instant" ? (
                                <>
                                    <div>
                                        <span className="text-gray-700 font-medium">Will Pay:</span>
                                    </div>
                                    <div className="text-right font-semibold">
                                        {ethers.formatEther(payoutAtCurrent.toString()).substring(0, 10)} FLR
                                    </div>
                                    <div className="col-span-2 text-xs text-gray-500 pt-2 border-t">
                                        Executes immediately at current ${(currentPrice / Math.pow(10, decimals)).toFixed(2)} price
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <span className="text-gray-600">If Stop Loss Hits:</span>
                                    </div>
                                    <div className="text-right text-red-600">
                                        {ethers.formatEther(payoutAtStopLoss.toString()).substring(0, 10)} FLR
                                    </div>

                                    <div>
                                        <span className="text-gray-600">If Current Price:</span>
                                    </div>
                                    <div className="text-right">
                                        {ethers.formatEther(payoutAtCurrent.toString()).substring(0, 10)} FLR
                                    </div>

                                    <div>
                                        <span className="text-green-600 font-semibold">If Take Profit Hits:</span>
                                    </div>
                                    <div className="text-right font-semibold text-green-600">
                                        {ethers.formatEther(payoutAtTakeProfit.toString()).substring(0, 10)} FLR
                                    </div>

                                    {savingsAtTakeProfit > 0 && (
                                        <div className="col-span-2 pt-2 border-t border-gray-300">
                                            <p className="text-sm font-semibold text-green-600">
                                                💰 Potential Savings: {savingsAtTakeProfit.toFixed(1)}% at take profit
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Submit button */}
                <button
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
                    {isLoading 
                        ? (mode === "instant" ? "Executing Payment..." : "Creating Payment...") 
                        : (mode === "instant" 
                            ? `⚡ Pay ${requiredCollateralEth.substring(0, 8)} FLR Now` 
                            : `⏳ Lock ${requiredCollateralEth.substring(0, 8)} FLR Collateral`
                        )
                    }
                </button>

                <p className="text-xs text-gray-500 text-center">
                    {mode === "instant" 
                        ? `Instant: Pays ${usdAmount || '0'} USD worth of FLR immediately`
                        : `Trigger: Waits for price to hit stop loss or take profit. Excess collateral refunded.`
                    }
                    {isLoading ? "Creating Payment..." : `Lock ${requiredCollateralEth.substring(0, 8)} FLR Collateral`}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                    Demo: Calculates ${usdAmount || '0'} USD as {feed.split('/')[0]} amount, pays that amount in FLR. Unused collateral refunded.
                </p>
            </form>
        </div>
    );
}
