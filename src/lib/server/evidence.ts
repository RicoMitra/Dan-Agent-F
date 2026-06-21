import type { PortfolioState } from "@/lib/types";
import { fetchMarketBundle } from "@/lib/server/market-data";
import { fetchNewsBundle } from "@/lib/server/news-data";

export async function fetchEngineEvidence(portfolio: PortfolioState) {
  const symbols = [...new Set([
    ...portfolio.holdings.map((holding) => holding.ticker.trim().toUpperCase()),
    ...portfolio.watchlist.map((ticker) => ticker.trim().toUpperCase()),
  ])];
  const [market, news] = await Promise.all([
    fetchMarketBundle(portfolio.holdings, symbols),
    fetchNewsBundle(symbols),
  ]);
  return {
    quotes: market.quotes,
    portfolioReturns: market.portfolioReturns,
    momentumScore: market.momentumScore,
    positiveBreadth: market.positiveBreadth,
    articles: news.articles,
    sources: [...market.sources, ...news.sources],
  };
}
