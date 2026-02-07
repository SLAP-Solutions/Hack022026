"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, User, Calendar, DollarSign, CheckCircle, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Payment {
    id: string | bigint;
    receiver: string;
    usdAmount: number;
    cryptoSymbol: string;
    status: "pending" | "executed" | "expired";
    executedAt: string | number | bigint | null;
}

interface ClaimCardProps {
    id: string;
    title: string;
    description: string;
    claimantName: string;
    type: string;
    status: "pending" | "approved" | "rejected" | "processing" | "settled";
    totalCost: number;
    dateCreated: string;
    dateSettled?: string;
    payments: Payment[];
    onClick?: () => void;
}

const statusConfig = {
    pending: { color: "bg-amber-100 text-amber-800 border-amber-300", icon: Clock },
    processing: { color: "bg-primary/20 text-primary border-primary/40", icon: Clock },
    approved: { color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle },
    settled: { color: "bg-emerald-100 text-emerald-800 border-emerald-300", icon: CheckCircle },
    rejected: { color: "bg-red-100 text-red-800 border-red-300", icon: XCircle },
};

const paymentStatusConfig = {
    pending: { color: "bg-amber-50 text-amber-700 border-amber-200", label: "Pending" },
    executed: { color: "bg-green-50 text-green-700 border-green-200", label: "Executed" },
    expired: { color: "bg-gray-50 text-gray-700 border-gray-200", label: "Expired" },
};

export function ClaimCard(props: ClaimCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const statusInfo = statusConfig[props.status];
    const StatusIcon = statusInfo.icon;

    return (
        <Card className="shadow-none hover:shadow-lg transition-all duration-300" onClick={props.onClick}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                                {props.id}
                            </Badge>
                            <Badge className={cn("text-xs border", statusInfo.color)}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {props.status.toUpperCase()}
                            </Badge>
                        </div>
                        <CardTitle className="text-xl mb-1">{props.title}</CardTitle>
                        <CardDescription className="text-sm">{props.description}</CardDescription>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Claimant</p>
                            <p className="font-medium">{props.claimantName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Total Cost</p>
                            <p className="font-bold text-primary">${props.totalCost.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Created</p>
                            <p className="font-medium">{new Date(props.dateCreated).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-xs text-muted-foreground">Type</span>
                        <Badge variant="secondary" className="text-xs">{props.type}</Badge>
                    </div>
                </div>
            </CardHeader>

            {props.payments.length > 0 && (
                <>
                    <CardContent className="pt-0">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <span className="text-sm font-medium">
                                {props.payments.length} Payment{props.payments.length !== 1 ? 's' : ''}
                            </span>
                            {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                        </button>

                        {isExpanded && (
                            <div className="mt-3 space-y-2">
                                {props.payments.map((payment) => {
                                    const paymentStatus = paymentStatusConfig[payment.status];
                                    return (
                                        <div
                                            key={payment.id.toString()}
                                            className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <Badge className={cn("text-xs border", paymentStatus.color)}>
                                                    {paymentStatus.label}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    ID: {payment.id.toString()}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Amount</p>
                                                    <p className="font-semibold">
                                                        ${Number(payment.usdAmount).toFixed(2)} ({payment.cryptoSymbol})
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Receiver</p>
                                                    <p className="font-mono text-xs truncate">
                                                        {payment.receiver.slice(0, 6)}...{payment.receiver.slice(-4)}
                                                    </p>
                                                </div>
                                                {payment.executedAt && (
                                                    <div className="col-span-2">
                                                        <p className="text-xs text-muted-foreground">Executed</p>
                                                        <p className="text-xs">
                                                            {new Date(Number(payment.executedAt) * 1000).toLocaleString()}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </>
            )}
        </Card>
    );
}
