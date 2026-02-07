"use client";

import { useContract } from "@/hooks/useContract";
import { ClaimPaymentWithPrice } from "@/hooks/usePayments";

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
        <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="font-bold text-lg">${usdAmountDollars.toFixed(2)}</h3>
                    <p className="text-sm text-gray-600">ID: {payment.id.toString()}</p>
                </div>
                <span
                    className={`px-2 py-1 rounded text-sm font-semibold ${
                        payment.executed
                            ? "bg-green-100 text-green-800"
                            : canExecute
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                    }`}
                >
                    {payment.executed ? "Executed" : canExecute ? "Ready" : "Pending"}
                </span>
            </div>

            <div className="text-sm space-y-1 mb-3">
                <p>Receiver: {payment.receiver.slice(0, 6)}...{payment.receiver.slice(-4)}</p>
                <p>Stop Loss: ${stopLoss.toFixed(2)}</p>
                <p>Take Profit: ${takeProfit.toFixed(2)}</p>
                <p className="font-semibold">Current Price: ${current.toFixed(2)}</p>
            </div>

            <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full ${
                            progress <= 0 ? "bg-red-500" : progress >= 100 ? "bg-green-500" : "bg-blue-500"
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                    />
                </div>
            </div>

            {!payment.executed && (
                <button
                    onClick={handleExecute}
                    disabled={isLoading}
                    className={`w-full py-2 rounded font-semibold ${
                        canExecute
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-gray-300 text-gray-600 cursor-not-allowed"
                    }`}
                >
                    {isLoading ? "Executing..." : "Execute Payment"}
                </button>
            )}
        </div>
    );
}
