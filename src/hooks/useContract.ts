"use client";

import { useState } from "react";
import { Contract, parseEther, formatEther, JsonRpcProvider } from "ethers";
import { useWallet } from "./useWallet";
import { CONTRACT_ADDRESS, FEED_IDS, RPC_URL } from "../lib/contract/constants";
import ABI from "../lib/contract/abi.json";

export interface ClaimPayment {
    id: number;
    payer: string;
    receiver: string;
    usdAmount: number;
    cryptoFeedId: string;
    stopLossPrice: bigint;
    takeProfitPrice: bigint;
    collateralAmount: bigint;
    createdAt: number;
    createdAtPrice: bigint;
    expiresAt: number;
    executed: boolean;
    executedAt: number;
    executedPrice: bigint;
    paidAmount: bigint;
}

export function useContract() {
    const { provider, address } = useWallet();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const publicProvider = new JsonRpcProvider(RPC_URL);

    const getContract = async () => {
        if (!provider || !address) throw new Error("Wallet not connected");
        const signer = await provider.getSigner();
        return new Contract(CONTRACT_ADDRESS, ABI, signer);
    };

    const createClaimPayment = async (
        receiver: string,
        usdAmountCents: number,
        feedSymbol: keyof typeof FEED_IDS,
        stopLossPrice: bigint,
        takeProfitPrice: bigint,
        expiryDays: number,
        collateralEth: string
    ) => {
        try {
            setIsLoading(true);
            setError(null);

            const contract = await getContract();
            const feedId = FEED_IDS[feedSymbol];
            const collateralWei = parseEther(collateralEth);

            const tx = await contract.createClaimPayment(
                receiver,
                usdAmountCents,
                feedId,
                stopLossPrice,
                takeProfitPrice,
                expiryDays,
                { value: collateralWei }
            );

            const receipt = await tx.wait();
            console.log("Payment created:", receipt);

            let paymentId = undefined;
            for (const log of receipt.logs) {
                try {
                    const parsed = contract.interface.parseLog(log);
                    if (parsed?.name === 'ClaimPaymentCreated') {
                        paymentId = parsed.args[0].toString();
                        break;
                    }
                } catch (e) {
                    // ignore logs that can't be parsed
                }
            }

            return { hash: tx.hash, paymentId };
        } catch (err: any) {
            const errorMessage = err.reason || err.message || "Unknown error";
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const executeClaimPayment = async (paymentId: number) => {
        try {
            setIsLoading(true);
            setError(null);

            const contract = await getContract();
            const tx = await contract.executeClaimPayment(paymentId);
            const receipt = await tx.wait();

            console.log("Payment executed:", receipt);
            return tx.hash;
        } catch (err: any) {
            const errorMessage = err.reason || err.message || "Unknown error";
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const executePaymentEarly = async (paymentId: number): Promise<string> => {
        try {
            setIsLoading(true);
            setError(null);

            const contract = await getContract();
            const tx = await contract.executePaymentEarly(paymentId);
            const receipt = await tx.wait();

            console.log("Payment executed early:", receipt);
            return tx.hash;
        } catch (err: any) {
            const errorMessage = err.reason || err.message || "Unknown error";
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const getClaimPayment = async (paymentId: number): Promise<ClaimPayment> => {
        const contract = await getContract();
        const payment = await contract.getClaimPayment(paymentId);

        return {
            id: Number(payment.id),
            payer: payment.payer,
            receiver: payment.receiver,
            usdAmount: Number(payment.usdAmount),
            cryptoFeedId: payment.cryptoFeedId,
            stopLossPrice: payment.stopLossPrice,
            takeProfitPrice: payment.takeProfitPrice,
            collateralAmount: payment.collateralAmount,
            createdAt: Number(payment.createdAt),
            createdAtPrice: payment.createdAtPrice,
            expiresAt: Number(payment.expiresAt),
            executed: payment.executed,
            executedAt: Number(payment.executedAt),
            executedPrice: payment.executedPrice,
            paidAmount: payment.paidAmount,
        };
    };

    const getTotalPayments = async (): Promise<number> => {
        const contract = await getContract();
        const total = await contract.getTotalPayments();
        return Number(total);
    };

    const getReadOnlyContract = () => {
        // Use connected provider if available, otherwise fallback to public RPC
        if (provider) {
            return new Contract(CONTRACT_ADDRESS, ABI, provider);
        }
        const jsonRpcProvider = new JsonRpcProvider(RPC_URL);
        return new Contract(CONTRACT_ADDRESS, ABI, jsonRpcProvider);
    };

    const getCurrentPrice = async (feedSymbol: keyof typeof FEED_IDS) => {
        try {
            // Price lookups are forced through the main Flare RPC for maximum stability
            const contract = new Contract(CONTRACT_ADDRESS, ABI, publicProvider);
            const feedId = FEED_IDS[feedSymbol];

            // The ABI defines this function as 'nonpayable' (write), so we use staticCall
            // to simulate the execution and extract the price data from the oracle.
            const result = await contract.getCurrentPrice.staticCall(feedId);
            const [price, decimals, timestamp] = result;

            console.log(`[Contract] ${feedSymbol} price:`, Number(price));

            return {
                price: Number(price),
                decimals: Number(decimals),
                timestamp: Number(timestamp),
            };
        } catch (err: any) {
            console.error(`[Contract] Failed to fetch ${feedSymbol} price:`, err.message);

            // Fallback for UI if contract call fails completely
            return {
                price: 0,
                decimals: 0,
                timestamp: Math.floor(Date.now() / 1000),
                error: err.message
            };
        }
    };

    const createInstantPayment = async (
        receiverAddress: string,
        usdAmountCents: number,
        feedSymbol: keyof typeof FEED_IDS,
        collateralEth: string
    ) => {
        try {
            setIsLoading(true);
            setError(null);

            const contract = await getContract();
            const feedId = FEED_IDS[feedSymbol];
            const collateralWei = parseEther(collateralEth);

            const tx = await contract.createAndExecutePayment(
                receiverAddress,
                usdAmountCents,
                feedId,
                { value: collateralWei }
            );

            console.log("💸 Instant payment transaction sent:", tx.hash);
            const receipt = await tx.wait();
            console.log("✅ Instant payment confirmed:", receipt);

            let paymentId = undefined;
            for (const log of receipt.logs) {
                try {
                    const parsed = contract.interface.parseLog(log);
                    // Instant payment might typically verify execution, but we look for ID
                    if (parsed?.name === 'ClaimPaymentCreated' || parsed?.name === 'ClaimPaymentExecuted') {
                        paymentId = parsed.args[0].toString();
                        break;
                    }
                } catch (e) {
                    // ignore
                }
            }

            return { hash: tx.hash, paymentId };
        } catch (err: any) {
            const errorMessage = err.reason || err.message || "Unknown error";
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        createClaimPayment,
        executeClaimPayment,
        executePaymentEarly,
        getClaimPayment,
        getTotalPayments,
        getCurrentPrice,
        createInstantPayment,
        isLoading,
        error,
    };
}