"use client";

import { useState, useEffect } from "react";
import { useContract, ClaimPayment } from "./useContract";
import { useWallet } from "./useWallet";
import { FEED_IDS } from "@/lib/contract/constants";

// Create reverse mapping from feedId to symbol
const FEED_ID_TO_SYMBOL: Record<string, keyof typeof FEED_IDS> = {
    [FEED_IDS["ETH/USD"]]: "ETH/USD",
    [FEED_IDS["FLR/USD"]]: "FLR/USD",
    [FEED_IDS["BTC/USD"]]: "BTC/USD",
};

export interface ClaimPaymentWithPrice extends ClaimPayment {
    currentPrice: number;
}

export function usePayments() {
    const { address } = useWallet();
    const { getTotalPayments, getClaimPayment, getCurrentPrice } = useContract();
    const [payments, setPayments] = useState<ClaimPaymentWithPrice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPayments = async () => {
        if (!address) {
            setPayments([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const total = await getTotalPayments();
            const allPayments: ClaimPaymentWithPrice[] = [];

            for (let i = 0; i < total; i++) {
                try {
                    const payment = await getClaimPayment(i);
                    if (payment.payer.toLowerCase() === address.toLowerCase()) {
                        // Fetch current price for this payment's feed
                        const feedSymbol = FEED_ID_TO_SYMBOL[payment.cryptoFeedId];
                        let currentPrice = 0;
                        if (feedSymbol) {
                            try {
                                const priceData = await getCurrentPrice(feedSymbol);
                                currentPrice = priceData.price;
                            } catch (priceErr) {
                                console.error(`Failed to fetch price for ${feedSymbol}:`, priceErr);
                            }
                        }

                        allPayments.push({
                            ...payment,
                            currentPrice,
                        });
                    }
                } catch (err) {
                    console.error(`Failed to fetch payment ${i}:`, err);
                }
            }

            setPayments(allPayments);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
        const interval = setInterval(fetchPayments, 10000);
        return () => clearInterval(interval);
    }, [address]);

    return { payments, isLoading: loading, error, refetch: fetchPayments };
}
