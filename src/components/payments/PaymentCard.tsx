"use client";

import { useState } from "react";
import { useContract } from "@/hooks/useContract";
import { ClaimPaymentWithPrice } from "@/hooks/usePayments";
import { FEED_IDS } from "@/lib/contract/constants";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PriceHistoryModal } from "./PriceHistoryModal";
import { PriceBar } from "./PriceChart";
import { useContactsStore } from "../../stores/useContactsStore";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useMemo } from "react";

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
    const { executeClaimPayment, executePaymentEarly, isLoading } = useContract();
    const { contacts } = useContactsStore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleExecute = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening modal if clicking button inside interactive area
        
        // Determine if triggers are hit
        const current = payment.currentPrice / Math.pow(10, 3);
        const stopLoss = Number(payment.stopLossPrice) / Math.pow(10, 3);
        const takeProfit = Number(payment.takeProfitPrice) / Math.pow(10, 3);
        const stopLossHit = current > 0 && current <= stopLoss;
        const takeProfitHit = current > 0 && current >= takeProfit;
        const canExecute = !payment.executed && (stopLossHit || takeProfitHit);
        
        try {
            if (canExecute) {
                // Triggers hit - normal execution
                await executeClaimPayment(payment.id);
                alert("Payment executed at trigger price! Check transaction history.");
            } else {
                // Early execution - bypass triggers
                await executePaymentEarly(payment.id);
                alert("Payment executed early! Check transaction history.");
            }
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

    const contact = contacts.find(c => c.receiverAddress.toLowerCase() === payment.receiver.toLowerCase());
    const receiverName = contact ? contact.name : `${payment.receiver.slice(0, 6)}...${payment.receiver.slice(-4)}`;

    const tickerAmountCurrent = current > 0 ? usdAmountDollars / current : 0;

    const collateralEth = ethers.formatEther(payment.collateralAmount.toString());
    const collateralAmount = parseFloat(collateralEth);

    const currentPayoutInTicker = current > 0 ? usdAmountDollars / current : 0;
    const refundAmount = collateralAmount - currentPayoutInTicker;

    const createdAtPrice = Number(payment.createdAtPrice) / multiplier;
    const amountAtCreation = createdAtPrice > 0 ? usdAmountDollars / createdAtPrice : 0;

    const pnlPercent = (createdAtPrice > 0 && current > 0)
        ? (1 - (createdAtPrice / current)) * 100
        : 0;

    const chartData = useMemo(() => {
        if (!current) return [];
        const points = 20;
        const result = [];
        let price = current * 0.95;
        for (let i = 0; i < points; i++) {
            const change = (Math.random() - 0.45) * (current * 0.02);
            price += change;
            if (i > points - 3) {
                price = price + (current - price) * 0.5;
            }
            result.push({ time: i, price: price });
        }
        result[result.length - 1].price = current;
        return result;
    }, [current]);

    const history = chartData.map((d) => d.price);
    const allPrices = [...history, takeProfit, stopLoss, current];
    const minPrice = Math.min(...allPrices) * 0.98;
    const maxPrice = Math.max(...allPrices) * 1.02;

    return (
        <>
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card relative h-fit">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            ${usdAmountDollars.toFixed(2)}
                            <span className="text-sm font-normal text-muted-foreground">
                                ({tickerAmountCurrent.toFixed(4)} {ticker})
                            </span>
                        </h3>
                        <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                            <p>From: <span className="font-mono text-xs">{payment.payer.slice(0, 6)}...{payment.payer.slice(-4)}</span></p>
                            <p>To: <span className={cn("font-medium", contact ? "text-primary" : "font-mono text-xs")}>
                                {receiverName}
                            </span></p>
                        </div>
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
                        {payment.executed ? "Executed" : canExecute ? "Ready" : "Pending"}
                    </Badge>
                </div>

                {!payment.executed && (
                    <HoverCard openDelay={200}>
                        <HoverCardTrigger asChild>
                            <div
                                className="mb-3 cursor-pointer group"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-red-600 font-medium">SL: ${stopLoss.toFixed(2)}</span>
                                    <span className="text-green-600 font-medium">TP: ${takeProfit.toFixed(2)}</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-3 relative overflow-hidden ring-1 ring-transparent group-hover:ring-primary/20 transition-all">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all absolute top-0 left-0",
                                            progress <= 0 ? "bg-red-500" : progress >= 100 ? "bg-green-500" : "bg-primary"
                                        )}
                                        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                                    />
                                    {progress > 0 && progress < 100 && (
                                        <div
                                            className="absolute top-0 bottom-0 w-0.5 bg-white z-10 shadow-[0_0_4px_rgba(0,0,0,0.5)]"
                                            style={{ left: `${payment.executed ? 100 : progress}%` }}
                                        />
                                    )}
                                </div>
                                <div className="text-center text-[10px] text-muted-foreground mt-0.5 group-hover:text-primary transition-colors">
                                    Hover to peek / Click to view full chart
                                </div>
                            </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80 p-0 overflow-hidden" side="top">
                            <div className="p-3 bg-muted/50 border-b flex justify-between items-center">
                                <span className="font-semibold text-xs">{ticker} Price Action</span>
                                <span className="text-[10px] text-muted-foreground">Live Preview</span>
                            </div>
                            <PriceBar
                                currentPrice={current}
                                tpPrice={takeProfit}
                                slPrice={stopLoss}
                                ticker={ticker}
                            />
                        </HoverCardContent>
                    </HoverCard>
                )}

                {/* Payout breakdown */}
                <div className="bg-muted/50 p-3 rounded text-sm space-y-2 mb-3">
                    <h4 className="font-semibold text-xs mb-2 border-b pb-1">
                        {payment.executed ? "Execution Details" : "Estimated Payout Details"}
                    </h4>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        {!payment.executed ? (
                            <>
                                <span className="text-muted-foreground">Price at Creation:</span>
                                <span className="font-mono text-right">${createdAtPrice.toFixed(2)}</span>

                                <span className="text-muted-foreground">Amount Entered:</span>
                                <span className="font-mono text-right">{amountAtCreation.toFixed(6)} {ticker}</span>

                                <span className="text-muted-foreground mt-3">Collateral Locked:</span>
                                <span className="font-mono text-right mt-3">{collateralAmount.toFixed(6)} {ticker}</span>

                                <span className="text-muted-foreground">Current Refund:</span>
                                <span className={cn("font-mono text-right", refundAmount >= 0 ? "text-green-600" : "text-red-600")}>
                                    {refundAmount > 0 ? "+" : ""}{refundAmount.toFixed(6)} {ticker}
                                </span>


                                <span className="text-muted-foreground mt-3">If Stop Loss Hit:</span>
                                <span className="font-mono text-right text-red-600 mt-3">
                                    {(usdAmountDollars / stopLoss).toFixed(6)} {ticker}
                                </span>

                                <span className="text-muted-foreground">If Take Profit Hit:</span>
                                <span className="font-mono text-right text-green-600">
                                    {(usdAmountDollars / takeProfit).toFixed(6)} {ticker}
                                </span>

                                <span className="text-muted-foreground mt-2">If Paid Now:</span>
                                <span className="font-mono text-right text-green-600 mt-2">
                                    {current > 0 ? (usdAmountDollars / current).toFixed(6) : "0.000000"} {ticker}
                                </span>

                                <div className="col-span-2 border-t pt-1 mt-1 flex justify-between items-center">
                                    <span className="text-muted-foreground">PNL:</span>
                                    <span className={cn(
                                        "font-bold",
                                        pnlPercent > 0 ? "text-green-600" : pnlPercent < 0 ? "text-red-600" : "text-muted-foreground"
                                    )}>
                                        {pnlPercent > 0 ? "+" : ""}{pnlPercent.toFixed(2)}%
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                <span className="text-muted-foreground">Price at Execution:</span>
                                <span className="font-mono text-right">
                                    ${(Number(payment.executedPrice) / multiplier).toFixed(2)}
                                </span>

                                <span className="text-muted-foreground font-semibold">Actual Payout:</span>
                                <span className="font-mono text-right font-bold text-green-600">
                                    {ethers.formatEther(payment.paidAmount.toString())} {ticker}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Action button */}
                {!payment.executed && (
                    <Button
                        onClick={handleExecute}
                        disabled={isLoading}
                        className="w-full"
                        variant={canExecute ? "default" : "secondary"}
                    >
                        {isLoading ? "Executing..." : canExecute ? "⚡ Execute Payment" : "Pay Now (Early)"}
                    </Button>
                )}

                {/* Link to view modal */}
                <PriceHistoryModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    ticker={ticker}
                    currentPrice={current}
                    initialTp={takeProfit}
                    initialSl={stopLoss}
                    onSave={() => { }} // Read only, no save
                    readOnly={true}
                />
            </div>
        </>
    );
}
