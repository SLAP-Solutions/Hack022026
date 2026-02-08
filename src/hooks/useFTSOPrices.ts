"use client";

import { useState, useEffect } from "react";
import { Contract, JsonRpcProvider } from "ethers";
import { CONTRACT_ADDRESS, FEED_IDS, RPC_URL } from "../lib/contract/constants";
import ABI from "../lib/contract/abi.json";

interface PriceData {
    symbol: string;
    price: string;
    decimals: number;
    timestamp: number;
    loading: boolean;
    error: string | null;
}

const publicProvider = new JsonRpcProvider(RPC_URL);

export function useFTSOPrices() {

    const [prices, setPrices] = useState<Record<string, PriceData>>({
        "ETH/USD": { symbol: "ETH/USD", price: "0", decimals: 0, timestamp: 0, loading: true, error: null },
        "FLR/USD": { symbol: "FLR/USD", price: "0", decimals: 0, timestamp: 0, loading: true, error: null },
        "BTC/USD": { symbol: "BTC/USD", price: "0", decimals: 0, timestamp: 0, loading: true, error: null },
    });

    const [nextRefresh, setNextRefresh] = useState(Date.now() + 10000);

    const fetchPrice = async (symbol: keyof typeof FEED_IDS) => {
        try {
            const contract = new Contract(CONTRACT_ADDRESS, ABI, publicProvider);
            const feedId = FEED_IDS[symbol];

            const [priceWei, decimals, timestamp] = await contract.getCurrentPrice.staticCall(feedId);

            const decimalsVal = Number(decimals);

            const priceNumber = Number(priceWei) / Math.pow(10, Math.abs(decimalsVal));

            setPrices(prev => ({
                ...prev,
                [symbol]: {
                    symbol,
                    price: priceNumber.toFixed(2),
                    decimals: decimalsVal,
                    timestamp: Number(timestamp),
                    loading: false,
                    error: null,
                }
            }));
        } catch (err: any) {
            console.error(`[FTSO] Error fetching ${symbol} price:`, err.message);
            setPrices(prev => ({
                ...prev,
                [symbol]: {
                    ...prev[symbol],
                    loading: false,
                    error: err.message || "Oracle unreachable",
                }
            }));
        }
    };

    const fetchAllPrices = async () => {
        await Promise.all([
            fetchPrice("ETH/USD"),
            fetchPrice("FLR/USD"),
            fetchPrice("BTC/USD"),
        ]);
        setNextRefresh(Date.now() + 10000);
    };

    useEffect(() => {
        fetchAllPrices();

        const interval = setInterval(fetchAllPrices, 10000);

        return () => clearInterval(interval);
    }, []);

    return { prices, refresh: fetchAllPrices, nextRefresh };
}
