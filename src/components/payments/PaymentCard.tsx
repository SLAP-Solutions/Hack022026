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
    
    // Convert prices from feed decimals (assuming 3 decimals = 1000x multiplier)
    const decimals = 3; // FTSO uses 3 decimals for USD pairs
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

    // Calculate potential payout amounts at different prices
    const calculateCryptoAmount = (price: number) => {
        if (price <= 0) return 0;
        return (payment.usdAmount * 1e18 * multiplier) / (price * 100);
    };

    const cryptoAtStopLoss = calculateCryptoAmount(stopLoss);
    const cryptoAtCurrent = calculateCryptoAmount(current);
    const cryptoAtTakeProfit = calculateCryptoAmount(takeProfit);
    const cryptoExecuted = payment.executed && executedPrice 
        ? calculateCryptoAmount(executedPrice)
        : null;

    // Calculate savings (comparing to stop loss worst case)
    const savingsVsStopLoss = current > stopLoss && current > 0
        ? ((cryptoAtStopLoss - cryptoAtCurrent) / cryptoAtStopLoss) * 100
        : 0;

    const savingsVsTakeProfit = current > takeProfit && current > 0
        ? ((cryptoAtStopLoss - cryptoAtTakeProfit) / cryptoAtStopLoss) * 100
        : 0;

    return (
        <div className="bg-white p-4 rounded-lg shadow border">
            {/* Header with amount and status */}
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-bold text-xl">${usdAmountDollars.toFixed(2)} USD</h3>
                    <p className="text-xs text-gray-500">Payment ID: {payment.id.toString()}</p>
                    <p className="text-sm text-gray-700 font-medium mt-1">
                        Calculated as {ticker}, paid in FLR
                    </p>
                </div>
                <span
                    className={`px-3 py-1 rounded text-sm font-semibold ${
        <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-bold text-lg">${usdAmountDollars.toFixed(2)}</h3>
                    <p className="text-sm text-muted-foreground">ID: {payment.id.toString()}</p>
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
                </span>
            </div>

            {/* Receiver address */}
            <div className="mb-3 pb-3 border-b">
                <p className="text-xs text-gray-500">Receiver</p>
                <p className="text-sm font-mono">{payment.receiver.slice(0, 10)}...{payment.receiver.slice(-8)}</p>
                    {payment.executed ? "Executed" : canExecute ? "Ready" : "Pending"}
                </Badge>
            </div>

            <div className="text-sm space-y-1 mb-3 text-muted-foreground">
                <p>Receiver: <span className="font-mono">{payment.receiver.slice(0, 6)}...{payment.receiver.slice(-4)}</span></p>
                <p>Stop Loss: <span className="text-red-600 font-medium">${stopLoss.toFixed(2)}</span></p>
                <p>Take Profit: <span className="text-green-600 font-medium">${takeProfit.toFixed(2)}</span></p>
                <p className="font-semibold text-foreground">Current Price: ${current.toFixed(2)}</p>
            </div>

            {/* Price information */}
            <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                    <span className="text-red-600 font-semibold">⬇ Stop Loss ({ticker}/USD)</span>
                    <span className="font-mono">${stopLoss.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Current Price</span>
                    <span className="font-mono font-semibold">
                        ${current > 0 ? current.toFixed(2) : "Loading..."}
                    </span>
                </div>
                
                <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-semibold">⬆ Take Profit ({ticker}/USD)</span>
                    <span className="font-mono">${takeProfit.toFixed(2)}</span>
                </div>

                {payment.executed && executedPrice && (
                    <div className="flex justify-between text-sm bg-green-50 -mx-4 px-4 py-2">
                        <span className="text-green-800 font-semibold">Executed At</span>
                        <span className="font-mono text-green-900">${executedPrice.toFixed(2)}</span>
                    </div>
                )}
            </div>

            {/* Progress bar */}
            <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-2.5 relative">
                    <div
                        className={`h-2.5 rounded-full transition-all ${
                            stopLossHit 
                                ? "bg-red-500" 
                                : takeProfitHit 
                                ? "bg-green-500" 
                                : "bg-blue-500"
                        }`}
                <div className="w-full bg-muted rounded-full h-2">
                    <div
                        className={cn(
                            "h-2 rounded-full transition-all",
                            progress <= 0 ? "bg-red-500" : progress >= 100 ? "bg-green-500" : "bg-primary"
                        )}
                        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{stopLossHit ? "🔴 Hit!" : "Stop"}</span>
                    <span>{takeProfitHit ? "🟢 Hit!" : "Take Profit"}</span>
                </div>
            </div>

            {/* Payout breakdown */}
            <div className="bg-gray-50 p-3 rounded text-sm space-y-1 mb-3">
                <h4 className="font-semibold text-xs text-gray-700 mb-2">Estimated Payout (in FLR)</h4>
                
                <div className="flex justify-between">
                    <span className="text-gray-600">If Stop Loss:</span>
                    <span className="font-mono text-red-600">
                        {ethers.formatEther(cryptoAtStopLoss.toString()).substring(0, 10)} FLR
                    </span>
                </div>
                
                {!payment.executed && current > 0 && (
                    <>
                        <div className="flex justify-between">
                            <span className="text-gray-700 font-medium">If Executed Now:</span>
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
                    <span className="text-gray-600">If Take Profit:</span>
                    <span className="font-mono text-green-600">
                        {ethers.formatEther(cryptoAtTakeProfit.toString()).substring(0, 10)} FLR
                    </span>
                </div>

                {savingsVsTakeProfit > 0 && (
                    <div className="text-xs text-green-700 font-semibold text-right border-t pt-1 mt-1">
                        🎯 Max savings: {savingsVsTakeProfit.toFixed(1)}% at take profit
                    </div>
                )}

                {payment.executed && cryptoExecuted && (
                    <div className="flex justify-between bg-green-100 -mx-3 px-3 py-2 mt-2 rounded">
                        <span className="text-green-800 font-semibold">Actual Paid:</span>
                        <span className="font-mono text-green-900 font-bold">
                            {ethers.formatEther(payment.paidAmount.toString()).substring(0, 10)} FLR
                        </span>
                    </div>
                )}
            </div>

            {/* Action buttons */}
            {!payment.executed && (
                <div className="space-y-2">
                    <button
                        onClick={handleExecute}
                        disabled={isLoading || !canExecute}
                        className={`w-full py-2 rounded font-semibold transition-colors ${
                            canExecute
                                ? "bg-green-600 text-white hover:bg-green-700"
                                : "bg-gray-300 text-gray-600 cursor-not-allowed"
                        }`}
                        title={canExecute ? "Price trigger hit - execute payment" : "Waiting for price to hit stop loss or take profit"}
                    >
                        {isLoading ? "Executing..." : canExecute ? "⚡ Execute Payment" : "⏳ Waiting for Trigger"}
                    </button>

                    <button
                        onClick={handleExecute}
                        disabled={isLoading}
                        className="w-full py-2 rounded font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                        title="Execute immediately at current price (bypasses trigger check on-chain)"
                    >
                        {isLoading ? "Executing..." : "🚀 Execute Now (Instant)"}
                    </button>
                    
                    <p className="text-xs text-gray-500 text-center">
                        Instant execution: Pays at current ${current.toFixed(2)} price
                    </p>
                </div>
                <Button
                    onClick={handleExecute}
                    disabled={isLoading || !canExecute}
                    className="w-full"
                    variant={canExecute ? "default" : "secondary"}
                >
                    {isLoading ? "Executing..." : "Execute Payment"}
                </Button>
            )}

            {/* Collateral info */}
            <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                <div className="flex justify-between">
                    <span>Locked Collateral:</span>
                    <span className="font-mono">
                        {ethers.formatEther(payment.collateralAmount.toString()).substring(0, 10)} FLR
                    </span>
                </div>
                {!payment.executed && (
                    <p className="text-xs text-gray-400 mt-1">
                        Excess collateral refunded automatically after execution
                    </p>
                )}
            </div>
        </div>
    );
}
