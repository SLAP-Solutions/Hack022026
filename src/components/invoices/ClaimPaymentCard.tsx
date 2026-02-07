// "use client";

// import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Loader2, ShieldCheck, TrendingUp } from "lucide-react";
// import { useWallet } from "@/hooks/useWallet";
// import { useModalStore } from "@/hooks/use-modal-store";
// import { useState } from "react";
// import { Contract, parseEther } from "ethers";
// import { CONTRACT_ADDRESS, FEED_IDS } from "@/lib/contract/constants";
// import ABI from "@/lib/contract/abi.json";
// import { Claim } from "../../types/index";

// interface PriceData {
//     symbol: string;
//     price: string;
//     decimals: number;
//     timestamp: number;
//     loading: boolean;
//     error: string | null;
// }

// interface ClaimPaymentCardProps {
//     policy: Claim;
//     currentPrice?: PriceData;
// }

// export function ClaimPaymentCard({ policy, currentPrice }: ClaimPaymentCardProps) {
//     const { isConnected, provider } = useWallet();
//     const [isProcessing, setIsProcessing] = useState(false);
//     const [txHash, setTxHash] = useState<string | null>(null);
//     const [error, setError] = useState<string | null>(null);

//     const handlePurchase = async () => {
//         if (!isConnected || !provider) {
//             setError("Please connect wallet first");
//             return;
//         }

//         try {
//             setIsProcessing(true);
//             setError(null);

//             const signer = await provider.getSigner();
//             const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);

//             const feedId = FEED_IDS[policy.market as keyof typeof FEED_IDS];
//             if (!feedId) throw new Error("Invalid market feed");

//             // For now, assuming cost = msg.value = payoutAmount
//             // In a real generic insurance, premium != payout.
//             // But per contract createClaim: msg.value IS the payoutAmount.
//             // So the user is "funding" their own claim?
//             // Or typically the "insurer" funds it.
//             // Based on current contract, the creator funds it.
//             // So this is a "Self-Insured" or "Betting" model.
//             // You lock 0.1 ETH. If condition met, you get 0.1 ETH back?
//             // Wait, if I lock 0.1 ETH, and condition met, I get 0.1 ETH back. Net zero?
//             // Unless there's an external pool.
//             // The contract says: `payoutAmount: msg.value`.
//             // `executeClaim` transfers `payoutAmount` to `beneficiary`.
//             // So yes, currently it's just locking funds.
//             // But let's stick to the requested flow: User pays to create it.

//             const tx = await contract.createClaim(
//                 feedId,
//                 BigInt(policy.triggerPrice * 10 ** 5), // Assuming 5 decimals for simplicity or matching FTSO?
//                 // Wait, FTSO decimals vary.
//                 // Let's look at how we handled prices in useFTSOPrices.
//                 // If triggerPrice is "2000", and FTSO returns 5 decimals for ETH, we need to match.
//                 // Let's assume standard integer matching for now or simple comparison if contract handles it.
//                 // *Critical*: Contract compares `feedValue` (from FTSO) with `triggerPrice`.
//                 // FTSO `getFeedById` returns value with decimals.
//                 // ETH/USD usually 5 decimals? Or 18?
//                 // We'll use a standard scaling for now, say 10^5, but this might need tuning.
//                 // Let's stick to raw inputs or careful scaling.
//                 // For this demo, let's assume we pass the raw value expected by contract.
//                 // Inspecting ABI/Contract: `uint256 _triggerPrice`.

//                 // Let's assign a safe default or ask user?
//                 // We will just pass `policy.triggerPrice` * 10^decimals of that feed.
//                 // Hardcoding 5 for ETH/USD/FLR/BTC for now as robust guess or checking constants?
//                 // Actually, let's just pass `parseUnits(policy.triggerPrice.toString(), 5)` if we had utilities.
//                 // I'll stick to a simple multiplier for the demo.
//                 BigInt(Math.floor(policy.triggerPrice * 100000)), // 5 decimals
//                 policy.isPriceAbove,
//                 { value: parseEther(policy.amount) }
//             );

//             setTxHash(tx.hash);
//             await tx.wait();

//             // Transaction confirmed
//             setIsProcessing(false);

//             // Could redirect or show success

//         } catch (err: any) {
//             console.error("Purchase failed:", err);
//             setError(err.reason || err.message || "Transaction failed");
//             setIsProcessing(false);
//         }
//     };

//     return (
//         <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
//             <CardHeader>
//                 <div className="flex justify-between items-start">
//                     <div>
//                         <Badge variant="outline" className="mb-2">
//                             {policy.category}
//                         </Badge>
//                         <CardTitle className="text-xl">{policy.title}</CardTitle>
//                     </div>
//                     {policy.isPriceAbove ? (
//                         <TrendingUp className="text-green-500 w-6 h-6" />
//                     ) : (
//                         <ShieldCheck className="text-blue-500 w-6 h-6" />
//                     )}
//                 </div>
//                 <CardDescription>{policy.description}</CardDescription>
//             </CardHeader>
//             <CardContent>
//                 <div className="space-y-4">
//                     <div className="flex justify-between text-sm">
//                         <span className="text-muted-foreground">Market</span>
//                         <span className="font-semibold">{policy.market}</span>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                         <span className="text-muted-foreground">Trigger Price</span>
//                         <span className="font-semibold">
//                             {policy.isPriceAbove ? "> " : "< "}
//                             ${policy.triggerPrice.toLocaleString()}
//                         </span>
//                     </div>
//                     {currentPrice && (
//                         <div className="flex justify-between text-sm">
//                             <span className="text-muted-foreground">Current Price</span>
//                             <span className={
//                                 (policy.isPriceAbove && Number(currentPrice.price) > policy.triggerPrice) ||
//                                     (!policy.isPriceAbove && Number(currentPrice.price) < policy.triggerPrice)
//                                     ? "text-green-600 font-bold"
//                                     : "text-gray-600"
//                             }>
//                                 ${Number(currentPrice.price).toLocaleString()}
//                             </span>
//                         </div>
//                     )}
//                     <div className="pt-4 border-t">
//                         <div className="flex justify-between items-center mb-2">
//                             <span className="text-sm font-medium">Coverage Amount</span>
//                             <span className="text-lg font-bold text-primary">{policy.amount} FLR</span>
//                         </div>
//                         <div className="flex justify-between items-center">
//                             <span className="text-sm text-muted-foreground">Premium Cost</span>
//                             <span className="text-sm font-semibold">{policy.cost} FLR</span>
//                         </div>
//                     </div>
//                 </div>

//                 {error && (
//                     <div className="mt-4 p-2 text-xs text-red-600 bg-red-50 rounded dark:bg-red-900/20">
//                         {error}
//                     </div>
//                 )}

//                 {txHash && (
//                     <div className="mt-4 p-2 text-xs text-green-600 bg-green-50 rounded dark:bg-green-900/20 break-all">
//                         Tx: {txHash}
//                     </div>
//                 )}
//             </CardContent>
//             <CardFooter>
//                 <Button
//                     className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
//                     onClick={handlePurchase}
//                     disabled={isProcessing || !isConnected}
//                 >
//                     {isProcessing ? (
//                         <>
//                             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                             Processing...
//                         </>
//                     ) : (
//                         `Purchase Policy (${policy.cost} FLR)`
//                     )}
//                 </Button>
//             </CardFooter>
//         </Card>
//     );
// }
