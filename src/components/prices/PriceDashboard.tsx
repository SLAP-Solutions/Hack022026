"use client";

import { useFTSOPrices } from "../../hooks/useFTSOPrices";
import { PriceCard } from "./PriceCard";

export function PriceDashboard() {
    const { prices } = useFTSOPrices();

    return (
        <div className="w-[60%]">
            <div className="grid grid-cols-3 w-full">
                <PriceCard
                    symbol={prices["ETH/USD"].symbol}
                    price={prices["ETH/USD"].price}
                    timestamp={prices["ETH/USD"].timestamp}
                    loading={prices["ETH/USD"].loading}
                    error={prices["ETH/USD"].error}
                />
                <PriceCard
                    symbol={prices["FLR/USD"].symbol}
                    price={prices["FLR/USD"].price}
                    timestamp={prices["FLR/USD"].timestamp}
                    loading={prices["FLR/USD"].loading}
                    error={prices["FLR/USD"].error}
                />
                <PriceCard
                    symbol={prices["BTC/USD"].symbol}
                    price={prices["BTC/USD"].price}
                    timestamp={prices["BTC/USD"].timestamp}
                    loading={prices["BTC/USD"].loading}
                    error={prices["BTC/USD"].error}
                />
            </div>
        </div>
    );
}
