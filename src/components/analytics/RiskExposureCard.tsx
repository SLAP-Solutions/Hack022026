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
    const estateAggregates = useMemo(() => {
        // Handle both flat payments array and nested invoices
        const allPayments = claims.some(c => c.payments)
            ? claims.flatMap(c => c.payments || [])
            : claims;

        const filtered = allPayments.filter((p: any) => {
            if (estateFilter === 'active') return !p.executed;
            if (estateFilter === 'closed') return p.executed;
            return true;
        });

        const multiplier = 1000; // 3 decimals for prices

        return filtered.reduce((acc, p) => {
            const usdDollars = Number(p.usdAmount) / 100;
            const slPrice = Number(p.stopLossPrice) / multiplier;
            const tpPrice = Number(p.takeProfitPrice) / multiplier;
            const currentPrice = Number(p.currentPrice) / multiplier || 0;

            acc.current += usdDollars;

            // Goal of this visualization: 
            // Current = Total USD we pay
            // LB = Total value of tokens if forced to execute at Lower Bound (relative to current price)
            // UB = Total value of tokens if executed at Upper Bound (relative to current price)

            if (slPrice > 0 && currentPrice > 0) {
                // tokens_needed = dollars / sl_price
                // current_value_of_those_tokens = tokens_needed * current_price
                acc.lower += (usdDollars / slPrice) * currentPrice;
            } else {
                acc.lower += usdDollars;
            }

            if (tpPrice > 0 && currentPrice > 0) {
                acc.upper += (usdDollars / tpPrice) * currentPrice;
            } else {
                acc.upper += usdDollars;
            }

            return acc;
        }, { lower: 0, current: 0, upper: 0 });
    }, [estateFilter, claims]);

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
                    <p className="text-xs text-muted-foreground mb-1">Max Cost Exposure (LB)</p>
                    <p className="font-mono font-bold text-lg text-red-600">${totalLowerBound.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Total Fixed Obligation</p>
                    <p className="font-mono font-bold text-3xl text-primary">${totalEstateCurrent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Min Cost Advantage (UB)</p>
                    <p className="font-mono font-bold text-lg text-green-600">${totalUpperBound.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
            </div>

            <div className="pt-2 pb-6">
                <Slider
                    defaultValue={[50]}
                    value={[totalEstateCurrent > 0 ? ((totalLowerBound - totalEstateCurrent) / (totalLowerBound - totalUpperBound) * 100) : 50]}
                    max={100}
                    min={0}
                    step={0.01}
                    disabled
                    className="opacity-100"
                    trackClassName="bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 h-4"
                    rangeClassName="opacity-0"
                    thumbContent="You"
                />
                <div className="flex justify-between mt-2 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    <span className="text-red-600/80">Cost Ceiling</span>
                    <span>Neutral</span>
                    <span className="text-green-600/80">Market Advantage</span>
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
                                name="Market Advantage Projection"
                                stroke="#22c55e"
                                strokeWidth={2}
                                dot={false}
                                strokeDasharray="5 5"
                            />
                            <Line
                                type="monotone"
                                dataKey="current"
                                name="Current Value"
                                stroke="#ec4899"
                                strokeWidth={2}
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="lower"
                                name="Max Exposure"
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
        <Card className="border-2 border-primary/10 bg-white">
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
