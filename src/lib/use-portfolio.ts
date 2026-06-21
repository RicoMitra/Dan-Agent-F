"use client";

import { useEffect, useState } from "react";
import { clearPortfolio, loadPortfolio, savePortfolio } from "@/lib/storage";
import type { Holding, PortfolioState } from "@/lib/types";

export const DEMO_PORTFOLIO: PortfolioState = {
  version: 2,
  cashBalance: 18_500_000,
  watchlist: ["ANTM", "ICBP"],
  holdings: [
    { id: "bbca-demo", ticker: "BBCA", lots: 24, averageBuyPrice: 8_750, currentPrice: 9_650, priceSource: "manual", marketTimestamp: null },
    { id: "tlkm-demo", ticker: "TLKM", lots: 40, averageBuyPrice: 3_120, currentPrice: 3_010, priceSource: "manual", marketTimestamp: null },
    { id: "asii-demo", ticker: "ASII", lots: 20, averageBuyPrice: 5_225, currentPrice: 5_575, priceSource: "manual", marketTimestamp: null },
  ],
};

export const EMPTY_PORTFOLIO: PortfolioState = { version: 2, cashBalance: 0, watchlist: [], holdings: [] };

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioState>(DEMO_PORTFOLIO);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    queueMicrotask(() => {
      setPortfolio(loadPortfolio() ?? DEMO_PORTFOLIO);
      setHydrated(true);
    });
  }, []);
  useEffect(() => { if (hydrated) savePortfolio(portfolio); }, [hydrated, portfolio]);
  const addHolding = () => {
    if (portfolio.holdings.length >= 20) return;
    const holding: Holding = { id: crypto.randomUUID(), ticker: "", lots: 0, averageBuyPrice: 0, currentPrice: 0, priceSource: "manual", marketTimestamp: null };
    setPortfolio((current) => ({ ...current, holdings: [...current.holdings, holding] }));
  };
  const reset = () => { clearPortfolio(); setPortfolio(EMPTY_PORTFOLIO); };
  return { portfolio, setPortfolio, hydrated, addHolding, reset };
}
