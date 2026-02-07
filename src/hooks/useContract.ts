"use client";

import { useState } from "react";
import { Contract, parseEther, formatEther } from "ethers";
import { useWallet } from "./useWallet";
import { CONTRACT_ADDRESS, FEED_IDS } from "../lib/contract/constants";
import ABI from "../lib/contract/abi.json";

export interface Claim {
    id: string;
    beneficiary: string;
    payoutAmount: string;
    feedId: string;
    triggerPrice: string;
    isPriceAbove: boolean;
    createdAt: number;
    executed: boolean;
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

    const createClaim = async (
        feedSymbol: keyof typeof FEED_IDS,
        triggerPrice: string,
        isPriceAbove: boolean,
        payoutAmount: string
    ) => {
        try {
            setIsLoading(true);
            setError(null);

            const contract = await getContract();
            const feedId = FEED_IDS[feedSymbol];

            // Convert trigger price to wei (assuming 5 decimals for FTSO feeds)
            const triggerPriceWei = parseEther(triggerPrice);
            const payoutWei = parseEther(payoutAmount);

            const tx = await contract.createClaim(feedId, triggerPriceWei, isPriceAbove, {
                value: payoutWei,
            });

            const receipt = await tx.wait();
            console.log("Claim created:", receipt);

            return tx.hash;
        } catch (err: any) {
            const errorMessage = err.reason || err.message || "Unknown error";
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const executeClaim = async (claimId: string) => {
        try {
            setIsLoading(true);
            setError(null);

            const contract = await getContract();
            const tx = await contract.executeClaim(claimId);
            const receipt = await tx.wait();

            console.log("Claim executed:", receipt);
            return tx.hash;
        } catch (err: any) {
            const errorMessage = err.reason || err.message || "Unknown error";
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const getClaim = async (claimId: string): Promise<Claim> => {
        const contract = await getContract();
        const claim = await contract.getClaim(claimId);

        return {
            id: claim.id.toString(),
            beneficiary: claim.beneficiary,
            payoutAmount: formatEther(claim.payoutAmount),
            feedId: claim.feedId,
            triggerPrice: formatEther(claim.triggerPrice),
            isPriceAbove: claim.isPriceAbove,
            createdAt: Number(claim.createdAt),
            executed: claim.executed,
        };
    };

    const getCurrentPrice = async (feedSymbol: keyof typeof FEED_IDS) => {
        try {
            const contract = await getContract();
            const feedId = FEED_IDS[feedSymbol];
            // Use staticCall to avoid creating an unnecessary transaction (read-only operation)
            const [price, decimals, timestamp] = await contract.getCurrentPrice.staticCall(feedId);

            return {
                price: formatEther(price),
                decimals: Number(decimals),
                timestamp: Number(timestamp),
            };
        } catch (err: any) {
            console.error("Error getting price:", err);
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
        createClaim,
        executeClaim,
        getClaim,
        getCurrentPrice,
        createInstantPayment,
        isLoading,
        error,
    };
}