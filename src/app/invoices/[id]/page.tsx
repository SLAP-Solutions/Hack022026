"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, DollarSign, Tag, Receipt, User, Building, Plus, CreditCard, Bell, Pen, Clock, BarChart3 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreatePaymentForm } from "@/components/payments/CreatePaymentForm";
import { useContract } from "@/hooks/useContract";
import { useWallet } from "@/hooks/useWallet";
import { PaymentCard } from "@/components/payments/PaymentCard";
import { PendingSignaturePaymentCard } from "@/components/payments/PendingSignaturePaymentCard";
import { FEED_IDS } from "@/lib/contract/constants";
import { useInvoicesStore } from "@/stores/useInvoicesStore";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { getFeedName, getFeedSymbol } from "@/config/feeds";
import { useFTSOPrices } from "@/hooks/useFTSOPrices";
import { usePayments } from "@/hooks/usePayments";
import { ExposureSummary } from "@/components/analytics/ExposureSummary";
import { usePaymentMetrics } from "@/hooks/usePaymentMetrics";

const statusConfig = {
    pending: { color: "bg-primary/10 text-primary border-primary/30" },
    processing: { color: "bg-primary/20 text-primary border-primary/40" },
    approved: { color: "bg-primary/30 text-primary border-primary/50" },
    settled: { color: "bg-primary/40 text-primary border-primary/60" },
    rejected: { color: "bg-primary/15 text-primary border-primary/35" },
};

const paymentStatusConfig = {
    pending_signature: { color: "bg-amber-500/20 text-amber-600 border-amber-500/40", label: "Awaiting Signature" },
    pending: { color: "bg-primary/10 text-primary border-primary/30", label: "Pending" },
    committed: { color: "bg-primary/20 text-primary border-primary/40", label: "Committed" },
    executed: { color: "bg-primary/30 text-primary border-primary/50", label: "Executed" },
    expired: { color: "bg-muted text-muted-foreground border-border", label: "Expired" },
};

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const invoiceId = params.id as string;
    const { getInvoice, updatePaymentStatus, addPayment, fetchInvoice } = useInvoicesStore();
    const { getClaimPayment } = useContract();
    const { address } = useWallet();
    const { prices } = useFTSOPrices();
    const { payments: livePayments } = usePayments();
    const [isPaymentSidebarOpen, setIsPaymentSidebarOpen] = useState(false);
    const [isExposureModalOpen, setIsExposureModalOpen] = useState(false);
    const [refreshTimer, setRefreshTimer] = useState(2);
    const [isEditingDueDate, setIsEditingDueDate] = useState(false);
    const [dueDate, setDueDate] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    // Reset timer when payments update
    useEffect(() => {
        setRefreshTimer(2);
    }, [livePayments]);

    // Countdown timer
    useEffect(() => {
        const interval = setInterval(() => {
            setRefreshTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const invoice = getInvoice(invoiceId);

    // Fetch invoice if not in store
    useEffect(() => {
        if (!invoice && address && !isLoading) {
            setIsLoading(true);
            fetchInvoice(invoiceId, address).finally(() => setIsLoading(false));
        }
    }, [invoiceId, address, invoice, fetchInvoice, isLoading]);

    // Update due date when invoice loads
    useEffect(() => {
        if (invoice?.dateDue) {
            setDueDate(new Date(invoice.dateDue).toISOString().split('T')[0]);
        }
    }, [invoice?.dateDue]);

    // Derive status and calculate metrics early (before conditional returns)
    const updatedPayments = useMemo(() => {
        if (!invoice) return [];
        return invoice.payments?.map(payment => {
            const livePayment = livePayments.find(p => p.id === Number(payment.id));
            if (livePayment) {
                return {
                    ...payment,
                    status: (livePayment.executed ? 'executed' : 'pending') as 'pending' | 'executed',
                    executed: livePayment.executed,
                    executedAt: BigInt(livePayment.executedAt),
                    expiresAt: BigInt(livePayment.expiresAt),
                    currentPrice: livePayment.currentPrice,
                    decimals: livePayment.decimals,
                    executedPrice: livePayment.executedPrice,
                    paidAmount: livePayment.paidAmount,
                };
            }
            return {
                ...payment,
                status: (payment.executed ? 'executed' : 'pending') as 'pending' | 'executed',
            };
        }) || [];
    }, [invoice, livePayments]);

    // Calculate metrics for invoice payments (must be called before conditional returns)
    const invoiceMetrics = usePaymentMetrics(updatedPayments as any);

    const handlePaymentSuccess = async (paymentId?: string) => {
        if (!paymentId) {
            setIsPaymentSidebarOpen(false);
            return;
        }

        try {
            const paymentDetails = await getClaimPayment(Number(paymentId));

            const newPayment = {
                id: BigInt(paymentId),
                payer: paymentDetails.payer,
                receiver: paymentDetails.receiver,
                usdAmount: paymentDetails.usdAmount,
                cryptoFeedId: paymentDetails.cryptoFeedId,
                stopLossPrice: paymentDetails.stopLossPrice,
                takeProfitPrice: paymentDetails.takeProfitPrice,
                collateralAmount: paymentDetails.collateralAmount,
                createdAt: BigInt(paymentDetails.createdAt),
                createdAtPrice: paymentDetails.createdAtPrice,
                expiresAt: BigInt(paymentDetails.expiresAt),
                status: 'pending' as const,
                executed: paymentDetails.executed,
                executedAt: BigInt(paymentDetails.executedAt),
                executedPrice: paymentDetails.executedPrice,
                paidAmount: paymentDetails.paidAmount,
                originalAmount: paymentDetails.usdAmount
            };

            await addPayment(invoiceId, newPayment);
            setIsPaymentSidebarOpen(false);
        } catch (error) {
            console.error("Failed to link payment to invoice", error);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto">
                <Card>
                    <CardContent className="pt-16 pb-16 text-center">
                        <h1 className="text-2xl font-bold mb-4">Loading invoice...</h1>
                    </CardContent>
                </Card>
            </div>
        );
    }

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

    let computedStatus = invoice.status;
    if (updatedPayments.length > 0) {
        const allExecuted = updatedPayments.every(p => p.status === 'executed');

        if (allExecuted) {
            computedStatus = 'settled';
        } else {
            const someExecuted = updatedPayments.some(p => p.status === 'executed');
            computedStatus = someExecuted ? 'processing' : 'pending';
        }
    }

    const statusInfo = statusConfig[computedStatus as keyof typeof statusConfig] || statusConfig.pending;

    // Get the ticker symbol for display (default to ETH if unable to determine)
    const firstPayment = updatedPayments[0];
    const feedSymbol = firstPayment ? Object.keys(FEED_IDS).find(
        (key) => FEED_IDS[key as keyof typeof FEED_IDS] === firstPayment.cryptoFeedId
    ) || "ETH" : "ETH";

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
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
                                        {computedStatus.toUpperCase()}
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
                                ${((invoice.payments?.reduce((acc: number, payment: any) => acc + Number(payment.usdAmount), 0) || 0) / 100).toFixed(2)}
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
                            {new Date(invoice.dateCreated).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                timeZone: 'UTC'
                            })}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs font-medium">Due</span>
                            </div>
                            {!isEditingDueDate && (
                                <button
                                    onClick={() => setIsEditingDueDate(true)}
                                    className="text-xs text-primary hover:underline"
                                >
                                    {dueDate ? 'Edit' : 'Set'}
                                </button>
                            )}
                        </div>
                        {isEditingDueDate ? (
                            <div className="flex gap-2 mt-2">
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="px-2 py-1 border rounded text-sm flex-1"
                                />
                                <Button
                                    size="sm"
                                    onClick={async () => {
                                        try {
                                            const updatedInvoice = { 
                                                ...invoice, 
                                                dateDue: dueDate ? new Date(dueDate).toISOString() : undefined 
                                            };
                                            const replacer = (key: string, value: any) => {
                                                if (typeof value === 'bigint') {
                                                    return value.toString();
                                                }
                                                return value;
                                            };
                                            await fetch(`/api/invoices/${invoice.id}`, {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify(updatedInvoice, replacer),
                                            });
                                            setIsEditingDueDate(false);
                                            window.location.reload();
                                        } catch (error) {
                                            console.error("Failed to update due date:", error);
                                        }
                                    }}
                                >
                                    Save
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setIsEditingDueDate(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        ) : (
                            <p className="font-semibold">
                                {dueDate ? new Date(dueDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    timeZone: 'UTC'
                                }) : 'Not set'}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {invoice.dateNotified && (
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Bell className="w-4 h-4" />
                                <span className="text-xs font-medium">Notified</span>
                            </div>
                            <p className="font-semibold">
                                {new Date(invoice.dateNotified).toLocaleDateString()}
                            </p>
                        </CardContent>
                    </Card>
                )}

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

            {/* Pending Signature Payments Section */}
            {invoice.payments && invoice.payments.filter((p: any) => p.status === 'pending_signature').length > 0 && (
                <Card className="border-amber-500/40 bg-amber-50/30 dark:bg-amber-950/10">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Pen className="w-5 h-5 text-amber-600" />
                                <h3 className="text-xl font-semibold text-amber-700 dark:text-amber-500">Payments Awaiting Signature</h3>
                                <Badge className="bg-amber-500 text-white">
                                    {invoice.payments.filter((p: any) => p.status === 'pending_signature').length}
                                </Badge>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            These payments were created by the AI agent and require your signature to execute.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="columns-1 md:columns-2 gap-4 space-y-4">
                            {invoice.payments
                                .filter((p: any) => p.status === 'pending_signature')
                                .map((payment: any) => (
                                    <div key={payment.id.toString()} className="break-inside-avoid mb-4">
                                        <PendingSignaturePaymentCard
                                            payment={payment}
                                            onSign={async (pendingId, blockchainId) => {
                                                // After signing, update the payment with the blockchain ID
                                                // and change status to 'pending'
                                                try {
                                                    const paymentDetails = await getClaimPayment(Number(blockchainId));

                                                    // Update the payment in the invoice
                                                    const updatedPayments = invoice.payments.map((p: any) => {
                                                        if (p.id === pendingId) {
                                                            return {
                                                                ...p,
                                                                id: BigInt(blockchainId),
                                                                status: 'pending',
                                                                payer: paymentDetails.payer,
                                                                stopLossPrice: paymentDetails.stopLossPrice,
                                                                takeProfitPrice: paymentDetails.takeProfitPrice,
                                                                collateralAmount: paymentDetails.collateralAmount,
                                                                createdAt: BigInt(paymentDetails.createdAt),
                                                                createdAtPrice: paymentDetails.createdAtPrice,
                                                                expiresAt: BigInt(paymentDetails.expiresAt),
                                                                executed: false,
                                                            };
                                                        }
                                                        return p;
                                                    });

                                                    // Update via API
                                                    const replacer = (key: string, value: any) => {
                                                        if (typeof value === 'bigint') {
                                                            return value.toString();
                                                        }
                                                        return value;
                                                    };

                                                    await fetch(`/api/invoices/${invoice.id}`, {
                                                        method: 'PUT',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ ...invoice, payments: updatedPayments }, replacer),
                                                    });

                                                    // Refresh the page to show updated data
                                                    window.location.reload();
                                                } catch (error) {
                                                    console.error("Failed to update payment after signing:", error);
                                                }
                                            }}
                                            onCancel={async (pendingId) => {
                                                // Remove the pending payment from the invoice
                                                try {
                                                    const updatedPayments = invoice.payments.filter((p: any) => p.id !== pendingId);

                                                    const replacer = (key: string, value: any) => {
                                                        if (typeof value === 'bigint') {
                                                            return value.toString();
                                                        }
                                                        return value;
                                                    };

                                                    await fetch(`/api/invoices/${invoice.id}`, {
                                                        method: 'PUT',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ ...invoice, payments: updatedPayments }, replacer),
                                                    });

                                                    window.location.reload();
                                                } catch (error) {
                                                    console.error("Failed to cancel pending payment:", error);
                                                }
                                            }}
                                        />
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Payments Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Receipt className="w-5 h-5" />
                            <h3 className="text-xl font-semibold">Payments</h3>
                            <Badge variant="secondary">
                                {invoice.payments.filter((p: any) => p.status !== 'pending_signature').length}
                            </Badge>
                        </div>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground self-center mr-2">
                                <Clock className="w-3 h-3" />
                                Refreshes in {refreshTimer}s
                            </span>
                            {updatedPayments && updatedPayments.length > 0 && (
                                <Button
                                    onClick={() => setIsExposureModalOpen(true)}
                                    variant="outline"
                                    size="sm"
                                    className="text-muted-foreground hover:text-primary"
                                >
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    Active Positions
                                </Button>
                            )}
                            <Button
                                onClick={() => setIsPaymentSidebarOpen(true)}
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
                    {updatedPayments && updatedPayments.filter((p: any) => p.status !== 'pending_signature').length > 0 ? (
                        <div className="columns-1 md:columns-2 gap-4 space-y-4">
                            {updatedPayments
                                .filter((p: any) => p.status !== 'pending_signature')
                                .map((payment: any) => {
                                    // Find price for this payment's feed
                                    const feedSymbol = Object.keys(FEED_IDS).find(
                                        (key) => FEED_IDS[key as keyof typeof FEED_IDS] === payment.cryptoFeedId
                                    );
                                    const priceData = feedSymbol ? prices[feedSymbol as keyof typeof FEED_IDS] : undefined;

                                    // PaymentCard expects price scaled by 1000 (3 decimals)
                                    const currentPrice = priceData ? Math.floor(parseFloat(priceData.price) * 1000) : 0;

                                    // Try to find live payment data to ensure status is up to date
                                    const livePayment = livePayments.find(p => p.id === Number(payment.id));

                                    // Construct ClaimPaymentWithPrice object
                                    const claimPayment = livePayment || {
                                        ...payment,
                                        id: Number(payment.id), // Convert bigint id to number for contract calls
                                        currentPrice: currentPrice,
                                        createdAtPrice: payment.createdAtPrice || BigInt(0),
                                    };

                                    return (
                                        <div key={payment.id.toString()} className="break-inside-avoid mb-4">
                                            <PaymentCard
                                                payment={claimPayment as any}
                                                onRefresh={() => updatePaymentStatus(invoice.id, payment.id, 'executed')}
                                            />
                                        </div>
                                    );
                                })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                            <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No payments recorded yet</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modals */}
            <Dialog open={isExposureModalOpen} onOpenChange={setIsExposureModalOpen}>
                <DialogContent className="max-w-6xl">
                    <DialogHeader>
                        <DialogTitle>Active Positions Overview</DialogTitle>
                    </DialogHeader>
                    {updatedPayments && updatedPayments.length > 0 && (
                        <ExposureSummary
                            worstCase={invoiceMetrics.currentExposureWorstCase}
                            livePercent={invoiceMetrics.liveExposurePercent}
                            isProfit={invoiceMetrics.isExposureProfit}
                            bestCase={invoiceMetrics.bestCaseExposure}
                            feedSymbol={feedSymbol}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Sheet open={isPaymentSidebarOpen} onOpenChange={setIsPaymentSidebarOpen}>
                <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                    <SheetHeader className="mb-6">
                        <SheetTitle>Create Payment Order</SheetTitle>
                    </SheetHeader>
                    <CreatePaymentForm onSuccess={handlePaymentSuccess} />
                </SheetContent>
            </Sheet>
        </div>
    );
}
