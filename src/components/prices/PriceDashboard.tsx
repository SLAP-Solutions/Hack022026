"use client";

import { useFTSOPrices } from "../../hooks/useFTSOPrices";
import { PriceCard } from "./PriceCard";
import { useWallet } from "../../hooks/useWallet";

export function PriceDashboard() {
    const { isConnected, address } = useWallet();
    const { prices, refresh } = useFTSOPrices();

    console.log("Wallet connected:", isConnected, "Address:", address);

    if (!isConnected) {
        return (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8 text-center">
                <p className="text-blue-800 text-lg">
                    Connect your wallet to view live FTSO prices
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Live FTSO Prices</h2>
                    <p className="text-gray-600 text-sm">
                        Real-time decentralized oracle data from Flare Network
                    </p>
                </div>
                <button
                    onClick={refresh}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    🔄 Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                    <span className="text-green-500">●</span>
                    Prices update automatically every 10 seconds from Flare FTSO v2
                </p>
            </div>
        </div>
    );
}
