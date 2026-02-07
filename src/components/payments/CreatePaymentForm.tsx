"use client";

import { useState, useEffect } from "react";
import { useContract } from "@/hooks/useContract";
import { FEED_IDS } from "@/lib/contract/constants";
import { ethers } from "ethers";

export function CreatePaymentForm() {
    const { createClaimPayment, getCurrentPrice, isLoading } = useContract();
    const [receiver, setReceiver] = useState("");
    const [usdAmount, setUsdAmount] = useState("10");
    const [feed, setFeed] = useState<keyof typeof FEED_IDS>("ETH/USD"); // Default to ETH/USD for realistic prices
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
        
        // Calculate required collateral
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

    // Calculate required collateral based on worst-case (stop loss price)
    const calculateRequiredCollateral = (stopLoss: bigint) => {
        if (!usdAmount || stopLoss <= 0n) return 0;
        
        const usdCents = parseFloat(usdAmount) * 100;
        const decimalsMultiplier = Math.pow(10, decimals);
        
        // Max crypto needed at stop loss = (usdCents * 10^18 * 10^decimals) / (stopLoss * 100)
        const maxCryptoNeeded = (usdCents * 1e18 * decimalsMultiplier) / (Number(stopLoss) * 100);
        
        // Apply collateral ratio
        const collateral = (maxCryptoNeeded * collateralRatio) / 100;
        
        return collateral;
    };

    // Calculate estimated payout at different price points
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
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Create USD-Denominated Payment</h2>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-blue-700">
                            <strong>Demo Mode:</strong> Calculates {feed.split('/')[0]} amount based on real {feed} price, 
                            but pays that same amount in FLR (e.g., 0.05 ETH calculated → 0.05 FLR sent). 
                            This demonstrates USD-optimization using real oracle prices on Coston2 testnet.
                        </p>
                    </div>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Recipient Address</label>
                    <input
                        type="text"
                        value={receiver}
                        onChange={(e) => setReceiver(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="0x..."
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Payment Amount (USD)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={usdAmount}
                            onChange={(e) => setUsdAmount(e.target.value)}
                            className="w-full border rounded px-3 py-2 pl-7"
                            placeholder="10.00"
                            required
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Recipient will receive exactly this USD value in crypto
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Price Feed (for calculation)</label>
                    <select
                        value={feed}
                        onChange={(e) => setFeed(e.target.value as keyof typeof FEED_IDS)}
                        className="w-full border rounded px-3 py-2"
                    >
                        <option value="ETH/USD">ETH/USD (Recommended for demo)</option>
                        <option value="BTC/USD">BTC/USD</option>
                        <option value="FLR/USD">FLR/USD</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        Contract calculates {feed.split('/')[0]} amount, but pays equivalent in FLR
                    </p>
                </div>

                {currentPrice && (
                    <div className="bg-blue-50 p-4 rounded border border-blue-200">
                        <p className="text-sm font-semibold text-blue-900">
                            Current {feed} Price: ${(currentPrice / Math.pow(10, decimals)).toFixed(decimals === 3 ? 2 : 0)}
                        </p>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Stop Loss: {stopLossPercent.toFixed(1)}% 
                        <span className="text-red-600 font-semibold ml-2">
                            ${(stopLossPrice / Math.pow(10, decimals)).toFixed(decimals === 3 ? 2 : 0)}
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
                        Execute if price drops here (limit losses from volatile markets)
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Take Profit: +{takeProfitPercent.toFixed(1)}%
                        <span className="text-green-600 font-semibold ml-2">
                            ${(takeProfitPrice / Math.pow(10, decimals)).toFixed(decimals === 3 ? 2 : 0)}
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
                        Execute when price reaches here (pay less crypto, capture savings)
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
                        Safety buffer (150% recommended for moderate volatility)
                    </p>
                </div>

                {usdAmount && currentPrice && (
                    <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-2">
                        <h3 className="font-semibold text-sm">Payment Breakdown (calculated as {feed.split('/')[0]}, paid as FLR)</h3>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-gray-600">Collateral Required:</span>
                            </div>
                            <div className="font-semibold text-right">
                                {parseFloat(requiredCollateralEth).toFixed(6)} FLR
                            </div>

                            <div>
                                <span className="text-gray-600">If Stop Loss Hits:</span>
                            </div>
                            <div className="text-right">
                                {ethers.formatEther(payoutAtStopLoss.toString()).substring(0, 10)} FLR paid
                            </div>

                            <div>
                                <span className="text-gray-600">If Current Price:</span>
                            </div>
                            <div className="text-right">
                                {ethers.formatEther(payoutAtCurrent.toString()).substring(0, 10)} FLR paid
                            </div>

                            <div>
                                <span className="text-green-600 font-semibold">If Take Profit Hits:</span>
                            </div>
                            <div className="text-right font-semibold text-green-600">
                                {ethers.formatEther(payoutAtTakeProfit.toString()).substring(0, 10)} FLR paid
                            </div>
                        </div>

                        {savingsAtTakeProfit > 0 && (
                            <div className="pt-2 border-t border-gray-300">
                                <p className="text-sm font-semibold text-green-600">
                                    💰 Potential Savings: {savingsAtTakeProfit.toFixed(1)}% if take profit executes
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading || !currentPrice}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
                >
                    {isLoading ? "Creating Payment..." : `Lock ${requiredCollateralEth.substring(0, 8)} FLR Collateral`}
                </button>

                <p className="text-xs text-gray-500 text-center">
                    Demo: Calculates ${usdAmount || '0'} USD as {feed.split('/')[0]} amount, pays that amount in FLR. Unused collateral refunded.
                </p>
            </form>
        </div>
    );
}
