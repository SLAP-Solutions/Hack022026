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
            <Button disabled className="gap-2 bg-muted text-muted-foreground opacity-50">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
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
                        className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        {isConnecting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Wallet className="w-4 h-4" />
                        )}
                        {isConnecting ? "Connecting..." : "Connect Wallet"}
                        <ChevronDown className={`w-4 h-4 transition-transform ${showWalletMenu ? "rotate-180" : ""}`} />
                    </Button>

                    {showWalletMenu && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
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
                    <div className="hidden md:flex flex-col items-end mr-2">
                        <span className="text-sm font-mono text-foreground font-medium">
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                            {walletType}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 p-1.5 bg-secondary/50 rounded-xl border border-border/50">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-inner">
                            <Wallet className="w-4 h-4 text-white" />
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={disconnect}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
