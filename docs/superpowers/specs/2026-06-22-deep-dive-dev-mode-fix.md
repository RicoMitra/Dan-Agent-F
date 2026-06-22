# Deep Dive Development Mode Fix

## Problem

Deep Dive mode is split across a server route and a client component. The client currently derives development state from its production-built bundle, while the server separately checks `NODE_ENV`. Vercel builds with `NODE_ENV=production`, so the Run button remains blocked. The deployed Vercel project currently has no environment variables, which also prevents the route from reaching the engine.

## Approved behavior

- Development mode is active when `NODE_ENV=development` or `DEV_MODE=true`.
- A server-side resolver is authoritative. `/analysis` passes the resolved boolean to the client component.
- In development mode, Turnstile is always bypassed and the UI does not render or wait for its widget.
- Consent and non-empty holdings remain required.
- The UI and report display `Unprotected dev run`.
- When OpenAI is configured, the existing multi-agent pipeline runs normally.
- When OpenAI is absent in development mode, the engine still runs deterministic market/portfolio calculations and returns an honest partial report with unavailable AI sections. It never fabricates AI analysis.
- Without development mode, production remains fail-closed and requires OpenAI, Turnstile, and Upstash configuration.

## Data flow

`process.env -> isDeepDiveDevelopmentMode() -> analysis server page + API config -> client run gate + server verification gate -> runDeepDive()`

The server remains authoritative; changing client state cannot bypass a protected route.

## Verification

- Unit tests cover `DEV_MODE=true`, normal production failure, and development fallback configuration.
- Component tests prove consent enables the button in dev mode even when a Turnstile site key exists.
- Component tests stream a report with an empty Turnstile token and confirm it renders.
- E2E covers development-mode consent and report rendering.
- Production build, GitHub CI, Vercel preview, and deployed route smoke tests must pass.

## Privacy and security

No credential value is committed, logged, or copied. `DEV_MODE=true` is an explicit unprotected deployment setting and is visibly labelled. Removing the flag restores fail-closed production behavior.
