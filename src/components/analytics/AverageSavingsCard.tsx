"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent, formatCrypto, cn } from "@/lib/utils";

interface AverageSavingsCardProps {
  averageAmount: number; // Average crypto saved per payment
  averagePercent: number; // Average % saved
  totalRealized: number; // Total crypto saved across all processed
  processedCount: number; // Number of processed payments
  feedSymbol?: string; // e.g., "ETH"
  className?: string;
}

export function AverageSavingsCard({
  averageAmount,
  averagePercent,
  totalRealized,
  processedCount,
  feedSymbol = "ETH",
  className,
}: AverageSavingsCardProps) {
  const isPositive = averageAmount >= 0;

  if (processedCount === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Average Savings Performance (Executed Transactions)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[150px] text-muted-foreground">
            No processed payments yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Average Savings Performance (Executed Transactions)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Main Metrics */}
          <div className="grid grid-cols-2 gap-4">
            {/* Average Amount */}
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Average Savings
              </div>
              <div
                className={cn(
                  "text-3xl font-bold",
                  isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}
              >
                {formatCrypto(averageAmount)} {feedSymbol}
              </div>
            </div>

            {/* Average Percent */}
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Average Percentage
              </div>
              <div
                className={cn(
                  "text-3xl font-bold",
                  isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}
              >
                {formatPercent(averagePercent)}
              </div>
            </div>
          </div>

          {/* Total Realized */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Total Savings Realized
              </span>
              <span
                className={cn(
                  "text-xl font-bold",
                  totalRealized >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {formatCrypto(totalRealized)} {feedSymbol}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Across {processedCount} processed {processedCount === 1 ? "payment" : "payments"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
