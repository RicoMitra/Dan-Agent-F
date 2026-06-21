import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { calculateHealthScore, calculatePortfolio, calculateScenario, calculateSectorAllocation, generateInsights } from "../src/lib/portfolio";
import { buildDeepDiveReport, buildPortfolioReport } from "../src/lib/report";
import type { DeepDiveReport, PortfolioState } from "../src/lib/types";

const portfolio = {
  version: 2,
  cashBalance: 18_500_000,
  watchlist: ["ANTM"],
  holdings: [
    { id: "bbca", ticker: "BBCA", lots: 13, averageBuyPrice: 7_848.08, currentPrice: 6_300, priceSource: "manual", marketTimestamp: null },
    { id: "tlkm", ticker: "TLKM", lots: 40, averageBuyPrice: 3_120, currentPrice: 3_010, priceSource: "manual", marketTimestamp: null },
  ],
} satisfies PortfolioState;
const summary = calculatePortfolio(portfolio);
const output = resolve("output/pdf/portfolio-dashboard-sample.pdf");
mkdirSync(dirname(output), { recursive: true });
const doc = buildPortfolioReport({
  summary,
  health: calculateHealthScore(summary),
  sectors: calculateSectorAllocation(summary),
  insights: generateInsights(summary),
  scenario: calculateScenario(summary, -10),
  generatedAt: new Date("2026-06-20T12:00:00+07:00"),
});
writeFileSync(output, Buffer.from(doc.output("arraybuffer")));
const deepDive: DeepDiveReport = {
  version: 1, id: "sample-report", generatedAt: "2026-06-21T02:00:00.000Z", portfolioFingerprint: "sample", status: "complete", executivePulse: "Measured evidence with transparent coverage", portfolioValue: summary.totalPortfolioValue, dailyImpact: -1_250_000, dailyImpactCoverage: 1,
  sentiment: { status: "available", score: 18, confidence: 0.72, articleCount: 4 }, volatility: { dailyPercentage: 1.65, triggered: false, observations: 20 }, evidenceBalance: { score: 16, label: "mixed", components: { momentum: 20, sentiment: 18, breadth: 0, volatility: 34 } },
  risks: [{ id: "concentration", title: "Single-holding concentration", detail: "BBCA represents 40.2%; the educational trigger is 40%.", triggered: true }],
  holdingImpacts: [{ ticker: "BBCA", impact: -650_000, dailyChangePercentage: -1.2, coverage: "available" }, { ticker: "TLKM", impact: -600_000, dailyChangePercentage: -0.5, coverage: "available" }],
  watchlistComparison: [{ ticker: "ANTM", status: "watchlist", observation: "Market evidence only; excluded from portfolio value." }],
  sections: ["market", "news", "sentiment", "portfolio", "risk", "advisor"].map((agent) => ({ agent: agent as DeepDiveReport["sections"][number]["agent"], headline: `${agent} evidence`, summary: "Current evidence is documented with visible source coverage and no transaction instruction.", confidence: 0.72, evidenceIds: ["yahoo-BBCA"] })),
  narrative: "The portfolio recorded a modest daily decline. Concentration is the most visible deterministic risk factor; current evidence remains mixed rather than predictive.", checklist: ["Verify market timestamps before relying on the report.", "Review the concentration percentage against the documented threshold."],
  sources: [{ id: "yahoo-BBCA", provider: "Yahoo Finance", label: "BBCA quote and OHLCV", url: "https://finance.yahoo.com/quote/BBCA.JK", fetchedAt: "2026-06-21T02:00:00.000Z", marketTimestamp: "2026-06-21T01:55:00.000Z", status: "available", detail: "Best-effort market data; may be delayed." }],
  methodology: ["Daily impact equals shares multiplied by current price minus previous close.", "Evidence balance weights momentum, sentiment, breadth, and inverse volatility."], disclaimers: ["Educational decision support only; not investment advice or a price forecast."],
};
const deepOutput = resolve("output/pdf/dan-agent-f-deep-dive-sample.pdf");
writeFileSync(deepOutput, Buffer.from(buildDeepDiveReport(deepDive).output("arraybuffer")));
console.log([output, deepOutput].join("\n"));
