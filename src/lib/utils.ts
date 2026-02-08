import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as USD currency
 * @param value - The number to format
 * @returns Formatted string like "$1,234.56"
 */
export function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a cryptocurrency amount
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 4)
 * @returns Formatted string like "1.2345"
 */
export function formatCrypto(value: number, decimals: number = 4): string {
  return value.toFixed(decimals);
}

/**
 * Format a percentage value
 * @param value - The percentage value (e.g., 12.34 for 12.34%)
 * @returns Formatted string like "+12.34%" or "-5.67%"
 */
export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format large numbers in compact form
 * @param value - The number to format
 * @returns Formatted string like "1.5K", "2.3M", "1.2B"
 */
export function formatLargeNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}
