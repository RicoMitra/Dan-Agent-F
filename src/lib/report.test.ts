import { describe, expect, it } from "vitest";
import { buildDeepDiveReport } from "@/lib/report";
import type { DeepDiveReport } from "@/lib/types";

describe("premium Deep Dive PDF", () => {
  it("creates a multi-section PDF with page numbering", () => {
    const report = {
      version: 2,
      id: "sample",
      generatedAt: "2026-06-21T02:00:00.000Z",
      status: "complete",
      portfolioFingerprint: "abc",
      executivePulse: "Measured portfolio evidence",
      portfolioValue: 10_000_000,
      investedCapital: 8_000_000,
      floatingProfitLoss: 1_000_000,
      cashBalance: 1_000_000,
      returnPercentage: 12.5,
      dailyImpact: 100_000,
      dailyImpactPercentage: 1.01,
      dailyImpactCoverage: 1,
      health: { score: 7, maxScore: 10, label: "Balanced", factors: [] },
      security: { unprotectedDevRun: false },
      sentiment: { status: "available", score: 20, confidence: 0.7, articleCount: 2 },
      volatility: { dailyPercentage: 1.2, triggered: false, observations: 20 },
      evidenceBalance: { score: 22, label: "bullish", components: { momentum: 30, sentiment: 20, breadth: 10, volatility: 52 } },
      bullishEvidence: ["Momentum supports current evidence."],
      bearishEvidence: ["Concentration warrants review."],
      risks: [], holdingImpacts: [], watchlistComparison: [], sections: [],
      narrative: "Current evidence is measured and coverage is documented.",
      checklist: ["Verify market timestamps."], sources: [],
      methodology: ["Deterministic methodology."], disclaimers: ["Not investment advice."],
    } satisfies DeepDiveReport;
    const pdf = buildDeepDiveReport(report);
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(2);
    expect(pdf.output("arraybuffer").byteLength).toBeGreaterThan(1_000);
    expect(pdf.output()).toContain("DanA-F Deep Dive Report");
    expect(pdf.output()).not.toContain("Impact by holding");
  });
});
