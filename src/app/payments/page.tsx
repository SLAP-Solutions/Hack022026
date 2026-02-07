"use client";

import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { usePayments } from "@/hooks/usePayments";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { useFTSOPrices } from "@/hooks/useFTSOPrices";
import { CreatePaymentForm } from "@/components/payments/CreatePaymentForm";
import { PaymentsList } from "@/components/payments/PaymentsList";
import { TransactionHistory } from "@/components/payments/TransactionHistory";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Plus, X, RefreshCw, CreditCard, History, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "payments" | "transactions";

export default function PaymentsPage() {
    const { address, isConnected } = useWallet();
    const { payments, isLoading, refetch } = usePayments();
    const { transactions, loading: txLoading, error: txError, refetch: refetchTx } = useTransactionHistory();
    const { prices } = useFTSOPrices();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("payments");

    if (!isConnected) {
        // ... existing auth check ...
    }

    return (
        <div className="flex h-full -m-6">
            <div className="flex-1 overflow-auto flex flex-col">
                <PageHeader title="Payments">
                    <div className="text-sm text-muted-foreground font-mono bg-muted px-3 py-1.5 rounded-md">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                    </div>
                </PageHeader>

                <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="px-6 py-2 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center">
                                <Button
                                    variant={activeTab === "payments" ? "secondary" : "ghost"}
                                    className="rounded-full"
                                    onClick={() => setActiveTab("payments")}
                                    size="sm"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Payments
                                    <span className="ml-2 text-muted-foreground">{payments.length}</span>
                                </Button>
                                <Button
                                    variant={activeTab === "transactions" ? "secondary" : "ghost"}
                                    className="rounded-full"
                                    onClick={() => setActiveTab("transactions")}
                                    size="sm"
                                >
                                    <History className="w-4 h-4 mr-2" />
                                    Transactions
                                </Button>
                            </div>

                            {/* Price Ticker */}
                            <div className="hidden md:flex items-center gap-4 text-xs font-mono border-l pl-6 h-6">
                                {["FLR/USD", "ETH/USD", "BTC/USD"].map((symbol) => {
                                    const feed = prices[symbol];
                                    return (
                                        <div key={symbol} className="flex items-center gap-1.5" title="Live FTSO Price">
                                            <span className="font-semibold text-muted-foreground">{symbol.split('/')[0]}</span>
                                            <span className={cn(
                                                "transition-colors",
                                                feed?.loading ? "text-muted-foreground" : "text-foreground"
                                            )}>
                                                ${feed?.price || "0.00"}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            {activeTab === "transactions" && (
                                <Button
                                    onClick={refetchTx}
                                    variant="ghost"
                                    size="sm"
                                    disabled={txLoading}
                                >
                                    <RefreshCw className={`w-4 h-4 ${txLoading ? 'animate-spin' : ''}`} />
                                </Button>
                            )}
                            {!sidebarOpen && (
                                <Button
                                    onClick={() => setSidebarOpen(true)}
                                    className="rounded-full"
                                    size="sm"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Payment
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Page Content */}
                <div className="flex-1 p-6">
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
