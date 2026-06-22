import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeepDiveDashboard } from "@/components/deep-dive-dashboard";
import { REPORT_STORAGE_KEY } from "@/lib/storage";
import type { DeepDiveReport } from "@/lib/types";

const report: DeepDiveReport = {
  version: 2,
  id: "report-1",
  generatedAt: "2026-06-22T02:00:00.000Z",
  portfolioFingerprint: "fixture",
  status: "complete",
  executivePulse: "Measured evidence with documented coverage",
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
  sentiment: { status: "available", score: 24, confidence: 0.72, articleCount: 4 },
  volatility: { dailyPercentage: 1.4, triggered: false, observations: 20 },
  evidenceBalance: {
    score: 22,
    label: "bullish",
    components: { momentum: 16, sentiment: 6, breadth: 4, volatility: -4 },
  },
  bullishEvidence: ["Price momentum contributes +16.0 to current evidence."],
  bearishEvidence: ["Inverse volatility contributes -4.0 to current evidence."],
  risks: [{ id: "concentration", title: "Single-holding concentration", detail: "BBCA represents 42.0%.", triggered: true }],
  holdingImpacts: [{ ticker: "BBCA", impact: 100_000, dailyChangePercentage: 1.2, coverage: "available" }],
  watchlistComparison: [],
  sections: [],
  narrative: "Daily evidence is constructive, while concentration remains the clearest risk trigger.",
  checklist: ["Verify market timestamps before relying on the report."],
  sources: [{ id: "yahoo", provider: "Yahoo Finance", label: "BBCA market data", url: null, fetchedAt: "2026-06-22T02:00:00.000Z", marketTimestamp: null, status: "available", detail: "Best-effort quote and OHLCV." }],
  methodology: ["Deterministic calculations remain separate from AI synthesis."],
  disclaimers: ["Not investment advice."],
};

describe("Deep Dive workspace", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("explains consent, agents, and unconfigured live access", () => {
    render(<DeepDiveDashboard />);
    expect(screen.getByRole("heading", { name: /deep dive analysis/i })).toBeInTheDocument();
    expect(screen.getByText(/snapshot is sent only after consent/i)).toBeInTheDocument();
    expect(screen.getByText("Market Agent")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run dana-f engine/i })).toBeDisabled();
  });

  it("enables a clearly labelled unprotected run after consent in development", () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "configured-site-key");
    render(<DeepDiveDashboard developmentMode />);

    expect(screen.getByText(/unprotected dev run/i)).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /run dana-f engine/i });
    expect(button).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(button).toBeEnabled();
  });

  it("executes with an empty Turnstile token and renders the streamed report in development", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "configured-site-key");
    const developmentReport: DeepDiveReport = {
      ...report,
      id: "development-report",
      security: { unprotectedDevRun: true, deterministicFallback: true },
    };
    const fetcher = vi.fn().mockResolvedValue(
      new Response(`${JSON.stringify({ type: "report", report: developmentReport })}\n`, {
        status: 200,
        headers: { "Content-Type": "application/x-ndjson" },
      }),
    );
    vi.stubGlobal("fetch", fetcher);
    render(<DeepDiveDashboard developmentMode />);

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /run dana-f engine/i }));

    expect(await screen.findByRole("heading", { name: "DanA-F Deep Dive Report" })).toBeInTheDocument();
    expect(screen.getAllByText(/unprotected dev run/i).length).toBeGreaterThan(0);
    const request = fetcher.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(request.body as string)).toMatchObject({ turnstileToken: "", consent: true });
  });

  it("renders the complete premium report structure without a dense table", async () => {
    window.localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(report));
    render(<DeepDiveDashboard />);

    expect(await screen.findByRole("heading", { name: "DanA-F Deep Dive Report" })).toBeInTheDocument();
    expect(screen.getByText("Portfolio Health Score")).toBeInTheDocument();
    expect(screen.getByText("Total Portfolio")).toBeInTheDocument();
    expect(screen.getByText("Invested Capital")).toBeInTheDocument();
    expect(screen.getByText("Floating P/L")).toBeInTheDocument();
    expect(screen.getByText("Cash Balance")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Market & Sentiment Overview" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Portfolio Impact" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Risk Triggers" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Portfolio Narrative" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Action Checklist" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bullish vs Bearish Evidence" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Data Source Transparency" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download Report (PDF)" })).toBeVisible();
    expect(document.querySelector("[aria-label='Deep Dive report'] table")).toBeNull();
  });
});
