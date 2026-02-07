"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, DollarSign, Tag, Receipt, User, Building, Plus, ShieldAlert, CreditCard } from "lucide-react";
import { usePaymentModal } from "@/stores/usePaymentModal";
import { AddPaymentModal } from "@/components/modals/AddPaymentModal";
import { ClaimRiskModal } from "@/components/modals/ClaimRiskModal";
import { useInvoicesStore } from "@/stores/useInvoicesStore";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { getFeedName, getFeedSymbol } from "@/config/feeds";
import { useFTSOPrices } from "@/hooks/useFTSOPrices";

const statusConfig = {
    pending: { color: "bg-primary/10 text-primary border-primary/30" },
    processing: { color: "bg-primary/20 text-primary border-primary/40" },
    approved: { color: "bg-primary/30 text-primary border-primary/50" },
    settled: { color: "bg-primary/40 text-primary border-primary/60" },
    rejected: { color: "bg-primary/15 text-primary border-primary/35" },
};

const paymentStatusConfig = {
    pending: { color: "bg-primary/10 text-primary border-primary/30", label: "Pending" },
    committed: { color: "bg-primary/20 text-primary border-primary/40", label: "Committed" },
    executed: { color: "bg-primary/30 text-primary border-primary/50", label: "Executed" },
    expired: { color: "bg-muted text-muted-foreground border-border", label: "Expired" },
};

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const invoiceId = params.id as string;
    const { getInvoice, updatePaymentStatus } = useInvoicesStore();
    const { openModal } = usePaymentModal();
    const { prices } = useFTSOPrices();
    const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);

    const invoice = getInvoice(invoiceId);

    if (!invoice) {
        return (
            <div className="max-w-4xl mx-auto">
                <Card>
                    <CardContent className="pt-16 pb-16 text-center">
                        <h1 className="text-4xl font-bold mb-4">Invoice Not Found</h1>
                        <p className="text-muted-foreground mb-8">
                            The invoice you're looking for doesn't exist.
                        </p>
                        <Button onClick={() => router.push("/invoices")}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Invoices
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const statusInfo = statusConfig[invoice.status as keyof typeof statusConfig];

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => router.push("/invoices")}
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Invoices
            </Button>

            {/* Header Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Title & Status */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="text-xs">
                                        {invoice.id}
                                    </Badge>
                                    <Badge className={cn("text-xs border", statusInfo.color)}>
                                        {invoice.status.toUpperCase()}
                                    </Badge>
                                </div>
                                <h1 className="text-4xl font-bold font-serif mb-2">
                                    {invoice.title}
                                </h1>
                                <p className="text-muted-foreground">{invoice.description}</p>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Amount Card */}
                <Card>
                    <CardContent className="p-6 h-full flex flex-col justify-center">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <DollarSign className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase tracking-wider">Total Cost</span>
                            </div>
                            <div className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/90 bg-clip-text text-transparent">
                                ${(invoice.payments?.reduce((acc: number, payment: any) => acc + Number(payment.usdAmount), 0) || 0).toFixed(2)}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <User className="w-4 h-4" />
                            <span className="text-xs font-medium">Client</span>
                        </div>
                        <p className="font-semibold">{invoice.claimantName}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Building className="w-4 h-4" />
                            <span className="text-xs font-medium">Type</span>
                        </div>
                        <Badge variant="secondary">{invoice.type}</Badge>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs font-medium">Created</span>
                        </div>
                        <p className="font-semibold">
                            {new Date(invoice.dateCreated).toLocaleDateString()}
                        </p>
                    </CardContent>
                </Card>

                {invoice.dateSettled && (
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Calendar className="w-4 h-4" />
                                <span className="text-xs font-medium">Settled</span>
                            </div>
                            <p className="font-semibold">
                                {new Date(invoice.dateSettled).toLocaleDateString()}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Payments Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Receipt className="w-5 h-5" />
                            <h3 className="text-xl font-semibold">Payments</h3>
                            <Badge variant="secondary">{invoice.payments.length}</Badge>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsRiskModalOpen(true)}
                                size="sm"
                                className="text-muted-foreground hover:text-primary"
                            >
                                <ShieldAlert className="w-4 h-4 mr-2" />
                                View Risk Exposure
                            </Button>
                            <Button
                                onClick={() => openModal(invoice.id)}
                                size="sm"
                                className="bg-primary hover:bg-primary/90"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Payment
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {invoice.payments && invoice.payments.length > 0 ? (
                        <div className="space-y-3">
                            {invoice.payments.map((payment: any) => {
                                const paymentStatus = paymentStatusConfig[(payment.status || "pending") as keyof typeof paymentStatusConfig];

                                // Calculate display values
                                const amount = Number(payment.usdAmount);
                                const lower = Number(payment.stopLossPrice);
                                const upper = Number(payment.takeProfitPrice);

                                return (
                                    <Card key={payment.id.toString()} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Receipt className="w-4 h-4 text-muted-foreground" />
                                                    <span className="font-mono text-sm text-muted-foreground">
                                                        Payment #{payment.id.toString()}
                                                    </span>
                                                </div>
                                                <Badge className={cn("text-xs border", paymentStatus?.color)}>
                                                    {paymentStatus?.label || "Unknown"}
                                                </Badge>
                                            </div>

                                            {payment.status === 'pending' && payment.expiresAt && (
                                                <div className="mb-4 p-2 bg-primary/10 dark:bg-primary/20 rounded border border-primary/30 dark:border-primary/40" title={`Expires on ${new Date(Number(payment.expiresAt) * 1000).toLocaleDateString()}`}>
                                                    <div className="flex justify-between items-baseline">
                                                        <span className="text-sm font-semibold text-primary">
                                                            {Math.ceil((new Date(Number(payment.expiresAt) * 1000).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} Days Remaining
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            Window ends: {new Date(Number(payment.expiresAt) * 1000).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-4">

                                                <div>
                                                    <div className="text-xs text-muted-foreground mb-1">Description</div>
                                                    <div className="text-xl font-bold text-foreground">
                                                        {payment.description || "Payment"}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-muted-foreground mb-1">Amount</div>
                                                    <div className="text-sm font-mono font-semibold">
                                                        ${amount.toFixed(2)}
                                                    </div>
                                                    <Badge variant="outline" className="mt-1 text-[10px] h-5">
                                                        {getFeedName(payment.cryptoFeedId) || "Unknown Feed"}
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-muted-foreground mb-1">Receiver</div>
                                                    <div className="text-sm font-mono">
                                                        {payment.receiver?.slice(0, 6)}...{payment.receiver?.slice(-4)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Visual Slider */}
                                            <div className="mt-4 pt-3 border-t">
                                                <div className="flex justify-between items-end mb-2">
                                                    <div className="text-xs text-muted-foreground">
                                                        Lower: <span className="font-mono font-medium">${lower.toFixed(2)}</span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Upper: <span className="font-mono font-medium">${upper.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                                <Slider
                                                    value={[amount]}
                                                    max={upper}
                                                    min={lower}
                                                    step={0.01}
                                                    disabled
                                                    className="opacity-100"
                                                    trackClassName="bg-gradient-to-r from-red-500 to-green-500"
                                                    rangeClassName="opacity-0"
                                                    thumbContent={(() => {
                                                        const feedName = getFeedName(payment.cryptoFeedId);
                                                        const priceData = prices[feedName];
                                                        return priceData && !priceData.loading
                                                            ? `$${parseFloat(priceData.price).toFixed(2)}`
                                                            : "...";
                                                    })()}
                                                />
                                            </div>

                                            {payment.status === 'pending' && (
                                                <div className="mt-4 flex items-center gap-3">
                                                    <Button
                                                        size="sm"
                                                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                                                        onClick={() => updatePaymentStatus(invoice.id, payment.id, 'committed')}
                                                    >
                                                        <Receipt className="w-4 h-4 mr-2" />
                                                        Commit
                                                    </Button>
                                                </div>
                                            )}

                                            {payment.status === 'committed' && (
                                                <div className="mt-4 flex items-center gap-3">
                                                    <Button
                                                        size="sm"
                                                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                                                        onClick={() => updatePaymentStatus(invoice.id, payment.id, 'executed')}
                                                    >
                                                        <CreditCard className="w-4 h-4 mr-2" />
                                                        Pay Now
                                                    </Button>

                                                    {(() => {
                                                        if (!payment.originalAmount) return null;

                                                        const feedName = getFeedName(payment.cryptoFeedId);
                                                        const feedSymbol = getFeedSymbol(payment.cryptoFeedId);
                                                        const currentPriceData = prices[feedName];

                                                        if (!currentPriceData) return null;

                                                        const currentPrice = parseFloat(currentPriceData.price);
                                                        if (!currentPrice) return null;

                                                        const currentCryptoAmount = amount / currentPrice;
                                                        const originalCryptoAmount = payment.originalAmount / currentPrice;
                                                        const diff = originalCryptoAmount - currentCryptoAmount;
                                                        const isSaving = diff > 0;
                                                        const percentDiff = (Math.abs(diff) / payment.originalAmount) * 100;

                                                        // Removed absolute threshold, just check for non-zero to show even small diffs
                                                        if (Math.abs(diff) === 0) return null;

                                                        return (
                                                            <div className={cn(
                                                                "text-xs px-3 py-1.5 rounded-md font-medium flex flex-col items-end leading-tight min-w-[120px]",
                                                                isSaving
                                                                    ? "text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800"
                                                                    : "text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800"
                                                            )}>
                                                                {isSaving ? (
                                                                    <>
                                                                        <span className="font-bold">Save {diff.toFixed(4)} {feedSymbol}</span>
                                                                        <span className="text-[10px] opacity-80">({percentDiff.toFixed(1)}%)</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className="font-bold">+{Math.abs(diff).toFixed(4)} {feedSymbol}</span>
                                                                        <span className="text-[10px] opacity-80">({percentDiff.toFixed(1)}%)</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )}

                                            {payment.executedAt > 0 && (
                                                <div className="mt-3 pt-3 border-t">
                                                    <div className="text-xs text-muted-foreground">
                                                        Executed: {new Date(Number(payment.executedAt) * 1000).toLocaleString()}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No payments recorded yet</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modals */}
            <AddPaymentModal />
            <ClaimRiskModal
                open={isRiskModalOpen}
                onOpenChange={setIsRiskModalOpen}
                claim={invoice}
            />
        </div>
    );
}
