"use client";

import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { usePayments } from "@/hooks/usePayments";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { CreatePaymentForm } from "@/components/payments/CreatePaymentForm";
import { PaymentsList } from "@/components/payments/PaymentsList";
import { TransactionHistory } from "@/components/payments/TransactionHistory";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Plus, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PaymentsPage() {
    const { address, isConnected } = useWallet();
    const { payments, isLoading, refetch } = usePayments();
    const { transactions, loading: txLoading, error: txError, refetch: refetchTx } = useTransactionHistory();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (!isConnected) {
        return (
            <div className="flex items-center justify-center min-h-full">
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
        );
    }

    return (
        <div className="flex h-full -m-6">
            {/* Main Content */}
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-7xl space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold font-serif">Payment Dashboard</h1>
                            <p className="text-muted-foreground mt-1">Create and manage blockchain payments</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {!sidebarOpen && (
                                <Button onClick={() => setSidebarOpen(true)}>
                                    <Plus className="w-4 h-4" />
                                    Create Payment
                                </Button>
                            )}
                            <div className="text-sm text-muted-foreground font-mono bg-muted px-3 py-1.5 rounded-md">
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                            </div>
                        </div>
                    </div>

                    {/* Payments List */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold font-serif">Your Payments</h2>
                        <PaymentsList
                            payments={payments}
                            isLoading={isLoading}
                            onRefresh={refetch}
                        />
                    </div>

                    {/* Transaction History */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold font-serif">Transaction History</h2>
                            <Button
                                onClick={refetchTx}
                                variant="outline"
                                size="sm"
                                disabled={txLoading}
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${txLoading ? 'animate-spin' : ''}`} />
                                {txLoading ? "Refreshing..." : "Refresh"}
                            </Button>
                        </div>
                        <TransactionHistory 
                            transactions={transactions}
                            loading={txLoading}
                            error={txError}
                            onRetry={refetchTx}
                        />
                    </div>
                </div>
            </div>

            {/* Create Payment Sidebar - inside the main card layout */}
            <div className={cn(
                "border-l bg-white dark:bg-slate-950 transition-all duration-300 ease-in-out overflow-hidden shrink-0",
                sidebarOpen ? "w-[380px]" : "w-0"
            )}>
                <div className="w-[380px] h-full flex flex-col">
                    {/* Sidebar Header */}
                    <div className="flex items-center justify-between p-4 border-b shrink-0">
                        <div>
                            <h3 className="font-semibold font-serif">Create Payment</h3>
                            <p className="text-xs text-muted-foreground">Set up a new blockchain payment</p>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                    
                    {/* Sidebar Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <CreatePaymentForm onSuccess={() => setSidebarOpen(false)} />
                    </div>
                </div>
            </div>
        </div>
    );
}
