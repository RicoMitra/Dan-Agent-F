"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { PortfolioState } from "@/lib/types";

type Quote = { ticker: string; price: number; previousClose: number | null; volume: number | null; dayLow: number | null; dayHigh: number | null; marketTime: string | null };

export function MarketSnapshot({ portfolio, onChange }: { portfolio: PortfolioState; onChange: (state: PortfolioState) => void }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [status, setStatus] = useState("Manual prices are active until you refresh.");
  const [loading, setLoading] = useState(false);
  const refresh = async () => {
    const symbols = [...new Set([...portfolio.holdings.map((item) => item.ticker), ...portfolio.watchlist])].filter(Boolean);
    if (symbols.length === 0) { setStatus("Add a holding or watchlist ticker first."); return; }
    setLoading(true);
    try {
      const response = await fetch(`/api/quotes?symbols=${encodeURIComponent(symbols.join(","))}`);
      const payload = await response.json() as { quotes: Quote[]; errors: string[] };
      if (!response.ok) throw new Error(payload.errors?.[0] ?? "Market data unavailable.");
      setQuotes(payload.quotes);
      const byTicker = new Map(payload.quotes.map((quote) => [quote.ticker, quote]));
      onChange({ ...portfolio, holdings: portfolio.holdings.map((holding) => { const quote = byTicker.get(holding.ticker.toUpperCase()); return quote ? { ...holding, currentPrice: quote.price, priceSource: "yahoo" as const, marketTimestamp: quote.marketTime } : holding; }) });
      setStatus(`${payload.quotes.length} updated; ${payload.errors.length} unavailable. Yahoo Finance may be delayed.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Market data unavailable; manual prices retained."); }
    finally { setLoading(false); }
  };
  return <Card className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Market snapshot</h2><p className="mt-1 text-xs leading-5 text-[#817d74]">Price, change, volume and day range. This is not an order book.</p></div><Button variant="secondary" disabled={loading} onClick={() => void refresh()}><RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} /> Refresh</Button></div><p className="mt-3 text-[10px] leading-4 text-[#817d74]" aria-live="polite">{status}</p><div className="mt-4 space-y-2">{quotes.slice(0, 6).map((quote) => { const change = quote.previousClose ? ((quote.price / quote.previousClose) - 1) * 100 : null; return <div key={quote.ticker} className="grid grid-cols-[1fr_auto] gap-3 rounded-xl bg-[#faf9f5] p-3 text-xs"><div><b>{quote.ticker}</b><p className="mt-1 text-[10px] text-[#817d74]">Vol {quote.volume?.toLocaleString("en-ID") ?? "Unavailable"} · Range {quote.dayLow ? formatCurrency(quote.dayLow) : "-"}–{quote.dayHigh ? formatCurrency(quote.dayHigh) : "-"}</p></div><div className="text-right"><b>{formatCurrency(quote.price)}</b><p className={change !== null && change < 0 ? "mt-1 text-[#9a4b43]" : "mt-1 text-[#4f744b]"}>{change === null ? "Unavailable" : `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`}</p></div></div>; })}</div></Card>;
}
