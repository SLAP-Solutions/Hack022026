"use client";

import { useState, useEffect, useMemo } from "react";
import { useWallet } from "../../hooks/useWallet";
import { usePayments } from "../../hooks/usePayments";
import { useTransactionHistory } from "../../hooks/useTransactionHistory";
import { useFTSOPrices } from "../../hooks/useFTSOPrices";
import { useInvoicesStore } from "../../stores/useInvoicesStore";
import { CreatePaymentForm } from "../../components/payments/CreatePaymentForm";
import { PaymentsList } from "../../components/payments/PaymentsList";
import { TransactionHistory } from "../../components/payments/TransactionHistory";
import { ConnectWallet } from "../../components/wallet/ConnectWallet";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Wallet, Plus, X, RefreshCw, Send, History, Clock } from "lucide-react";
import { cn } from "../../lib/utils";
import { CopyAddressButton } from "../../components/ui/CopyAddressButton";

type TabType = "payments" | "transactions";

export default function PaymentsPage() {
    const { address, isConnected } = useWallet();
    const { payments, isLoading, refetch } = usePayments();
    const { transactions, loading: txLoading, error: txError, refetch: refetchTx } = useTransactionHistory();
    const { prices } = useFTSOPrices();
    const { invoices, fetchInvoices } = useInvoicesStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("payments");
    const [refreshTimer, setRefreshTimer] = useState(5);

    // Reset timer when payments update
    useEffect(() => {
        setRefreshTimer(5);
    }, [payments]);

    // Countdown timer
    useEffect(() => {
        const interval = setInterval(() => {
            setRefreshTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (address) {
            fetchInvoices(address);
        }
    }, [address, fetchInvoices]);

    const paymentToInvoiceMap = useMemo(() => {
        const map: Record<string, { id: string; title: string }> = {};
        invoices.forEach(inv => {
            inv.payments?.forEach(p => {
                map[p.id.toString()] = { id: inv.id, title: inv.title };
            });
        });
        return map;
    }, [invoices]);

    const invoiceOptions = useMemo(() => {
        return invoices.map(inv => ({ id: inv.id, title: inv.title }));
    }, [invoices]);

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
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">Wallet Address:</span>
                        <div className="flex items-center bg-muted pl-3 pr-1 py-1 rounded-md border text-sm font-mono text-muted-foreground">
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                            <CopyAddressButton address={address || ""} className="ml-1 h-6 w-6" />
                        </div>
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
                        </div>

                        <div className="flex items-center gap-1">
                            {activeTab === "payments" && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground mr-3">
                                    <Clock className="w-3 h-3" />
                                    Refreshes in {refreshTimer}s
                                </span>
                            )}
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
                <div className="flex-1 overflow-auto p-6">
                    <div className="w-full">
                        {activeTab === "payments" && (
                            <PaymentsList
                                payments={payments}
                                isLoading={isLoading}
                                onRefresh={refetch}
                                paymentToInvoiceMap={paymentToInvoiceMap}
                                invoices={invoiceOptions}
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
                "border-l border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 transition-all duration-300 ease-in-out overflow-hidden shrink-0",
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
