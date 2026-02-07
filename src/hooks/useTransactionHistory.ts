"use client";

import { useState, useEffect } from "react";
import { useWallet } from "./useWallet";
import { ethers } from "ethers";
import { RPC_URL, BLOCK_EXPLORER, CONTRACT_ADDRESS } from "@/lib/contract/constants";

interface Transaction {
    hash: string;
    from: string;
    to: string;
    value: string;
    timestamp: number;
    blockNumber: number;
    isContractInteraction: boolean;
    method?: string;
    status?: string;
}

export function useTransactionHistory() {
    const { address } = useWallet();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTransactions = async () => {
        if (!address) {
            setTransactions([]);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Option 1: Query Coston2 Block Explorer API
            const explorerApiUrl = `https://coston2-explorer.flare.network/api?module=account&action=txlist&address=${address}&sort=desc&page=1&offset=50`;
            
            const response = await fetch(explorerApiUrl);
            const data = await response.json();

            if (data.status === "1" && Array.isArray(data.result)) {
                const txs: Transaction[] = data.result.map((tx: any) => ({
                    hash: tx.hash,
                    from: tx.from,
                    to: tx.to || "Contract Creation",
                    value: ethers.formatEther(tx.value),
                    timestamp: parseInt(tx.timeStamp) * 1000,
                    blockNumber: parseInt(tx.blockNumber),
                    isContractInteraction: tx.to?.toLowerCase() === CONTRACT_ADDRESS.toLowerCase(),
                    method: tx.functionName || (tx.input !== "0x" ? "Contract Call" : "Transfer"),
                    status: tx.isError === "0" ? "success" : "failed",
                }));
                
                setTransactions(txs);
            } else {
                // Fallback: No transactions or API error
                console.log("No transactions found or API error:", data.message);
                setTransactions([]);
            }
        } catch (err: any) {
            console.error("Error fetching transactions:", err);
            setError(err.message);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
        // Refresh every 30 seconds
        const interval = setInterval(fetchTransactions, 30000);
        return () => clearInterval(interval);
    }, [address]);

    return { transactions, loading, error, refetch: fetchTransactions };
}
