import { z } from "zod";

const tickerSchema = z.string().trim().min(1).max(15).regex(/^[A-Za-z0-9.-]+$/).transform((value) => value.toUpperCase());

export const holdingInputSchema = z.object({
  id: z.string().min(1).max(100),
  ticker: tickerSchema,
  lots: z.number().finite().nonnegative(),
  averageBuyPrice: z.number().finite().nonnegative(),
  currentPrice: z.number().finite().nonnegative(),
  priceSource: z.enum(["manual", "yahoo"]),
  marketTimestamp: z.string().datetime().nullable(),
});

export const portfolioStateSchema = z
  .object({
    version: z.literal(2),
    holdings: z.array(holdingInputSchema).max(20),
    cashBalance: z.number().finite().nonnegative(),
    watchlist: z.array(tickerSchema).max(10),
  })
  .superRefine((portfolio, context) => {
    const symbols = new Set([
      ...portfolio.holdings.map((holding) => holding.ticker),
      ...portfolio.watchlist,
    ]);
    if (symbols.size > 20) {
      context.addIssue({
        code: "custom",
        message: "Holdings and watchlist may contain at most 20 unique symbols.",
      });
    }
  });

export const deepDiveRequestSchema = z.object({
  consent: z.literal(true),
  turnstileToken: z.string().min(1).max(4096),
  portfolio: portfolioStateSchema,
});

export const specialistOutputSchema = z.object({
  headline: z.string().min(1).max(140),
  summary: z.string().min(1).max(1200),
  confidence: z.number().min(0).max(1),
  evidenceIds: z.array(z.string().min(1)).max(20),
});

export const agentResponseSchema = specialistOutputSchema.extend({
  sentimentScore: z.number().min(-100).max(100).nullable(),
});

export const advisorResponseSchema = specialistOutputSchema.extend({
  narrative: z.string().min(1).max(1800),
  checklist: z
    .array(z.string().min(1).max(220))
    .min(1)
    .max(6)
    .refine(
      (items) => items.every((item) => !/\b(buy|sell|purchase|dispose|trade)\b/i.test(item)),
      "Checklist must contain non-trading actions only.",
    ),
});

export type DeepDiveRequest = z.infer<typeof deepDiveRequestSchema>;
export type SpecialistOutput = z.infer<typeof specialistOutputSchema>;
export type AgentResponse = z.infer<typeof agentResponseSchema>;
export type AdvisorResponse = z.infer<typeof advisorResponseSchema>;
