"use client";

import { useState } from "react";
import claimsData from "@/data/claims.json";
import { PriceDashboard } from "@/components/prices/PriceDashboard";
import { ClaimCard } from "@/components/claims/ClaimCard";
import { Button } from "@/components/ui/button";

export default function ClaimsPage() {
    const [filter, setFilter] = useState<string>("all");

    const filteredClaims = filter === "all"
        ? claimsData
        : claimsData.filter(claim => claim.status === filter);

    return (
        <div className="min-h-screen p-8 pt-24">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent">
                            Claims Dashboard
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Manage and track all insurance claims
                        </p>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex gap-2 flex-wrap">
                        {["all", "pending", "processing", "approved", "settled", "rejected"].map((status) => (
                            <Button
                                key={status}
                                onClick={() => setFilter(status)}
                                variant={filter === status ? "default" : "outline"}
                                size="sm"
                                className={filter === status ? "bg-gradient-to-r from-blue-600 to-blue-700" : ""}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Button>
                        ))}
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
                            totalCost={claim.totalCost}
                            dateCreated={claim.dateCreated}
                            dateSettled={claim.dateSettled}
                            payments={claim.payments as any}
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
