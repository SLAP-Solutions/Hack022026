"use client";

import { useContract } from "@/hooks/useContract";
import { ClaimPaymentWithPrice } from "@/hooks/usePayments";
import { FEED_IDS } from "@/lib/contract/constants";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PaymentCardProps {
    payment: ClaimPaymentWithPrice;
    onRefresh?: () => void;
}

// Create reverse mapping from feedId to symbol
const FEED_ID_TO_SYMBOL: Record<string, string> = {
    [FEED_IDS["ETH/USD"]]: "ETH",
    [FEED_IDS["FLR/USD"]]: "FLR",
    [FEED_IDS["BTC/USD"]]: "BTC",
};

export function PaymentCard({ payment, onRefresh }: PaymentCardProps) {
    const { executeClaimPayment, isLoading } = useContract();

    const handleExecute = async () => {
        try {
            await executeClaimPayment(payment.id);
            alert("Payment executed! Check transaction history.");
            onRefresh?.();
        } catch (error: any) {
            console.error(error);
            const reason = error.message || "Execution failed";
            alert(`Execution failed: ${reason}`);
        }
    };

    // Get ticker symbol from feed ID
    const ticker = FEED_ID_TO_SYMBOL[payment.cryptoFeedId] || "???";

    // Convert prices from feed decimals (assuming 3 decimals for FTSO)
    const decimals = 3;
    const multiplier = Math.pow(10, decimals);

    const usdAmountDollars = payment.usdAmount / 100;
    const stopLoss = Number(payment.stopLossPrice) / multiplier;
    const takeProfit = Number(payment.takeProfitPrice) / multiplier;
    const current = payment.currentPrice / multiplier;
    const executedPrice = payment.executed ? Number(payment.executedPrice) / multiplier : null;

    // Determine trigger hit status
    const stopLossHit = current > 0 && current <= stopLoss;
    const takeProfitHit = current > 0 && current >= takeProfit;
    const canExecute = !payment.executed && (stopLossHit || takeProfitHit);

    // Calculate progress bar position
    const progress = stopLoss < takeProfit
        ? ((current - stopLoss) / (takeProfit - stopLoss)) * 100
        : 50;

    // Calculate potential payout amounts
    const calculateCryptoAmount = (price: number) => {
        if (price <= 0) return 0;
        return (payment.usdAmount * 1e18 * multiplier) / (price * 100);
    };

    const cryptoAtStopLoss = calculateCryptoAmount(stopLoss);
    const cryptoAtCurrent = calculateCryptoAmount(current);
    const cryptoAtTakeProfit = calculateCryptoAmount(takeProfit);

    // Calculate savings
    const savingsVsStopLoss = current > stopLoss && current > 0
        ? ((cryptoAtStopLoss - cryptoAtCurrent) / cryptoAtStopLoss) * 100
        : 0;

    const savingsVsTakeProfit = current > takeProfit && current > 0
        ? ((cryptoAtStopLoss - cryptoAtTakeProfit) / cryptoAtStopLoss) * 100
        : 0;

    return (
        <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-bold text-lg">${usdAmountDollars.toFixed(2)}</h3>
                    <p className="text-sm text-muted-foreground">ID: {payment.id.toString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Calculated as {ticker}, paid in FLR
                    </p>
                </div>
                <Badge
                    variant="outline"
                    className={cn(
                        "text-xs",
                        payment.executed
                            ? "bg-green-100 text-green-800 border-green-300"
                            : canExecute
                                ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                : "bg-primary/20 text-primary border-primary/40"
                    )}
                >
                    {payment.executed ? "✓ Executed" : canExecute ? "⚡ Ready" : "⏳ Pending"}
                </Badge>
            </div>

            {/* Receiver info */}
            <div className="text-sm space-y-1 mb-3 text-muted-foreground">
                <p>
                    Receiver: <span className="font-mono">{payment.receiver.slice(0, 6)}...{payment.receiver.slice(-4)}</span>
                </p>
                <p>
                    Stop Loss: <span className="text-red-600 font-medium">${stopLoss.toFixed(2)}</span>
                </p>
                <p>
                    Take Profit: <span className="text-green-600 font-medium">${takeProfit.toFixed(2)}</span>
                </p>
                <p className="font-semibold text-foreground">
                    Current Price: ${current > 0 ? current.toFixed(2) : "Loading..."}
                </p>
                {payment.executed && executedPrice && (
                    <p className="text-green-600 font-semibold">
                        Executed At: ${executedPrice.toFixed(2)}
                    </p>
                )}
            </div>

            {/* Progress bar */}
            <div className="mb-3">
                <div className="w-full bg-muted rounded-full h-2">
                    <div
                        className={cn(
                            "h-2 rounded-full transition-all",
                            progress <= 0 ? "bg-red-500" : progress >= 100 ? "bg-green-500" : "bg-primary"
                        )}
                        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{stopLossHit ? "🔴 Hit!" : "Stop Loss"}</span>
                    <span>{takeProfitHit ? "🟢 Hit!" : "Take Profit"}</span>
                </div>
            </div>

            {/* Payout breakdown */}
            <div className="bg-muted/50 p-3 rounded text-sm space-y-1 mb-3">
                <h4 className="font-semibold text-xs mb-2">Estimated Payout (FLR)</h4>

                <div className="space-y-1">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">If Stop Loss:</span>
                        <span className="font-mono text-red-600">
                            {ethers.formatEther(cryptoAtStopLoss.toString()).substring(0, 10)} FLR
                        </span>
                    </div>

                    {!payment.executed && current > 0 && (
                        <>
                            <div className="flex justify-between">
                                <span className="font-medium">If Now:</span>
                                <span className="font-mono font-semibold">
                                    {ethers.formatEther(cryptoAtCurrent.toString()).substring(0, 10)} FLR
                                </span>
                            </div>

                            {savingsVsStopLoss > 0 && (
                                <div className="text-xs text-green-600 text-right">
                                    💰 {savingsVsStopLoss.toFixed(1)}% savings vs stop loss
                                </div>
                            )}
                        </>
                    )}

                    <div className="flex justify-between">
                        <span className="text-muted-foreground">If Take Profit:</span>
                        <span className="font-mono text-green-600">
                            {ethers.formatEther(cryptoAtTakeProfit.toString()).substring(0, 10)} FLR
                        </span>
                    </div>

                    {savingsVsTakeProfit > 0 && (
                        <div className="text-xs text-green-700 font-semibold text-right border-t pt-1 mt-1">
                            🎯 Max savings: {savingsVsTakeProfit.toFixed(1)}%
                        </div>
                    )}

                    {payment.executed && (
                        <div className="flex justify-between bg-green-100 -mx-3 px-3 py-2 mt-2 rounded border-t">
                            <span className="text-green-800 font-semibold">Actual Paid:</span>
                            <span className="font-mono text-green-900 font-bold">
                                {ethers.formatEther(payment.paidAmount.toString()).substring(0, 10)} FLR
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Action button */}
            {!payment.executed && (
                <Button
                    onClick={handleExecute}
                    disabled={isLoading || !canExecute}
                    className="w-full"
                    variant={canExecute ? "default" : "secondary"}
                >
                    {isLoading ? "Executing..." : canExecute ? "⚡ Execute Payment" : "⏳ Waiting for Trigger"}
                </Button>
            )}

            {/* Collateral info */}
            <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                <div className="flex justify-between">
                    <span>Locked Collateral:</span>
                    <span className="font-mono">
                        {ethers.formatEther(payment.collateralAmount.toString()).substring(0, 10)} FLR
                    </span>
                </div>
                {!payment.executed && (
                    <p className="text-xs mt-1">
                        Excess collateral refunded after execution
                    </p>
                )}
            </div>
        </div>
    );
}
