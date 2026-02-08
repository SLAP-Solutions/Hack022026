"use client";

import { formatUSD, formatPercent, cn } from "@/lib/utils";

interface ExposureSummaryProps {
  worstCase: number; // Crypto amount if all stop-losses hit
  livePercent: number; // Current % saving/loss
  isProfit: boolean; // True if saving, false if loss
  bestCase: number; // Crypto amount if all take-profits hit
  feedSymbol?: string; // e.g., "ETH"
  className?: string;
}

export function ExposureSummary({
  worstCase,
  livePercent,
  isProfit,
  bestCase,
  feedSymbol = "ETH",
  className,
}: ExposureSummaryProps) {
  return (
    <div className={cn("", className)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Worst Case */}
          <div className="flex flex-col space-y-1 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <div className="text-sm text-muted-foreground">
              Max Exposure
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {worstCase.toFixed(4)} {feedSymbol}
            </div>
            <div className="text-xs text-muted-foreground">
              If all stop-losses trigger
            </div>
          </div>

          {/* Live Exposure */}
          <div
            className={cn(
              "flex flex-col space-y-1 p-4 rounded-lg border",
              isProfit
                ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
            )}
          >
            <div className="text-sm text-muted-foreground">
              Live Exposure
            </div>
            <div
              className={cn(
                "text-2xl font-bold",
                isProfit
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {formatPercent(livePercent)}
            </div>
            <div className="text-xs text-muted-foreground">
              {isProfit ? "Average saving vs baseline" : "Average loss vs baseline"}
            </div>
          </div>

          {/* Best Case */}
          <div className="flex flex-col space-y-1 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
            <div className="text-sm text-muted-foreground">
              Best Case
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {bestCase.toFixed(4)} {feedSymbol}
            </div>
            <div className="text-xs text-muted-foreground">
              If all take-profits hit
            </div>
          </div>
        </div>
    </div>
  );
}
