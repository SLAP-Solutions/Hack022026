"use client";

import { useRef, useState, useEffect } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

export interface PriceChartProps {
    data: { time: number; price: number }[];
    minPrice: number;
    maxPrice: number;
    currentPrice: number;
    tpPrice: number;
    slPrice: number;
    readOnly?: boolean;
    onDrag?: (type: "tp" | "sl", price: number) => void;
    height?: number | string;
    showLabels?: boolean;
}

export function PriceChart({
    data,
    minPrice,
    maxPrice,
    currentPrice,
    tpPrice,
    slPrice,
    readOnly = false,
    onDrag,
    height = "100%",
    showLabels = true,
}: PriceChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState<"tp" | "sl" | null>(null);

    // Helper to get % position for CSS top
    const getTopPercent = (price: number) => {
        const fraction = (maxPrice - price) / (maxPrice - minPrice);
        return Math.max(0, Math.min(100, fraction * 100));
    };

    const formatPrice = (p: number) => p.toFixed(2);

    const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
        if (!dragging || !containerRef.current || readOnly || !onDrag) return;

        const rect = containerRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const h = rect.height;

        // Clamp y
        const clampedY = Math.max(0, Math.min(h, y));
        const ratio = clampedY / h;
        const priceRange = maxPrice - minPrice;
        const newPrice = maxPrice - (ratio * priceRange);

        onDrag(dragging, newPrice);
    };

    const handleMouseUp = () => {
        setDragging(null);
    };

    // Attach global mouse listeners when dragging
    useEffect(() => {
        if (dragging) {
            window.addEventListener("mousemove", handleMouseMove as any);
            window.addEventListener("mouseup", handleMouseUp);
        } else {
            window.removeEventListener("mousemove", handleMouseMove as any);
            window.removeEventListener("mouseup", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove as any);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [dragging, maxPrice, minPrice]);

    return (
        <div
            className="relative w-full bg-slate-50 dark:bg-slate-900 rounded-md border overflow-hidden select-none"
            style={{ height }}
            ref={containerRef}
        >
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <YAxis
                        domain={[minPrice, maxPrice]}
                        hide={true}
                        type="number"
                    />
                    <XAxis dataKey="time" hide={true} />
                    <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                    />
                </LineChart>
            </ResponsiveContainer>

            {/* Current Price Line */}
            <div
                className="absolute w-full border-t-2 border-blue-500 border-dotted pointer-events-none flex items-center justify-end pr-2"
                style={{ top: `${getTopPercent(currentPrice)}%` }}
            >
                {showLabels && (
                    <div className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow absolute right-0 -translate-y-1/2">
                        ${formatPrice(currentPrice)}
                    </div>
                )}
            </div>

            {/* Take Profit Line (Draggable) */}
            <div
                className={cn(
                    "absolute w-full border-t-2 border-green-500 flex items-center justify-between transition-opacity",
                    !readOnly && "cursor-ns-resize group",
                    dragging === 'tp' ? "z-50 opacity-100" : "z-40 opacity-80 hover:opacity-100"
                )}
                style={{ top: `${getTopPercent(tpPrice)}%` }}
                onMouseDown={(e) => {
                    if (readOnly) return;
                    e.preventDefault();
                    setDragging("tp");
                }}
            >
                {showLabels && (
                    <>
                        <div className={cn(
                            "bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded ml-2 -translate-y-1/2 select-none shadow-sm transition-transform",
                            !readOnly && "group-hover:scale-110"
                        )}>
                            TP
                        </div>
                        <div className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded mr-2 -translate-y-1/2 select-none shadow-sm font-mono">
                            ${formatPrice(tpPrice)} ({(((tpPrice - currentPrice) / currentPrice) * 100).toFixed(1)}%)
                        </div>
                    </>
                )}
            </div>

            {/* Stop Loss Line (Draggable) */}
            <div
                className={cn(
                    "absolute w-full border-t-2 border-red-500 flex items-center justify-between transition-opacity",
                    !readOnly && "cursor-ns-resize group",
                    dragging === 'sl' ? "z-50 opacity-100" : "z-40 opacity-80 hover:opacity-100"
                )}
                style={{ top: `${getTopPercent(slPrice)}%` }}
                onMouseDown={(e) => {
                    if (readOnly) return;
                    e.preventDefault();
                    setDragging("sl");
                }}
            >
                {showLabels && (
                    <>
                        <div className={cn(
                            "bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded ml-2 -translate-y-1/2 select-none shadow-sm transition-transform",
                            !readOnly && "group-hover:scale-110"
                        )}>
                            SL
                        </div>
                        <div className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded mr-2 -translate-y-1/2 select-none shadow-sm font-mono">
                            ${formatPrice(slPrice)} ({(((slPrice - currentPrice) / currentPrice) * 100).toFixed(1)}%)
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
