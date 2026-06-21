"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, RefreshCw, Telescope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { MarketSignal } from "@/lib/types";
import { cn } from "@/lib/utils";

type MarketWatchResponse = {
  signals: MarketSignal[];
  generatedAt: string;
  methodology: string;
  source: string;
  disclaimer: string;
};

export function DailyMarketWatch() {
  const [data, setData] = useState<MarketWatchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSignals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/market-watch", { cache: "no-store" });
      if (!response.ok) throw new Error("Market watch is temporarily unavailable.");
      const payload = (await response.json()) as MarketWatchResponse;
      if (payload.signals.length === 0) throw new Error("No market signals are available today.");
      setData(payload);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Market watch is unavailable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void loadSignals());
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <Card className="mt-5 overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[#ece8df] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-[#f3efe5] text-[#9b7b3f]"><Telescope className="size-4.5" /></div>
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a08548]">Daily market watch</p><h2 className="mt-1 text-lg font-semibold tracking-[-0.025em]">Three transparent IDX signals</h2></div>
        </div>
        <Button variant="secondary" disabled={loading} onClick={loadSignals}><RefreshCw className={cn("size-4", loading && "animate-spin")} /> Refresh watch</Button>
      </div>

      <div className="p-5 sm:p-6">
        {error && <div className="rounded-2xl border border-[#eed7d0] bg-[#fdf7f5] p-4 text-sm text-[#8c4c45]">{error}</div>}
        {loading && !data && <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl bg-[#f2efe8]" />)}</div>}
        {data && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              {data.signals.map((signal, index) => (
                <div key={signal.ticker} className="rounded-2xl border border-[#e7e2d8] bg-[#faf9f5] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div><p className="text-[10px] uppercase tracking-[0.14em] text-[#98948b]">Signal {index + 1} · {signal.sector}</p><p className="mt-1 text-xl font-semibold">{signal.ticker}</p></div>
                    <span className={cn("flex items-center rounded-full px-2 py-1 text-xs font-semibold", signal.momentum20Percentage >= 0 ? "bg-[#edf4ec] text-[#4c7048]" : "bg-[#f8ece8] text-[#9a4b43]")}>{signal.momentum20Percentage >= 0 ? <ArrowUpRight className="mr-0.5 size-3.5" /> : <ArrowDownRight className="mr-0.5 size-3.5" />}{signal.momentum20Percentage >= 0 ? "+" : ""}{signal.momentum20Percentage.toFixed(1)}%</span>
                  </div>
                  <p className="mt-4 text-sm font-semibold">{formatCurrency(signal.price)}</p>
                  <p className="mt-2 text-xs font-medium text-[#5e5b54]">{signal.signal}</p>
                  <p className="mt-1 text-[11px] leading-5 text-[#858178]">{signal.explanation}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-1 text-[10px] leading-4 text-[#969189] sm:flex-row sm:justify-between"><p>{data.methodology}</p><p>{data.source} · May be delayed</p></div>
            <p className="mt-1 text-[10px] font-medium text-[#8c665e]">{data.disclaimer}</p>
          </>
        )}
      </div>
    </Card>
  );
}
