"use client";

import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { usePayments } from "@/hooks/usePayments";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { CreatePaymentForm } from "@/components/payments/CreatePaymentForm";
import { PaymentsList } from "@/components/payments/PaymentsList";
import { TransactionHistory } from "@/components/payments/TransactionHistory";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Plus, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "payments" | "transactions";

export default function PaymentsPage() {
    const { address, isConnected } = useWallet();
    const { payments, isLoading, refetch } = usePayments();
    const { transactions, loading: txLoading, error: txError, refetch: refetchTx } = useTransactionHistory();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("payments");

    if (!isConnected) {
        return (
            <div className="flex items-center justify-center min-h-full -m-6">
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
        <div className="flex h-full">
            <div className="flex-1 flex flex-col overflow-hidden">
                <PageHeader title="Payments">
                    <div className="text-sm text-muted-foreground font-mono bg-muted px-3 py-1.5 rounded-md">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                    </div>
                    {!sidebarOpen && (
                        <Button 
                            onClick={() => setSidebarOpen(true)}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                            size="sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Payment
                        </Button>
                    )}
                </PageHeader>

                <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="px-6 py-2 flex items-center gap-1">
                        <div className="flex gap-2 flex-nowrap overflow-x-auto">
                            <Button
                                variant={activeTab === "payments" ? "default" : "outline"}
                                className={cn(
                                    "rounded-full",
                                    activeTab === "payments"
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent shadow-sm"
                                        : "hover:bg-muted"
                                )}
                                onClick={() => setActiveTab("payments")}
                                size="sm"
                            >
                                Payments
                                <span className={cn("ml-2", activeTab === "payments" ? "text-white" : "text-muted-foreground")}>{payments.length}</span>
                            </Button>
                            <Button
                                variant={activeTab === "transactions" ? "default" : "outline"}
                                className={cn(
                                    "rounded-full",
                                    activeTab === "transactions"
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent shadow-sm"
                                        : "hover:bg-muted"
                                )}
                                onClick={() => setActiveTab("transactions")}
                                size="sm"
                            >
                                Transactions
                            </Button>
                        </div>
                        {activeTab === "transactions" && (
                            <div className="flex items-center gap-1 ml-auto">
                                <Button
                                    onClick={refetchTx}
                                    variant="ghost"
                                    size="sm"
                                    disabled={txLoading}
                                >
                                    <RefreshCw className={`w-4 h-4 ${txLoading ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-7xl">
                        {activeTab === "payments" && (
                            <PaymentsList
                                payments={payments}
                                isLoading={isLoading}
                                onRefresh={refetch}
                            />
                        )}

                        {activeTab === "transactions" && (
                            <TransactionHistory
                                transactions={transactions}
                                loading={txLoading}
                                error={txError}
                                onRetry={refetchTx}
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className={cn(
                "border-l bg-white dark:bg-slate-950 transition-all duration-300 ease-in-out overflow-hidden shrink-0",
                sidebarOpen ? "w-[380px]" : "w-0"
            )}>
                <div className="w-[380px] h-full flex flex-col">

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
