"use client";

import { useState } from "react";
import { useWallet } from "../../hooks/useWallet";
import { Button } from "../ui/button";
import { Loader2, LogOut, Wallet, ChevronDown } from "lucide-react";

export function ConnectWallet() {
    const { address, isConnecting, isInitializing, error, connectWallet, disconnect, isConnected, walletType } = useWallet();
    const [showWalletMenu, setShowWalletMenu] = useState(false);

    const handleConnect = (wallet: "metamask" | "phantom") => {
        connectWallet(wallet);
        setShowWalletMenu(false);
    };

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
                <>
                    <Button
                        onClick={() => setShowWalletMenu(!showWalletMenu)}
                        disabled={isConnecting}
                        className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:min-w-0"
                    >
                        {isConnecting ? (
                            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        ) : (
                            <Wallet className="w-4 h-4 shrink-0" />
                        )}
                        <span className="group-data-[collapsible=icon]:hidden">{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
                        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform group-data-[collapsible=icon]:hidden ${showWalletMenu ? "rotate-180" : ""}`} />
                    </Button>

                    {showWalletMenu && (
                        <div className="absolute bottom-full right-0 mb-2 w-56 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 group-data-[collapsible=icon]:bottom-auto group-data-[collapsible=icon]:top-1/2 group-data-[collapsible=icon]:-translate-y-1/2 group-data-[collapsible=icon]:left-full group-data-[collapsible=icon]:ml-2 group-data-[collapsible=icon]:mb-0 group-data-[collapsible=icon]:right-auto group-data-[collapsible=icon]:slide-in-from-left-2">
                            <div className="p-2 flex flex-col gap-1">
                                <Button
                                    variant="ghost"
                                    onClick={() => handleConnect("metamask")}
                                    className="w-full justify-start h-12 gap-3 font-normal"
                                >
                                    <span className="text-xl">🦊</span>
                                    <span>MetaMask</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleConnect("phantom")}
                                    className="w-full justify-start h-12 gap-3 font-normal"
                                >
                                    <span className="text-xl">👻</span>
                                    <span>Phantom</span>
                                </Button>
                            </div>
                        </div>
                    )}
                </>
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
