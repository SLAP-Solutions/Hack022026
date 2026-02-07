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
import { useClaimsStore } from "@/stores/useClaimsStore";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { getFeedName, getFeedSymbol } from "@/config/feeds";
import { useFTSOPrices } from "@/hooks/useFTSOPrices";

const statusConfig = {
    pending: { color: "bg-amber-100 text-amber-800 border-amber-300" },
    processing: { color: "bg-blue-100 text-blue-800 border-blue-300" },
    approved: { color: "bg-green-100 text-green-800 border-green-300" },
    settled: { color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
    rejected: { color: "bg-red-100 text-red-800 border-red-300" },
};

const paymentStatusConfig = {
    pending: { color: "bg-amber-50 text-amber-700 border-amber-200", label: "Pending" },
    executed: { color: "bg-green-50 text-green-700 border-green-200", label: "Executed" },
    expired: { color: "bg-gray-50 text-gray-700 border-gray-200", label: "Expired" },
};

export default function ClaimDetailPage() {
    const params = useParams();
    const router = useRouter();
    const claimId = params.id as string;
    const { getClaim, updatePaymentStatus } = useClaimsStore();
    const { openModal } = usePaymentModal();
    const { prices } = useFTSOPrices();
    const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);

    const claim = getClaim(claimId);

    if (!claim) {
        return (
            <div className="max-w-4xl mx-auto">
                <Card>
                    <CardContent className="pt-16 pb-16 text-center">
                        <h1 className="text-4xl font-bold mb-4">Claim Not Found</h1>
                        <p className="text-muted-foreground mb-8">
                            The claim you're looking for doesn't exist.
                        </p>
                        <Button onClick={() => router.push("/claims")}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Claims
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const statusInfo = statusConfig[claim.status as keyof typeof statusConfig];

    return (
        <div className="max-w-7xl mx-auto space-y-6">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => router.push("/claims")}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Claims
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
                                            {claim.id}
                                        </Badge>
                                        <Badge className={cn("text-xs border", statusInfo.color)}>
                                            {claim.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent mb-2">
                                        {claim.title}
                                    </h1>
                                    <p className="text-muted-foreground">{claim.description}</p>
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
                                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                                    ${(claim.payments?.reduce((acc: number, payment: any) => acc + (Number(payment.originalAmount || payment.usdAmount)), 0) || 0).toFixed(2)}
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
                                <span className="text-xs font-medium">Claimant</span>
                            </div>
                            <p className="font-semibold">{claim.claimantName}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Building className="w-4 h-4" />
                                <span className="text-xs font-medium">Line of Business</span>
                            </div>
                            <Badge variant="secondary">{claim.lineOfBusiness}</Badge>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Calendar className="w-4 h-4" />
                                <span className="text-xs font-medium">Created</span>
                            </div>
                            <p className="font-semibold">
                                {new Date(claim.dateCreated).toLocaleDateString()}
                            </p>
                        </CardContent>
                    </Card>

                    {claim.dateSettled && (
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-xs font-medium">Settled</span>
                                </div>
                                <p className="font-semibold">
                                    {new Date(claim.dateSettled).toLocaleDateString()}
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
                                <Badge variant="secondary">{claim.payments.length}</Badge>
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
                                    onClick={() => openModal(claim.id)}
                                    size="sm"
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Payment
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {claim.payments && claim.payments.length > 0 ? (
                            <div className="space-y-3">
                                {claim.payments.map((payment: any) => {
                                    const paymentStatus = paymentStatusConfig[(payment.status || "pending") as keyof typeof paymentStatusConfig];

                                    // Calculate display values
                                    const amount = Number(payment.originalAmount || payment.usdAmount);
                                    const currentUsdAmount = Number(payment.usdAmount);
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
                                                        value={[currentUsdAmount]}
                                                        max={upper}
                                                        min={lower}
                                                        step={0.01}
                                                        disabled
                                                        className="opacity-100"
                                                        trackClassName="bg-gradient-to-r from-red-500 to-green-500"
                                                        rangeClassName="opacity-0"
                                                        thumbContent={`$${currentUsdAmount.toFixed(2)}`}
                                                    />
                                                </div>

                                                {payment.status === 'pending' && (
                                                    <div className="mt-4 flex items-center gap-3">
                                                        <Button
                                                            size="sm"
                                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                                            onClick={() => updatePaymentStatus(claim.id, payment.id, 'executed')}
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

                                                            const currentCryptoAmount = currentUsdAmount / currentPrice;
                                                            const originalCryptoAmount = amount / currentPrice;
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
                                                        {payment.expiresAt && (
                                                            <div className="ml-auto text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200 whitespace-nowrap">
                                                                {Math.ceil((new Date(payment.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} Days Left
                                                            </div>
                                                        )}
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
                claim={claim}
            />
        </div>
    );
}
