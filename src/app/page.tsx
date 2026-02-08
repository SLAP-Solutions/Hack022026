"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ArrowRight,
  DollarSign,
  Activity,
  FileText,
  CheckCircle,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ClipboardList,
  Zap,
  Layers,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw
} from "lucide-react";
import { useInvoicesStore } from "@/stores/useInvoicesStore";
import { useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { RiskExposureCard } from "@/components/analytics/RiskExposureCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePayments } from "@/hooks/usePayments";
import { useFTSOPrices } from "@/hooks/useFTSOPrices";
import { useWallet } from "@/hooks/useWallet";
import { cn } from "@/lib/utils";

export default function Home() {
  const { address, isConnected, isInitializing } = useWallet();
  const { payments, isLoading: paymentsLoading } = usePayments();
  const { prices, refresh: refreshPrices } = useFTSOPrices();
  const { invoices, fetchInvoices, isLoading: invoicesLoading, error: storeError } = useInvoicesStore();
  const [activeTab, setActiveTab] = useState<"invoices" | "payments">("invoices");

  useEffect(() => {
    if (address) {
      fetchInvoices(address);
    }
  }, [address, fetchInvoices]);

  // Calculate Statistics
  const stats = useMemo(() => {
    const totalInvoices = invoices.length;
    const activeInvoices = invoices.filter(c => ['pending', 'processing', 'approved'].includes(c.status)).length;
    const settledInvoices = invoices.filter(c => c.status === 'settled').length;

    // Only pending payments are "Active Deposits" (locked collateral)
    const activeDepositsUSD = payments
      .filter(p => !p.executed)
      .reduce((acc, p) => acc + (Number(p.usdAmount) / 100), 0);

    const executedPayments = payments.filter(p => p.executed).length;
    const pendingPayments = payments.filter(p => !p.executed).length;

    return {
      totalInvoices,
      activeInvoices,
      settledInvoices,
      activeDepositsUSD,
      executedPayments,
      pendingPayments,
    };
  }, [invoices, payments]);

  // Chart Data for Invoices
  const statusDistribution = useMemo(() => [
    { name: 'Pending', value: invoices.filter(c => c.status === 'pending').length, color: '#f59e0b' },
    { name: 'Processing', value: invoices.filter(c => c.status === 'processing').length, color: '#ec4899' },
    { name: 'Approved', value: invoices.filter(c => c.status === 'approved').length, color: '#22c55e' },
    { name: 'Settled', value: invoices.filter(c => c.status === 'settled').length, color: '#10b981' },
    { name: 'Rejected', value: invoices.filter(c => c.status === 'rejected').length, color: '#ef4444' },
  ].filter(item => item.value > 0), [invoices]);

  const invoicesByTotalCost = useMemo(() => invoices.map(invoice => ({
    name: invoice.title.length > 15 ? invoice.title.substring(0, 15) + '...' : invoice.title,
    cost: (invoice.totalCost || (invoice.payments?.reduce((acc, p) => acc + Number(p.usdAmount), 0) || 0)) / 100,
  })).sort((a, b) => b.cost - a.cost).slice(0, 5), [invoices]);

  // Payment performance data derived from real payments
  const performanceData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = days.map(name => ({ name, value: 0 }));

    payments.forEach(p => {
      const date = new Date(Number(p.createdAt) * 1000);
      const dayIndex = date.getDay();
      data[dayIndex].value += Number(p.usdAmount) / 100;
    });

    // If no real data yet, provide a slight "baseline" to make it look active
    // but clearly marked as real data if it shows 0
    return data;
  }, [payments]);

  if (isInitializing || ((invoicesLoading || paymentsLoading) && invoices.length === 0 && payments.length === 0)) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50/50 dark:bg-slate-950/50 gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
          <RefreshCw className="h-10 w-10 animate-spin text-primary relative z-10" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="font-semibold text-lg">Loading Dashboard</h3>
          <p className="text-sm text-muted-foreground animate-pulse">
            {isInitializing ? "Initializing secure session..." : "Synchronizing decentralized data..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/50">
      <PageHeader title="Executive Overview">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-background border rounded-full text-xs font-medium shadow-sm animate-pulse">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Live FTSO Feeds
          </div>
          <Button variant="outline" size="sm" onClick={() => refreshPrices()} className="rounded-full">
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Refresh
          </Button>
        </div>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6 space-y-8">

        {/* Top Feature Card: Risk Exposure */}
        <div className="relative group">
          <div className="absolute -inset-1 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <RiskExposureCard claims={payments} title="Global Exposure Dashboard" />
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-between">
          <div className="inline-flex p-1 bg-muted/50 rounded-xl border">
            <button
              onClick={() => setActiveTab("invoices")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === "invoices"
                  ? "bg-white dark:bg-slate-900 shadow-sm text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Invoice Overview
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === "payments"
                  ? "bg-white dark:bg-slate-900 shadow-sm text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Payments Performance
            </button>
          </div>

          <div className="text-xs text-muted-foreground hidden md:block">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {activeTab === "invoices" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total Invoices"
                value={stats.totalInvoices}
                description="Records in database"
              />
              <StatsCard
                title="Active Value"
                value={`$${invoices.reduce((acc, inv) => acc + (inv.totalCost || 0), 0).toLocaleString()}`}
                description="Total liability"
              />
              <StatsCard
                title="Pending Review"
                value={stats.activeInvoices}
                description="Awaiting action"
              />
              <StatsCard
                title="Settled Successfully"
                value={stats.settledInvoices}
                description="History total"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-primary" />
                    Distribution by Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Highest Value Invoices
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={invoicesByTotalCost} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        formatter={(value) => `$${Number(value).toLocaleString()}`}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="cost" fill="url(#barGradient)" radius={[0, 10, 10, 0]} barSize={20} />
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#ec4899" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Active Deposits"
                value={`$${stats.activeDepositsUSD.toLocaleString()}`}
                description={`Across ${stats.pendingPayments} active objects`}
              />
              <StatsCard
                title="Completed"
                value={stats.executedPayments}
                description="Automated settlements"
              />
              <StatsCard
                title="Pending Execution"
                value={stats.pendingPayments}
                description="Waiting for price targets"
              />
              <StatsCard
                title="Live FTSO Price (FLR)"
                value={`$${prices["FLR/USD"]?.price || "..."}`}
                description="Real-time Oracle feed"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Settlement Activity</CardTitle>
                    <p className="text-sm text-muted-foreground">Historical volume of automated payments</p>
                  </div>
                  <Badge variant="secondary" className="rounded-full">Real-time</Badge>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Market Snapshot
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {Object.values(prices).map((p) => (
                      <div key={p.symbol} className="flex items-center justify-between p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                            {p.symbol.split('/')[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{p.symbol}</div>
                            <div className="text-[10px] opacity-70">FTSO Protocol</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold">${parseFloat(p.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                          <div className="flex items-center text-[10px] justify-end gap-1 text-emerald-300">
                            <ArrowUpRight className="w-3 h-3" />
                            +0.2%
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2">
                      <Button asChild variant="secondary" className="w-full rounded-xl bg-white text-indigo-600 hover:bg-slate-100">
                        <Link href="/payments">
                          Manage Assets
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatsCard({ title, value, description }: {
  title: string;
  value: string | number;
  description: string;
}) {
  return (
    <Card className="border-none shadow-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm group hover:shadow-xl transition-all duration-300 border-b-2 border-transparent hover:border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="flex items-center mt-1 text-xs text-muted-foreground">
          {description}
        </div>
      </CardContent>
    </Card>
  );
}
