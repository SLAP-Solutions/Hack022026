"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { BrowserProvider, Eip1193Provider } from "ethers";
import { CHAIN_ID, CHAIN_NAME, RPC_URL } from "../lib/contract/constants";

declare global {
    interface Window {
        ethereum?: Eip1193Provider & {
            isMetaMask?: boolean;
            isPhantom?: boolean;
            providers?: any[];
            on: (event: string, callback: (...args: any[]) => void) => void;
            removeListener: (event: string, callback: (...args: any[]) => void) => void;
            request: (request: { method: string; params?: any[] }) => Promise<any>;
        };
        phantom?: {
            ethereum?: Eip1193Provider;
        };
    }
}

interface WalletContextType {
    address: string | null;
    provider: BrowserProvider | null;
    isConnecting: boolean;
    isInitializing: boolean;
    error: string | null;
    connectWallet: (preferredWallet?: "metamask" | "phantom") => Promise<void>;
    disconnect: () => void;
    isConnected: boolean;
    walletType: "metamask" | "phantom" | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
    const [address, setAddress] = useState<string | null>(null);
    const [provider, setProvider] = useState<BrowserProvider | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [walletType, setWalletType] = useState<"metamask" | "phantom" | null>(null);

    const connectWallet = async (preferredWallet?: "metamask" | "phantom") => {
        try {
            setIsConnecting(true);
            setError(null);

            let targetProvider: any = null;

            // Helper to find provider in window.ethereum or window.ethereum.providers
            const findProvider = (checkFn: (p: any) => boolean) => {
                if ((window.ethereum as any)?.providers?.length) {
                    return (window.ethereum as any).providers.find(checkFn);
                }
                if (window.ethereum && checkFn(window.ethereum)) {
                    return window.ethereum;
                }
                return null;
            };

            if (preferredWallet === "metamask") {
                targetProvider = findProvider((p) => p.isMetaMask && !p.isPhantom);

                if (!targetProvider) {
                    // Fallback checks
                    if ((window.ethereum as any)?.isMetaMask && !(window.ethereum as any)?.isPhantom) {
                        targetProvider = window.ethereum;
                    }
                }

                if (!targetProvider) {
                    setError("MetaMask not found. Please install MetaMask.");
                    return;
                }
                setWalletType("metamask");
            } else if (preferredWallet === "phantom") {
                if (window.phantom?.ethereum) {
                    targetProvider = window.phantom.ethereum;
                } else {
                    targetProvider = findProvider((p) => p.isPhantom);
                }

                if (!targetProvider) {
                    setError("Phantom not found. Please install Phantom.");
                    return;
                }
                setWalletType("phantom");
            } else {
                // Auto-detect
                if (window.ethereum) {
                    targetProvider = window.ethereum;
                    setWalletType("metamask");
                } else if (window.phantom?.ethereum) {
                    targetProvider = window.phantom.ethereum;
                    setWalletType("phantom");
                } else {
                    setError("No wallet found.");
                    return;
                }
            }

            const browserProvider = new BrowserProvider(targetProvider);

            // Request account access
            await browserProvider.send("eth_requestAccounts", []);

            // Check network
            const network = await browserProvider.getNetwork();
            if (Number(network.chainId) !== CHAIN_ID) {
                await switchToCoston2(targetProvider);
            }

            const signer = await browserProvider.getSigner();
            const userAddress = await signer.getAddress();

            setProvider(browserProvider);
            setAddress(userAddress);
        } catch (err: any) {
            console.error("Wallet connection error:", err);
            if (err.code === 4001) {
                setError("Connection rejected by user.");
            } else {
                setError(err.message || "Failed to connect wallet.");
            }
        } finally {
            setIsConnecting(false);
        }
    };

    const switchToCoston2 = async (targetProvider: any) => {
        try {
            await targetProvider.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
            });
        } catch (switchError: any) {
            if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
                try {
                    await targetProvider.request({
                        method: "wallet_addEthereumChain",
                        params: [{
                            chainId: `0x${CHAIN_ID.toString(16)}`,
                            chainName: CHAIN_NAME,
                            rpcUrls: [RPC_URL],
                            nativeCurrency: { name: "C2FLR", symbol: "C2FLR", decimals: 18 },
                            blockExplorerUrls: ["https://coston2-explorer.flare.network"],
                        }],
                    });
                } catch (addError: any) {
                    console.error("Failed to add chain:", addError);
                    throw new Error("Failed to add Coston2 network to wallet.");
                }
            } else {
                console.error("Failed to switch chain:", switchError);
                throw new Error("Failed to switch to Coston2 network.");
            }
        }
    };

    const disconnect = () => {
        setAddress(null);
        setProvider(null);
        setWalletType(null);
    };

    // Auto-connect on mount
    useEffect(() => {
        const checkConnection = async (retries = 3) => {
            // Some extensions inject window.ethereum with a slight delay
            if (typeof window === "undefined") return;

            if (!window.ethereum && retries > 0) {
                setTimeout(() => checkConnection(retries - 1), 500);
                return;
            }

            if (window.ethereum) {
                try {
                    const accounts = await window.ethereum.request({ method: "eth_accounts" });
                    if (accounts && accounts.length > 0) {
                        const browserProvider = new BrowserProvider(window.ethereum);
                        const signer = await browserProvider.getSigner();
                        const userAddress = await signer.getAddress();

                        // Detect wallet type
                        if (window.ethereum.isMetaMask) setWalletType("metamask");
                        else if (window.ethereum.isPhantom) setWalletType("phantom");

                        setProvider(browserProvider);
                        setAddress(userAddress);

                        console.log("[Wallet] Auto-connected to:", userAddress);
                    }
                } catch (err) {
                    console.error("Failed to restore connection:", err);
                } finally {
                    setIsInitializing(false);
                }
            } else {
                setIsInitializing(false);
            }
        };

        checkConnection();
    }, []);

    // Event listeners
    useEffect(() => {
        if (typeof window !== "undefined" && window.ethereum) {
            const handleAccountsChanged = async (accounts: string[]) => {
                if (accounts.length === 0) {
                    disconnect();
                } else {
                    setAddress(accounts[0]);

                    // If we somehow don't have a provider yet (unlikely), set it up
                    if (!provider && window.ethereum) {
                        const browserProvider = new BrowserProvider(window.ethereum);
                        setProvider(browserProvider);
                    }
                }
            };

            const handleChainChanged = () => {
                window.location.reload();
            }

            window.ethereum.on("accountsChanged", handleAccountsChanged);
            window.ethereum.on("chainChanged", handleChainChanged);

            return () => {
                if (window.ethereum?.removeListener) {
                    window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
                    window.ethereum.removeListener("chainChanged", handleChainChanged);
                }
            };
        }
    }, [provider]); // Re-bind if provider changes/init, though window.ethereum is usually static

    return (
        <WalletContext.Provider value={{
            address,
            provider,
            isConnecting,
            isInitializing,
            error,
            connectWallet,
            disconnect,
            isConnected: !!address,
            walletType,
        }}>
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error("useWallet must be used within a WalletProvider");
    }
    return context;
}
