"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUSD } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { CheckCircle2, Clock } from "lucide-react";

interface PaymentsBreakdownProps {
  pendingCount: number;
  processedCount: number;
  pendingValue: number; // USD value of pending payments
  processedValue: number; // USD value of processed payments
  className?: string;
}

const COLORS = {
  pending: "#f59e0b", // amber-500
  processed: "#22c55e", // green-500
};

export function PaymentsBreakdown({
  pendingCount,
  processedCount,
  pendingValue,
  processedValue,
  className,
}: PaymentsBreakdownProps) {
  const data = [
    { name: "Pending", value: pendingCount, usdValue: pendingValue },
    { name: "Processed", value: processedCount, usdValue: processedValue },
  ];

  const totalPayments = pendingCount + processedCount;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">Count: {data.value}</p>
          <p className="text-sm text-muted-foreground">Value: {formatUSD(data.usdValue)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Payments Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {totalPayments === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No payments yet
          </div>
        ) : (
          <div className="space-y-4">
            {/* Chart */}
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? COLORS.pending : COLORS.processed}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-lg font-bold">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatUSD(pendingValue)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Processed</p>
                  <p className="text-lg font-bold">{processedCount}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatUSD(processedValue)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
