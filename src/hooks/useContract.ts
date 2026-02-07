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

            return tx.hash;
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
            const contract = getReadOnlyContract();
            const feedId = FEED_IDS[feedSymbol];
            // The ABI defines this function as 'nonpayable' (write), implying a state change.
            // Since we are using a read-only provider (no signer), we must use .staticCall()
            // to simulate the transaction and read the return value without broadcasting a tx.
            const result = await contract.getCurrentPrice.staticCall(feedId);
            const [price, decimals, timestamp] = result;

            console.log(`Fetched price for ${feedSymbol}:`, Number(price));

            return {
                price: Number(price),
                decimals: Number(decimals),
                timestamp: Number(timestamp),
            };
        } catch (err: any) {
            console.error(`Error getting price for ${feedSymbol}:`, err);
            throw err;
        }
    };

    /**
     * Creates and executes a payment instantly in a single transaction
     * Use this for immediate payments without price trigger conditions
     */
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

            return tx.hash;
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
        getClaimPayment,
        getTotalPayments,
        getCurrentPrice,
        createInstantPayment,
        isLoading,
        error,
    };
}