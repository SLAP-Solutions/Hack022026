"use client";

import { useState } from "react";
import { useContract } from "@/hooks/useContract";
import { FEED_IDS } from "@/lib/contract/constants";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useContactsStore } from "../../stores/useContactsStore";
import { Pen, Clock, AlertCircle, Loader2 } from "lucide-react";
import { useFTSOPrices } from "@/hooks/useFTSOPrices";

interface PendingPayment {
    id: string;
    payer: string;
    receiver: string;
    usdAmount: number;
    cryptoFeedId: string;
    stopLossPrice: bigint | number;
    takeProfitPrice: bigint | number;
    collateralAmount: bigint | number;
    expiryDays: number;
    status: string;
    description?: string;
    createdByAgent?: boolean;
    agentCreatedAt?: string;
}

interface PendingSignaturePaymentCardProps {
    payment: PendingPayment;
    onSign?: (paymentId: string, blockchainPaymentId: string) => void;
    onCancel?: (paymentId: string) => void;
}

// Create reverse mapping from feedId to symbol
const FEED_ID_TO_SYMBOL: Record<string, keyof typeof FEED_IDS> = {
    [FEED_IDS["ETH/USD"]]: "ETH/USD",
    [FEED_IDS["FLR/USD"]]: "FLR/USD",
    [FEED_IDS["BTC/USD"]]: "BTC/USD",
    "ETH/USD": "ETH/USD",
    "FLR/USD": "FLR/USD",
    "BTC/USD": "BTC/USD",
};

export function PendingSignaturePaymentCard({ 
    payment, 
    onSign, 
    onCancel 
}: PendingSignaturePaymentCardProps) {
    const { createClaimPayment, getCurrentPrice, isLoading } = useContract();
    const { contacts } = useContactsStore();
    const { prices } = useFTSOPrices();
    const [isSigning, setIsSigning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get the feed symbol
    const feedKey = FEED_ID_TO_SYMBOL[payment.cryptoFeedId] || "ETH/USD";
    const ticker = feedKey.split('/')[0];

    // Get current price from FTSO
    const priceData = prices[feedKey];
    const currentPrice = priceData ? parseFloat(priceData.price) : 0;
    const decimals = 3;

    // Calculate USD amount in dollars (stored in cents)
    const usdAmountDollars = payment.usdAmount / 100;

    // Calculate required collateral based on current price
    const calculateRequiredCollateral = () => {
        if (!currentPrice || currentPrice <= 0) return BigInt(0);

        const usdCents = payment.usdAmount;
        const decimalsMultiplier = Math.pow(10, decimals);
        const priceScaled = currentPrice * decimalsMultiplier;

        // Use 150% collateral ratio for safety
        const collateralRatio = 150;
        const maxCryptoNeeded = (usdCents * 1e18 * decimalsMultiplier) / (priceScaled * 100);
        const collateral = (maxCryptoNeeded * collateralRatio) / 100;

        return BigInt(Math.floor(collateral));
    };

    const handleSign = async () => {
        setIsSigning(true);
        setError(null);

        try {
            // Get current price for calculations
            const priceResult = await getCurrentPrice(feedKey);
            const currentPriceScaled = priceResult.price;

            // Calculate stop loss and take profit (default ±5% from current price)
            const stopLossPercent = -5;
            const takeProfitPercent = 5;
            const stopLoss = BigInt(Math.floor(currentPriceScaled * (1 + stopLossPercent / 100)));
            const takeProfit = BigInt(Math.floor(currentPriceScaled * (1 + takeProfitPercent / 100)));

            // Calculate collateral
            const collateralWei = calculateRequiredCollateral();
            const collateralEth = ethers.formatEther(collateralWei.toString());

            // Create the payment on the blockchain
            const result = await createClaimPayment(
                payment.receiver,
                Math.floor(payment.usdAmount), // Amount in cents
                feedKey,
                stopLoss,
                takeProfit,
                payment.expiryDays,
                collateralEth
            );

            // Notify parent of successful signing
            onSign?.(payment.id, result.paymentId);
        } catch (err: any) {
            console.error("Failed to sign payment:", err);
            setError(err.message || "Failed to sign payment");
        } finally {
            setIsSigning(false);
        }
    };

    const contact = contacts.find(c => c.receiverAddress.toLowerCase() === payment.receiver.toLowerCase());
    const receiverName = contact ? contact.name : `${payment.receiver.slice(0, 6)}...${payment.receiver.slice(-4)}`;

    const collateralWei = calculateRequiredCollateral();
    const collateralEth = ethers.formatEther(collateralWei.toString());
    const tickerAmount = currentPrice > 0 ? usdAmountDollars / currentPrice : 0;

    return (
        <div className="border-2 border-amber-500/40 rounded-lg p-4 bg-amber-50/50 dark:bg-amber-950/20 relative h-fit">
            {/* Agent badge */}
            {payment.createdByAgent && (
                <div className="absolute -top-2 -right-2">
                    <Badge className="bg-amber-500 text-white text-[10px] px-2">
                        Agent Created
                    </Badge>
                </div>
            )}

            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        ${usdAmountDollars.toFixed(2)}
                        {currentPrice > 0 && (
                            <span className="text-sm font-normal text-muted-foreground">
                                (~{tickerAmount.toFixed(4)} {ticker})
                            </span>
                        )}
                    </h3>
                    <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                        <p>To: <span className={cn("font-medium", contact ? "text-primary" : "font-mono text-xs")}>
                            {receiverName}
                        </span></p>
                        {payment.description && (
                            <p className="text-xs italic">{payment.description}</p>
                        )}
                    </div>
                </div>
                <Badge
                    variant="outline"
                    className="bg-amber-500/20 text-amber-600 border-amber-500/40 text-xs"
                >
                    <Pen className="w-3 h-3 mr-1" />
                    Awaiting Signature
                </Badge>
            </div>

            {/* Payment details */}
            <div className="bg-white/50 dark:bg-black/20 p-3 rounded text-sm space-y-2 mb-3">
                <h4 className="font-semibold text-xs mb-2 border-b pb-1 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Payment Details
                </h4>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <span className="text-muted-foreground">Payment ID:</span>
                    <span className="font-mono text-right text-[10px]">{payment.id}</span>

                    <span className="text-muted-foreground">Price Feed:</span>
                    <span className="font-mono text-right">{feedKey}</span>

                    <span className="text-muted-foreground">Current Price:</span>
                    <span className="font-mono text-right">
                        {currentPrice > 0 ? `$${currentPrice.toFixed(2)}` : "Loading..."}
                    </span>

                    <span className="text-muted-foreground">Expiry:</span>
                    <span className="font-mono text-right">{payment.expiryDays} days</span>

                    <span className="text-muted-foreground mt-2 pt-2 border-t">Est. Collateral:</span>
                    <span className="font-mono text-right mt-2 pt-2 border-t">
                        {currentPrice > 0 ? `${parseFloat(collateralEth).toFixed(6)} FLR` : "Calculating..."}
                    </span>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="bg-red-100 dark:bg-red-950/30 border border-red-300 dark:border-red-800 rounded p-2 mb-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-600">{error}</p>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
                <Button
                    onClick={handleSign}
                    disabled={isSigning || isLoading || currentPrice <= 0}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                >
                    {isSigning ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Signing...
                        </>
                    ) : (
                        <>
                            <Pen className="w-4 h-4 mr-2" />
                            Sign & Submit
                        </>
                    )}
                </Button>
                {onCancel && (
                    <Button
                        variant="outline"
                        onClick={() => onCancel(payment.id)}
                        disabled={isSigning}
                        className="text-muted-foreground"
                    >
                        Cancel
                    </Button>
                )}
            </div>

            <p className="text-[10px] text-muted-foreground text-center mt-2">
                Signing will create a blockchain transaction requiring your wallet approval
            </p>
        </div>
    );
}
