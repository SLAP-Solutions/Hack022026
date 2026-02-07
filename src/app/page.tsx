"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, DollarSign, Activity, FileText, CheckCircle } from "lucide-react";
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
} from "recharts";
import { RiskExposureCard } from "@/components/analytics/RiskExposureCard";

export default function Home() {
  // Calculate Statistics
  const totalClaims = claimsData.length;

  const totalPayments = claimsData.reduce((acc, claim) => {
    const claimPayments = claim.payments?.reduce((sum: number, p: any) => sum + (Number(p.usdAmount) / 100), 0) || 0;
    return acc + claimPayments;
  }, 0);

  const activeClaims = claimsData.filter(c => ['pending', 'processing', 'approved'].includes(c.status)).length;
  const settledClaims = claimsData.filter(c => c.status === 'settled').length;

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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-serif">
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
      <RiskExposureCard claims={claimsData} title="Overall Payment Estate" />

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

          <div className="mt-16">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/60">
              <Link href="/payments">
                Payment Dashboard
              </Link>
            </Button>
          </div>
        </div>
  );
}
