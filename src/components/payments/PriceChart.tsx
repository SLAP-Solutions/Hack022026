"use client";

import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PriceBarProps {
    currentPrice: number;
    tpPrice: number;
    slPrice: number;
    ticker: string;
    readOnly?: boolean;
    onSlChange?: (val: number) => void;
    onTpChange?: (val: number) => void;
    className?: string;
}

export function PriceBar({
    currentPrice,
    tpPrice,
    slPrice,
    ticker,
    readOnly = false,
    onSlChange,
    onTpChange,
    className,
}: PriceBarProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);


    useEffect(() => {
        if (containerRef.current) {
            setWidth(containerRef.current.offsetWidth);
        }
    }, []);


    const actualMaxDist = Math.max(Math.abs(tpPrice - currentPrice), Math.abs(currentPrice - slPrice));
    const minDev = currentPrice * (readOnly ? 0.02 : 0.08);
    const maxDeviation = Math.max(actualMaxDist, minDev);

    const zoomPadding = readOnly ? 1.1 : 1.2;
    const minRange = currentPrice - (maxDeviation * zoomPadding);
    const maxRange = currentPrice + (maxDeviation * zoomPadding);
    const totalRange = maxRange - minRange;

    const getPosPercent = (price: number) => {
        return ((price - minRange) / totalRange) * 100;
    };

    const calculatePriceFromX = (x: number) => {
        const percent = (x / width);
        return minRange + (percent * totalRange);
    };

    const handleSlDrag = (event: any, info: any) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const relativeX = info.point.x - rect.left;

        let newPrice = calculatePriceFromX(relativeX);

        // Constraints: 0 < SL < Current Price
        newPrice = Math.max(0, Math.min(newPrice, currentPrice * 0.999));

        onSlChange?.(newPrice);
    };

    const handleTpDrag = (event: any, info: any) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const relativeX = info.point.x - rect.left;

        let newPrice = calculatePriceFromX(relativeX);

        // Constraints: TP > Current Price
        newPrice = Math.max(currentPrice * 1.001, newPrice);

        onTpChange?.(newPrice);
    };

    // Percent positions for rendering
    const currentPos = getPosPercent(currentPrice);
    const slPos = getPosPercent(slPrice);
    const tpPos = getPosPercent(tpPrice);

    // Percent changes for labels
    const slPercentChange = ((slPrice - currentPrice) / currentPrice) * 100;
    const tpPercentChange = ((tpPrice - currentPrice) / currentPrice) * 100;

    return (
        <div className={cn("w-full relative py-8 h-40", className)} ref={containerRef}>
            {/* Background Track */}
            <div className="absolute top-1/2 left-0 right-0 h-2 bg-secondary rounded-full -translate-y-1/2 overflow-hidden">
                {/* Center marker (Current Price reference) */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-muted-foreground/20 z-0"
                    style={{ left: `${currentPos}%` }}
                />

                {/* Filled Range (SL to TP) - purely visual indicator of "active zone" */}
                <div
                    className="absolute top-0 bottom-0 bg-primary/5 transition-all duration-75"
                    style={{
                        left: `${Math.min(slPos, tpPos)}%`,
                        width: `${Math.abs(tpPos - slPos)}%`
                    }}
                />
            </div>

            <motion.div
                drag={readOnly ? false : "x"}
                dragMomentum={false}
                dragElastic={0}
                dragConstraints={containerRef}
                onDrag={handleSlDrag}
                className={cn(
                    "absolute top-1/2 -translate-y-1/2 z-20 flex flex-col items-center cursor-grab active:cursor-grabbing",
                    readOnly && "cursor-default"
                )}
                style={{ left: `${slPos}%` }}
                layout={!readOnly}
            >
                <div className="w-4 h-8 bg-background border-2 border-destructive rounded-full shadow-sm z-20 hover:scale-110 transition-transform" />

                <div className="absolute top-10 flex flex-col items-center pointer-events-none">
                    <span className="text-[10px] font-bold text-destructive uppercase tracking-wider">Stop</span>
                    <span className="text-xs font-mono font-medium">${slPrice.toFixed(2)}</span>
                    <span className="text-[10px] text-destructive/80 font-mono">
                        {slPercentChange.toFixed(1)}%
                    </span>
                </div>
            </motion.div>

            {/* --- CURRENT PRICE INDICATOR (Fixed) --- */}
            <div
                className="absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none flex flex-col items-center"
                style={{ left: `${currentPos}%` }}
            >
                <div className="w-1.5 h-12 bg-primary/50 blur-[2px] absolute" />
                <div className="w-0.5 h-12 bg-primary relative" />

                <div className="absolute bottom-10 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg">
                    Current: ${currentPrice.toFixed(2)}
                </div>
            </div>

            {/* --- TAKE PROFIT HANDLE --- */}
            <motion.div
                drag={readOnly ? false : "x"}
                dragMomentum={false}
                dragElastic={0}
                dragConstraints={containerRef}
                onDrag={handleTpDrag}
                className={cn(
                    "absolute top-1/2 -translate-y-1/2 z-20 flex flex-col items-center cursor-grab active:cursor-grabbing",
                    readOnly && "cursor-default"
                )}
                style={{ left: `${tpPos}%` }}
                layout={!readOnly}
            >
                {/* Handle UI */}
                <div className="w-4 h-8 bg-background border-2 border-green-500 rounded-full shadow-sm z-20 hover:scale-110 transition-transform" />

                {/* Floating Label */}
                <div className="absolute top-10 flex flex-col items-center pointer-events-none">
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Limit</span>
                    <span className="text-xs font-mono font-medium">${tpPrice.toFixed(2)}</span>
                    <span className="text-[10px] text-green-600/80 font-mono">
                        +{tpPercentChange.toFixed(1)}%
                    </span>
                </div>
            </motion.div>
        </div>
    );
}
