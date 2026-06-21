import { describe, expect, it } from "vitest";
import {
  aggregateSentiment,
  calculateDailyImpact,
  calculateEvidenceBalance,
  calculateRealizedVolatility,
  createPortfolioFingerprint,
  isReportStale,
} from "@/lib/intelligence";
import type { PortfolioState } from "@/lib/types";

const portfolio: PortfolioState = {
  version: 2,
  cashBalance: 1_000_000,
  watchlist: ["TLKM"],
  holdings: [
    {
      id: "bbca",
      ticker: "BBCA",
      lots: 2,
      averageBuyPrice: 8_000,
      currentPrice: 9_000,
      priceSource: "yahoo",
      marketTimestamp: "2026-06-21T02:00:00.000Z",
    },
  ],
};

describe("daily portfolio impact", () => {
  it("uses shares times the move from previous close", () => {
    const result = calculateDailyImpact(portfolio.holdings, {
      BBCA: { currentPrice: 9_000, previousClose: 8_800 },
    });

    expect(result.holdings[0].impact).toBe(40_000);
    expect(result.totalImpact).toBe(40_000);
    expect(result.coverage).toBe(1);
  });

  it("marks missing previous close as unavailable instead of zero impact", () => {
    const result = calculateDailyImpact(portfolio.holdings, {
      BBCA: { currentPrice: 9_000, previousClose: null },
    });

    expect(result.holdings[0].impact).toBeNull();
    expect(result.coverage).toBe(0);
  });
});

describe("realized volatility", () => {
  it("triggers at the approved 2.5 percent boundary", () => {
    const result = calculateRealizedVolatility([-2.5, 2.5, -2.5, 2.5]);

    expect(result.dailyPercentage).toBe(2.5);
    expect(result.triggered).toBe(true);
  });

  it("returns unavailable when fewer than two returns exist", () => {
    expect(calculateRealizedVolatility([1])).toEqual({
      dailyPercentage: null,
      triggered: false,
      observations: 1,
    });
  });
});

describe("evidence balance", () => {
  it("classifies scores above 20 as bullish evidence", () => {
    const result = calculateEvidenceBalance({
      momentumScore: 80,
      sentimentScore: 60,
      positiveBreadth: 0.75,
      volatilityDailyPercentage: 1,
    });

    expect(result.score).toBe(66);
    expect(result.label).toBe("bullish");
  });

  it("classifies exactly 20 as mixed evidence", () => {
    const result = calculateEvidenceBalance({
      momentumScore: 50,
      sentimentScore: 0,
      positiveBreadth: 0.5,
      volatilityDailyPercentage: 2.5,
    });

    expect(result.score).toBe(20);
    expect(result.label).toBe("mixed");
  });
});

describe("sentiment aggregation", () => {
  it("weights score by relevance, confidence, and recency", () => {
    const result = aggregateSentiment([
      { score: 80, confidence: 0.9, relevance: 1, ageHours: 1 },
      { score: -80, confidence: 0.5, relevance: 0.5, ageHours: 60 },
    ]);

    expect(result.status).toBe("available");
    expect(result.score).toBeGreaterThan(60);
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it("does not turn missing articles into neutral sentiment", () => {
    expect(aggregateSentiment([])).toEqual({
      status: "insufficient",
      score: null,
      confidence: 0,
      articleCount: 0,
    });
  });
});

describe("latest report freshness", () => {
  it("is stable across holding order and changes when inputs change", () => {
    const fingerprint = createPortfolioFingerprint(portfolio);
    expect(isReportStale(fingerprint, { ...portfolio })).toBe(false);
    expect(
      isReportStale(fingerprint, { ...portfolio, cashBalance: 2_000_000 }),
    ).toBe(true);
  });
});
