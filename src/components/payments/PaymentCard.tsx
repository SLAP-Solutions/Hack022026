"use client";

import { useContract } from "@/hooks/useContract";
import { ClaimPaymentWithPrice } from "@/hooks/usePayments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PaymentCardProps {
    payment: ClaimPaymentWithPrice;
}

export function PaymentCard({ payment }: PaymentCardProps) {
    const { executeClaimPayment, isLoading } = useContract();

    const handleExecute = async () => {
        try {
            await executeClaimPayment(payment.id);
            alert("Payment executed!");
        } catch (error) {
            console.error(error);
            alert("Execution failed - conditions not met or error occurred");
        }
    };

    const usdAmountDollars = payment.usdAmount / 100;
    const stopLoss = Number(payment.stopLossPrice) / 1000;
    const takeProfit = Number(payment.takeProfitPrice) / 1000;
    const current = payment.currentPrice / 1000;

    const canExecute = !payment.executed && (current <= stopLoss || current >= takeProfit);
    const progress = ((current - stopLoss) / (takeProfit - stopLoss)) * 100;

    return (
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
                    {payment.executed ? "Executed" : canExecute ? "Ready" : "Pending"}
                </Badge>
            </div>

            <div className="text-sm space-y-1 mb-3 text-muted-foreground">
                <p>Receiver: <span className="font-mono">{payment.receiver.slice(0, 6)}...{payment.receiver.slice(-4)}</span></p>
                <p>Stop Loss: <span className="text-red-600 font-medium">${stopLoss.toFixed(2)}</span></p>
                <p>Take Profit: <span className="text-green-600 font-medium">${takeProfit.toFixed(2)}</span></p>
                <p className="font-semibold text-foreground">Current Price: ${current.toFixed(2)}</p>
            </div>

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
            </div>

            {!payment.executed && (
                <Button
                    onClick={handleExecute}
                    disabled={isLoading || !canExecute}
                    className="w-full"
                    variant={canExecute ? "default" : "secondary"}
                >
                    {isLoading ? "Executing..." : "Execute Payment"}
                </Button>
            )}
        </div>
    );
}
