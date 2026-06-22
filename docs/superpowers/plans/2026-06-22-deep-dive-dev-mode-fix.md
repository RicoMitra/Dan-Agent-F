# Deep Dive Development Mode Fix Plan

1. Add failing security tests for `DEV_MODE=true`, server-derived UI mode, and missing-OpenAI development fallback.
2. Add a failing component test proving a dev run submits an empty Turnstile token and renders the streamed report.
3. Centralize development-mode resolution in server security configuration.
4. Pass the server-resolved mode from `/analysis` to `DeepDiveDashboard` and always bypass the widget in that mode.
5. Let the route use unavailable-agent fallbacks only when OpenAI is absent in explicit development mode.
6. Record the dev-only fallback and production fail-closed policy in `.env.example`, README, project context, and decisions.
7. Run lint, typecheck, unit/component tests, E2E, build, and browser/API smoke tests.
8. Set `DEV_MODE=true` in Vercel, push a branch, open PR, wait for green CI/preview, merge, and verify production.
