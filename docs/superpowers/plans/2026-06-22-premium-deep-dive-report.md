# Premium Deep Dive Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a cream-based Deep Dive report whose in-page view and client-side PDF share the same visual structure, while allowing clearly labelled unprotected runs only in local development when Turnstile is unconfigured.

**Architecture:** Upgrade the persisted report to schema v2 with deterministic portfolio totals, health, impact percentage, and evidence columns. Render the report through a focused React component and capture its marked DOM sections into A4 pages client-side. Centralize security-mode resolution on the server and expose only a public boolean to the UI; production remains fail-closed.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, React, Zod, jsPDF, html2canvas, Vitest, Testing Library, Playwright, Cloudflare Turnstile.

## Global Constraints

- Cream/off-white/charcoal/muted-gold only; no dark neon or blue-led redesign.
- Report financial values are deterministic and cannot be changed by agents.
- Consent remains mandatory in every environment.
- Turnstile bypass is valid only when `NODE_ENV === "development"` and keys are missing.
- Production must fail closed when Turnstile is unavailable or invalid.
- PDF generation remains private and client-side; no portfolio/report payload is sent to an export service.
- No dense table in the Deep Dive UI or Deep Dive PDF.

---

### Task 1: Security mode and development fallback

**Files:**
- Modify: `src/lib/server/security.ts`
- Modify: `src/app/api/deep-dive/route.ts`
- Modify: `src/lib/deep-dive-schema.ts`
- Modify: `src/components/deep-dive-dashboard.tsx`
- Test: `src/lib/server/security.test.ts`
- Test: `src/lib/deep-dive-schema.test.ts`
- Test: `src/components/deep-dive-dashboard.test.tsx`

**Interfaces:**
- Produce `resolveDeepDiveSecurityMode(environment): { enabled: boolean; unprotectedDevRun: boolean; reason?: string }`.
- Permit an empty Turnstile token in the request schema; the route, not the schema, decides whether it is legal.
- Include `security: { unprotectedDevRun: boolean }` in report metadata/stream output.

- [ ] Write tests proving development with missing keys bypasses Turnstile and reports `unprotectedDevRun: true`.
- [ ] Run focused tests and confirm they fail for the missing behavior.
- [ ] Implement mode resolution and route branching without deleting verification or rate-limit logic.
- [ ] Render an amber `Unprotected dev run` status and enable the button after consent when public dev mode is active.
- [ ] Run focused security/schema/component tests until green.

### Task 2: Deep Dive report v2 deterministic contract

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/server/engine.ts`
- Modify: `src/lib/storage.ts`
- Modify: `src/lib/server/engine.test.ts`
- Modify: `src/lib/storage.test.ts`
- Modify: `scripts/generate-sample-report.ts`

**Interfaces:**
- `DeepDiveReport.version` becomes `2`.
- Add `investedCapital`, `floatingProfitLoss`, `cashBalance`, `returnPercentage`, `dailyImpactPercentage`, `health`, `bullishEvidence`, `bearishEvidence`, and security metadata.
- `REPORT_STORAGE_KEY` becomes `dan-agent-f:latest-report:v2`.

- [ ] Add failing engine/storage tests for all v2 fields and v1 rejection.
- [ ] Confirm focused tests fail for the absent v2 contract.
- [ ] Populate totals with `calculatePortfolio`, health with `calculateHealthScore`, impact percent against prior value, and evidence lists from deterministic balance components.
- [ ] Update storage guards and every typed fixture.
- [ ] Run focused engine/storage tests until green.

### Task 3: Shared premium report UI

**Files:**
- Create: `src/components/deep-dive-report.tsx`
- Modify: `src/components/deep-dive-dashboard.tsx`
- Modify: `src/components/deep-dive-dashboard.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- `DeepDiveReportView({ report, stale, exporting, onDownload, onDelete })` renders the complete visible report.
- Root uses `id="deep-dive-report"`; coherent page groups use `data-pdf-section`; controls use `data-pdf-exclude`.

- [ ] Add failing component assertions for all required headings, metric values, download action, empty state, development warning, and absence of a table.
- [ ] Confirm the component test fails for the current dashboard.
- [ ] Build the report header, four metric cards, sentiment gauge, impact list, risk cards, narrative, checklist, evidence columns, and source ledger.
- [ ] Add calm loading/empty states and responsive/reduced-motion/accessibility polish.
- [ ] Run component tests until green.

### Task 4: WYSIWYG DOM PDF and deterministic sample PDF

**Files:**
- Create: `src/lib/report-dom.ts`
- Create: `src/lib/report-dom.test.ts`
- Modify: `src/lib/report.ts`
- Modify: `src/lib/report.test.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- `downloadRenderedDeepDiveReport(root: HTMLElement, report: DeepDiveReport): Promise<void>` captures `[data-pdf-section]` elements with html2canvas and paginates them into jsPDF.
- `planPdfSections()` remains a pure, unit-tested pagination helper.
- `buildDeepDiveReport(report)` remains deterministic for sample/CI but mirrors the same card/list section order and uses no Deep Dive autoTable.

- [ ] Add failing pagination/PDF tests.
- [ ] Install `html2canvas` using pnpm.
- [ ] Implement DOM capture with A4 margins, cream background, excluded controls, and section-aware page breaks.
- [ ] Redesign deterministic PDF helpers with cards and lists rather than tables.
- [ ] Connect the persistent top-right button and expose an exporting state.
- [ ] Run report tests until green.

### Task 5: E2E, documentation, visual QA, and release

**Files:**
- Modify: `tests/e2e/workspaces.spec.ts`
- Modify: `PROJECT_CONTEXT.md`
- Modify: `DECISIONS.md`
- Modify: `README.md`
- Modify: `.env.example` if a public development flag is required (prefer automatic NODE_ENV detection).

- [ ] Add a deterministic v2 localStorage report fixture and verify desktop/mobile report structure and PDF-button visibility.
- [ ] Document v2 report presentation, client-side WYSIWYG export, and dev-only unprotected security mode.
- [ ] Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm build`, and `pnpm report:sample`.
- [ ] Render every deterministic PDF page to PNG with Poppler and inspect visual defects.
- [ ] Run browser smoke tests at desktop and mobile widths.
- [ ] Inspect diff for secrets, personal portfolio data, build output, and unrelated changes.
- [ ] Commit, push `codex/premium-deep-dive-report`, open a draft PR, require green CI/Vercel preview, merge, and smoke-test production.

## Self-review

- Every requested UI/PDF section maps to Task 3 or 4.
- The security addition is fail-open only in development and fail-closed in production.
- Consent and privacy boundaries remain unchanged.
- The plan contains no deferred placeholders and all public interfaces are named.
