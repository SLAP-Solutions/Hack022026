"use client";

import { useFTSOPrices } from "../../hooks/useFTSOPrices";
import { PriceCard } from "./PriceCard";

export function PriceDashboard() {
    const { prices } = useFTSOPrices();
    const feeds = ["FLR/USD", "ETH/USD", "BTC/USD"];

    return (
        <div className="w-full space-y-1">
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
