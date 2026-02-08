"use client";

import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface PriceCardProps {
    symbol: string;
    price: string;
    timestamp: number;
    loading: boolean;
    error: string | null;
    className?: string;
}

export function PriceCard({ symbol, price, timestamp, loading, error, className }: PriceCardProps) {
    const prevPriceRef = useRef<number | null>(null);
    const [trend, setTrend] = useState<'up' | 'down' | 'neutral'>('neutral');

    useEffect(() => {
        const current = Number(price);
        if (prevPriceRef.current !== null) {
            const prev = prevPriceRef.current;
            if (current > prev) setTrend('up');
            else if (current < prev) setTrend('down');
            else setTrend('neutral');
        }
        prevPriceRef.current = current;
    }, [price, timestamp]); // Run when timestamp updates even if price is same

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
                <div className="flex items-center gap-1.5">
                    <span className="text-base font-mono font-bold">
                        ${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </span>
                    {trend === 'up' && <ArrowUp className="w-3 h-3 text-green-500" />}
                    {trend === 'down' && <ArrowDown className="w-3 h-3 text-red-500" />}
                    {trend === 'neutral' && <Minus className="w-3 h-3 text-blue-500" />}
                </div>
            )}
        </div>
    );
}
