import { describe, expect, it, vi } from "vitest";
import { runDeepDive, type EngineDependencies } from "@/lib/server/engine";
import type { PortfolioState } from "@/lib/types";

const portfolio: PortfolioState = {
  version: 2,
  cashBalance: 1_000_000,
  watchlist: ["TLKM"],
  holdings: [
    {
      id: "bbca",
      ticker: "BBCA",
      lots: 1,
      averageBuyPrice: 8_000,
      currentPrice: 9_000,
      priceSource: "manual",
      marketTimestamp: null,
    },
  ],
};

const dependencies = (): EngineDependencies => ({
  fetchEvidence: vi.fn().mockResolvedValue({
    quotes: {
      BBCA: { currentPrice: 9_000, previousClose: 8_800 },
      TLKM: { currentPrice: 3_000, previousClose: 3_050 },
    },
    portfolioReturns: [-1, 1, -1, 1],
    momentumScore: 40,
    positiveBreadth: 0.5,
    articles: [
      {
        id: "news-1",
        ticker: "BBCA",
        title: "Bank reports operating update",
        url: "https://example.com/news",
        domain: "example.com",
        publishedAt: "2026-06-21T01:00:00.000Z",
      },
    ],
    sources: [
      {
        id: "yahoo-BBCA",
        provider: "Yahoo Finance",
        label: "BBCA market data",
        url: null,
        fetchedAt: "2026-06-21T02:00:00.000Z",
        marketTimestamp: "2026-06-21T01:59:00.000Z",
        status: "available",
        detail: "Best-effort quote and OHLCV; may be delayed.",
      },
    ],
  }),
  runSpecialist: vi.fn().mockImplementation(async (agent) => ({
    headline: `${agent} evidence`,
    summary: `Current ${agent} evidence is documented.`,
    confidence: 0.8,
    evidenceIds: ["yahoo-BBCA"],
    ...(agent === "sentiment" ? { sentimentScore: 30 } : {}),
  })),
  runAdvisor: vi.fn().mockResolvedValue({
    headline: "Measured daily evidence",
    summary: "Portfolio evidence is currently mixed and should be monitored.",
    confidence: 0.75,
    evidenceIds: ["yahoo-BBCA"],
    narrative: "Daily movement is modest relative to the current portfolio value.",
    checklist: ["Verify delayed quotes before relying on the report."],
  }),
  now: () => new Date("2026-06-21T02:00:00.000Z"),
  createId: () => "report-1",
});

describe("DanA-F engine", () => {
  it("runs five specialists and Advisor while preserving deterministic impact", async () => {
    const deps = dependencies();
    const progress: string[] = [];
    const report = await runDeepDive(
      portfolio,
      deps,
      (event) => progress.push(`${event.agent}:${event.status}`),
      { unprotectedDevRun: true },
    );

    expect(deps.runSpecialist).toHaveBeenCalledTimes(5);
    expect(deps.runAdvisor).toHaveBeenCalledTimes(1);
    expect(report.dailyImpact).toBe(20_000);
    expect(report.version).toBe(2);
    expect(report.portfolioValue).toBe(1_900_000);
    expect(report.investedCapital).toBe(800_000);
    expect(report.floatingProfitLoss).toBe(100_000);
    expect(report.cashBalance).toBe(1_000_000);
    expect(report.returnPercentage).toBe(12.5);
    expect(report.dailyImpactPercentage).toBeCloseTo(20_000 / 1_880_000 * 100);
    expect(report.health.score).toBeGreaterThanOrEqual(0);
    expect(report.bullishEvidence.length).toBeGreaterThan(0);
    expect(report.bearishEvidence.length).toBeGreaterThan(0);
    expect(report.security.unprotectedDevRun).toBe(true);
    expect(report.sections).toHaveLength(6);
    expect(report.status).toBe("complete");
    expect(progress).toContain("advisor:complete");
  });

  it("returns a partial report when one specialist fails", async () => {
    const deps = dependencies();
    vi.mocked(deps.runSpecialist).mockImplementation(async (agent) => {
      if (agent === "news") throw new Error("provider timeout");
      return {
        headline: `${agent} evidence`,
        summary: "Available evidence only.",
        confidence: 0.5,
        evidenceIds: [],
        ...(agent === "sentiment" ? { sentimentScore: null } : {}),
      };
    });

    const report = await runDeepDive(portfolio, deps, () => undefined);

    expect(report.status).toBe("partial");
    expect(report.sections.find((section) => section.agent === "news")?.summary).toContain("unavailable");
  });
});
