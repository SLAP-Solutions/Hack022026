"use client";

import { useState } from "react";
import { PaymentCard } from "./PaymentCard";
import { ClaimPaymentWithPrice } from "@/hooks/usePayments";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface PaymentsListProps {
    payments: ClaimPaymentWithPrice[];
    isLoading: boolean;
    onRefresh?: () => void;
    paymentToInvoiceMap?: Record<string, { id: string; title: string }>;
    invoices?: { id: string; title: string }[];
}

export function PaymentsList({ payments, isLoading, onRefresh, paymentToInvoiceMap, invoices }: PaymentsListProps) {
    const [filter, setFilter] = useState<"all" | "pending" | "executed">("all");
    const [invoiceFilter, setInvoiceFilter] = useState<string>("all");

    const filteredPayments = payments.filter((p) => {
        // Invoice filter check
        if (invoiceFilter !== "all") {
            const inv = paymentToInvoiceMap?.[p.id.toString()];
            if (invoiceFilter === "none") {
                if (inv) return false;
            } else {
                if (inv?.id !== invoiceFilter) return false;
            }
        }

        // Status filter check
        if (filter === "pending") return !p.executed;
        if (filter === "executed") return p.executed;
        return true;
    });

    if (isLoading) {
        return <div className="text-center py-8 text-muted-foreground">Loading payments...</div>;
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row gap-4 mb-4 justify-between items-start sm:items-center">
                <div className="flex gap-2">
                    <Button
                        onClick={() => setFilter("all")}
                        variant={filter === "all" ? "default" : "outline"}
                        size="sm"
                    >
                        All ({payments.length})
                    </Button>
                    <Button
                        onClick={() => setFilter("pending")}
                        variant={filter === "pending" ? "default" : "outline"}
                        size="sm"
                    >
                        Pending ({payments.filter((p) => !p.executed).length})
                    </Button>
                    <Button
                        onClick={() => setFilter("executed")}
                        variant={filter === "executed" ? "default" : "outline"}
                        size="sm"
                    >
                        Executed ({payments.filter((p) => p.executed).length})
                    </Button>
                </div>

                <div className="w-full sm:w-[250px]">
                    <Select value={invoiceFilter} onValueChange={setInvoiceFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by Invoice" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Invoices</SelectItem>
                            <SelectItem value="none">No Invoice</SelectItem>
                            {invoices?.map((invoice) => (
                                <SelectItem key={invoice.id} value={invoice.id}>
                                    <span className="truncate block max-w-[200px]">
                                        {invoice.title || `Invoice #${invoice.id}`}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            <div className="flex flex-col sm:flex-row gap-4 mb-4 items-start sm:items-center">
                <div className="flex gap-2">
                    <Button
                        onClick={() => setFilter("all")}
                        variant={filter === "all" ? "default" : "outline"}
                        size="sm"
                    >
                        All ({payments.length})
                    </Button>
                    <Button
                        onClick={() => setFilter("pending")}
                        variant={filter === "pending" ? "default" : "outline"}
                        size="sm"
                    >
                        Pending ({payments.filter((p) => !p.executed).length})
                    </Button>
                    <Button
                        onClick={() => setFilter("executed")}
                        variant={filter === "executed" ? "default" : "outline"}
                        size="sm"
                    >
                        Executed ({payments.filter((p) => p.executed).length})
                    </Button>
                </div>

                <div className="w-full sm:w-[300px]">
                    <Select value={invoiceFilter} onValueChange={setInvoiceFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by Invoice" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Invoices</SelectItem>
                            <SelectItem value="none">No Invoice</SelectItem>
                            {invoices?.map((invoice) => (
                                <SelectItem key={invoice.id} value={invoice.id}>
                                    <span className="truncate block">
                                        {invoice.title || `Invoice #${invoice.id}`}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {filteredPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    No {filter !== "all" && filter} payments found.
                </div>
            ) : (
                <div className="columns-1 md:columns-2 gap-4 space-y-4">
                    {filteredPayments.map((payment) => (
                        <div key={payment.id.toString()} className="break-inside-avoid mb-4">
                            <PaymentCard
                                payment={payment}
                                onRefresh={onRefresh}
                                invoiceId={paymentToInvoiceMap?.[payment.id.toString()]?.id}
                                invoiceTitle={paymentToInvoiceMap?.[payment.id.toString()]?.title}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
