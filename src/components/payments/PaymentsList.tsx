"use client";

import { useState } from "react";
import { PaymentCard } from "./PaymentCard";
import { ClaimPaymentWithPrice } from "@/hooks/usePayments";

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
        return <div className="text-center py-8">Loading payments...</div>;
    }

    return (
        <div>
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setFilter("all")}
                    className={`px-4 py-2 rounded font-semibold ${
                        filter === "all" ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
                >
                    All ({payments.length})
                </button>
                <button
                    onClick={() => setFilter("pending")}
                    className={`px-4 py-2 rounded font-semibold ${
                        filter === "pending" ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
                >
                    Pending ({payments.filter((p) => !p.executed).length})
                </button>
                <button
                    onClick={() => setFilter("executed")}
                    className={`px-4 py-2 rounded font-semibold ${
                        filter === "executed" ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
                >
                    Executed ({payments.filter((p) => p.executed).length})
                </button>
            </div>

            {filteredPayments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    No {filter !== "all" && filter} payments found.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
