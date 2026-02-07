"use client";

import { useState, useEffect } from "react";
import { PriceDashboard } from "@/components/prices/PriceDashboard";
import { InvoiceCard } from "@/components/invoices/InvoiceCard";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useClaimsStore } from "@/stores/useClaimsStore";
import { Loader2, Plus } from "lucide-react";
import { Claim } from "@/types/claim";
import { CreateInvoiceModal } from "@/components/modals/CreateInvoiceModal";

const statusConfig = {
    pending: "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20",
    processing: "bg-primary/20 text-primary border-primary/40 hover:bg-primary/30",
    approved: "bg-primary/30 text-primary border-primary/50 hover:bg-primary/40",
    settled: "bg-primary/40 text-primary border-primary/60 hover:bg-primary/50",
    rejected: "bg-primary/15 text-primary border-primary/35 hover:bg-primary/25",
};

export default function InvoicesPage() {
    const { claims, isLoading, fetchClaims } = useClaimsStore();
    const [filter, setFilter] = useState<string>("all");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchClaims();
    }, [fetchClaims]);

    const filteredClaims = filter === "all"
        ? claims
        : claims.filter(claim => claim.status === filter);

    if (isLoading && claims.length === 0) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold font-serif">
                            Invoices
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Manage and track all insurance invoices
                        </p>
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Invoice
                    </Button>
                </div>

                {/* Filter Buttons and Prices Row */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Filter Buttons */}
                    <div className="flex gap-2 flex-nowrap overflow-x-auto pb-2">
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
                                        "capitalize whitespace-nowrap",
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

                    {/* Price Dashboard - Same Row */}
                    <div className="shrink-0">
                        <PriceDashboard />
                    </div>
                </div>
            </div>

            {/* Claims Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClaims.map((claim) => (
                    <InvoiceCard
                        key={claim.id}
                        id={claim.id}
                        title={claim.title}
                        description={claim.description}
                        claimantName={claim.claimantName}
                        type={claim.type}
                        status={claim.status as any}
                        totalCost={claim.payments?.reduce((acc: number, p: any) => acc + Number(p.usdAmount), 0) || 0}
                        dateCreated={claim.dateCreated as string}
                        dateSettled={claim.dateSettled as string}
                        payments={claim.payments as any}
                        onClick={() => router.push(`/invoices/${claim.id}`)}
                    />
                ))}
            </div>

            {/* Empty State */}
            {!isLoading && filteredClaims.length === 0 && (
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
            )}

            <CreateInvoiceModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
        </div>
    );
}
