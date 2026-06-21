# Dan-Agent-F Decision Log

Add new entries instead of silently changing accepted decisions. Mark replaced decisions as superseded.

## D-001: Separate Upgrade Project

- **Status:** Accepted
- **Decision:** Build Dan-Agent-F in public repository `RicoMitra/Dan-Agent-F` with independent Git history while reusing proven code from the earlier portfolio dashboard.
- **Consequence:** Exclude old Git history, build output, exports, and Vercel metadata.

## D-002: Two Workspaces

- **Status:** Accepted
- **Decision:** Use `/` for Monitoring and `/analysis` for Deep Dive with shared local state.
- **Consequence:** Monitoring stays immediately useful and Deep Dive has sufficient space for evidence-dense output.

## D-003: Local-First Without Accounts

- **Status:** Accepted
- **Decision:** Store portfolio and latest report in versioned localStorage; do not add authentication or a portfolio database.
- **Consequence:** Deep Dive requires explicit consent because its minimum validated snapshot leaves the device.

## D-004: Best-Effort Yahoo Market Data

- **Status:** Accepted
- **Decision:** Use server-side Yahoo chart data for IDX quotes and OHLCV with manual fallback.
- **Consequence:** Display source, market timestamp, delay warning, partial failures, and no SLA claim.

## D-005: Market Snapshot, Not Order Book

- **Status:** Accepted
- **Decision:** Replace the proposed order-book view with price, change, previous close, volume, and day range.
- **Consequence:** Never infer depth, bids, asks, or historical order-book behavior from OHLCV.

## D-006: GDELT News Metadata

- **Status:** Accepted
- **Decision:** Use GDELT for article metadata and source links from the previous 72 hours.
- **Consequence:** Do not scrape or store full article text; missing coverage is insufficient data.

## D-007: Five Specialists Plus Advisor

- **Status:** Accepted
- **Decision:** Run Market, News, Sentiment, Portfolio, and Risk agents in parallel, then an Advisor synthesis using OpenAI structured outputs.
- **Consequence:** Deterministic inputs remain authoritative; all agent outputs require schema validation and evidence references.

## D-008: Balanced Model Profile

- **Status:** Accepted
- **Decision:** Configure a current OpenAI mini model for specialists and a current primary model for Advisor through environment variables.
- **Consequence:** Verify model identifiers against official documentation before production configuration; use `store: false`.

## D-009: Deterministic Risk and Evidence Policy

- **Status:** Accepted
- **Decision:** Trigger volatility risk at 2.5% 20-day daily volatility. Weight evidence balance as momentum 40%, sentiment 30%, breadth 20%, inverse volatility 10%; classify above 20 bullish, below -20 bearish, otherwise mixed.
- **Consequence:** Display inputs, thresholds, coverage, and non-predictive wording.

## D-010: Public Endpoint Protection

- **Status:** Accepted
- **Decision:** Require Cloudflare Turnstile and Upstash limits of 3/hour and 10/day per hashed IP.
- **Consequence:** Upstash stores only expiring operational counters, never portfolio data.

## D-011: Latest Report Only

- **Status:** Accepted
- **Decision:** Persist one latest Deep Dive report locally and mark it stale after input changes.
- **Consequence:** Provide report deletion and do not add report history.

## D-012: Private Client-Side PDF

- **Status:** Accepted
- **Decision:** Generate the premium report in the browser with jsPDF and AutoTable.
- **Consequence:** Include methodology, sources, timestamps, coverage, and disclaimer; render a deterministic sample for visual QA.

## D-013: English Private-Banking Interface

- **Status:** Accepted
- **Decision:** Use English copy, IDX/IDR semantics, IBM Plex Sans, cream/off-white surfaces, charcoal, and restrained gold.
- **Consequence:** Meet documented accessibility and responsive requirements without trading-terminal styling.
