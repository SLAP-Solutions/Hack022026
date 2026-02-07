"use client";

import { useWallet } from "@/hooks/useWallet";
import { usePayments } from "@/hooks/usePayments";
import { CreatePaymentForm } from "@/components/payments/CreatePaymentForm";
import { PaymentsList } from "@/components/payments/PaymentsList";
import { TransactionHistory } from "@/components/payments/TransactionHistory";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";

export default function PaymentsPage() {
    const { address, isConnected } = useWallet();
    const { payments, isLoading } = usePayments();

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Payment Dashboard</h1>
                    <p className="text-gray-600 mb-6">Connect your wallet to manage payments</p>
                    <ConnectWallet />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Payment Dashboard</h1>
                    <div className="text-sm text-gray-600">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3 mb-6">
                    <div className="lg:col-span-1">
                        <CreatePaymentForm />
                    </div>
                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-bold mb-4">Your Payments</h2>
                        <PaymentsList payments={payments} isLoading={isLoading} />
                    </div>
                </div>

                <div className="mt-6">
                    <TransactionHistory />
                </div>
            </div>
        </div>
    );
}
