import { expect, test } from "@playwright/test";

test("Monitoring supports local portfolio editing and mocked market refresh", async ({ page }) => {
  await page.route("**/api/quotes?**", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ quotes: [{ ticker: "BBCA", price: 9700, previousClose: 9600, volume: 100000, dayLow: 9500, dayHigh: 9750, marketTime: "2026-06-21T02:00:00.000Z" }], errors: [] }) }));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Portfolio monitoring" })).toBeVisible();
  const refresh = page.getByRole("button", { name: "Refresh", exact: true });
  await refresh.scrollIntoViewIfNeeded();
  await refresh.click({ force: true });
  await expect(page.getByText(/1 updated; 0 unavailable/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Deep Dive Analysis/i })).toBeVisible();
});

test("Deep Dive explains privacy and remains safe without credentials", async ({ page }) => {
  await page.goto("/analysis");
  await expect(page.getByRole("heading", { name: "Deep Dive Analysis" })).toBeVisible();
  await expect(page.getByText(/server does not store it/i)).toBeVisible();
  await expect(page.getByText(/unprotected dev run/i)).toBeVisible();
  const run = page.getByRole("button", { name: "Run DanA-F Engine" });
  await expect(run).toBeDisabled();
  await page.getByRole("checkbox").check();
  await expect(run).toBeEnabled();
});

test("Deep Dive renders the premium report consistently on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const report = {
      version: 2, id: "e2e-report", generatedAt: "2026-06-22T02:00:00.000Z", portfolioFingerprint: "e2e", status: "complete",
      executivePulse: "Measured evidence with documented coverage", portfolioValue: 10_000_000, investedCapital: 8_000_000,
      floatingProfitLoss: 1_000_000, cashBalance: 1_000_000, returnPercentage: 12.5, dailyImpact: 100_000,
      dailyImpactPercentage: 1.01, dailyImpactCoverage: 1, health: { score: 7, maxScore: 10, label: "Balanced", factors: [] },
      security: { unprotectedDevRun: false }, sentiment: { status: "available", score: 24, confidence: 0.72, articleCount: 4 },
      volatility: { dailyPercentage: 1.4, triggered: false, observations: 20 },
      evidenceBalance: { score: 22, label: "bullish", components: { momentum: 16, sentiment: 6, breadth: 4, volatility: -4 } },
      bullishEvidence: ["Price momentum contributes +16.0 to current evidence."], bearishEvidence: ["Inverse volatility contributes -4.0 to current evidence."],
      risks: [{ id: "concentration", title: "Single-holding concentration", detail: "BBCA represents 42.0%.", triggered: true }],
      holdingImpacts: [{ ticker: "BBCA", impact: 100_000, dailyChangePercentage: 1.2, coverage: "available" }], watchlistComparison: [], sections: [],
      narrative: "Daily evidence is constructive, while concentration remains the clearest risk trigger.", checklist: ["Verify market timestamps before relying on the report."],
      sources: [{ id: "yahoo", provider: "Yahoo Finance", label: "BBCA market data", url: null, fetchedAt: "2026-06-22T02:00:00.000Z", marketTimestamp: null, status: "available", detail: "Best-effort quote and OHLCV." }],
      methodology: ["Deterministic calculations remain separate from AI synthesis."], disclaimers: ["Not investment advice."],
    };
    localStorage.setItem("dan-agent-f:latest-report:v2", JSON.stringify(report));
  });
  await page.goto("/analysis");
  await expect(page.getByRole("heading", { name: "DanA-F Deep Dive Report" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download Report (PDF)" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bullish vs Bearish Evidence" })).toBeVisible();
  await expect(page.locator("[aria-label='Deep Dive report'] table")).toHaveCount(0);
});
