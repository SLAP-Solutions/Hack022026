"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Calendar, DollarSign, Tag, Receipt } from "lucide-react";

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
        { id: "PAY-002-1", date: "2026-02-05", amount: 649.99, method: "Credit Card", status: "completed", reference: "TXN-20260205-002" },
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

    const claim = sampleClaims.find(c => c.id === claimId);

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
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => router.push("/claims")}
                    className="mb-6"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Claims
                </Button>

                {/* Claim Header */}
                <Card className="mb-6">
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

                {/* Claim Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Amount Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <DollarSign className="w-5 h-5" />
                                <h3 className="font-semibold">Claim Amount</h3>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                                £{claim.amount.toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Date Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <Calendar className="w-5 h-5" />
                                <h3 className="font-semibold">Claim Date</h3>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                {new Date(claim.date).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Description Card */}
                <Card className="mb-6">
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
                <Card className="mb-6">
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

                {/* Payment History */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                            <Receipt className="w-5 h-5" />
                            <h3 className="text-xl font-semibold">Payment History</h3>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {claimPayments[claim.id] && claimPayments[claim.id].length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {claimPayments[claim.id].map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell className="font-medium">
                                                {new Date(payment.date).toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm text-slate-600 dark:text-slate-400">
                                                {payment.reference}
                                            </TableCell>
                                            <TableCell>{payment.method}</TableCell>
                                            <TableCell className="text-right font-semibold">
                                                £{payment.amount.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className={`font-medium ${paymentStatusColors[payment.status]}`}>
                                                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No payments recorded yet</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
