import { describe, expect, it, vi } from "vitest";
import { createOpenAIAgents } from "@/lib/server/agents";
import type { EngineEvidence } from "@/lib/server/engine";
import type { PortfolioState } from "@/lib/types";

const context = {
  portfolio: { version: 2, holdings: [], cashBalance: 0, watchlist: [] } satisfies PortfolioState,
  evidence: {
    quotes: {},
    portfolioReturns: [],
    momentumScore: 0,
    positiveBreadth: 0.5,
    articles: [],
    sources: [],
  } satisfies EngineEvidence,
};

describe("OpenAI agent adapter", () => {
  it("uses structured Responses with store disabled", async () => {
    const create = vi.fn().mockResolvedValue({
      output_text: JSON.stringify({
        headline: "Market evidence",
        summary: "No current market coverage is available.",
        confidence: 0,
        evidenceIds: [],
        sentimentScore: null,
      }),
    });
    const agents = createOpenAIAgents({ responses: { create } }, "mini-model", "primary-model");

    await agents.runSpecialist("market", context);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ model: "mini-model", store: false }),
    );
  });

  it("rejects malformed model output", async () => {
    const create = vi.fn().mockResolvedValue({ output_text: "not-json" });
    const agents = createOpenAIAgents({ responses: { create } }, "mini-model", "primary-model");

    await expect(agents.runSpecialist("risk", context)).rejects.toThrow();
  });
});
