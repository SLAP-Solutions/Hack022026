"use client";

interface PriceCardProps {
    symbol: string;
    price: string;
    timestamp: number;
    loading: boolean;
    error: string | null;
}

export function PriceCard({ symbol, price, timestamp, loading, error }: PriceCardProps) {

    const formatTime = (timestamp: number) => {
        if (timestamp === 0) return "Never";
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString();
    };

    return (
        <div className="flex flex-col items-center justify-center gap-1">
            <p className="text-4xl font-medium text-gray-900">${price}</p>
            <p className="text-lg text-primary font-semibold">{symbol.split("/")[0]}</p>
        </div>
        // <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 transition-colors">
        //     <div className="flex items-center justify-between mb-4">
        //         <div className="flex items-center gap-3">
        //             <div>
        //                 <h3 className="text-lg font-bold text-gray-900">{symbol.split("/")[0]}</h3>
        //                 <p className="text-xs text-gray-500">Price Feed</p>
        //             </div>
        //         </div>
        //     </div>

        //     {loading ? (
        //         <div className="animate-pulse">
        //             <div className="h-8 bg-gray-200 rounded mb-2"></div>
        //             <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        //         </div>
        //     ) : error ? (
        //         <div className="text-red-600 text-sm">{error}</div>
        //     ) : (
        //         <>
        //             <div className="text-3xl font-bold text-gray-900 mb-2">
        //                 ${price}
        //             </div>
        //             <div className="flex items-center justify-between text-xs text-gray-500">
        //                 <span>Last updated</span>
        //                 <span className="font-mono">{formatTime(timestamp)}</span>
        //             </div>
        //         </>
        //     )}
        // </div>
    );
}
