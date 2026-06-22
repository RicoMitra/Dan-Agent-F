import {
  calculateDailyImpact,
  calculateEvidenceBalance,
  calculateRealizedVolatility,
  createPortfolioFingerprint,
} from "@/lib/intelligence";
import { calculateHealthScore, calculatePortfolio, CONCENTRATION_THRESHOLD } from "@/lib/portfolio";
import type { SpecialistOutput } from "@/lib/deep-dive-schema";
import type {
  AgentSection,
  DeepDiveReport,
  PortfolioState,
  SourceRecord,
} from "@/lib/types";

export type SpecialistAgent = Exclude<AgentSection["agent"], "advisor">;

export type NewsArticle = {
  id: string;
  ticker: string;
  title: string;
  url: string;
  domain: string;
  publishedAt: string;
};

export type EngineEvidence = {
  quotes: Record<string, { currentPrice: number; previousClose: number | null }>;
  portfolioReturns: number[];
  momentumScore: number;
  positiveBreadth: number;
  articles: NewsArticle[];
  sources: SourceRecord[];
};

export type SpecialistResult = SpecialistOutput & { sentimentScore?: number | null };
export type AdvisorResult = SpecialistOutput & { narrative: string; checklist: string[] };

export type EngineProgress = {
  agent: SpecialistAgent | "advisor" | "data";
  status: "started" | "complete";
  message: string;
};

export type EngineDependencies = {
  fetchEvidence: (portfolio: PortfolioState) => Promise<EngineEvidence>;
  runSpecialist: (
    agent: SpecialistAgent,
    context: { portfolio: PortfolioState; evidence: EngineEvidence },
  ) => Promise<SpecialistResult>;
  runAdvisor: (context: {
    portfolio: PortfolioState;
    evidence: EngineEvidence;
    sections: AgentSection[];
    deterministic: Record<string, unknown>;
  }) => Promise<AdvisorResult>;
  now: () => Date;
  createId: () => string;
};

const specialists: SpecialistAgent[] = ["market", "news", "sentiment", "portfolio", "risk"];

const unavailableSection = (agent: SpecialistAgent): AgentSection => ({
  agent,
  headline: `${agent[0].toUpperCase()}${agent.slice(1)} evidence unavailable`,
  summary: "This specialist output is unavailable. No neutral result was assumed.",
  confidence: 0,
  evidenceIds: [],
});

export async function runDeepDive(
  portfolio: PortfolioState,
  dependencies: EngineDependencies,
  onProgress: (event: EngineProgress) => void,
  security: { unprotectedDevRun: boolean } = { unprotectedDevRun: false },
): Promise<DeepDiveReport> {
  onProgress({ agent: "data", status: "started", message: "Collecting current evidence" });
  const evidence = await dependencies.fetchEvidence(portfolio);
  onProgress({ agent: "data", status: "complete", message: "Evidence normalized" });

  let partial = evidence.sources.some((source) => source.status !== "available");
  let sentimentScore: number | null = null;
  const specialistSections = await Promise.all(
    specialists.map(async (agent) => {
      onProgress({ agent, status: "started", message: `${agent} agent started` });
      try {
        const result = await dependencies.runSpecialist(agent, { portfolio, evidence });
        if (agent === "sentiment") sentimentScore = result.sentimentScore ?? null;
        const section: AgentSection = { agent, ...result };
        onProgress({ agent, status: "complete", message: `${agent} evidence ready` });
        return section;
      } catch {
        partial = true;
        onProgress({ agent, status: "complete", message: `${agent} evidence unavailable` });
        return unavailableSection(agent);
      }
    }),
  );

  const summary = calculatePortfolio(portfolio);
  const daily = calculateDailyImpact(portfolio.holdings, evidence.quotes);
  const volatility = calculateRealizedVolatility(evidence.portfolioReturns.slice(-20));
  const balance = calculateEvidenceBalance({
    momentumScore: evidence.momentumScore,
    sentimentScore,
    positiveBreadth: evidence.positiveBreadth,
    volatilityDailyPercentage: volatility.dailyPercentage,
  });
  const health = calculateHealthScore(summary);
  const priorPortfolioValue = summary.totalPortfolioValue - daily.totalImpact;
  const dailyImpactPercentage =
    priorPortfolioValue > 0 ? (daily.totalImpact / priorPortfolioValue) * 100 : 0;
  const evidenceComponents = [
    ["Price momentum", balance.components.momentum],
    ["News sentiment", balance.components.sentiment],
    ["Positive breadth", balance.components.breadth],
    ["Inverse volatility", balance.components.volatility],
  ] as const;
  const bullishEvidence = evidenceComponents
    .filter(([, score]) => score > 0)
    .map(([label, score]) => `${label} contributes +${score.toFixed(1)} to current evidence.`);
  const bearishEvidence = evidenceComponents
    .filter(([, score]) => score < 0)
    .map(([label, score]) => `${label} contributes ${score.toFixed(1)} to current evidence.`);
  if (bullishEvidence.length === 0) bullishEvidence.push("No supportive component is currently available.");
  if (bearishEvidence.length === 0) bearishEvidence.push("No cautionary component is currently available.");
  const largest = summary.holdings.reduce(
    (current, holding) =>
      holding.allocationPercentage > current.allocationPercentage ? holding : current,
    { ticker: "None", allocationPercentage: 0 },
  );
  const risks = [
    {
      id: "concentration",
      title: "Single-holding concentration",
      detail: `${largest.ticker} represents ${largest.allocationPercentage.toFixed(1)}%; the educational trigger is ${CONCENTRATION_THRESHOLD}%.`,
      triggered: largest.allocationPercentage >= CONCENTRATION_THRESHOLD,
    },
    {
      id: "volatility",
      title: "20-day realized volatility",
      detail:
        volatility.dailyPercentage === null
          ? "Insufficient synchronized return observations."
          : `${volatility.dailyPercentage.toFixed(2)}% daily; the educational trigger is 2.50%.`,
      triggered: volatility.triggered,
    },
  ];
  const deterministic = {
    portfolioValue: summary.totalPortfolioValue,
    investedCapital: summary.totalInvestedCapital,
    floatingProfitLoss: summary.floatingProfitLoss,
    cashBalance: summary.cashBalance,
    returnPercentage: summary.returnPercentage,
    dailyImpact: daily.totalImpact,
    dailyImpactPercentage,
    dailyImpactCoverage: daily.coverage,
    health,
    volatility,
    evidenceBalance: balance,
    risks,
  };

  onProgress({ agent: "advisor", status: "started", message: "Advisor synthesis started" });
  let advisor: AdvisorResult;
  try {
    advisor = await dependencies.runAdvisor({
      portfolio,
      evidence,
      sections: specialistSections,
      deterministic,
    });
  } catch {
    partial = true;
    advisor = {
      headline: "Deterministic evidence available",
      summary: "Advisor synthesis is unavailable; the report retains calculated evidence only.",
      confidence: 0,
      evidenceIds: [],
      narrative: "Review the calculated impact, risk triggers, and source coverage directly.",
      checklist: ["Refresh unavailable sources before using this report for further review."],
    };
  }
  onProgress({ agent: "advisor", status: "complete", message: "Advisor synthesis ready" });

  const generatedAt = dependencies.now().toISOString();
  return {
    version: 2,
    id: dependencies.createId(),
    generatedAt,
    portfolioFingerprint: createPortfolioFingerprint(portfolio),
    status: partial ? "partial" : "complete",
    executivePulse: advisor.headline,
    portfolioValue: summary.totalPortfolioValue,
    investedCapital: summary.totalInvestedCapital,
    floatingProfitLoss: summary.floatingProfitLoss,
    cashBalance: summary.cashBalance,
    returnPercentage: summary.returnPercentage,
    dailyImpact: daily.totalImpact,
    dailyImpactPercentage,
    dailyImpactCoverage: daily.coverage,
    health,
    security,
    sentiment: {
      status: sentimentScore === null ? "insufficient" : "available",
      score: sentimentScore,
      confidence:
        specialistSections.find((section) => section.agent === "sentiment")?.confidence ?? 0,
      articleCount: evidence.articles.length,
    },
    volatility,
    evidenceBalance: balance,
    bullishEvidence,
    bearishEvidence,
    risks,
    holdingImpacts: daily.holdings.map((holding) => ({
      ticker: holding.ticker,
      impact: holding.impact,
      dailyChangePercentage: holding.dailyChangePercentage,
      coverage: holding.impact === null ? "unavailable" : "available",
    })),
    watchlistComparison: [
      ...portfolio.holdings.map((holding) => ({
        ticker: holding.ticker,
        status: "holding" as const,
        observation: "Included in portfolio impact and risk calculations.",
      })),
      ...portfolio.watchlist
        .filter(
          (ticker) =>
            !portfolio.holdings.some(
              (holding) => holding.ticker.toUpperCase() === ticker.toUpperCase(),
            ),
        )
        .map((ticker) => ({
          ticker,
          status: "watchlist" as const,
          observation: "Market evidence only; excluded from portfolio value and impact.",
        })),
    ],
    sections: [
      ...specialistSections,
      { agent: "advisor", ...advisor },
    ],
    narrative: advisor.narrative,
    checklist: advisor.checklist.slice(0, 6),
    sources: evidence.sources,
    methodology: [
      "Daily impact equals shares multiplied by current price minus previous close.",
      "Volatility is the standard deviation of up to 20 synchronized daily portfolio returns.",
      "Evidence balance weights momentum 40%, sentiment 30%, breadth 20%, and inverse volatility 10%.",
    ],
    disclaimers: [
      "Educational decision support only; not investment advice or a price forecast.",
      "Yahoo Finance and GDELT are best-effort sources and may be delayed or incomplete.",
    ],
  };
}
