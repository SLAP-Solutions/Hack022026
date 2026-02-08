"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  RefreshCw,
  AlertTriangle,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePayments } from "@/hooks/usePayments";
import { usePaymentMetrics } from "@/hooks/usePaymentMetrics";
import { useFTSOPrices } from "@/hooks/useFTSOPrices";
import { useWallet } from "@/hooks/useWallet";
import { formatUSD, formatPercent, formatCrypto } from "@/lib/utils";
import { MetricCard } from "@/components/analytics/MetricCard";
import { ExposureSummary } from "@/components/analytics/ExposureSummary";
import { PaymentsBreakdown } from "@/components/analytics/PaymentsBreakdown";
import { AverageSavingsCard } from "@/components/analytics/AverageSavingsCard";

export default function Home() {
  const { address, isConnected, isInitializing } = useWallet();
  const { payments, isLoading: paymentsLoading } = usePayments();
  const { prices, refresh: refreshPrices } = useFTSOPrices();
  
  // Calculate all payment metrics
  const metrics = usePaymentMetrics(payments);
  
  // Calculate processed payment value for breakdown
  const processedValue = metrics.processedPayments.reduce(
    (acc, p) => acc + p.usdAmount / 100,
    0
  );

  if (isInitializing || (paymentsLoading && payments.length === 0)) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
          <RefreshCw className="h-10 w-10 animate-spin text-primary relative z-10" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="font-semibold text-lg">Loading Dashboard</h3>
          <p className="text-sm text-muted-foreground animate-pulse">
            {isInitializing ? "Initializing secure session..." : "Synchronizing blockchain payments..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Payments Overview Dashboard">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-background border rounded-full text-xs font-medium shadow-sm animate-pulse">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Live FTSO Feeds
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshPrices()}
            className="rounded-full"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Refresh
          </Button>
        </div>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6 space-y-8 bg-muted/10">
        {/* Exposure Summary - Top Feature */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <ExposureSummary
            worstCase={metrics.currentExposureWorstCase}
            livePercent={metrics.liveExposurePercent}
            isProfit={metrics.isExposureProfit}
            bestCase={metrics.bestCaseExposure}
            feedSymbol="ETH"
          />
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Total Payments Due"
            value={formatUSD(metrics.totalPaymentsDue)}
            subtitle={`${metrics.pendingCount} pending payments`}
            colorTheme="default"
          />
          <MetricCard
            title="Pending Payments"
            value={metrics.pendingCount}
            subtitle="Waiting for conditions"
            colorTheme="default"
            trend="neutral"
          />
          <MetricCard
            title="Processed Payments"
            value={metrics.processedCount}
            subtitle="Successfully executed"
            colorTheme="green"
            trend="up"
          />
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PaymentsBreakdown
            pendingCount={metrics.pendingCount}
            processedCount={metrics.processedCount}
            pendingValue={metrics.totalPaymentsDue}
            processedValue={processedValue}
          />

          <AverageSavingsCard
            averageAmount={metrics.averageSavingAmount}
            averagePercent={metrics.averageSavingPercent}
            totalRealized={metrics.totalSavingsRealized}
            processedCount={metrics.processedCount}
            feedSymbol="ETH"
          />
        </div>

        {/* Quick Actions */}
        {metrics.pendingCount === 0 && metrics.processedCount === 0 && (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Payments Yet</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                Create your first payment to start optimizing settlements with
                Flare FTSO price feeds.
              </p>
              <Button asChild>
                <Link href="/payments">Create Payment</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
