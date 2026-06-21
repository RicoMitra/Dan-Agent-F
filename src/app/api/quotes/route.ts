import { NextRequest, NextResponse } from "next/server";

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        symbol?: string;
        currency?: string;
        exchangeName?: string;
        regularMarketPrice?: number;
        previousClose?: number;
        regularMarketVolume?: number;
        regularMarketDayLow?: number;
        regularMarketDayHigh?: number;
        regularMarketTime?: number;
        exchangeTimezoneName?: string;
      };
    }>;
    error?: { description?: string } | null;
  };
};

const normalizeTicker = (ticker: string) => {
  const cleaned = ticker.trim().toUpperCase();
  if (!/^[A-Z0-9.-]{1,15}$/.test(cleaned)) return null;
  return cleaned.endsWith(".JK") ? cleaned : `${cleaned}.JK`;
};

export async function GET(request: NextRequest) {
  const requested = (request.nextUrl.searchParams.get("symbols") ?? "")
    .split(",")
    .map((ticker) => ticker.trim())
    .filter(Boolean)
    .slice(0, 20);

  const symbols = [...new Set(requested.map(normalizeTicker).filter(Boolean))] as string[];
  if (symbols.length === 0) {
    return NextResponse.json({ quotes: [], errors: ["No valid IDX tickers provided."] }, { status: 400 });
  }

  const results = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const response = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`,
          {
            cache: "no-store",
            headers: { "User-Agent": "Mozilla/5.0 PortfolioDashboard/1.0" },
          },
        );
        if (!response.ok) throw new Error(`Yahoo returned ${response.status}`);

        const payload = (await response.json()) as YahooChartResponse;
        const meta = payload.chart?.result?.[0]?.meta;
        if (!meta || !Number.isFinite(meta.regularMarketPrice)) {
          throw new Error(payload.chart?.error?.description ?? "Price unavailable");
        }

        return {
          ok: true as const,
          quote: {
            ticker: symbol.replace(/\.JK$/, ""),
            symbol: meta.symbol ?? symbol,
            price: meta.regularMarketPrice as number,
            previousClose: Number.isFinite(meta.previousClose) ? meta.previousClose : null,
            volume: Number.isFinite(meta.regularMarketVolume) ? meta.regularMarketVolume : null,
            dayLow: Number.isFinite(meta.regularMarketDayLow) ? meta.regularMarketDayLow : null,
            dayHigh: Number.isFinite(meta.regularMarketDayHigh) ? meta.regularMarketDayHigh : null,
            currency: meta.currency ?? "IDR",
            exchange: meta.exchangeName ?? "JKT",
            marketTime: meta.regularMarketTime
              ? new Date(meta.regularMarketTime * 1000).toISOString()
              : null,
            timezone: meta.exchangeTimezoneName ?? "Asia/Jakarta",
            source: "Yahoo Finance",
            mayBeDelayed: true,
          },
        };
      } catch (error) {
        return {
          ok: false as const,
          error: `${symbol}: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    }),
  );

  const quotes = results.flatMap((result) => (result.ok ? [result.quote] : []));
  const errors = results.flatMap((result) => (result.ok ? [] : [result.error]));

  return NextResponse.json(
    { quotes, errors, fetchedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
