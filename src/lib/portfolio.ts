import type {
  Holding,
  PortfolioHealth,
  PortfolioInsight,
  PortfolioState,
  PortfolioSummary,
  SectorAllocation,
} from "@/lib/types";
import { getSector } from "@/lib/sectors";

export const LOT_SIZE = 100;
export const CONCENTRATION_THRESHOLD = 40;
export const HIGH_CASH_THRESHOLD = 30;
export const LOW_CASH_THRESHOLD = 5;

const finiteNonNegative = (value: number) =>
  Number.isFinite(value) ? Math.max(0, value) : 0;

export function calculatePortfolio(state: PortfolioState): PortfolioSummary {
  const cashBalance = finiteNonNegative(state.cashBalance);
  const baseHoldings = state.holdings.map((holding) => {
    const lots = finiteNonNegative(holding.lots);
    const averageBuyPrice = finiteNonNegative(holding.averageBuyPrice);
    const currentPrice = finiteNonNegative(holding.currentPrice);
    const shares = lots * LOT_SIZE;
    const investedCapital = shares * averageBuyPrice;
    const currentValue = shares * currentPrice;
    const floatingProfitLoss = currentValue - investedCapital;

    return {
      ...holding,
      ticker: holding.ticker.trim().toUpperCase(),
      lots,
      averageBuyPrice,
      currentPrice,
      shares,
      investedCapital,
      currentValue,
      floatingProfitLoss,
      returnPercentage:
        investedCapital > 0 ? (floatingProfitLoss / investedCapital) * 100 : 0,
    };
  });

  const totalInvestedCapital = baseHoldings.reduce(
    (total, holding) => total + holding.investedCapital,
    0,
  );
  const totalHoldingsValue = baseHoldings.reduce(
    (total, holding) => total + holding.currentValue,
    0,
  );
  const totalPortfolioValue = totalHoldingsValue + cashBalance;
  const floatingProfitLoss = totalHoldingsValue - totalInvestedCapital;

  return {
    holdings: baseHoldings.map((holding) => ({
      ...holding,
      allocationPercentage:
        totalPortfolioValue > 0
          ? (holding.currentValue / totalPortfolioValue) * 100
          : 0,
    })),
    cashBalance,
    totalInvestedCapital,
    totalHoldingsValue,
    totalPortfolioValue,
    floatingProfitLoss,
    returnPercentage:
      totalInvestedCapital > 0
        ? (floatingProfitLoss / totalInvestedCapital) * 100
        : 0,
    cashAllocationPercentage:
      totalPortfolioValue > 0 ? (cashBalance / totalPortfolioValue) * 100 : 0,
  };
}

export function calculateScenario(
  summary: PortfolioSummary,
  percentageChange: number,
) {
  const safeChange = Number.isFinite(percentageChange) ? percentageChange : 0;
  const projectedHoldingsValue =
    summary.totalHoldingsValue * (1 + safeChange / 100);
  const projectedPortfolioValue = projectedHoldingsValue + summary.cashBalance;

  return {
    percentageChange: safeChange,
    projectedHoldingsValue,
    projectedPortfolioValue,
    valueDifference: projectedPortfolioValue - summary.totalPortfolioValue,
  };
}

export function generateInsights(
  summary: PortfolioSummary,
): PortfolioInsight[] {
  if (summary.totalPortfolioValue === 0) {
    return [
      {
        id: "empty",
        title: "Your portfolio is ready for data",
        description:
          "Add a holding or cash balance to generate allocation and performance insights.",
        tone: "neutral",
      },
    ];
  }

  const insights: PortfolioInsight[] = [];
  const concentratedHolding = [...summary.holdings]
    .sort((a, b) => b.allocationPercentage - a.allocationPercentage)
    .find(
      (holding) => holding.allocationPercentage >= CONCENTRATION_THRESHOLD,
    );

  if (concentratedHolding) {
    insights.push({
      id: "concentration",
      title: "High single-stock concentration",
      description: `${concentratedHolding.ticker || "One holding"} represents ${concentratedHolding.allocationPercentage.toFixed(1)}% of total portfolio value, above the educational ${CONCENTRATION_THRESHOLD}% threshold.`,
      tone: "attention",
    });
  }

  if (summary.cashAllocationPercentage >= HIGH_CASH_THRESHOLD) {
    insights.push({
      id: "high-cash",
      title: "High cash exposure",
      description: `Cash represents ${summary.cashAllocationPercentage.toFixed(1)}% of the portfolio, above the educational ${HIGH_CASH_THRESHOLD}% threshold.`,
      tone: "neutral",
    });
  } else if (
    summary.cashAllocationPercentage < LOW_CASH_THRESHOLD &&
    summary.cashBalance > 0
  ) {
    insights.push({
      id: "low-cash",
      title: "Low cash exposure",
      description: `Cash represents ${summary.cashAllocationPercentage.toFixed(1)}% of the portfolio, below the educational ${LOW_CASH_THRESHOLD}% threshold.`,
      tone: "neutral",
    });
  }

  const isPositive = summary.floatingProfitLoss > 0;
  const isNegative = summary.floatingProfitLoss < 0;
  insights.push({
    id: "performance",
    title: isPositive
      ? "Portfolio is above cost basis"
      : isNegative
        ? "Portfolio is below cost basis"
        : "Portfolio is at cost basis",
    description: `Holdings currently show a ${Math.abs(summary.returnPercentage).toFixed(2)}% ${isPositive ? "gain" : isNegative ? "loss" : "change"} relative to invested capital.`,
    tone: isPositive ? "positive" : isNegative ? "attention" : "neutral",
  });

  return insights.slice(0, 3);
}

export function calculateHealthScore(
  summary: PortfolioSummary,
): PortfolioHealth {
  const activeHoldings = summary.holdings.filter((holding) => holding.currentValue > 0);
  const holdingCount = activeHoldings.length;
  const diversificationScore = holdingCount >= 5 ? 3 : holdingCount >= 3 ? 2 : holdingCount >= 2 ? 1 : 0;
  const largestAllocation = activeHoldings.reduce(
    (largest, holding) => Math.max(largest, holding.allocationPercentage),
    0,
  );
  const concentrationScore =
    holdingCount === 0 ? 0 : largestAllocation < 30 ? 3 : largestAllocation < 40 ? 2 : largestAllocation < 60 ? 1 : 0;
  const cashPercentage = summary.cashAllocationPercentage;
  const cashScore =
    summary.totalPortfolioValue === 0 ? 0 : cashPercentage >= 5 && cashPercentage <= 30 ? 2 : cashPercentage > 0 && cashPercentage <= 50 ? 1 : 0;
  const performanceScore = summary.totalInvestedCapital === 0 ? 0 : summary.returnPercentage >= 0 ? 2 : summary.returnPercentage >= -10 ? 1 : 0;

  const factors = [
    { id: "diversification", label: "Diversification", score: diversificationScore, maxScore: 3, detail: `${holdingCount} active holding${holdingCount === 1 ? "" : "s"}` },
    { id: "concentration", label: "Concentration", score: concentrationScore, maxScore: 3, detail: `${largestAllocation.toFixed(1)}% largest position` },
    { id: "cash", label: "Cash balance", score: cashScore, maxScore: 2, detail: `${cashPercentage.toFixed(1)}% cash allocation` },
    { id: "performance", label: "Performance", score: performanceScore, maxScore: 2, detail: `${summary.returnPercentage.toFixed(2)}% stock return` },
  ];
  const score = factors.reduce((total, factor) => total + factor.score, 0);

  return {
    score,
    maxScore: 10,
    label: score >= 8 ? "Strong" : score >= 5 ? "Balanced" : "Needs attention",
    factors,
  };
}

export function calculateSectorAllocation(
  summary: PortfolioSummary,
): SectorAllocation[] {
  const bySector = new Map<string, number>();
  for (const holding of summary.holdings) {
    const sector = getSector(holding.ticker);
    bySector.set(sector, (bySector.get(sector) ?? 0) + holding.currentValue);
  }

  return [...bySector.entries()]
    .map(([sector, value]) => ({
      sector,
      value,
      percentage:
        summary.totalHoldingsValue > 0
          ? (value / summary.totalHoldingsValue) * 100
          : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

export function isValidPortfolioState(value: unknown): value is PortfolioState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PortfolioState>;
  if (
    candidate.version !== 2 ||
    !Array.isArray(candidate.holdings) ||
    candidate.holdings.length > 20 ||
    !Array.isArray(candidate.watchlist) ||
    candidate.watchlist.length > 10 ||
    typeof candidate.cashBalance !== "number" ||
    !Number.isFinite(candidate.cashBalance) ||
    candidate.cashBalance < 0
  ) {
    return false;
  }

  const validWatchlist = candidate.watchlist.every(
    (ticker) => typeof ticker === "string" && /^[A-Za-z0-9.-]{1,15}$/.test(ticker.trim()),
  );
  if (!validWatchlist) return false;

  const validHoldings = candidate.holdings.every((holding: unknown) => {
    if (!holding || typeof holding !== "object") return false;
    const item = holding as Partial<Holding>;
    return (
      typeof item.id === "string" &&
      typeof item.ticker === "string" &&
      (item.priceSource === "manual" || item.priceSource === "yahoo") &&
      (item.marketTimestamp === null ||
        (typeof item.marketTimestamp === "string" &&
          Number.isFinite(Date.parse(item.marketTimestamp)))) &&
      [item.lots, item.averageBuyPrice, item.currentPrice].every(
        (field) =>
          typeof field === "number" && Number.isFinite(field) && field >= 0,
      )
    );
  });
  if (!validHoldings) return false;

  const combined = new Set([
    ...candidate.holdings.map((holding) => holding.ticker.trim().toUpperCase()),
    ...candidate.watchlist.map((ticker) => ticker.trim().toUpperCase()),
  ]);
  return combined.size <= 20;
}
