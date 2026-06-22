"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BrainCircuit, CheckCircle2, Database, LoaderCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DeepDiveReportView } from "@/components/deep-dive-report";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isReportStale } from "@/lib/intelligence";
import { downloadRenderedDeepDiveReport } from "@/lib/report-dom";
import { clearLatestReport, loadLatestReport, saveLatestReport } from "@/lib/storage";
import type { AgentSection, DeepDiveReport, DeepDiveStreamEvent } from "@/lib/types";
import { usePortfolio } from "@/lib/use-portfolio";

const agents: Array<{ id: AgentSection["agent"]; label: string }> = [
  { id: "market", label: "Market Agent" },
  { id: "news", label: "News Agent" },
  { id: "sentiment", label: "Sentiment Agent" },
  { id: "portfolio", label: "Portfolio Agent" },
  { id: "risk", label: "Risk Agent" },
  { id: "advisor", label: "Advisor Agent" },
];

export function DeepDiveDashboard({ developmentMode = process.env.NODE_ENV === "development" }: { developmentMode?: boolean }) {
  const { portfolio } = usePortfolio();
  const [report, setReport] = useState<DeepDiveReport | null>(null);
  const [consent, setConsent] = useState(false);
  const [token, setToken] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  const unprotectedDevRun = developmentMode && !siteKey;

  useEffect(() => { queueMicrotask(() => setReport(loadLatestReport())); }, []);
  const stale = useMemo(() => report ? isReportStale(report.portfolioFingerprint, portfolio) : false, [portfolio, report]);
  const symbolCount = new Set([...portfolio.holdings.map((item) => item.ticker), ...portfolio.watchlist]).size;
  const handleToken = useCallback((value: string) => setToken(value), []);

  const run = async () => {
    if (!consent || (!token && !unprotectedDevRun) || running) return;
    setRunning(true);
    setError(null);
    setProgress({ data: "started" });
    try {
      const response = await fetch("/api/deep-dive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: true, turnstileToken: token, portfolio }),
      });
      if (!response.ok) {
        const payload = await response.json() as { error?: string };
        throw new Error(payload.error ?? "Deep Dive request failed.");
      }
      if (!response.body) throw new Error("Streaming response is unavailable.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as DeepDiveStreamEvent;
          if (event.type === "progress") setProgress((current) => ({ ...current, [event.agent]: event.status }));
          if (event.type === "report") { setReport(event.report); saveLatestReport(event.report); }
          if (event.type === "error") throw new Error(event.message);
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Deep Dive failed.");
    } finally {
      setRunning(false);
      setToken("");
    }
  };

  const download = async () => {
    if (!report || exporting) return;
    const root = document.getElementById("deep-dive-report");
    if (!root) return;
    setExporting(true);
    setError(null);
    try {
      await downloadRenderedDeepDiveReport(root, report);
    } catch {
      setError("The PDF could not be prepared in this browser. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppShell active="analysis">
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9b7b3f]">Intelligence workspace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Deep Dive Analysis</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#747168]">Current evidence from market data, recent linked news, deterministic portfolio metrics, and six bounded AI roles. This is not a forecast or investment advice.</p>
      </section>

      <section className="mt-7 grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#f3efe5] text-[#9b7b3f]"><BrainCircuit className="size-5" /></span><div><h2 className="text-lg font-semibold">DanA-F Engine</h2><p className="text-xs text-[#817d74]">Five specialists in parallel, then Advisor synthesis</p></div></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{agents.map((agent) => <div key={agent.id} className="flex min-h-14 items-center gap-3 rounded-xl border border-[#e5e0d6] bg-[#faf9f5] p-3">{progress[agent.id] === "complete" ? <CheckCircle2 className="size-4 text-[#4f744b]" /> : progress[agent.id] === "started" ? <LoaderCircle className="size-4 animate-spin text-[#9b7b3f]" /> : <span className="size-2 rounded-full bg-[#c9c3b7]" />}<span className="text-xs font-semibold">{agent.label}</span></div>)}</div>
          {running && <div role="status" className="mt-5 rounded-2xl border border-[#e5ddca] bg-[#faf6ec] p-4 text-xs text-[#6f6040]">The engine is collecting evidence and synthesizing bounded agent outputs. This can take up to one minute.</div>}
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold">Run controls</h2>
          <p className="mt-2 text-xs leading-5 text-[#817d74]">Your snapshot is sent only after consent. It includes tickers, lots, average/current prices, cash, and watchlist. The server does not store it.</p>
          <div className="mt-4 rounded-xl bg-[#faf9f5] p-3 text-xs"><p className="flex justify-between"><span>Holdings</span><b>{portfolio.holdings.length}</b></p><p className="mt-2 flex justify-between"><span>Unique symbols</span><b>{symbolCount}/20</b></p></div>
          <label className="mt-4 flex min-h-11 cursor-pointer items-start gap-3 text-xs leading-5"><input type="checkbox" className="mt-1 size-4 accent-[#8b7138]" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I consent to sending this snapshot to the configured market, news, and OpenAI services for this run.</span></label>
          <div className="mt-4">{siteKey ? <TurnstileWidget siteKey={siteKey} onToken={handleToken} /> : unprotectedDevRun ? <p role="status" className="rounded-xl border border-[#ead8ae] bg-[#fffaf0] p-3 text-xs font-medium leading-5 text-[#775f2f]">Unprotected dev run: Turnstile verification is skipped only in local development.</p> : <p role="status" className="rounded-xl border border-[#ead8ae] bg-[#fffaf0] p-3 text-xs text-[#775f2f]">Live Deep Dive is disabled until the Turnstile site key is configured.</p>}</div>
          <Button className="mt-4 w-full" disabled={!consent || (!token && !unprotectedDevRun) || running || portfolio.holdings.length === 0} onClick={() => void run()}>{running ? <LoaderCircle className="size-4 animate-spin" /> : <BrainCircuit className="size-4" />} Run DanA-F Engine</Button>
          {error && <p role="alert" className="mt-3 text-xs leading-5 text-[#9a4b43]">{error}</p>}
        </Card>
      </section>

      {report ? (
        <DeepDiveReportView report={report} stale={stale} exporting={exporting} onDownload={() => void download()} onDelete={() => { clearLatestReport(); setReport(null); }} />
      ) : (
        <Card className="mt-5 border-dashed bg-[#f8f5ee] p-9 text-center">
          <Database className="mx-auto size-7 text-[#9b7b3f]" />
          <h2 className="mt-3 text-lg font-semibold">Your intelligence report will appear here</h2>
          <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-[#817d74]">Review the snapshot, provide consent, and run the engine. Monitoring remains fully available without a Deep Dive.</p>
        </Card>
      )}
    </AppShell>
  );
}
