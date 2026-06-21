import type { Holding, SourceRecord } from "@/lib/types";

type YahooPayload = {
  chart?: {
    result?: Array<{
      meta?: Record<string, unknown>;
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: Array<number | null> }> };
    }>;
    error?: { description?: string } | null;
  };
};

export type ParsedYahooChart = {
  ticker: string;
  quote: {
    currentPrice: number;
    previousClose: number | null;
    volume: number | null;
    dayLow: number | null;
    dayHigh: number | null;
    marketTimestamp: string | null;
  };
  closes: number[];
  points: Array<{ timestamp: number; close: number }>;
};

const finiteOrNull = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export function parseYahooChart(ticker: string, payload: unknown): ParsedYahooChart {
  const data = payload as YahooPayload;
  const result = data.chart?.result?.[0];
  const meta = result?.meta;
  const currentPrice = finiteOrNull(meta?.regularMarketPrice);
  if (currentPrice === null) {
    throw new Error(data.chart?.error?.description ?? `${ticker} market data unavailable`);
  }
  const timestamps = result?.timestamp ?? [];
  const closesRaw = result?.indicators?.quote?.[0]?.close ?? [];
  const points = timestamps.flatMap((timestamp, index) => {
    const close = closesRaw[index];
    return typeof close === "number" && Number.isFinite(close) ? [{ timestamp, close }] : [];
  });
  return {
    ticker,
    quote: {
      currentPrice,
      previousClose: finiteOrNull(meta?.previousClose),
      volume: finiteOrNull(meta?.regularMarketVolume),
      dayLow: finiteOrNull(meta?.regularMarketDayLow),
      dayHigh: finiteOrNull(meta?.regularMarketDayHigh),
      marketTimestamp:
        typeof meta?.regularMarketTime === "number"
          ? new Date(meta.regularMarketTime * 1000).toISOString()
          : null,
    },
    closes: points.map((point) => point.close),
    points,
  };
}

export async function fetchYahooChart(ticker: string): Promise<ParsedYahooChart> {
  const symbol = ticker.toUpperCase().endsWith(".JK") ? ticker.toUpperCase() : `${ticker.toUpperCase()}.JK`;
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=3mo`,
    {
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0 Dan-Agent-F/1.0" },
    },
  );
  if (!response.ok) throw new Error(`Yahoo Finance returned ${response.status}`);
  return parseYahooChart(ticker.replace(/\.JK$/i, ""), (await response.json()) as unknown);
}

export function calculateHistoricalPortfolioReturns(
  holdings: Holding[],
  charts: ParsedYahooChart[],
) {
  const chartByTicker = new Map(charts.map((chart) => [chart.ticker.toUpperCase(), chart]));
  const timestamps = holdings
    .map((holding) => new Set(chartByTicker.get(holding.ticker.toUpperCase())?.points.map((point) => point.timestamp) ?? []))
    .reduce<Set<number>>((intersection, current, index) => {
      if (index === 0) return current;
      return new Set([...intersection].filter((timestamp) => current.has(timestamp)));
    }, new Set<number>());
  const values = [...timestamps]
    .sort((a, b) => a - b)
    .map((timestamp) =>
      holdings.reduce((total, holding) => {
        const point = chartByTicker
          .get(holding.ticker.toUpperCase())
          ?.points.find((candidate) => candidate.timestamp === timestamp);
        return total + (point?.close ?? 0) * holding.lots * 100;
      }, 0),
    )
    .filter((value) => value > 0);
  return values.slice(1).map((value, index) => ((value / values[index]) - 1) * 100);
}

export async function fetchMarketBundle(holdings: Holding[], symbols: string[]) {
  const fetchedAt = new Date().toISOString();
  const results = await Promise.allSettled(symbols.map(fetchYahooChart));
  const charts = results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
  const sources: SourceRecord[] = results.map((result, index) => ({
    id: `yahoo-${symbols[index].toUpperCase()}`,
    provider: "Yahoo Finance",
    label: `${symbols[index].toUpperCase()} quote and OHLCV`,
    url: `https://finance.yahoo.com/quote/${symbols[index].toUpperCase()}.JK`,
    fetchedAt,
    marketTimestamp: result.status === "fulfilled" ? result.value.quote.marketTimestamp : null,
    status: result.status === "fulfilled" ? "available" : "unavailable",
    detail:
      result.status === "fulfilled"
        ? "Best-effort market data; may be delayed."
        : "Yahoo Finance data unavailable; manual price remains unchanged.",
  }));
  const quotes = Object.fromEntries(
    charts.map((chart) => [chart.ticker.toUpperCase(), chart.quote]),
  );
  const dailyMoves = charts.flatMap((chart) => {
    const previous = chart.quote.previousClose;
    return previous && previous > 0
      ? [((chart.quote.currentPrice - previous) / previous) * 100]
      : [];
  });
  const averageMomentum = charts.flatMap((chart) => {
    const closes = chart.closes;
    if (closes.length < 21) return [];
    return [((closes.at(-1)! / closes.at(-21)!) - 1) * 100];
  });
  return {
    charts,
    quotes,
    sources,
    portfolioReturns: calculateHistoricalPortfolioReturns(holdings, charts),
    momentumScore:
      averageMomentum.length > 0
        ? Math.max(-100, Math.min(100, averageMomentum.reduce((a, b) => a + b, 0) / averageMomentum.length * 5))
        : 0,
    positiveBreadth:
      dailyMoves.length > 0 ? dailyMoves.filter((move) => move > 0).length / dailyMoves.length : 0.5,
  };
}
