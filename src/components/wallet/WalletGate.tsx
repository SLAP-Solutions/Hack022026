"use client";

import { useWallet } from "@/hooks/useWallet";
import { ConnectWallet } from "./ConnectWallet";
import { Loader2 } from "lucide-react";
import Image from "next/image";

interface WalletGateProps {
    children: React.ReactNode;
}

export function WalletGate({ children }: WalletGateProps) {
    const { isConnected, isInitializing } = useWallet();

    if (isInitializing) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
        );
    }

    if (!isConnected) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center">
                {/* Background Image */}
                <Image
                    src="/connect-wallet-bg.png"
                    alt="Background"
                    fill
                    className="object-cover"
                    priority
                />
                
                {/* Overlay for better contrast */}
                <div className="absolute inset-0 bg-black/30" />
                
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center gap-8">
                    {/* Logo */}
                    <Image
                        src="/logo-white.png"
                        alt="Slapsure"
                        width={200}
                        height={60}
                        className="h-auto"
                        priority
                    />
                    
                    {/* Connect Wallet Button */}
                    <ConnectWallet variant="white" />
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
