# Dan-Agent-F

Dan-Agent-F (Daniel Agent Finance) is a local-first IDX portfolio monitoring and AI intelligence dashboard for beginner Indonesian investors. It combines deterministic financial calculations with an explicit, evidence-backed Deep Dive powered by five specialist roles and an Advisor synthesis.

Dan-Agent-F is read-only decision support. It does not predict prices, execute trades, or provide buy/sell recommendations.

## Workspaces

- **Monitoring** - editable holdings, cash, watchlist, portfolio totals, allocation, health factors, scenarios, Yahoo price refresh, Market Snapshot, and private PDF export.
- **Deep Dive Analysis** - market/news/sentiment/portfolio/risk specialists, Advisor synthesis, daily holding impact, volatility trigger, evidence balance, risk factors, source ledger, non-trading checklist, stale-report detection, and premium research PDF.

## Architecture

```text
validated browser input -> versioned localStorage -> pure portfolio calculations
                                              |
explicit consent + Turnstile (or labelled dev override) -> server route -> Yahoo + GDELT evidence
                                              |
                              five parallel specialists -> Advisor
                                              |
                         validated NDJSON report -> local v2 report + WYSIWYG PDF
```

Portfolio data and the latest report stay in the current browser. Quote refresh sends ticker symbols only. Deep Dive sends the validated snapshot only after per-run consent. The server does not persist portfolio payloads or reports.

## Stack

Next.js App Router, strict TypeScript, Tailwind CSS, shadcn-compatible primitives, Recharts, OpenAI Responses API, Zod, Cloudflare Turnstile, Upstash Redis rate limiting, html2canvas, jsPDF, Vitest, Testing Library, Playwright, GitHub Actions, and Vercel.

## Local Setup

Requires Node.js 22.13+ and pnpm 11.5.3.

```bash
pnpm install
copy .env.example .env.local
pnpm dev
```

Monitoring works without credentials. Deep Dive development mode is active when `NODE_ENV=development` or `DEV_MODE=true`. In that mode, Turnstile and rate limiting are bypassed, consent remains mandatory, and every result is visibly marked `Unprotected dev run`. If OpenAI is absent, the engine returns an honest deterministic partial report with AI sections marked unavailable; configured OpenAI credentials activate the normal multi-agent pipeline. Without development mode, production requires every provider/security value and fails closed.

```dotenv
DEV_MODE=false
OPENAI_API_KEY=
OPENAI_SPECIALIST_MODEL=
OPENAI_ADVISOR_MODEL=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Never commit `.env.local` or paste credentials into issues, logs, prompts, or reports.

## Financial and Intelligence Semantics

- One IDX lot equals 100 shares; currency is IDR.
- Cash affects total value and allocation but not stock return.
- Daily impact equals shares multiplied by current price minus previous close.
- A 2.5% 20-day daily volatility value triggers the educational volatility flag.
- Evidence balance weights momentum 40%, news sentiment 30%, positive breadth 20%, and inverse volatility 10%.
- Above 20 is bullish evidence, below -20 bearish evidence, otherwise mixed. This describes current evidence and is not a forecast.

Yahoo Finance and GDELT are best-effort sources and may be delayed, incomplete, rate-limited, or unavailable. Manual prices remain available. Market Snapshot is not an order book.

## Quality Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm exec playwright install chromium
pnpm test:e2e
pnpm build
pnpm report:sample
```

Generated PDF samples are written to `output/pdf/` and must be rendered to PNG for visual inspection before release.

## Privacy and Abuse Controls

- No authentication or portfolio database
- Versioned local state and explicit reset/delete controls
- OpenAI requests use `store: false`
- Turnstile verification on every production run
- Hashed-IP Upstash limits in production: 3 runs/hour and 10/day
- Development-only missing-key bypass with visible `Unprotected dev run` labelling; consent is never bypassed
- Missing OpenAI credentials in development produce a labelled deterministic partial fallback, never fabricated AI output
- WYSIWYG Deep Dive PDF capture runs entirely in the browser
- No portfolio, prompt, report, token, or API-key logging

Provider retention remains governed by the owner's provider account policies.

## Deployment

The production deployment is configured through the GitHub-connected Vercel project `dan-agent-f`. Normal production should leave `DEV_MODE` unset/false and configure all provider/security values. An explicit `DEV_MODE=true` deployment is unprotected, visibly labelled, and intended only for development or owner-approved diagnostics. Verify `/`, `/analysis`, `/api/quotes`, and `/api/deep-dive` before promotion.

Production URL: [dan-agent-f.vercel.app](https://dan-agent-f.vercel.app)

## Governance

- [`AGENTS.md`](./AGENTS.md) - rules, formulas, privacy, and decision authority
- [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) - product and architecture
- [`DECISIONS.md`](./DECISIONS.md) - approved decisions and consequences

## Disclaimer

Educational decision support only. Dan-Agent-F does not provide investment advice, forecast prices, recommend transactions, or execute trades.
