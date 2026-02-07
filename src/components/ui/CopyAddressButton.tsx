"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

interface CopyAddressButtonProps {
    address: string;
    className?: string;
}

export function CopyAddressButton({ address, className }: CopyAddressButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className={`h-7 w-7 p-0 ${className || ""}`}
        >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
        </Button>
    );
}
