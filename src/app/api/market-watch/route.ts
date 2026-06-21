import { NextResponse } from "next/server";
import { getSector } from "@/lib/sectors";
import type { MarketSignal } from "@/lib/types";

const WATCH_UNIVERSE = ["BBCA", "BBRI", "BMRI", "TLKM", "ASII", "ICBP", "KLBF", "UNVR"];

type YahooHistory = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: Array<number | null> }> };
    }>;
  };
};

const standardDeviation = (values: number[]) => {
  if (values.length === 0) return 0;
  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  return Math.sqrt(values.reduce((total, value) => total + (value - mean) ** 2, 0) / values.length);
};

async function analyzeTicker(ticker: string): Promise<MarketSignal | null> {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}.JK?interval=1d&range=3mo`,
      {
        next: { revalidate: 3600 },
        headers: { "User-Agent": "Mozilla/5.0 PortfolioDashboard/1.0" },
      },
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as YahooHistory;
    const result = payload.chart?.result?.[0];
    const closes = (result?.indicators?.quote?.[0]?.close ?? []).filter(
      (value): value is number => typeof value === "number" && Number.isFinite(value),
    );
    if (closes.length < 21) return null;

    const latest = closes.at(-1) as number;
    const previous = closes.at(-2) as number;
    const base20 = closes.at(-21) as number;
    const recent = closes.slice(-21);
    const returns = recent.slice(1).map((value, index) => ((value / recent[index]) - 1) * 100);
    const dailyChangePercentage = ((latest / previous) - 1) * 100;
    const momentum20Percentage = ((latest / base20) - 1) * 100;
    const volatility20Percentage = standardDeviation(returns);
    const signal = momentum20Percentage > 3
      ? "Positive momentum"
      : momentum20Percentage < -3
        ? "Negative momentum"
        : "Neutral momentum";
    const timestamp = result?.timestamp?.at(-1);

    return {
      ticker,
      sector: getSector(ticker),
      price: latest,
      dailyChangePercentage,
      momentum20Percentage,
      volatility20Percentage,
      signal,
      explanation: `20-day momentum ${momentum20Percentage >= 0 ? "+" : ""}${momentum20Percentage.toFixed(1)}%, daily move ${dailyChangePercentage >= 0 ? "+" : ""}${dailyChangePercentage.toFixed(1)}%, volatility ${volatility20Percentage.toFixed(1)}%.`,
      marketTime: timestamp ? new Date(timestamp * 1000).toISOString() : null,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const analyzed = (await Promise.all(WATCH_UNIVERSE.map(analyzeTicker))).filter(
    (signal): signal is MarketSignal => signal !== null,
  );
  const signals = analyzed
    .sort(
      (a, b) =>
        (b.momentum20Percentage - b.volatility20Percentage * 0.5) -
        (a.momentum20Percentage - a.volatility20Percentage * 0.5),
    )
    .slice(0, 3);

  return NextResponse.json(
    {
      signals,
      generatedAt: new Date().toISOString(),
      methodology: "Ranked by 20-day price momentum adjusted for recent daily volatility.",
      source: "Yahoo Finance",
      disclaimer: "Educational market watch only. Not a buy or sell recommendation. Data may be delayed.",
    },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
