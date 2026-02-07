"use client";

import { useWallet } from "../../hooks/useWallet";
import { Button } from "../ui/button";
import { Loader2, LogOut, Wallet } from "lucide-react";
import Image from "next/image";

interface ConnectWalletProps {
    variant?: "default" | "white";
}

export function ConnectWallet({ variant = "default" }: ConnectWalletProps) {
    const { address, isConnecting, isInitializing, error, connectWallet, disconnect, isConnected, walletType } = useWallet();

    const buttonClassName = variant === "white"
        ? "gap-2 bg-white text-gray-900 hover:bg-white/90 group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:min-w-0"
        : "gap-2 bg-primary text-primary-foreground hover:bg-primary/90 group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:min-w-0";

    if (isInitializing) {
        return (
            <Button disabled className="gap-2 bg-muted text-muted-foreground opacity-50 group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:min-w-0">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">Loading...</span>
            </Button>
        );
    }

    return (
        <div className="relative flex items-center gap-4">
            {!isConnected ? (
                <Button
                    onClick={() => connectWallet("metamask")}
                    disabled={isConnecting}
                    className={buttonClassName}
                >
                    {isConnecting ? (
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    ) : (
                        <Image src="/metamask-logo.svg" alt="MetaMask" width={20} height={20} className="shrink-0" />
                    )}
                    <span className="group-data-[collapsible=icon]:hidden">{isConnecting ? "Connecting..." : "Connect MetaMask"}</span>
                </Button>
            ) : (
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end mr-2 group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-mono text-foreground font-medium">
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                            {walletType}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 p-1.5 bg-secondary/50 rounded-xl border border-border/50 group-data-[collapsible=icon]:p-1.5 group-data-[collapsible=icon]:gap-0">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-inner">
                            <Wallet className="w-4 h-4 text-white" />
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={disconnect}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 group-data-[collapsible=icon]:hidden"
                            title="Disconnect"
                        >
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {error && (
                <div className="absolute top-full right-0 mt-2 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg shadow-lg flex items-center gap-2 backdrop-blur-sm w-max z-50">
                    <span className="flex h-2 w-2 rounded-full bg-destructive animate-pulse" />
                    {error}
                </div>
            )}
        </div>
    );
}
