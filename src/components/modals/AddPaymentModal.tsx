"use client";

import { useState } from "react";
import { usePaymentModal } from "@/stores/usePaymentModal";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface AddPaymentModalProps {
    onPaymentAdded?: (payment: any) => void;
}

export function AddPaymentModal({ onPaymentAdded }: AddPaymentModalProps) {
    const { isOpen, claimId, closeModal } = usePaymentModal();
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("");
    const [reference, setReference] = useState("");
    const [lowerBound, setLowerBound] = useState("");
    const [upperBound, setUpperBound] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!amount || !method || !reference || !lowerBound || !upperBound) {
            alert("Please fill in all fields");
            return;
        }

        // Validate bounds
        const lower = parseFloat(lowerBound);
        const upper = parseFloat(upperBound);
        const amt = parseFloat(amount);

        if (lower > upper) {
            alert("Lower bound must be less than or equal to upper bound");
            return;
        }

        if (amt < lower || amt > upper) {
            alert("Amount must be between lower and upper bounds");
            return;
        }

        // Create new payment
        const newPayment = {
            id: `PAY-${claimId}-${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
            date: new Date().toISOString().split('T')[0],
            amount: parseFloat(amount),
            method,
            status: "completed" as const,
            reference,
            lowerBound: parseFloat(lowerBound),
            upperBound: parseFloat(upperBound)
        };

        console.log("New payment created:", newPayment);

        // Call callback if provided
        if (onPaymentAdded) {
            onPaymentAdded(newPayment);
        }

        // Reset form
        setAmount("");
        setMethod("");
        setReference("");
        setLowerBound("");
        setUpperBound("");

        // Close modal
        closeModal();

        // Show success message
        alert("Payment added successfully!");
    };

    const handleClose = () => {
        // Reset form
        setAmount("");
        setMethod("");
        setReference("");
        setLowerBound("");
        setUpperBound("");
        closeModal();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                        Add Payment
                    </DialogTitle>
                    <DialogDescription>
                        Record a new payment for this claim.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Amount Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="payment-amount">Amount (£)</Label>
                            <Input
                                id="payment-amount"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>

                        {/* Payment Method Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="payment-method">Payment Method</Label>
                            <Select value={method} onValueChange={setMethod} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                                    <SelectItem value="PayPal">PayPal</SelectItem>
                                    <SelectItem value="Debit Card">Debit Card</SelectItem>
                                    <SelectItem value="Cash">Cash</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Reference Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="payment-reference">Transaction Reference</Label>
                            <Input
                                id="payment-reference"
                                placeholder="e.g., TXN-20260207-001"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                required
                            />
                        </div>

                        {/* Lower Bound Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="lower-bound">Lower Bound (£)</Label>
                            <Input
                                id="lower-bound"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={lowerBound}
                                onChange={(e) => setLowerBound(e.target.value)}
                                required
                            />
                        </div>

                        {/* Upper Bound Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="upper-bound">Upper Bound (£)</Label>
                            <Input
                                id="upper-bound"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={upperBound}
                                onChange={(e) => setUpperBound(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                        >
                            Add Payment
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
