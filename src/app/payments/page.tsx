"use client";

import { useWallet } from "@/hooks/useWallet";
import { usePayments } from "@/hooks/usePayments";
import { CreatePaymentForm } from "@/components/payments/CreatePaymentForm";
import { PaymentsList } from "@/components/payments/PaymentsList";
import { TransactionHistory } from "@/components/payments/TransactionHistory";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";

export default function PaymentsPage() {
    const { address, isConnected } = useWallet();
    const { payments, isLoading, refetch } = usePayments();

    if (!isConnected) {
        return (
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <Card className="w-full max-w-md text-center">
                        <CardHeader>
                            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Wallet className="w-6 h-6 text-primary" />
                            </div>
                            <CardTitle className="text-2xl font-serif">Payment Dashboard</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">Connect your wallet to manage payments</p>
                            <ConnectWallet />
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }
    

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-serif">Payment Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Create and manage blockchain payments</p>
                </div>
                <div className="text-sm text-muted-foreground font-mono bg-muted px-3 py-1.5 rounded-md">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create Payment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CreatePaymentForm />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Payments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PaymentsList
                                payments={payments}
                                isLoading={isLoading}
                                onRefresh={refetch}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Transaction History */}
            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                    <TransactionHistory />
                </CardContent>
            </Card>
        </div>
    );
}
