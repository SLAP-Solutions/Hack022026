"use client";

import { useState, useEffect, useRef } from "react";
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
    const contract = useContract();
    const [payments, setPayments] = useState<ClaimPaymentWithPrice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refetchTrigger, setRefetchTrigger] = useState(0);
    const hasFetchedOnce = useRef(false);
    const contractRef = useRef(contract);
    contractRef.current = contract;

    useEffect(() => {
        let cancelled = false;
        let timeoutId: NodeJS.Timeout;

        // Reset on address change
        if (refetchTrigger === 0) {
            hasFetchedOnce.current = false;
        }

        const fetchPayments = async (showLoading: boolean) => {
            if (!address) {
                setPayments([]);
                setLoading(false);
                return;
            }

            const { getTotalPayments, getClaimPayment, getCurrentPrice } = contractRef.current;

            try {
                // Only show loading spinner on initial load
                if (showLoading) {
                    setLoading(true);
                }

                const total = await getTotalPayments();
                const allPayments: ClaimPaymentWithPrice[] = [];

                for (let i = 0; i < total; i++) {
                    if (cancelled) return;
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

                if (!cancelled) {
                    setPayments(allPayments);
                    setError(null);
                    hasFetchedOnce.current = true;
                    setLoading(false);
                }
            } catch (err: any) {
                if (!cancelled) {
                    setError(err.message);
                    setLoading(false);
                }
            }
        };

        const poll = async () => {
            if (cancelled) return;
            await fetchPayments(false);
            if (!cancelled) {
                timeoutId = setTimeout(poll, 2000);
            }
        };

        // Initial fetch then start polling
        const init = async () => {
            await fetchPayments(!hasFetchedOnce.current);
            if (!cancelled) {
                timeoutId = setTimeout(poll, 2000);
            }
        };

        init();

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, [address, refetchTrigger]);

    const refetch = () => {
        hasFetchedOnce.current = false;
        setRefetchTrigger(prev => prev + 1);
    };

    return { payments, isLoading: loading, error, refetch };
}
