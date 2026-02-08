"use client";

import { useState, useEffect } from "react";
import { InvoiceCard } from "@/components/invoices/InvoiceCard";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useInvoicesStore } from "@/stores/useInvoicesStore";
import { useWallet } from "@/hooks/useWallet";
import { usePayments } from "@/hooks/usePayments";
import { Loader2, Plus } from "lucide-react";
import { Invoice } from "@/types/invoice";
import { CreateInvoiceModal } from "@/components/modals/CreateInvoiceModal";
import { PageHeader } from "@/components/layout/PageHeader";

const statusConfig = {
    pending: "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20",
    processing: "bg-primary/20 text-primary border-primary/40 hover:bg-primary/30",
    approved: "bg-primary/30 text-primary border-primary/50 hover:bg-primary/40",
    settled: "bg-primary/40 text-primary border-primary/60 hover:bg-primary/50",
    rejected: "bg-primary/15 text-primary border-primary/35 hover:bg-primary/25",
};

export default function InvoicesPage() {
    const { invoices, isLoading, fetchInvoices } = useInvoicesStore();
    const { payments: livePayments } = usePayments();
    const { address } = useWallet();
    const [filter, setFilter] = useState<string>("all");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (address) {
            fetchInvoices(address);
            const interval = setInterval(() => {
                fetchInvoices(address, false);
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [fetchInvoices, address]);

    // Merge live payment status into invoices
    const mergedInvoices = invoices.map(invoice => ({
        ...invoice,
        payments: invoice.payments?.map(payment => {
            const livePayment = livePayments.find(p => p.id === Number(payment.id));
            if (livePayment) {
                return {
                    ...payment,
                    status: (livePayment.executed ? 'executed' : 'pending') as 'pending' | 'executed',
                    executedAt: BigInt(livePayment.executedAt),
                };
            }
            return payment;
        }) || []
    }));

    const filteredInvoices = filter === "all"
        ? mergedInvoices
        : mergedInvoices.filter(invoice => invoice.status === filter);

    if (isLoading && invoices.length === 0) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <PageHeader title="Invoices">
                <Button onClick={() => setIsCreateOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Invoice
                </Button>
            </PageHeader>

            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="px-6 py-2 flex items-center justify-between gap-4">
                    {/* Filter Buttons */}
                    <div className="flex gap-2 flex-nowrap overflow-x-auto py-1">
                        {["all", "pending", "processing", "approved", "settled", "rejected"].map((status) => {
                            const activeStyle = status === "all"
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : statusConfig[status as keyof typeof statusConfig];

                            return (
                                <Button
                                    key={status}
                                    onClick={() => setFilter(status)}
                                    variant={filter === status ? "default" : "outline"}
                                    size="sm"
                                    className={cn(
                                        "capitalize whitespace-nowrap rounded-full px-4",
                                        filter === status
                                            ? cn(activeStyle, "border-transparent shadow-sm")
                                            : "hover:bg-muted"
                                    )}
                                >
                                    {status}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* {error && (
                <div className="m-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center justify-between text-red-600 dark:text-red-400">
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4" />
                        <p className="text-sm font-medium">Error: {error}</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => address && fetchInvoices(address)}
                        className="bg-white hover:bg-red-50 border-red-200 text-red-600"
                    >
                        Try Again
                    </Button>
                </div>
            )} */}

            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Invoices Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredInvoices.map((invoice: Invoice) => (
                            <InvoiceCard
                                key={invoice.id}
                                id={invoice.id}
                                title={invoice.title}
                                description={invoice.description}
                                claimantName={invoice.claimantName}
                                type={invoice.type}
                                status={invoice.status as any}
                                totalCost={(invoice.payments?.reduce((acc: number, p: any) => acc + Number(p.usdAmount), 0) || 0) / 100}
                                dateCreated={invoice.dateCreated as string}
                                dateSettled={invoice.dateSettled as string}
                                payments={invoice.payments as any}
                                onClick={() => router.push(`/invoices/${invoice.id}`)}
                            />
                        ))}
                    </div>

                    {/* Empty State */}
                    {
                        !isLoading && filteredInvoices.length === 0 && (
                            <div className="text-center py-16">
                                <div className="text-6xl mb-4">📋</div>
                                <h3 className="text-2xl font-bold mb-2">
                                    No invoices found
                                </h3>
                                <p className="text-muted-foreground">
                                    Try adjusting your filters to see more results or create a new invoice.
                                </p>
                                <Button onClick={() => setIsCreateOpen(true)} className="mt-4" variant="outline">
                                    Create New Invoice
                                </Button>
                            </div>
                        )
                    }

                    <CreateInvoiceModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
                </div>
            </div>
        </div>
    );
}
