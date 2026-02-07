"use client";

import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { BLOCK_EXPLORER } from "@/lib/contract/constants";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function TransactionHistory() {
    const { transactions, loading, error, refetch } = useTransactionHistory();

    if (loading && transactions.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">Loading transactions...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 space-y-4">
                <p className="text-destructive">Error: {error}</p>
                <Button
                    onClick={refetch}
                    variant="outline"
                    size="sm"
                >
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-end mb-4">
                <Button
                    onClick={refetch}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? "Refreshing..." : "Refresh"}
                </Button>
            </div>

            {transactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No transactions found.</p>
            ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {transactions.map((tx) => (
                        <div
                            key={tx.hash}
                            className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span
                                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                                tx.isContractInteraction
                                                    ? "bg-purple-100 text-purple-800"
                                                    : "bg-primary/20 text-primary"
                                            }`}
                                        >
                                            {tx.isContractInteraction ? "Contract" : "Transfer"}
                                        </span>
                                        {tx.method && (
                                            <span className="text-xs text-muted-foreground">
                                                {tx.method}
                                            </span>
                                        )}
                                        <span
                                            className={`px-2 py-0.5 rounded text-xs ${
                                                tx.status === "success"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {tx.status}
                                        </span>
                                    </div>
                                    <div className="text-sm space-y-1">
                                        <p className="text-muted-foreground">
                                            From: <span className="font-mono">{tx.from.slice(0, 10)}...{tx.from.slice(-8)}</span>
                                        </p>
                                        <p className="text-muted-foreground">
                                            To: <span className="font-mono">{tx.to.slice(0, 10)}...{tx.to.slice(-8)}</span>
                                        </p>
                                        <p className="font-semibold">
                                            Value: {parseFloat(tx.value).toFixed(6)} C2FLR
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(tx.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <a
                                    href={`${BLOCK_EXPLORER}/tx/${tx.hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-primary/80 text-sm font-medium"
                                >
                                    View
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
