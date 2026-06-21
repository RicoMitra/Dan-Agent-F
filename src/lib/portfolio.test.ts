import { describe, expect, it } from "vitest";
import {
  calculatePortfolio,
  calculateHealthScore,
  calculateScenario,
  calculateSectorAllocation,
  generateInsights,
  isValidPortfolioState,
} from "@/lib/portfolio";
import type { PortfolioState } from "@/lib/types";

const sample: PortfolioState = {
  version: 2,
  cashBalance: 30_000,
  watchlist: ["TLKM"],
  holdings: [
    {
      id: "bbca",
      ticker: "bbca",
      lots: 1,
      averageBuyPrice: 1_000,
      currentPrice: 1_200,
      priceSource: "manual",
      marketTimestamp: null,
    },
  ],
};

describe("portfolio calculations", () => {
  it("converts Indonesian lots and reconciles portfolio totals", () => {
    const result = calculatePortfolio(sample);

    expect(result.holdings[0]).toMatchObject({
      ticker: "BBCA",
      shares: 100,
      investedCapital: 100_000,
      currentValue: 120_000,
      floatingProfitLoss: 20_000,
      returnPercentage: 20,
      allocationPercentage: 80,
    });
    expect(result.totalPortfolioValue).toBe(150_000);
    expect(result.cashAllocationPercentage).toBe(20);
  });

  it("keeps cash unchanged in a stock-price scenario", () => {
    const summary = calculatePortfolio(sample);
    const scenario = calculateScenario(summary, 10);

    expect(scenario.projectedHoldingsValue).toBeCloseTo(132_000);
    expect(scenario.projectedPortfolioValue).toBeCloseTo(162_000);
    expect(scenario.valueDifference).toBeCloseTo(12_000);
  });

  it("returns finite zero values for an empty portfolio", () => {
    const result = calculatePortfolio({ version: 2, holdings: [], cashBalance: 0, watchlist: [] });

    expect(result.totalPortfolioValue).toBe(0);
    expect(result.returnPercentage).toBe(0);
    expect(result.cashAllocationPercentage).toBe(0);
  });

  it("describes transparent concentration thresholds", () => {
    const insights = generateInsights(calculatePortfolio(sample));

    expect(insights[0].id).toBe("concentration");
    expect(insights[0].description).toContain("80.0%");
    expect(insights[0].description).toContain("40%");
  });

  it("scores portfolio health from visible factors", () => {
    const health = calculateHealthScore(calculatePortfolio(sample));

    expect(health.maxScore).toBe(10);
    expect(health.score).toBe(4);
    expect(health.factors).toHaveLength(4);
  });

  it("groups holdings into deterministic sectors", () => {
    const allocation = calculateSectorAllocation(calculatePortfolio(sample));

    expect(allocation).toEqual([
      { sector: "Financials", value: 120_000, percentage: 100 },
    ]);
  });
});

describe("saved state validation", () => {
  it("accepts valid versioned portfolio data", () => {
    expect(isValidPortfolioState(sample)).toBe(true);
  });

  it("rejects malformed or negative persisted values", () => {
    expect(isValidPortfolioState({ ...sample, cashBalance: -1 })).toBe(false);
    expect(isValidPortfolioState({ ...sample, version: 1 })).toBe(false);
    expect(isValidPortfolioState({ ...sample, watchlist: Array(11).fill("BBCA") })).toBe(false);
    expect(
      isValidPortfolioState({
        ...sample,
        holdings: [{ ...sample.holdings[0], currentPrice: Number.NaN }],
      }),
    ).toBe(false);
  });
});
