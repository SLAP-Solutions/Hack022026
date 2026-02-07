"use client";

import { useState } from "react";
import claimsData from "@/data/claims.json";
import { PriceDashboard } from "@/components/prices/PriceDashboard";
import { ClaimCard } from "@/components/claims/ClaimCard";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const statusConfig = {
    pending: "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200",
    processing: "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200",
    approved: "bg-green-100 text-green-800 border-green-300 hover:bg-green-200",
    settled: "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200",
    rejected: "bg-red-100 text-red-800 border-red-300 hover:bg-red-200",
};

export default function ClaimsPage() {
    const [filter, setFilter] = useState<string>("all");
    const router = useRouter();

    const filteredClaims = filter === "all"
        ? claimsData
        : claimsData.filter(claim => claim.status === filter);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 pt-24">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <div>
                    <h1 className="text-3xl font-bold bg-clip-text font-serif">
                        Claims
                    </h1>
                        <p className="text-muted-foreground mt-2">
                            Manage and track all insurance claims
                        </p>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex gap-2 flex-wrap">
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
                                        "capitalize",
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
                </div>

                {/* Price Dashboard */}
                <PriceDashboard />

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
        </div>
    );
}
