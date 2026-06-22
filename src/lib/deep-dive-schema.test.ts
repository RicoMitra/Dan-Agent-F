import { describe, expect, it } from "vitest";
import {
  advisorResponseSchema,
  agentResponseSchema,
  deepDiveRequestSchema,
  specialistOutputSchema,
} from "@/lib/deep-dive-schema";

const request = {
  consent: true,
  turnstileToken: "verified-token",
  portfolio: {
    version: 2,
    cashBalance: 1_000_000,
    watchlist: ["TLKM"],
    holdings: [
      {
        id: "bbca",
        ticker: "BBCA",
        lots: 1,
        averageBuyPrice: 8_000,
        currentPrice: 9_000,
        priceSource: "manual",
        marketTimestamp: null,
      },
    ],
  },
};

describe("deep dive request schema", () => {
  it("accepts the approved private snapshot", () => {
    expect(deepDiveRequestSchema.parse(request).portfolio.version).toBe(2);
  });

  it("always requires explicit consent but permits the route to evaluate an empty dev token", () => {
    expect(deepDiveRequestSchema.safeParse({ ...request, consent: false }).success).toBe(false);
    expect(deepDiveRequestSchema.safeParse({ ...request, turnstileToken: "" }).success).toBe(true);
  });

  it("rejects more than 20 combined unique symbols", () => {
    const tooMany = {
      ...request,
      portfolio: {
        ...request.portfolio,
        watchlist: Array.from({ length: 10 }, (_, index) => `W${index}`),
        holdings: Array.from({ length: 11 }, (_, index) => ({
          ...request.portfolio.holdings[0],
          id: `h${index}`,
          ticker: `H${index}`,
        })),
      },
    };
    expect(deepDiveRequestSchema.safeParse(tooMany).success).toBe(false);
  });
});

describe("specialist output schema", () => {
  it("rejects confidence outside zero to one", () => {
    expect(
      specialistOutputSchema.safeParse({
        headline: "Evidence summary",
        summary: "Based on current evidence.",
        confidence: 2,
        evidenceIds: [],
      }).success,
    ).toBe(false);
  });

  it("bounds the sentiment score and non-trading Advisor checklist", () => {
    expect(
      agentResponseSchema.safeParse({
        headline: "Sentiment",
        summary: "Current headline evidence.",
        confidence: 0.7,
        evidenceIds: ["gdelt-BBCA"],
        sentimentScore: 101,
      }).success,
    ).toBe(false);
    expect(
      advisorResponseSchema.parse({
        headline: "Daily evidence",
        summary: "Evidence synthesis.",
        confidence: 0.7,
        evidenceIds: [],
        narrative: "Current evidence is mixed.",
        checklist: ["Verify source timestamps."],
      }).checklist,
    ).toHaveLength(1);
  });
});
