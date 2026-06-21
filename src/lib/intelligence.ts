import type { EvidenceBalance, Holding, PortfolioState } from "@/lib/types";

export const VOLATILITY_TRIGGER_PERCENTAGE = 2.5;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export function calculateDailyImpact(
  holdings: Holding[],
  quotes: Record<string, { currentPrice: number; previousClose: number | null }>,
) {
  const rows = holdings.map((holding) => {
    const quote = quotes[holding.ticker.trim().toUpperCase()];
    if (!quote || quote.previousClose === null || quote.previousClose <= 0) {
      return { ticker: holding.ticker, impact: null, dailyChangePercentage: null };
    }
    const shares = holding.lots * 100;
    return {
      ticker: holding.ticker,
      impact: shares * (quote.currentPrice - quote.previousClose),
      dailyChangePercentage:
        ((quote.currentPrice - quote.previousClose) / quote.previousClose) * 100,
    };
  });
  const available = rows.filter((row) => row.impact !== null);
  return {
    holdings: rows,
    totalImpact: available.reduce((total, row) => total + (row.impact ?? 0), 0),
    coverage: holdings.length > 0 ? available.length / holdings.length : 0,
  };
}

export function calculateRealizedVolatility(returns: number[]) {
  const finite = returns.filter(Number.isFinite);
  if (finite.length < 2) {
    return { dailyPercentage: null, triggered: false, observations: finite.length };
  }
  const mean = finite.reduce((sum, value) => sum + value, 0) / finite.length;
  const variance =
    finite.reduce((sum, value) => sum + (value - mean) ** 2, 0) / finite.length;
  const dailyPercentage = Math.sqrt(variance);
  return {
    dailyPercentage,
    triggered: dailyPercentage >= VOLATILITY_TRIGGER_PERCENTAGE,
    observations: finite.length,
  };
}

export function calculateEvidenceBalance(input: {
  momentumScore: number;
  sentimentScore: number | null;
  positiveBreadth: number;
  volatilityDailyPercentage: number | null;
}): EvidenceBalance {
  const momentum = clamp(input.momentumScore, -100, 100);
  const sentiment = clamp(input.sentimentScore ?? 0, -100, 100);
  const breadth = clamp(input.positiveBreadth, 0, 1) * 200 - 100;
  const volatility =
    input.volatilityDailyPercentage === null
      ? 0
      : clamp(100 - input.volatilityDailyPercentage * 40, -100, 100);
  const score = Math.round(
    momentum * 0.4 + sentiment * 0.3 + breadth * 0.2 + volatility * 0.1,
  );
  return {
    score,
    label: score > 20 ? "bullish" : score < -20 ? "bearish" : "mixed",
    components: { momentum, sentiment, breadth, volatility },
  };
}

export function aggregateSentiment(
  items: Array<{
    score: number;
    confidence: number;
    relevance: number;
    ageHours: number;
  }>,
) {
  if (items.length === 0) {
    return { status: "insufficient" as const, score: null, confidence: 0, articleCount: 0 };
  }
  const weighted = items.map((item) => {
    const recency = clamp(1 - item.ageHours / 72, 0.1, 1);
    const weight = clamp(item.confidence, 0, 1) * clamp(item.relevance, 0, 1) * recency;
    return { ...item, weight };
  });
  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) {
    return { status: "insufficient" as const, score: null, confidence: 0, articleCount: items.length };
  }
  return {
    status: "available" as const,
    score: Math.round(
      weighted.reduce((sum, item) => sum + clamp(item.score, -100, 100) * item.weight, 0) /
        totalWeight,
    ),
    confidence:
      weighted.reduce((sum, item) => sum + clamp(item.confidence, 0, 1) * item.weight, 0) /
      totalWeight,
    articleCount: items.length,
  };
}

export function createPortfolioFingerprint(state: PortfolioState) {
  const canonical = {
    cashBalance: state.cashBalance,
    holdings: [...state.holdings]
      .map((holding) => ({
        ticker: holding.ticker,
        lots: holding.lots,
        averageBuyPrice: holding.averageBuyPrice,
        currentPrice: holding.currentPrice,
        priceSource: holding.priceSource,
        marketTimestamp: holding.marketTimestamp,
      }))
      .sort((a, b) => a.ticker.localeCompare(b.ticker)),
    watchlist: [...state.watchlist].map((ticker) => ticker.toUpperCase()).sort(),
  };
  const text = JSON.stringify(canonical);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function isReportStale(fingerprint: string, state: PortfolioState) {
  return fingerprint !== createPortfolioFingerprint(state);
}
