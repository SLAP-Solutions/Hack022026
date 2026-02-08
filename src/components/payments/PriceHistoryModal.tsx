"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PriceBar } from "./PriceChart";

interface PriceHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticker: string;
    currentPrice: number;
    initialTp: number;
    initialSl: number;
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
    const [tpPrice, setTpPrice] = useState(initialTp);
    const [slPrice, setSlPrice] = useState(initialSl);

    useEffect(() => {
        if (isOpen) {
            if (!readOnly && initialTp === 0 && initialSl === 0) {
                setTpPrice(currentPrice * 1.05);
                setSlPrice(currentPrice * 0.95);
            } else {
                setTpPrice(initialTp);
                setSlPrice(initialSl);
            }
        }
    }, [isOpen, initialTp, initialSl, currentPrice, readOnly]);

    const handleSave = () => {
        onSave(tpPrice, slPrice);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl overflow-visible">
                <DialogHeader>
                    <DialogTitle>{readOnly ? `Price Levels: ${ticker}` : `Set Bounds for ${ticker}`}</DialogTitle>
                    <DialogDescription>
                        {readOnly
                            ? "Visual representation of current price vs. set limits."
                            : "Drag the sliders to adjust your Lower and Upper bound levels."}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-12 px-2 w-full select-none">
                    <PriceBar
                        currentPrice={currentPrice}
                        tpPrice={tpPrice}
                        slPrice={slPrice}
                        ticker={ticker}
                        readOnly={readOnly}
                        onSlChange={setSlPrice}
                        onTpChange={setTpPrice}
                    />
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    {readOnly ? (
                        <Button onClick={onClose}>Close</Button>
                    ) : (
                        <>
                            <Button variant="outline" onClick={onClose}>Cancel</Button>
                            <Button onClick={handleSave} className="bg-primary text-primary-foreground">
                                Confirm Bounds
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
