export type Holding = {
  id: string;
  ticker: string;
  lots: number;
  averageBuyPrice: number;
  currentPrice: number;
  priceSource: "manual" | "yahoo";
  marketTimestamp: string | null;
};

export type PortfolioState = {
  version: 2;
  holdings: Holding[];
  cashBalance: number;
  watchlist: string[];
};

export type HoldingMetrics = Holding & {
  shares: number;
  investedCapital: number;
  currentValue: number;
  floatingProfitLoss: number;
  returnPercentage: number;
  allocationPercentage: number;
};

export type PortfolioSummary = {
  holdings: HoldingMetrics[];
  cashBalance: number;
  totalInvestedCapital: number;
  totalHoldingsValue: number;
  totalPortfolioValue: number;
  floatingProfitLoss: number;
  returnPercentage: number;
  cashAllocationPercentage: number;
};

export type PortfolioInsight = {
  id: string;
  title: string;
  description: string;
  tone: "neutral" | "positive" | "attention";
};

export type HealthFactor = {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  detail: string;
};

export type PortfolioHealth = {
  score: number;
  maxScore: 10;
  label: "Strong" | "Balanced" | "Needs attention";
  factors: HealthFactor[];
};

export type SectorAllocation = {
  sector: string;
  value: number;
  percentage: number;
};

export type MarketSignal = {
  ticker: string;
  sector: string;
  price: number;
  dailyChangePercentage: number;
  momentum20Percentage: number;
  volatility20Percentage: number;
  signal: "Positive momentum" | "Neutral momentum" | "Negative momentum";
  explanation: string;
  marketTime: string | null;
};

export type QuoteSnapshot = {
  ticker: string;
  currentPrice: number;
  previousClose: number | null;
  volume: number | null;
  dayLow: number | null;
  dayHigh: number | null;
  currency: string;
  exchange: string;
  marketTimestamp: string | null;
  source: "Yahoo Finance";
  mayBeDelayed: true;
};

export type SourceRecord = {
  id: string;
  provider: "Yahoo Finance" | "GDELT" | "OpenAI";
  label: string;
  url: string | null;
  fetchedAt: string;
  marketTimestamp: string | null;
  status: "available" | "partial" | "unavailable";
  detail: string;
};

export type AgentSection = {
  agent: "market" | "news" | "sentiment" | "portfolio" | "risk" | "advisor";
  headline: string;
  summary: string;
  confidence: number;
  evidenceIds: string[];
};

export type EvidenceBalance = {
  score: number;
  label: "bullish" | "mixed" | "bearish";
  components: {
    momentum: number;
    sentiment: number;
    breadth: number;
    volatility: number;
  };
};

export type HoldingImpact = {
  ticker: string;
  impact: number | null;
  dailyChangePercentage: number | null;
  coverage: "available" | "unavailable";
};

export type DeepDiveReport = {
  version: 1;
  id: string;
  generatedAt: string;
  portfolioFingerprint: string;
  status: "complete" | "partial";
  executivePulse: string;
  portfolioValue: number;
  dailyImpact: number;
  dailyImpactCoverage: number;
  sentiment: {
    status: "available" | "insufficient";
    score: number | null;
    confidence: number;
    articleCount: number;
  };
  volatility: {
    dailyPercentage: number | null;
    triggered: boolean;
    observations: number;
  };
  evidenceBalance: EvidenceBalance;
  risks: Array<{ id: string; title: string; detail: string; triggered: boolean }>;
  holdingImpacts: HoldingImpact[];
  watchlistComparison: Array<{ ticker: string; status: "holding" | "watchlist"; observation: string }>;
  sections: AgentSection[];
  narrative: string;
  checklist: string[];
  sources: SourceRecord[];
  methodology: string[];
  disclaimers: string[];
};

export type DeepDiveStreamEvent =
  | { type: "progress"; agent: AgentSection["agent"] | "data"; status: "started" | "complete"; message: string }
  | { type: "report"; report: DeepDiveReport }
  | { type: "error"; message: string; recoverable: boolean };
