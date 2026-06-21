# Dan-Agent-F v1 Design

Dan-Agent-F upgrades the existing local-first IDX portfolio dashboard into two separate workspaces: deterministic Monitoring and an explicit AI Deep Dive. It preserves manual fallback and private browser persistence while adding transparent evidence, bounded multi-agent analysis, operational abuse protection, and a research-style client-side PDF.

The canonical requirements, formulas, data providers, privacy boundaries, architecture, visual system, and release gates are defined in `AGENTS.md`, `PROJECT_CONTEXT.md`, and `DECISIONS.md`. Those files are normative; this document records the approved product shape and links the implementation to repository governance.

Monitoring remains useful without credentials. Deep Dive validates consent, verification, input limits, and data coverage; fetches best-effort evidence; computes authoritative metrics; runs five bounded specialists in parallel; and lets Advisor synthesize only validated outputs. Partial failures remain visible and never become invented neutral evidence.

The interface uses a shared private-banking shell. Monitoring prioritizes totals and editable facts. Deep Dive prioritizes executive status, impact, risk, outlook evidence, holding-level detail, news links, source transparency, and non-trading actions. The PDF mirrors that hierarchy and carries methodology and disclaimers.

Acceptance requires deterministic automated tests with external APIs mocked, a production build, responsive browser checks, a rendered PDF inspection, protected endpoint verification, green GitHub CI, and a smoke-tested Vercel deployment.
