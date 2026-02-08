"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, DollarSign, Tag, Receipt, User, Building, Plus, ShieldAlert, CreditCard, Bell, Clock } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CreatePaymentForm } from "@/components/payments/CreatePaymentForm";
import { useContract } from "@/hooks/useContract";
import { PaymentCard } from "@/components/payments/PaymentCard";
import { FEED_IDS } from "@/lib/contract/constants";
import { ClaimRiskModal } from "@/components/modals/ClaimRiskModal";
import { useInvoicesStore } from "@/stores/useInvoicesStore";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { getFeedName, getFeedSymbol } from "@/config/feeds";
import { useFTSOPrices } from "@/hooks/useFTSOPrices";
import { usePayments } from "@/hooks/usePayments";

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
    const { getInvoice, updatePaymentStatus, addPayment } = useInvoicesStore();
    const { getClaimPayment } = useContract();
    const { prices } = useFTSOPrices();
    const { payments: livePayments } = usePayments();
    const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
    const [isPaymentSidebarOpen, setIsPaymentSidebarOpen] = useState(false);
    const [refreshTimer, setRefreshTimer] = useState(2);

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

    // Derive status based on live payments (matches InvoicesPage logic)
    const updatedPayments = invoice.payments?.map(payment => {
        const livePayment = livePayments.find(p => p.id === Number(payment.id));
        if (livePayment) {
            return {
                ...payment,
                status: (livePayment.executed ? 'executed' : 'pending') as 'pending' | 'executed',
                executed: livePayment.executed,
                executedAt: BigInt(livePayment.executedAt),
            };
        }
        return {
            ...payment,
            status: (payment.executed ? 'executed' : 'pending') as 'pending' | 'executed',
        };
    }) || [];

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
                            <span className="flex items-center gap-1 text-xs text-muted-foreground self-center mr-2">
                                <Clock className="w-3 h-3" />
                                Refreshes in {refreshTimer}s
                            </span>
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
                    {invoice.payments && invoice.payments.length > 0 ? (
                        <div className="columns-1 md:columns-2 gap-4 space-y-4">
                            {invoice.payments.map((payment) => {
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
            <Sheet open={isPaymentSidebarOpen} onOpenChange={setIsPaymentSidebarOpen}>
                <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                    <SheetHeader className="mb-6">
                        <SheetTitle>Create Payment Order</SheetTitle>
                    </SheetHeader>
                    <CreatePaymentForm onSuccess={handlePaymentSuccess} />
                </SheetContent>
            </Sheet>
            <ClaimRiskModal
                open={isRiskModalOpen}
                onOpenChange={setIsRiskModalOpen}
                claim={invoice}
            />
        </div>
    );
}
