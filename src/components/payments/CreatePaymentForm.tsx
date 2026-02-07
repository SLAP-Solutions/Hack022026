"use client";

import { useState, useEffect } from "react";
import { useContract } from "@/hooks/useContract";
import { FEED_IDS } from "@/lib/contract/constants";

export function CreatePaymentForm() {
    const { createClaimPayment, getCurrentPrice, isLoading } = useContract();
    const [receiver, setReceiver] = useState("");
    const [usdAmount, setUsdAmount] = useState("");
    const [feed, setFeed] = useState<keyof typeof FEED_IDS>("ETH/USD");
    const [stopLossPercent, setStopLossPercent] = useState(-0.5);
    const [takeProfitPercent, setTakeProfitPercent] = useState(0.5);
    const [collateral, setCollateral] = useState("0.01");
    const [expiryDays, setExpiryDays] = useState(30);
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);

    useEffect(() => {
        getCurrentPrice(feed).then(data => setCurrentPrice(data.price)).catch(console.error);
    }, [feed]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPrice) return;

        const usdCents = Math.floor(parseFloat(usdAmount) * 100);
        const stopLoss = BigInt(Math.floor(currentPrice * (1 + stopLossPercent / 100)));
        const takeProfit = BigInt(Math.floor(currentPrice * (1 + takeProfitPercent / 100)));

        try {
            await createClaimPayment(receiver, usdCents, feed, stopLoss, takeProfit, expiryDays, collateral);
            alert("Payment created!");
            setReceiver("");
            setUsdAmount("");
        } catch (error) {
            console.error(error);
        }
    };

    const stopLossPrice = currentPrice ? currentPrice * (1 + stopLossPercent / 100) : 0;
    const takeProfitPrice = currentPrice ? currentPrice * (1 + takeProfitPercent / 100) : 0;

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Create Payment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Receiver Address</label>
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
                    <label className="block text-sm font-medium mb-1">USD Amount</label>
                    <input
                        type="number"
                        step="0.01"
                        value={usdAmount}
                        onChange={(e) => setUsdAmount(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="0.32"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Crypto Feed</label>
                    <select
                        value={feed}
                        onChange={(e) => setFeed(e.target.value as keyof typeof FEED_IDS)}
                        className="w-full border rounded px-3 py-2"
                    >
                        <option value="ETH/USD">ETH/USD</option>
                        <option value="BTC/USD">BTC/USD</option>
                        <option value="FLR/USD">FLR/USD</option>
                    </select>
                </div>

                {currentPrice && (
                    <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm">Current Price: ${(currentPrice / 1000).toFixed(2)}</p>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Stop Loss: {stopLossPercent.toFixed(2)}% (${(stopLossPrice / 1000).toFixed(2)})
                    </label>
                    <input
                        type="range"
                        min="-5"
                        max="-0.01"
                        step="0.01"
                        value={stopLossPercent}
                        onChange={(e) => setStopLossPercent(parseFloat(e.target.value))}
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Take Profit: +{takeProfitPercent.toFixed(2)}% (${(takeProfitPrice / 1000).toFixed(2)})
                    </label>
                    <input
                        type="range"
                        min="0.01"
                        max="5"
                        step="0.01"
                        value={takeProfitPercent}
                        onChange={(e) => setTakeProfitPercent(parseFloat(e.target.value))}
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Collateral (ETH)</label>
                    <input
                        type="number"
                        step="0.001"
                        value={collateral}
                        onChange={(e) => setCollateral(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {isLoading ? "Creating..." : "Create Payment"}
                </button>
            </form>
        </div>
    );
}
