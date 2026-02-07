"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PriceHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticker: string;
    currentPrice: number;
    initialTp: number; // Price value
    initialSl: number; // Price value
    onSave: (tp: number, sl: number) => void;
}

export function PriceHistoryModal({
    isOpen,
    onClose,
    ticker,
    currentPrice,
    initialTp,
    initialSl,
    onSave,
}: PriceHistoryModalProps) {
    // Local state for the lines
    const [tpPrice, setTpPrice] = useState(initialTp);
    const [slPrice, setSlPrice] = useState(initialSl);

    // Initialize checks
    useEffect(() => {
        if (isOpen) {
            setTpPrice(initialTp);
            setSlPrice(initialSl);
        }
    }, [isOpen, initialTp, initialSl]);

    // Mock data generation
    const data = useMemo(() => {
        const points = 50;
        const result = [];
        let price = currentPrice * 0.95; // Start a bit lower
        for (let i = 0; i < points; i++) {
            // Random walk
            const change = (Math.random() - 0.45) * (currentPrice * 0.02);
            price += change;
            // Make sure the last point connects to current price roughly
            if (i > points - 5) {
                price = price + (currentPrice - price) * 0.5;
            }
            result.push({
                time: i,
                price: price
            });
        }
        // Force last point to be current price
        result[result.length - 1].price = currentPrice;
        return result;
    }, [currentPrice]);

    // Calculate domain
    const history = data.map((d) => d.price);
    const allPrices = [...history, tpPrice, slPrice, currentPrice];
    const minPrice = Math.min(...allPrices) * 0.98;
    const maxPrice = Math.max(...allPrices) * 1.02;

    // Dragging logic
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState<"tp" | "sl" | null>(null);

    const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
        if (!dragging || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const height = rect.height;

        // Calculate price from Y (top is maxPrice, bottom is minPrice)
        // ratio = y / height
        // value = max - ratio * (max - min)

        // Clamp y
        const clampedY = Math.max(0, Math.min(height, y));
        const ratio = clampedY / height;
        const priceRange = maxPrice - minPrice;
        const newPrice = maxPrice - (ratio * priceRange);

        if (dragging === "tp") {
            // TP usually > current, but user can drag anywhere?
            // Let's allow free drag but maybe warn visually
            setTpPrice(newPrice);
        } else if (dragging === "sl") {
            setSlPrice(newPrice);
        }
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
    }, [dragging, maxPrice, minPrice]); // Dependencies needed for calculation

    // Helper to get % position for CSS top
    const getTopPercent = (price: number) => {
        // top 0% = maxPrice
        // top 100% = minPrice
        // fraction = (maxPrice - price) / (max - min)
        const fraction = (maxPrice - price) / (maxPrice - minPrice);
        return Math.max(0, Math.min(100, fraction * 100));
    };

    const formatPrice = (p: number) => p.toFixed(2);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Set Trigger Levels for {ticker}</DialogTitle>
                </DialogHeader>

                <div className="select-none py-6">
                    <div
                        className="relative h-[400px] w-full bg-slate-50 dark:bg-slate-900 rounded-md border"
                        ref={containerRef}
                    // We can also use onMouseMove here for local, but window is safer for drag out
                    >
                        {/* Chart */}
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                {/* 
                  We customize the domain so it matches our manual overlay calculations. 
                  YAxis is hidden but defines the scale.
                */}
                                <YAxis
                                    domain={[minPrice, maxPrice]}
                                    hide={true}
                                    type="number"
                                />

                                {/* 
                  XAxis just for visual structure 
                */}
                                <XAxis dataKey="time" hide={true} />

                                <Line
                                    type="monotone"
                                    dataKey="price"
                                    stroke="#3b82f6" // Blue
                                    strokeWidth={2}
                                    dot={false}
                                    isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>

                        {/* Overlays */}

                        {/* Current Price Line */}
                        <div
                            className="absolute w-full border-t-2 border-blue-500 border-dotted pointer-events-none flex items-center justify-end pr-2"
                            style={{ top: `${getTopPercent(currentPrice)}%` }}
                        >
                            <div className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded shadow absolute right-0 -translate-y-1/2">
                                Current: ${formatPrice(currentPrice)}
                            </div>
                        </div>

                        {/* Take Profit Line (Draggable) */}
                        <div
                            className={cn(
                                "absolute w-full border-t-2 border-green-500 cursor-ns-resize group flex items-center justify-between",
                                dragging === 'tp' ? "z-50" : "z-40"
                            )}
                            style={{ top: `${getTopPercent(tpPrice)}%` }}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                setDragging("tp");
                            }}
                        >
                            <div className="bg-green-500 text-white text-xs px-2 py-1 rounded ml-2 -translate-y-1/2 select-none shadow-sm group-hover:scale-110 transition-transform">
                                TP
                            </div>
                            <div className="bg-green-500 text-white text-xs px-2 py-1 rounded mr-2 -translate-y-1/2 select-none shadow-sm font-mono">
                                ${formatPrice(tpPrice)} ({(((tpPrice - currentPrice) / currentPrice) * 100).toFixed(1)}%)
                            </div>
                        </div>

                        {/* Stop Loss Line (Draggable) */}
                        <div
                            className={cn(
                                "absolute w-full border-t-2 border-red-500 cursor-ns-resize group flex items-center justify-between",
                                dragging === 'sl' ? "z-50" : "z-40"
                            )}
                            style={{ top: `${getTopPercent(slPrice)}%` }}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                setDragging("sl");
                            }}
                        >
                            <div className="bg-red-500 text-white text-xs px-2 py-1 rounded ml-2 -translate-y-1/2 select-none shadow-sm group-hover:scale-110 transition-transform">
                                SL
                            </div>
                            <div className="bg-red-500 text-white text-xs px-2 py-1 rounded mr-2 -translate-y-1/2 select-none shadow-sm font-mono">
                                ${formatPrice(slPrice)} ({(((slPrice - currentPrice) / currentPrice) * 100).toFixed(1)}%)
                            </div>
                        </div>

                    </div>

                    <p className="text-center text-xs text-muted-foreground mt-2">
                        Drag the green (Target) and red (Stop) lines to set your levels.
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={() => onSave(tpPrice, slPrice)}>
                        Apply Settings
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
