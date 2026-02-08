"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Contract, JsonRpcProvider } from "ethers";
import { CONTRACT_ADDRESS, FEED_IDS, RPC_URL } from "@/lib/contract/constants";
import ABI from "@/lib/contract/abi.json";

interface PriceData {
    symbol: string;
    price: number;
    decimals: number;
    timestamp: number;
    loading: boolean;
    error: string | null;
}

interface PriceContextType {
    prices: Record<string, PriceData>;
    refetchPrices: () => Promise<void>;
    nextRefresh: number;
}

const PriceContext = createContext<PriceContextType | undefined>(undefined);

const publicProvider = new JsonRpcProvider(RPC_URL);

export function PriceProvider({ children }: { children: ReactNode }) {
    const [prices, setPrices] = useState<Record<string, PriceData>>({
        "ETH/USD": { symbol: "ETH/USD", price: 0, decimals: 0, timestamp: 0, loading: true, error: null },
        "FLR/USD": { symbol: "FLR/USD", price: 0, decimals: 0, timestamp: 0, loading: true, error: null },
        "BTC/USD": { symbol: "BTC/USD", price: 0, decimals: 0, timestamp: 0, loading: true, error: null },
    });
    const [nextRefresh, setNextRefresh] = useState(Date.now() + 10000);

    const fetchPrice = async (symbol: keyof typeof FEED_IDS): Promise<PriceData> => {
        try {
            const contract = new Contract(CONTRACT_ADDRESS, ABI, publicProvider);
            const feedId = FEED_IDS[symbol];

            const [priceWei, decimals, timestamp] = await contract.getCurrentPrice.staticCall(feedId);

            const decimalsVal = Number(decimals);
            // Store raw price value (not divided), matching contract scale
            const rawPrice = Number(priceWei);

            const priceData: PriceData = {
                symbol,
                price: rawPrice,
                decimals: decimalsVal,
                timestamp: Number(timestamp),
                loading: false,
                error: null,
            };

            return priceData;
        } catch (err: any) {
            console.error(`[PriceProvider] Error fetching ${symbol} price:`, err.message);
            return {
                symbol,
                price: prices[symbol]?.price || 0, // Keep last known price
                decimals: prices[symbol]?.decimals || 0,
                timestamp: prices[symbol]?.timestamp || 0,
                loading: false,
                error: err.message || "Oracle unreachable",
            };
        }
    };

    const refetchPrices = async () => {
        // Mark all as loading
        setPrices(prev => ({
            ...prev,
            "ETH/USD": { ...prev["ETH/USD"], loading: true },
            "FLR/USD": { ...prev["FLR/USD"], loading: true },
            "BTC/USD": { ...prev["BTC/USD"], loading: true },
        }));

        // Fetch all prices in parallel
        const [ethData, flrData, btcData] = await Promise.all([
            fetchPrice("ETH/USD"),
            fetchPrice("FLR/USD"),
            fetchPrice("BTC/USD"),
        ]);

        setPrices({
            "ETH/USD": ethData,
            "FLR/USD": flrData,
            "BTC/USD": btcData,
        });

        setNextRefresh(Date.now() + 10000);
    };

    useEffect(() => {
        // Initial fetch
        refetchPrices();

        // Set up polling every 10 seconds
        const interval = setInterval(refetchPrices, 10000);

        return () => clearInterval(interval);
    }, []);

    return (
        <PriceContext.Provider value={{ prices, refetchPrices, nextRefresh }}>
            {children}
        </PriceContext.Provider>
    );
}

export function usePrices() {
    const context = useContext(PriceContext);
    if (context === undefined) {
        throw new Error("usePrices must be used within PriceProvider");
    }
    return context;
}
