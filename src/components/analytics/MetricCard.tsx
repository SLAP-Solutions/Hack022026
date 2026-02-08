"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react";

export type TrendDirection = "up" | "down" | "neutral";
export type ColorTheme = "default" | "green" | "red" | "blue" | "purple" | "cyan";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: TrendDirection;
  colorTheme?: ColorTheme;
  icon?: React.ReactNode;
  className?: string;
}

const trendIcons = {
  up: ArrowUpIcon,
  down: ArrowDownIcon,
  neutral: MinusIcon,
};

const colorThemes = {
  default: "text-foreground",
  green: "text-green-500",
  red: "text-red-500",
  blue: "text-blue-500",
  purple: "text-purple-500",
  cyan: "text-cyan-500",
};

const trendColors = {
  up: "text-green-500",
  down: "text-red-500",
  neutral: "text-gray-500",
};

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  colorTheme = "default",
  icon,
  className,
}: MetricCardProps) {
  const TrendIcon = trend ? trendIcons[trend] : null;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", colorThemes[colorTheme])}>
          {value}
        </div>
        {(subtitle || trend) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            {trend && TrendIcon && (
              <TrendIcon className={cn("h-3 w-3", trendColors[trend])} />
            )}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
