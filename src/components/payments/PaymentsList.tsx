"use client";

import { useState } from "react";
import { PaymentCard } from "./PaymentCard";
import { ClaimPaymentWithPrice } from "@/hooks/usePayments";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaymentsListProps {
    payments: ClaimPaymentWithPrice[];
    isLoading: boolean;
    onRefresh?: () => void;
}

export function PaymentsList({ payments, isLoading, onRefresh }: PaymentsListProps) {
    const [filter, setFilter] = useState<"all" | "pending" | "executed">("all");

    const filteredPayments = payments.filter((p) => {
        if (filter === "pending") return !p.executed;
        if (filter === "executed") return p.executed;
        return true;
    });

    if (isLoading) {
        return <div className="text-center py-8 text-muted-foreground">Loading payments...</div>;
    }

    return (
        <div>
            <div className="flex gap-2 mb-4">
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

            {filteredPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    No {filter !== "all" && filter} payments found.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {filteredPayments.map((payment) => (
                        <PaymentCard 
                            key={payment.id.toString()} 
                            payment={payment}
                            onRefresh={onRefresh}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
