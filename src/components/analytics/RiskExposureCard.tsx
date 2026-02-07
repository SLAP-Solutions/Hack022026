"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ShieldAlert } from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";

interface RiskExposureCardProps {
    claims: any[];
    title?: string;
    variant?: 'card' | 'clean';
}

export function RiskExposureCard({ claims, title = "Overall Payment Estate", variant = 'card' }: RiskExposureCardProps) {
    const [estateFilter, setEstateFilter] = useState<'active' | 'closed' | 'combined'>('combined');
    const [graphRange, setGraphRange] = useState<'1H' | '24H' | '1W' | '1M' | '3M' | '1Y' | 'ALL'>('1M');

    // Calculate Estate Aggregates
    const filteredClaimsForEstate = useMemo(() => {
        if (estateFilter === 'combined') return claims;

        return claims.map(claim => ({
            ...claim,
            payments: claim.payments?.filter((p: any) => {
                if (estateFilter === 'active') return p.status === 'pending';
                if (estateFilter === 'closed') return ['executed', 'expired'].includes(p.status);
                return true;
            }) || []
        }));
    }, [estateFilter, claims]);

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
    const totalEstateCurrent = estateAggregates.current;
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

    const content = (
        <div className="space-y-6">
            {/* Header Controls (Only rendered here if variant is clean, else part of CardHeader) */}
            {variant === 'clean' && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    {/* Title is handled by parent modal in clean mode, but we keep filters */}
                    <div />
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
            )}

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
    );

    if (variant === 'clean') {
        return content;
    }

    return (
        <Card className="border-2 border-primary/10 bg-gradient-to-br from-background to-primary/5">
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-primary" />
                        <div>
                            <CardTitle>{title}</CardTitle>
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
                {content}
            </CardContent>
        </Card>
    );
}
