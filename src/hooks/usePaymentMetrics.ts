"use client";

import { useMemo } from "react";
import { ClaimPaymentWithPrice } from "./usePayments";
import { ethers } from "ethers";

export interface PaymentMetrics {
  // Exposure / Risk
  currentExposureWorstCase: number; // Sum if all stop-losses hit
  bestCaseExposure: number; // Sum if all take-profits hit (crypto amount)
  liveExposurePercent: number; // Average % saving/loss vs baseline
  isExposureProfit: boolean; // True if saving, false if loss

  // Totals
  totalPaymentsDue: number; // Total USD value pending

  // Operational Counts
  pendingCount: number;
  processedCount: number;

  // Performance
  averageSavingAmount: number; // Average saving in crypto (ETH)
  averageSavingPercent: number; // Average saving in %
  totalSavingsRealized: number; // Total crypto saved across all executed

  // Detailed breakdowns for visualization
  pendingPayments: ClaimPaymentWithPrice[];
  processedPayments: ClaimPaymentWithPrice[];

  // Price feed decimals (for consistent calculations)
  readonly PRICE_DECIMALS: number;
}

export function usePaymentMetrics(
  payments: ClaimPaymentWithPrice[]
): PaymentMetrics {
  return useMemo(() => {
    const PRICE_DECIMALS = 3; // FTSO price feed decimals
    const multiplier = Math.pow(10, PRICE_DECIMALS);

    // Separate pending and processed
    const pendingPayments = payments.filter((p) => !p.executed);
    const processedPayments = payments.filter((p) => p.executed);

    // === METRIC 1: Current Exposure (Worst Case) ===
    // If all stop-losses hit, how much crypto would we pay?
    const currentExposureWorstCase = pendingPayments.reduce((acc, payment) => {
      const usdAmountDollars = payment.usdAmount / 100;
      const stopLossPrice = Number(payment.stopLossPrice) / multiplier;

      // Handle instant payments (stopLoss === takeProfit)
      const stopLossBigInt =
        typeof payment.stopLossPrice === "bigint"
          ? payment.stopLossPrice
          : BigInt(Math.floor(payment.stopLossPrice || 0));
      const takeProfitBigInt =
        typeof payment.takeProfitPrice === "bigint"
          ? payment.takeProfitPrice
          : BigInt(Math.floor(payment.takeProfitPrice || 0));
      const isInstant = stopLossBigInt === takeProfitBigInt;

      if (isInstant) {
        // For instant payments, use current price as baseline
        const currentPrice = payment.currentPrice / multiplier;
        return acc + (currentPrice > 0 ? usdAmountDollars / currentPrice : 0);
      }

      // For trigger payments, worst case is stop loss
      if (stopLossPrice > 0) {
        const cryptoAtStopLoss = usdAmountDollars / stopLossPrice;
        return acc + cryptoAtStopLoss;
      }
      return acc;
    }, 0);

    // === METRIC 2: Live Exposure (% Saving/Loss vs Baseline) ===
    // Baseline = price at creation, Current = now
    let totalPercentDiff = 0;
    let countWithBaseline = 0;

    pendingPayments.forEach((payment) => {
      const usdAmountDollars = payment.usdAmount / 100;
      const createdAtPrice = Number(payment.createdAtPrice) / multiplier;
      const currentPrice = payment.currentPrice / multiplier;

      if (createdAtPrice > 0 && currentPrice > 0) {
        const amountAtCreation = usdAmountDollars / createdAtPrice;
        const amountAtCurrent = usdAmountDollars / currentPrice;
        const savingAmount = amountAtCreation - amountAtCurrent;
        const savingPercent = (savingAmount / amountAtCreation) * 100;

        totalPercentDiff += savingPercent;
        countWithBaseline++;
      }
    });

    const liveExposurePercent =
      countWithBaseline > 0 ? totalPercentDiff / countWithBaseline : 0;
    const isExposureProfit = liveExposurePercent >= 0;

    // === METRIC 3: Total Payments Due ===
    const totalPaymentsDue = pendingPayments.reduce((acc, p) => {
      return acc + p.usdAmount / 100;
    }, 0);

    // === METRIC 4: Best Case Exposure (Crypto Amount) ===
    // If all take-profits hit, how much crypto would we pay?
    const bestCaseExposure = pendingPayments.reduce((acc, payment) => {
      const usdAmountDollars = payment.usdAmount / 100;
      const takeProfitPrice = Number(payment.takeProfitPrice) / multiplier;

      // Check if instant payment
      const stopLossBigInt =
        typeof payment.stopLossPrice === "bigint"
          ? payment.stopLossPrice
          : BigInt(Math.floor(payment.stopLossPrice || 0));
      const takeProfitBigInt =
        typeof payment.takeProfitPrice === "bigint"
          ? payment.takeProfitPrice
          : BigInt(Math.floor(payment.takeProfitPrice || 0));
      const isInstant = stopLossBigInt === takeProfitBigInt;

      if (isInstant) {
        // For instant payments, use current price
        const currentPrice = payment.currentPrice / multiplier;
        return acc + (currentPrice > 0 ? usdAmountDollars / currentPrice : 0);
      }

      // For trigger payments, best case is take profit
      if (takeProfitPrice > 0) {
        const cryptoAtTakeProfit = usdAmountDollars / takeProfitPrice;
        return acc + cryptoAtTakeProfit;
      }
      return acc;
    }, 0);

    // === METRIC 5 & 6: Counts ===
    const pendingCount = pendingPayments.length;
    const processedCount = processedPayments.length;

    // === METRIC 7: Average Saving (Processed Payments) ===
    let totalSavingsRealizedCrypto = 0;
    let totalSavingsPercentSum = 0;
    let processedWithSavingsData = 0;

    processedPayments.forEach((payment) => {
      const usdAmountDollars = payment.usdAmount / 100;
      const createdAtPrice = Number(payment.createdAtPrice) / multiplier;
      const executedPrice = Number(payment.executedPrice) / multiplier;

      if (createdAtPrice > 0 && executedPrice > 0) {
        const amountAtCreation = usdAmountDollars / createdAtPrice;
        const actualPaid = parseFloat(
          ethers.formatEther(payment.paidAmount.toString())
        );

        const savingCrypto = amountAtCreation - actualPaid;
        const savingPercent = (savingCrypto / amountAtCreation) * 100;

        totalSavingsRealizedCrypto += savingCrypto;
        totalSavingsPercentSum += savingPercent;
        processedWithSavingsData++;
      }
    });

    const averageSavingAmount =
      processedWithSavingsData > 0
        ? totalSavingsRealizedCrypto / processedWithSavingsData
        : 0;

    const averageSavingPercent =
      processedWithSavingsData > 0
        ? totalSavingsPercentSum / processedWithSavingsData
        : 0;

    return {
      currentExposureWorstCase,
      bestCaseExposure,
      liveExposurePercent,
      isExposureProfit,
      totalPaymentsDue,
      pendingCount,
      processedCount,
      averageSavingAmount,
      averageSavingPercent,
      totalSavingsRealized: totalSavingsRealizedCrypto,
      pendingPayments,
      processedPayments,
      PRICE_DECIMALS,
    };
  }, [payments]);
}
