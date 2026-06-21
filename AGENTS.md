# Dan-Agent-F Project Governance

## Owner

Owned by **Rico Majesty Daniel Mitra** ([@RicoMitra](https://github.com/RicoMitra)).

## Purpose

Dan-Agent-F (Daniel Agent Finance) is a read-only, AI-powered portfolio intelligence dashboard for beginner Indonesian stock investors. It combines a private monitoring workspace with an on-demand Deep Dive Analysis that explains market, news, sentiment, portfolio, and risk evidence without executing trades or giving personalized buy/sell instructions.

## Product Goals

- Make an IDX portfolio understandable at a glance using accurate IDR calculations.
- Keep manual portfolio monitoring useful even when external services fail.
- Turn current market and news evidence into cited, structured, non-advisory intelligence.
- Show confidence, coverage, methodology, timestamps, and source limitations.
- Produce a premium private PDF research report from the visible analysis.

## Non-Goals

- Trade execution, brokerage connectivity, price prediction, or market timing
- Personalized buy/sell/rebalancing recommendations
- Tax, dividend, fee, corporate-action, or multi-currency accounting
- Authentication, cloud portfolio storage, or cross-device synchronization
- Claiming order-book depth from OHLCV data

## Data, Privacy, and Access

- Portfolio holdings, watchlist, cash, calculations, and the latest report are stored in versioned browser `localStorage`.
- No account or portfolio database is used. The app provides explicit reset and report-delete actions.
- Quote refresh sends ticker symbols only. Deep Dive sends the validated portfolio snapshot only after explicit per-run consent.
- Deep Dive requests pass through a server route protected by Cloudflare Turnstile and Upstash Redis rate limits of 3 runs/hour and 10 runs/day per hashed IP.
- Server logs must exclude portfolio payloads, prompts, generated analysis, Turnstile tokens, and API keys.
- OpenAI requests use `store: false`; provider retention remains governed by the owner's OpenAI account policy and must be disclosed.
- Never commit credentials, personal exports, `.env.local`, Vercel metadata, or production portfolio data.

## Approved Data Sources

- Manual browser input is the portfolio source of truth.
- Yahoo Finance chart data is approved for best-effort IDX quotes and OHLCV. Normalize symbols to `.JK`, retain manual fallback, and label data as possibly delayed and without an SLA.
- GDELT DOC API is approved for recent article metadata and source links. Do not scrape or redistribute full article text.
- OpenAI is approved for structured specialist explanations and Advisor synthesis. Deterministic calculations remain authoritative.
- Market Snapshot may show price, change, previous close, volume, and day range. It must never be called an order book.

## Financial and Intelligence Semantics

- Currency is IDR and one IDX lot equals 100 shares.
- `shares = lots * 100`
- `investedCapital = shares * averageBuyPrice`
- `currentValue = shares * currentPrice`
- `floatingProfitLoss = currentValue - investedCapital`
- `dailyHoldingImpact = shares * (currentPrice - previousClose)` when previous close is available.
- Cash contributes to total value and allocation but not stock return.
- Portfolio volatility is the standard deviation of the latest 20 synchronized daily portfolio returns. `>= 2.5%` per day triggers the educational volatility-risk flag.
- Evidence balance ranges from -100 to 100: momentum 40%, aggregated news sentiment 30%, positive holding breadth 20%, inverse volatility 10%. Above 20 is bullish evidence, below -20 bearish evidence, otherwise mixed.
- A holding at or above 40% of total value is high concentration. Cash at or above 30% is high exposure; below 5% is low exposure.
- Missing evidence is `unavailable` or `insufficient`, never silently neutral.
- AI may explain deterministic metrics but must not replace, alter, or fabricate them.

## Application Workflow

1. Capture and validate holdings, cash, and watchlist.
2. Normalize into typed versioned domain state.
3. Calculate portfolio metrics with framework-independent pure functions.
4. Fetch best-effort market/news data through bounded server adapters.
5. Run five specialist analyses in parallel, then Advisor synthesis.
6. Validate all agent outputs against explicit schemas.
7. Present evidence, confidence, coverage, timestamps, and source ledger.
8. Export the visible report client-side and verify its rendered pages.

## Required Stack

- Next.js App Router, React, and strict TypeScript
- Tailwind CSS and shadcn/ui-compatible local primitives
- Recharts
- OpenAI JavaScript SDK and Zod
- Cloudflare Turnstile and Upstash Redis rate limiting
- jsPDF and jsPDF-AutoTable
- Vitest, Testing Library, Playwright, GitHub Actions, and Vercel
- pnpm only; follow the committed lockfile

## Architecture Rules

- Keep one-way flow: validated input -> domain state -> pure calculations -> external evidence -> structured analysis -> presentation.
- React components must not independently recalculate financial metrics.
- Keep provider adapters, schemas, orchestration, storage, reporting, and UI components isolated.
- Use explicit TypeScript types; never use `any`.
- Bound ticker count to 20 combined holdings and watchlist symbols; watchlist itself is limited to 10.
- Treat partial external failures as normal. Preserve successful records and expose per-source errors.
- Never expose secrets or provider SDK calls to client bundles.

## Product and Design Direction

- English UI with IDX/IDR context.
- Calm private-banking visual system: cream/off-white, charcoal, gray, restrained gold, IBM Plex Sans.
- Use clear financial hierarchy, generous whitespace, 18-24px radii, subtle shadows, and 150-250ms motion.
- No neon themes, dense trading-terminal styling, emoji icons, or color-only meaning.
- Maintain 4.5:1 text contrast, visible focus, 44px touch targets, textual chart equivalents, `aria-live` status, reduced-motion support, and responsive layouts at 375/768/1024/1440px.

## Knowledge Sources

Read before product or architecture changes:

1. `AGENTS.md` - governance and decision authority
2. `PROJECT_CONTEXT.md` - product model, architecture, and delivery state
3. `DECISIONS.md` - approved decisions and consequences

Keep all three synchronized when scope, financial semantics, privacy, providers, architecture, or user-visible behavior changes.

## Decision-Making Policy

Agents may make reversible implementation decisions that follow these documents and established patterns.

Owner approval is required for changes to financial formulas, evidence weights or thresholds, data retention, authentication, providers, major dependencies, deployment strategy, visual direction, or behavior that could be interpreted as financial advice.

When requirements are incomplete, prioritize:

1. Calculation correctness, privacy, and non-advisory positioning
2. Explicit owner instructions and repository governance
3. Deterministic evidence over model-generated claims
4. Existing reusable patterns
5. The smallest reversible solution

## Quality Gates

- Tests cover normal, empty, zero, loss-making, stale, malformed, partial-provider, refusal, timeout, and boundary cases.
- External APIs are mocked in automated checks.
- Run lint, type checking, unit/component tests, Playwright, and production build before release.
- Render the deterministic PDF sample to PNG and visually inspect every page.
- Smoke-test monitoring, Deep Dive, API protection, responsive behavior, and the production URL.
- Failed calculation tests, schema validation, type checks, or production builds block release.
