"use client";

import { cn } from "@/lib/utils";

interface PriceCardProps {
    symbol: string;
    price: string;
    timestamp: number;
    loading: boolean;
    error: string | null;
    className?: string;
}

export function PriceCard({ symbol, price, timestamp, loading, error, className }: PriceCardProps) {
    return (
        <div className={cn("flex items-center justify-between w-full p-2 rounded-md hover:bg-muted/50 transition-colors group", className)}>
            <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary transition-colors">
                    {symbol.split("/")[0]}
                </span>
            </div>

            {loading ? (
                <div className="h-4 w-12 bg-muted animate-pulse rounded" />
            ) : error ? (
                <span className="text-xs text-destructive">Error</span>
            ) : (
                <span className="text-base font-mono font-bold">
                    ${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </span>
            )}
        </div>
    );
}
