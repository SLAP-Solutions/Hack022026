"use client";

import { useState } from "react";

interface Claim {
    id: string;
    title: string;
    description: string;
    amount: number;
    status: "pending" | "approved" | "rejected" | "processing";
    date: string;
    category: string;
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

const categoryGradients = {
    Healthcare: "from-red-400/10 via-red-500/10 to-red-600/10",
    Technology: "from-slate-400/10 via-slate-500/10 to-slate-600/10",
    Travel: "from-red-300/10 via-red-400/10 to-red-500/10",
    Education: "from-slate-300/10 via-slate-400/10 to-slate-500/10",
    Office: "from-red-500/10 via-red-600/10 to-red-700/10"
};

export default function ClaimsPage() {
    const [filter, setFilter] = useState<string>("all");

    const filteredClaims = filter === "all"
        ? sampleClaims
        : sampleClaims.filter(claim => claim.status === filter);

    return (
        <div className="min-h-screen bg-white dark:bg-black">
            {/* Header */}
            <header className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-black/50 backdrop-blur-xl sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent">
                                Claims
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">
                                Manage and track all your claims in one place
                            </p>
                        </div>

                        {/* Filter Buttons */}
                        <div className="flex gap-2 flex-wrap">
                            {["all", "pending", "processing", "approved", "rejected"].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilter(status)}
                                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${filter === status
                                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/50"
                                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                                        }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Total Claims", value: sampleClaims.length, color: "from-red-600 to-red-700" },
                        { label: "Pending", value: sampleClaims.filter(c => c.status === "pending").length, color: "from-amber-500 to-yellow-500" },
                        { label: "Approved", value: sampleClaims.filter(c => c.status === "approved").length, color: "from-emerald-500 to-green-500" },
                        { label: "Total Amount", value: `£${sampleClaims.reduce((sum, c) => sum + c.amount, 0).toLocaleString()}`, color: "from-red-700 to-red-800" }
                    ].map((stat, idx) => (
                        <div
                            key={idx}
                            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <div className={`inline-block px-3 py-1 rounded-lg bg-gradient-to-r ${stat.color} text-white text-sm font-semibold mb-2`}>
                                {stat.label}
                            </div>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">
                                {stat.value}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Claims Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClaims.map((claim, idx) => (
                        <div
                            key={claim.id}
                            className="group relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                            style={{
                                animation: `fadeInUp 0.5s ease-out ${idx * 0.1}s both`
                            }}
                        >
                            {/* Gradient Background */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${categoryGradients[claim.category as keyof typeof categoryGradients] || categoryGradients.Technology} opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />

                            {/* Content */}
                            <div className="relative p-6">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="text-sm font-mono text-slate-500 dark:text-slate-400 mb-1">
                                            {claim.id}
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                            {claim.title}
                                        </h3>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[claim.status]}`}>
                                        {claim.status.toUpperCase()}
                                    </span>
                                </div>

                                {/* Description */}
                                <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 line-clamp-2">
                                    {claim.description}
                                </p>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                                    <div>
                                        <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                                            £{claim.amount.toFixed(2)}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            {new Date(claim.date).toLocaleDateString('en-GB', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium">
                                        {claim.category}
                                    </div>
                                </div>
                            </div>

                            {/* Hover Effect Border */}
                            <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-red-500/50 transition-all duration-500" />
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredClaims.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            No claims found
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            Try adjusting your filters to see more results
                        </p>
                    </div>
                )}
            </main>

            <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </div>
    );
}
