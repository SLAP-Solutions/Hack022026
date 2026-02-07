"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { RiskExposureCard } from "@/components/analytics/RiskExposureCard";

interface ClaimRiskModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    claim: any;
}

export function ClaimRiskModal({ open, onOpenChange, claim }: ClaimRiskModalProps) {
    if (!claim) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[95vw] w-full max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Claim Risk Exposure</DialogTitle>
                    <p className="text-muted-foreground">{claim.description}</p>
                </DialogHeader>
                <div className="py-4">
                    <RiskExposureCard
                        claims={[claim]}
                        title="" // Title is suppressed in clean mode anyway
                        variant="clean"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
