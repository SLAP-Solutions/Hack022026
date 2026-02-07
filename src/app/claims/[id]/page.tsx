"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Calendar, DollarSign, Tag, Receipt, Plus } from "lucide-react";
import { usePaymentModal } from "@/stores/usePaymentModal";
import { AddPaymentModal } from "@/components/modals/AddPaymentModal";
import { Slider } from "@/components/ui/slider";

interface Claim {
    id: string;
    title: string;
    description: string;
    amount: number;
    status: "pending" | "approved" | "rejected" | "processing";
    date: string;
    category: string;
}

interface Payment {
    id: string;
    date: string;
    amount: number;
    method: string;
    status: "completed" | "pending" | "failed";
    reference: string;
    lowerBound?: number;
    upperBound?: number;
    marketPrice?: number;
}

const sampleClaims: Claim[] = [
    {
        id: "CLM-001",
        title: "Medical Consultation",
        description: "Annual health checkup and consultation with specialist",
        amount: 450.00,
        status: "approved",
        date: "2026-02-05",
        category: "Healthcare"
    },
    {
        id: "CLM-002",
        title: "Equipment Purchase",
        description: "New laptop for remote work setup",
        amount: 1299.99,
        status: "processing",
        date: "2026-02-04",
        category: "Technology"
    },
    {
        id: "CLM-003",
        title: "Travel Expenses",
        description: "Business trip to London - flights and accommodation",
        amount: 875.50,
        status: "pending",
        date: "2026-02-03",
        category: "Travel"
    },
    {
        id: "CLM-004",
        title: "Professional Development",
        description: "Online course certification in cloud architecture",
        amount: 299.00,
        status: "approved",
        date: "2026-02-02",
        category: "Education"
    },
    {
        id: "CLM-005",
        title: "Office Supplies",
        description: "Ergonomic chair and desk accessories",
        amount: 520.00,
        status: "rejected",
        date: "2026-02-01",
        category: "Office"
    },
    {
        id: "CLM-006",
        title: "Software Subscription",
        description: "Annual license for development tools",
        amount: 699.00,
        status: "pending",
        date: "2026-01-31",
        category: "Technology"
    }
];

const statusColors = {
    pending: "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
    approved: "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    rejected: "bg-gradient-to-r from-rose-500/20 to-red-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30",
    processing: "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30"
};

const paymentStatusColors = {
    completed: "text-emerald-700 dark:text-emerald-400",
    pending: "text-amber-700 dark:text-amber-400",
    failed: "text-rose-700 dark:text-rose-400"
};

// Sample payment data for each claim
const claimPayments: Record<string, Payment[]> = {
    "CLM-001": [
        { id: "PAY-001-1", date: "2026-02-06", amount: 450.00, method: "Bank Transfer", status: "completed", reference: "TXN-20260206-001" }
    ],
    "CLM-002": [
        { id: "PAY-002-1", date: "2026-02-05", amount: 649.99, method: "Credit Card", status: "completed", reference: "TXN-20260205-002", lowerBound: 640.00, upperBound: 660.00, marketPrice: 655.00 },
        { id: "PAY-002-2", date: "2026-02-06", amount: 650.00, method: "Credit Card", status: "pending", reference: "TXN-20260206-003" }
    ],
    "CLM-003": [],
    "CLM-004": [
        { id: "PAY-004-1", date: "2026-02-03", amount: 299.00, method: "PayPal", status: "completed", reference: "TXN-20260203-004" }
    ],
    "CLM-005": [
        { id: "PAY-005-1", date: "2026-02-02", amount: 520.00, method: "Bank Transfer", status: "failed", reference: "TXN-20260202-005" }
    ],
    "CLM-006": []
};

export default function ClaimDetailPage() {
    const params = useParams();
    const router = useRouter();
    const claimId = params.id as string;
    const { openModal } = usePaymentModal();

    const claim = sampleClaims.find(c => c.id === claimId);

    // Initialize payments state
    const [payments, setPayments] = useState(claimPayments[claimId] || []);

    // Handle adding new payment
    const handlePaymentAdded = (newPayment: any) => {
        setPayments(prev => [...prev, newPayment]);
    };

    if (!claim) {
        return (
            <div className="min-h-screen bg-white dark:bg-black pt-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <Card>
                        <CardContent className="pt-16 pb-16 text-center">
                            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Claim Not Found</h1>
                            <p className="text-slate-600 dark:text-slate-400 mb-8">
                                The claim you're looking for doesn't exist.
                            </p>
                            <Button onClick={() => router.push("/claims")}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Claims
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => router.push("/claims")}
                    className="mb-6"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Claims
                </Button>

                {/* Header Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Claim Title & Status */}
                    <Card className="h-full">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-sm font-mono text-slate-500 dark:text-slate-400 mb-2">
                                        {claim.id}
                                    </div>
                                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent mb-2">
                                        {claim.title}
                                    </h1>
                                </div>
                                <Badge variant="outline" className={`${statusColors[claim.status]} text-sm px-4 py-2`}>
                                    {claim.status.toUpperCase()}
                                </Badge>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Combined Amount and Date Card */}
                    <Card className="h-full">
                        <CardContent className="p-6 h-full flex flex-col justify-center">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                                        <DollarSign className="w-3.5 h-3.5" />
                                        <span className="text-xs font-medium uppercase tracking-wider">Claim Amount</span>
                                    </div>
                                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                                        £{claim.amount.toFixed(2)}
                                    </div>
                                </div>

                                <div className="h-px md:h-12 w-full md:w-px bg-slate-100 dark:bg-slate-800" />

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span className="text-xs font-medium uppercase tracking-wider">Claim Date</span>
                                    </div>
                                    <div className="text-xl font-semibold text-slate-900 dark:text-white">
                                        {new Date(claim.date).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Claim Details */}
                    <div className="space-y-6">
                        {/* Claim Details */}

                        {/* Description Card */}
                        <Card>
                            <CardHeader>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Description</h3>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {claim.description}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Category Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                    <Tag className="w-5 h-5" />
                                    <h3 className="font-semibold">Category</h3>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Badge variant="secondary" className="text-lg px-4 py-2">
                                    {claim.category}
                                </Badge>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Payment History */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                                        <Receipt className="w-5 h-5" />
                                        <h3 className="text-xl font-semibold">Payment History</h3>
                                    </div>
                                    <Button
                                        onClick={() => openModal(claim.id)}
                                        size="sm"
                                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Payment
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {payments && payments.length > 0 ? (
                                    <div className="space-y-3">
                                        {payments.map((payment) => (
                                            <Card key={payment.id} className="hover:shadow-md transition-shadow">
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <Receipt className="w-4 h-4 text-slate-500" />
                                                            <span className="font-mono text-sm text-slate-600 dark:text-slate-400">
                                                                {payment.reference}
                                                            </span>
                                                        </div>
                                                        <span className={`font-medium text-sm ${paymentStatusColors[payment.status]}`}>
                                                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Amount</div>
                                                            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                                                                £{payment.amount.toFixed(2)}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Method</div>
                                                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                                                                {payment.method}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {(payment.lowerBound !== undefined && payment.upperBound !== undefined) && (
                                                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                                            <div className="mb-3">
                                                                <div className="flex justify-between items-end mb-2">
                                                                    <div className="text-xs text-slate-500">
                                                                        Lower: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">£{payment.lowerBound.toFixed(2)}</span>
                                                                    </div>
                                                                    {payment.marketPrice !== undefined && (
                                                                        <div className="text-xs text-blue-600 font-medium">
                                                                            Market: <span className="font-mono">£{payment.marketPrice.toFixed(2)}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="text-xs text-slate-500">
                                                                        Upper: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">£{payment.upperBound.toFixed(2)}</span>
                                                                    </div>
                                                                </div>
                                                                <Slider
                                                                    value={[payment.marketPrice || payment.amount]}
                                                                    max={payment.upperBound}
                                                                    min={payment.lowerBound}
                                                                    step={0.01}
                                                                    className="py-1 opacity-100"
                                                                    disabled
                                                                    trackClassName="bg-gradient-to-r from-red-500 to-green-500"
                                                                    rangeClassName="opacity-0"
                                                                    thumbContent={`£${(payment.marketPrice || payment.amount).toFixed(2)}`}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                                            {new Date(payment.date).toLocaleDateString('en-GB', {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric'
                                                            })}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                        <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>No payments recorded yet</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Add Payment Modal */}
                        <AddPaymentModal onPaymentAdded={handlePaymentAdded} />
                    </div>
                </div>
            </div>
        </div>
    );
}
