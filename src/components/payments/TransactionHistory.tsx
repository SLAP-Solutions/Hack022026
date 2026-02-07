"use client";

import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { BLOCK_EXPLORER } from "@/lib/contract/constants";

export function TransactionHistory() {
    const { transactions, loading, error, refetch } = useTransactionHistory();

    if (loading && transactions.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Transaction History</h2>
                <p className="text-gray-500">Loading transactions...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Transaction History</h2>
                <p className="text-red-500">Error: {error}</p>
                <button
                    onClick={refetch}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Transaction History</h2>
                <button
                    onClick={refetch}
                    className="text-sm px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    disabled={loading}
                >
                    {loading ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {transactions.length === 0 ? (
                <p className="text-gray-500">No transactions found.</p>
            ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {transactions.map((tx) => (
                        <div
                            key={tx.hash}
                            className="border rounded p-3 hover:bg-gray-50 transition"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span
                                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                                tx.isContractInteraction
                                                    ? "bg-purple-100 text-purple-800"
                                                    : "bg-blue-100 text-blue-800"
                                            }`}
                                        >
                                            {tx.isContractInteraction ? "Contract" : "Transfer"}
                                        </span>
                                        {tx.method && (
                                            <span className="text-xs text-gray-600">
                                                {tx.method}
                                            </span>
                                        )}
                                        <span
                                            className={`px-2 py-0.5 rounded text-xs ${
                                                tx.status === "success"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {tx.status}
                                        </span>
                                    </div>
                                    <div className="text-sm space-y-1">
                                        <p className="text-gray-600">
                                            From: <span className="font-mono">{tx.from.slice(0, 10)}...{tx.from.slice(-8)}</span>
                                        </p>
                                        <p className="text-gray-600">
                                            To: <span className="font-mono">{tx.to.slice(0, 10)}...{tx.to.slice(-8)}</span>
                                        </p>
                                        <p className="font-semibold">
                                            Value: {parseFloat(tx.value).toFixed(6)} C2FLR
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(tx.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <a
                                    href={`${BLOCK_EXPLORER}/tx/${tx.hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                    View 
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
