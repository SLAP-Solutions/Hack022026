"use client";

import { useState, useEffect } from "react";
import { BrowserProvider, Eip1193Provider } from "ethers";
import { CHAIN_ID, CHAIN_NAME, RPC_URL } from "../lib/contract/constants";

declare global {
    interface Window {
        ethereum?: Eip1193Provider & {
            isMetaMask?: boolean;
            isPhantom?: boolean;
            on: (event: string, callback: (...args: any[]) => void) => void;
            removeListener: (event: string, callback: (...args: any[]) => void) => void;
            request: (request: { method: string; params?: any[] }) => Promise<any>;
        };
        phantom?: {
            ethereum?: Eip1193Provider;
        };
    }
}

export function useWallet() {
    const [address, setAddress] = useState<string | null>(null);
    const [provider, setProvider] = useState<BrowserProvider | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
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
                    setWalletType("metamask"); // Default assumption
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
            // Handle specific user rejection codes or fallback errors
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
            // Chain not added, add it
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

    // Remove auto-connect on mount
    useEffect(() => {
        if (window.ethereum) {
            const handleAccountsChanged = (accounts: string[]) => {
                if (accounts.length === 0) {
                    disconnect();
                } else {
                    setAddress(accounts[0]);
                }
            };

            window.ethereum.on("accountsChanged", handleAccountsChanged);

            return () => {
                window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
            };
        }
    }, []);

    return {
        address,
        provider,
        isConnecting,
        error,
        connectWallet,
        disconnect,
        isConnected: !!address,
        walletType,
    };
}
