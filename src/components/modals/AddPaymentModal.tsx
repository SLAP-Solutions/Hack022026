"use client";

import { usePaymentModal } from "@/stores/usePaymentModal";
import { useInvoicesStore } from "@/stores/useInvoicesStore";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CreatePaymentForm } from "@/components/payments/CreatePaymentForm";
import { Receipt } from "lucide-react";

export function AddPaymentModal() {
    const { isOpen, claimId, closeModal } = usePaymentModal();
    const { addPayment } = useInvoicesStore();

    const handleSuccess = (paymentData?: any) => {
        // If we have payment data and a claimId, we can link it in the store
        // However, the user said "literally take the exact code", 
        // so we'll let the form handle its own blockchain logic
        // and just close the modal.
        closeModal();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Receipt className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">
                                Create Payment Order
                            </DialogTitle>
                            <DialogDescription>
                                Set up automated blockchain settlements for Invoice #{claimId?.slice(0, 8)}...
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-2">
                    <CreatePaymentForm
                        onSuccess={handleSuccess}
                        invoiceId={claimId ?? undefined}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
