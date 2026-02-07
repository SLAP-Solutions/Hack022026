"use client";

import { useState } from "react";
import claimsData from "@/data/claims.json";
import { PriceDashboard } from "@/components/prices/PriceDashboard";
import { ClaimCard } from "@/components/claims/ClaimCard";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const statusConfig = {
    pending: "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20",
    processing: "bg-primary/20 text-primary border-primary/40 hover:bg-primary/30",
    approved: "bg-primary/30 text-primary border-primary/50 hover:bg-primary/40",
    settled: "bg-primary/40 text-primary border-primary/60 hover:bg-primary/50",
    rejected: "bg-primary/15 text-primary border-primary/35 hover:bg-primary/25",
};

export default function ClaimsPage() {
    const [filter, setFilter] = useState<string>("all");
    const router = useRouter();

    const filteredClaims = filter === "all"
        ? claimsData
        : claimsData.filter(claim => claim.status === filter);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-serif">
                        Claims
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage and track all insurance claims
                    </p>
                </div>

                {/* Filter Buttons and Prices Row */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Filter Buttons */}
                    <div className="flex gap-2 flex-nowrap overflow-x-auto pb-2">
                        {["all", "pending", "processing", "approved", "settled", "rejected"].map((status) => {
                            const activeStyle = status === "all"
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : statusConfig[status as keyof typeof statusConfig];

                            return (
                                <Button
                                    key={status}
                                    onClick={() => setFilter(status)}
                                    variant={filter === status ? "default" : "outline"}
                                    size="sm"
                                    className={cn(
                                        "capitalize whitespace-nowrap",
                                        filter === status
                                            ? cn(activeStyle, "border-transparent shadow-sm")
                                            : "hover:bg-muted"
                                    )}
                                >
                                    {status}
                                </Button>
                            );
                        })}
                    </div>

                    {/* Price Dashboard - Same Row */}
                    <div className="shrink-0">
                        <PriceDashboard />
                    </div>
                </div>
            </div>

            {/* Claims Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClaims.map((claim) => (
                    <ClaimCard
                        key={claim.id}
                        id={claim.id}
                        title={claim.title}
                        description={claim.description}
                        claimantName={claim.claimantName}
                        lineOfBusiness={claim.lineOfBusiness}
                        status={claim.status as any}
                        totalCost={claim.payments?.reduce((acc: number, p: any) => acc + Number(p.usdAmount), 0) || 0}
                        dateCreated={claim.dateCreated}
                        dateSettled={claim.dateSettled}
                        payments={claim.payments as any}
                        onClick={() => router.push(`/claims/${claim.id}`)}
                    />
                ))}
            </div>

            {/* Empty State */}
            {filteredClaims.length === 0 && (
                <div className="text-center py-16">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-2xl font-bold mb-2">
                        No claims found
                    </h3>
                    <p className="text-muted-foreground">
                        Try adjusting your filters to see more results
                    </p>
                </div>
            )}
        </div>
    );
}
