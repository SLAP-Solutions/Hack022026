"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PriceChart } from "./PriceChart";

interface PriceHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticker: string;
    currentPrice: number;
    initialTp: number; // Price value
    initialSl: number; // Price value
    onSave: (tp: number, sl: number) => void;
    readOnly?: boolean;
}

export function PriceHistoryModal({
    isOpen,
    onClose,
    ticker,
    currentPrice,
    initialTp,
    initialSl,
    onSave,
    readOnly = false,
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

    const handleDrag = (type: "tp" | "sl", price: number) => {
        if (type === "tp") {
            setTpPrice(price);
        } else {
            setSlPrice(price);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{readOnly ? `Price History & Levels for ${ticker}` : `Set Trigger Levels for ${ticker}`}</DialogTitle>
                </DialogHeader>

                <div className="py-6 h-[400px] w-full">
                    <PriceChart
                        data={data}
                        minPrice={minPrice}
                        maxPrice={maxPrice}
                        currentPrice={currentPrice}
                        tpPrice={tpPrice}
                        slPrice={slPrice}
                        readOnly={readOnly}
                        onDrag={handleDrag}
                        height="100%"
                    />
                    {!readOnly && (
                        <p className="text-center text-xs text-muted-foreground mt-2">
                            Drag the green (Target) and red (Stop) lines to set your levels.
                        </p>
                    )}
                </div>

                <DialogFooter>
                    {readOnly ? (
                        <Button onClick={onClose}>
                            Close
                        </Button>
                    ) : (
                        <>
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button onClick={() => onSave(tpPrice, slPrice)}>
                                Apply Settings
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
