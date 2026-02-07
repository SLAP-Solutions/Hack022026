"use client";

import { useState, useEffect } from "react";
import { useFTSOPrices } from "../../hooks/useFTSOPrices";
import { PriceCard } from "./PriceCard";
import { Clock } from "lucide-react";

export function PriceDashboard() {
    const { prices, nextRefresh } = useFTSOPrices();
    const feeds = ["FLR/USD", "ETH/USD", "BTC/USD"];

    const [secondsLeft, setSecondsLeft] = useState(0);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const left = Math.max(0, Math.ceil((nextRefresh - Date.now()) / 1000));
            setSecondsLeft(left);
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [nextRefresh]);

    return (
        <div className="w-full space-y-1">
            <div className="flex items-center justify-between px-2 py-2 mb-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Market Prices</span>
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono transition-opacity hover:opacity-100 opacity-70">
                    <Clock className="w-3 h-3" />
                    {secondsLeft}s
                </span>
            </div>
            {feeds.map(feed => (
                <PriceCard
                    key={feed}
                    symbol={prices[feed].symbol}
                    price={prices[feed].price}
                    timestamp={prices[feed].timestamp}
                    loading={prices[feed].loading}
                    error={prices[feed].error}
                />
            ))}
        </div>
    );
}
