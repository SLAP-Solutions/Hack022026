"use client";

import { useState, useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import Link from "next/link";
import { ArrowRight, DollarSign, Activity, FileText, CheckCircle, Clock, ShieldAlert } from "lucide-react";
import claimsData from "@/data/claims.json";
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
  LineChart,
  Line
} from "recharts";

export default function Home() {
  const [estateFilter, setEstateFilter] = useState<'active' | 'closed' | 'combined'>('combined');
  const [graphRange, setGraphRange] = useState<'1H' | '24H' | '1W' | '1M' | '3M' | '1Y' | 'ALL'>('1M');

  // Calculate Statistics
  const totalClaims = claimsData.length;

  const totalPayments = claimsData.reduce((acc, claim) => {
    const claimPayments = claim.payments?.reduce((sum: number, p: any) => sum + (Number(p.usdAmount) / 100), 0) || 0;
    return acc + claimPayments;
  }, 0);

  const activeClaims = claimsData.filter(c => ['pending', 'processing', 'approved'].includes(c.status)).length;
  const settledClaims = claimsData.filter(c => c.status === 'settled').length;

  // Calculate Estate Aggregates
  const filteredClaimsForEstate = useMemo(() => {
    if (estateFilter === 'combined') return claimsData;

    return claimsData.map(claim => ({
      ...claim,
      payments: claim.payments?.filter(p => {
        if (estateFilter === 'active') return p.status === 'pending';
        if (estateFilter === 'closed') return ['executed', 'expired'].includes(p.status);
        return true;
      }) || []
    }));
  }, [estateFilter]);

  const estateAggregates = useMemo(() => {
    return filteredClaimsForEstate.reduce((acc, claim) => {
      const claimPayments = claim.payments || [];

      acc.lower += claimPayments.reduce((sum: number, p: any) => sum + (Number(p.stopLossPrice) / 100), 0);
      acc.current += claimPayments.reduce((sum: number, p: any) => sum + (Number(p.usdAmount) / 100), 0);
      acc.upper += claimPayments.reduce((sum: number, p: any) => sum + (Number(p.takeProfitPrice) / 100), 0);

      return acc;
    }, { lower: 0, current: 0, upper: 0 });
  }, [filteredClaimsForEstate]);

  const totalLowerBound = estateAggregates.lower;
  const totalEstateCurrent = estateAggregates.current; // Use this for the estate card only
  const totalUpperBound = estateAggregates.upper;

  // Generate Mock Historical Data for Risk Trend
  const rangeConfig = {
    '1H': { points: 60, interval: 60 * 1000, labelFormat: 'time', volatility: 0.005 }, // 1 min intervals
    '24H': { points: 24, interval: 60 * 60 * 1000, labelFormat: 'time', volatility: 0.01 }, // 1 hour intervals
    '1W': { points: 7, interval: 24 * 60 * 60 * 1000, labelFormat: 'date', volatility: 0.02 },
    '1M': { points: 30, interval: 24 * 60 * 60 * 1000, labelFormat: 'date', volatility: 0.1 },
    '3M': { points: 90, interval: 24 * 60 * 60 * 1000, labelFormat: 'date', volatility: 0.15 },
    '1Y': { points: 365, interval: 24 * 60 * 60 * 1000, labelFormat: 'date', volatility: 0.2 },
    'ALL': { points: 730, interval: 24 * 60 * 60 * 1000, labelFormat: 'date', volatility: 0.25 }
  }[graphRange];

  const riskTrendData = Array.from({ length: rangeConfig.points }, (_, i) => {
    const date = new Date();
    // Calculate timestamp: Current Time - (Total Points - 1 - Current Index) * Interval
    date.setTime(date.getTime() - (rangeConfig.points - 1 - i) * rangeConfig.interval);

    // Variance factors to simulate movement (adjust volatility based on time range)
    const variance = (Math.random() - 0.5) * rangeConfig.volatility;

    // Simulate trends over time
    const trendFactor = i / rangeConfig.points;

    // Tighter variance for shorter timeframes
    const boundVolatility = rangeConfig.volatility * 0.5;
    const lowerVariance = 1 + ((Math.random() - 0.5) * boundVolatility);
    const upperVariance = 1 + ((Math.random() - 0.5) * boundVolatility);

    return {
      date: rangeConfig.labelFormat === 'time'
        ? date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      lower: totalLowerBound * (0.95 + trendFactor * 0.05) * lowerVariance,
      current: totalEstateCurrent * (0.9 + trendFactor * 0.1) * (1 + variance),
      upper: totalUpperBound * (0.98 + trendFactor * 0.02) * upperVariance,
    };
  });

  // Prepare Chart Data
  const statusDistribution = [
    { name: 'Pending', value: claimsData.filter(c => c.status === 'pending').length, color: '#f59e0b' },
    { name: 'Processing', value: claimsData.filter(c => c.status === 'processing').length, color: '#3b82f6' },
    { name: 'Approved', value: claimsData.filter(c => c.status === 'approved').length, color: '#22c55e' },
    { name: 'Settled', value: claimsData.filter(c => c.status === 'settled').length, color: '#10b981' },
    { name: 'Rejected', value: claimsData.filter(c => c.status === 'rejected').length, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const claimsByTotalCost = claimsData.map(claim => ({
    name: claim.title.length > 15 ? claim.title.substring(0, 15) + '...' : claim.title,
    cost: claim.totalCost,
  })).sort((a, b) => b.cost - a.cost).slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Home
            </h1>
            <p className="text-muted-foreground mt-1">Overview of all insurance activity</p>
          </div>
          <Button asChild>
            <Link href="/claims">
              View All Claims <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Overall Payment Estate Card */}
        <Card className="border-2 border-primary/10 bg-gradient-to-br from-background to-primary/5">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle>Overall Payment Estate</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Aggregate risk exposure across {estateFilter} payments.</p>
                </div>
              </div>
              <div className="flex bg-muted/50 p-1 rounded-lg border">
                {(['active', 'closed', 'combined'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setEstateFilter(filter)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${estateFilter === filter
                      ? 'bg-background text-primary shadow-sm border'
                      : 'text-muted-foreground hover:text-primary/80'
                      }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Lower Bound (Stop Loss)</p>
                  <p className="font-mono font-bold text-lg text-red-600">${totalLowerBound.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Current Value</p>
                  <p className="font-mono font-bold text-3xl text-primary">${totalEstateCurrent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">Total Upper Bound (Take Profit)</p>
                  <p className="font-mono font-bold text-lg text-green-600">${totalUpperBound.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="pt-2 pb-6">
                <Slider
                  defaultValue={[totalLowerBound + (totalUpperBound - totalLowerBound) * 0.5]} // Mock position for now as we don't have real-time price feeds for all
                  value={[totalEstateCurrent]}
                  max={totalUpperBound || 100} // Prevent 0 max
                  min={totalLowerBound}
                  step={0.01}
                  disabled
                  className="opacity-100"
                  trackClassName="bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 h-4"
                  rangeClassName="opacity-0"
                  thumbContent="Current"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>High Risk Zone</span>
                  <span>Optimal Zone</span>
                  <span>Profit Zone</span>
                </div>
              </div>

              {/* Risk Trend Graph */}
              <div className="pt-4 border-t">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                  <h3 className="text-sm font-semibold">Risk Exposure Over Time</h3>
                  <div className="flex bg-muted/50 p-1 rounded-lg border">
                    {(['1H', '24H', '1W', '1M', '3M', '1Y', 'ALL'] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setGraphRange(range)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${graphRange === range
                          ? 'bg-background text-primary shadow-sm border'
                          : 'text-muted-foreground hover:text-primary/80'
                          }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={riskTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                      />
                      <YAxis
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip
                        formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, '']}
                        contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="upper"
                        name="Upper Bound (Take Profit)"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={false}
                        strokeDasharray="5 5"
                      />
                      <Line
                        type="monotone"
                        dataKey="current"
                        name="Current Value"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="lower"
                        name="Lower Bound (Stop Loss)"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={false}
                        strokeDasharray="5 5"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClaims}</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPayments.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Claims</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeClaims}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Settled Claims</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{settledClaims}</div>
              <p className="text-xs text-muted-foreground">Successfully processed</p>
            </CardContent>
          </Card>
        </div>



        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Status Distribution Pie Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Claims by Status</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Claims by Cost Bar Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Top Claims by Cost</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={claimsByTotalCost} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Bar dataKey="cost" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center pt-8">
          <Link href="/landing" className="text-sm text-muted-foreground hover:text-primary underline">
            Back to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
}
