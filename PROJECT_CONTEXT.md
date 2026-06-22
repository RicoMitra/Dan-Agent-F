# Dan-Agent-F Project Context

## Product Summary

Dan-Agent-F is a two-workspace portfolio intelligence product for beginner Indonesian investors. Monitoring remains private and deterministic. Deep Dive Analysis is an explicit, rate-limited action that combines current market data, recent news metadata, deterministic portfolio metrics, five specialist AI analyses, and an Advisor synthesis.

The product is decision support, not financial advice, a trading bot, or a price predictor.

## Primary User and Success Criteria

The primary user manages a personal IDX portfolio and wants a fast, trustworthy explanation without professional trading software.

Success means the user can:

- Add, edit, and remove holdings and cash; maintain a separate watchlist.
- Reconcile totals with holding-level values and understand units.
- Refresh best-effort prices without losing manual fallback.
- Understand allocation, performance, daily impact, concentration, volatility, and evidence coverage.
- Run Deep Dive with informed consent and follow agent progress.
- Inspect news links, source timestamps, methodology, confidence, and partial failures.
- Export a polished report without server-side report storage.

## Workspaces

### Monitoring (`/`)

Summary KPIs, holdings editor, allocation, sector exposure, manual watchlist, Market Snapshot, scenarios, and deterministic notes. The primary CTA opens Deep Dive Analysis with a data-freshness summary.

### Deep Dive (`/analysis`)

Consent and verification precede execution. The version-2 report presents a health-score header, four deterministic portfolio metrics, sentiment and confidence, daily impact and a holding list, risk triggers, an emphasized narrative, a non-trading checklist, bullish-versus-bearish evidence, methodology, and a source ledger. It uses the same calm cream-based hierarchy in the page and PDF, without a dense report table.

## Domain State

`PortfolioState` version 2 stores holdings, cash, and watchlist locally. A holding records its current price source and optional market timestamp. The latest `DeepDiveReport` version 2 is stored separately with an input fingerprint and is marked stale whenever the portfolio or watchlist changes. Incompatible version-1 reports are ignored safely.

The combined unique symbol limit is 20; the watchlist limit is 10.

## Engine Architecture

1. Validate request, consent, Turnstile token, symbol limits, and rate limits.
2. Fetch Yahoo quote/OHLCV and GDELT article metadata with timeouts and partial-result handling.
3. Calculate deterministic portfolio, impact, momentum, breadth, volatility, and evidence-balance models.
4. Run Market, News, Sentiment, Portfolio, and Risk agents in parallel with structured schemas.
5. Pass validated specialist results and deterministic metrics to the Advisor.
6. Stream status events and a final validated `DeepDiveReport` as NDJSON.

Specialists explain only their bounded evidence. Advisor produces narrative and non-trading checklist but cannot overwrite deterministic numbers.

## Privacy and Operational Controls

No authentication or portfolio database is used. Turnstile reduces automated abuse; Upstash stores expiring hashed-IP counters only. OpenAI, GDELT, and Yahoo requests run server-side. The report is kept locally, and the server does not log private payloads.

Production fails closed unless both Turnstile keys and Upstash credentials are configured. Local `NODE_ENV=development` may bypass a missing Turnstile pair and missing Upstash credentials so the engine can be exercised; consent remains mandatory and both the UI and generated report label the result as an `Unprotected dev run`.

The visible Deep Dive DOM is the source for user-triggered WYSIWYG export. Report sections are captured and paginated locally with html2canvas and jsPDF. No portfolio or report data is sent to a PDF service. A deterministic programmatic sample mirrors the same section order for CI and visual QA.

Required production credentials are configured directly in Vercel. The application must present a disabled, actionable state when they are absent.

## Delivery Sequence

1. Establish governance and new repository history.
2. Upgrade the monitoring state and modular UI.
3. Implement deterministic intelligence calculations and provider adapters test-first.
4. Implement protected streaming orchestration and Deep Dive UI.
5. Extend the private PDF and visually verify a deterministic report.
6. Complete CI, browser QA, GitHub review, Vercel configuration, and production smoke tests.
