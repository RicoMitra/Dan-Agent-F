"use client";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Download,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercentage } from "@/lib/format";
import type { DeepDiveReport } from "@/lib/types";

type Props = {
  report: DeepDiveReport;
  stale: boolean;
  exporting?: boolean;
  onDownload: () => void;
  onDelete: () => void;
};

const card = "rounded-[22px] border border-[#e3ddd0] bg-[#fffdf8] shadow-[0_12px_35px_rgba(47,43,35,0.055)]";

function SectionTitle({ eyebrow, title, detail }: { eyebrow: string; title: string; detail?: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#98783c]">{eyebrow}</p>
      <h3 className="mt-2 text-xl font-semibold tracking-[-0.035em] text-[#272622] sm:text-2xl">{title}</h3>
      {detail && <p className="mt-2 max-w-2xl text-xs leading-5 text-[#777269]">{detail}</p>}
    </div>
  );
}

function MetricCard({ label, value, detail, tone = "neutral" }: { label: string; value: string; detail: string; tone?: "neutral" | "positive" | "negative" }) {
  const valueColor = tone === "positive" ? "text-[#456341]" : tone === "negative" ? "text-[#8a4c45]" : "text-[#272622]";
  return (
    <article className={`${card} min-h-36 p-5 sm:p-6`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777269]">{label}</p>
      <p className={`mt-5 text-2xl font-semibold tracking-[-0.045em] ${valueColor}`}>{value}</p>
      <p className="mt-2 text-[11px] leading-5 text-[#8a857c]">{detail}</p>
    </article>
  );
}

export function DeepDiveReportView({ report, stale, exporting = false, onDownload, onDelete }: Props) {
  const sentiment = report.sentiment.score;
  const sentimentPosition = sentiment === null ? 50 : Math.max(0, Math.min(100, (sentiment + 100) / 2));
  const impactTone = report.dailyImpact > 0 ? "positive" : report.dailyImpact < 0 ? "negative" : "neutral";

  return (
    <section id="deep-dive-report" className="mt-8 space-y-5 rounded-[28px] bg-[#f4f0e7] p-2 sm:p-4" aria-label="Deep Dive report">
      {stale && (
        <div data-pdf-exclude className="flex gap-3 rounded-[20px] border border-[#e4cf9d] bg-[#fff8e8] p-4 text-sm text-[#675329]">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          <p>This report is stale because portfolio or watchlist inputs changed. Run a new analysis before relying on comparisons.</p>
        </div>
      )}

      <header data-pdf-section className={`${card} relative overflow-hidden p-6 sm:p-8`}>
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#8d7137] via-[#d4b873] to-[#8d7137]" />
        <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#98783c]">Daniel Agent Finance / Intelligence brief</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.055em] text-[#22211e] sm:text-4xl">DanA-F Deep Dive Report</h2>
            <p className="mt-3 text-sm leading-6 text-[#6f6b63]">{report.executivePulse}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-[#7a766d]">
              <span className="rounded-full border border-[#ded8cc] bg-[#faf7f0] px-3 py-1.5">{new Date(report.generatedAt).toLocaleString("en-ID")}</span>
              <span className="rounded-full border border-[#ded8cc] bg-[#faf7f0] px-3 py-1.5">{report.status} coverage</span>
              {report.security.unprotectedDevRun && <span className="rounded-full border border-[#e1c987] bg-[#fff6dd] px-3 py-1.5 font-semibold text-[#745c26]">Unprotected dev run</span>}
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row lg:flex-col lg:items-end">
            <div className="flex items-center gap-4 rounded-[18px] border border-[#e5ddcd] bg-[#f9f5eb] p-4">
              <div className="grid size-16 place-items-center rounded-full border-[5px] border-[#c6a65e] bg-[#fffdf8] text-xl font-semibold text-[#302e29]">{report.health.score}<span className="sr-only"> out of 10</span></div>
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#777269]">Portfolio Health Score</p><p className="mt-1 font-semibold text-[#3a3832]">{report.health.label} · {report.health.score}/{report.health.maxScore}</p></div>
            </div>
            <div data-pdf-exclude className="flex gap-2">
              <Button onClick={onDownload} disabled={exporting} className="min-w-48 bg-[#292823]">
                <Download className="size-4" /> {exporting ? "Preparing PDF..." : "Download Report (PDF)"}
              </Button>
              <Button variant="danger" size="icon" onClick={onDelete} aria-label="Delete local report"><Trash2 className="size-4" /></Button>
            </div>
          </div>
        </div>
      </header>

      <div data-pdf-section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Portfolio" value={formatCurrency(report.portfolioValue)} detail="Holdings plus cash at the report timestamp" />
        <MetricCard label="Invested Capital" value={formatCurrency(report.investedCapital)} detail="Documented cost basis across holdings" />
        <MetricCard label="Floating P/L" value={formatCurrency(report.floatingProfitLoss)} detail={`${formatPercentage(report.returnPercentage)} versus invested capital`} tone={report.floatingProfitLoss >= 0 ? "positive" : "negative"} />
        <MetricCard label="Cash Balance" value={formatCurrency(report.cashBalance)} detail="Excluded from stock return calculations" />
      </div>

      <div data-pdf-section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <article className={`${card} p-6 sm:p-7`}>
          <SectionTitle eyebrow="Market pulse" title="Market & Sentiment Overview" detail="Headline evidence is scored from -100 to +100. Missing evidence is shown as insufficient, never neutral." />
          <div className="mt-8 flex items-end justify-between gap-5">
            <div><p className="text-4xl font-semibold tracking-[-0.05em]">{sentiment === null ? "Insufficient" : `${sentiment > 0 ? "+" : ""}${sentiment}`}</p><p className="mt-2 text-xs text-[#7a766d]">Sentiment score · {report.sentiment.articleCount} linked items</p></div>
            <div className="text-right"><p className="text-2xl font-semibold">{Math.round(report.sentiment.confidence * 100)}%</p><p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#7a766d]">Confidence</p></div>
          </div>
          <div className="mt-7" aria-label={`Sentiment score ${sentiment ?? "insufficient"}`}>
            <div className="relative h-3 rounded-full bg-gradient-to-r from-[#c9978f] via-[#ded8cb] to-[#91aa89]">
              {sentiment !== null && <span className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[#fffdf8] bg-[#2f2e29] shadow" style={{ left: `${sentimentPosition}%` }} />}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-[#8b867d]"><span>-100 caution</span><span>0 mixed</span><span>+100 supportive</span></div>
          </div>
          <div className="mt-7"><div className="flex justify-between text-[11px]"><span>Evidence confidence</span><b>{Math.round(report.sentiment.confidence * 100)}%</b></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#ebe6dc]"><div className="h-full rounded-full bg-[#b3934d]" style={{ width: `${report.sentiment.confidence * 100}%` }} /></div></div>
        </article>

        <article className={`${card} p-6 sm:p-7`}>
          <SectionTitle eyebrow="Daily attribution" title="Portfolio Impact" detail="Daily holding impact equals shares multiplied by current price minus previous close." />
          <div className="mt-7 flex flex-wrap items-end justify-between gap-4 rounded-[18px] bg-[#f7f3ea] p-5">
            <div><p className="text-[10px] uppercase tracking-[0.14em] text-[#79746b]">Impact today</p><p className={`mt-2 text-3xl font-semibold tracking-[-0.045em] ${impactTone === "positive" ? "text-[#486743]" : impactTone === "negative" ? "text-[#8b4d46]" : ""}`}>{formatCurrency(report.dailyImpact)}</p></div>
            <div className="text-right"><p className="text-xl font-semibold">{formatPercentage(report.dailyImpactPercentage)}</p><p className="mt-1 text-[10px] text-[#7b766d]">{Math.round(report.dailyImpactCoverage * 100)}% holding coverage</p></div>
          </div>
          <div className="mt-4 space-y-2">
            {report.holdingImpacts.length === 0 ? <p className="rounded-2xl border border-dashed border-[#dcd5c8] p-5 text-sm text-[#777269]">Holding-level impact is unavailable.</p> : report.holdingImpacts.map((holding) => {
              const positive = (holding.impact ?? 0) >= 0;
              return <div key={holding.ticker} className="flex items-center justify-between gap-4 rounded-2xl border border-[#e8e2d7] bg-[#fffefa] px-4 py-3.5"><div className="flex items-center gap-3"><span className={`grid size-9 place-items-center rounded-xl ${holding.coverage === "unavailable" ? "bg-[#eeeae1] text-[#7b766d]" : positive ? "bg-[#edf4e9] text-[#4e6d49]" : "bg-[#f7ebe8] text-[#8a5049]"}`}>{positive ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}</span><div><p className="text-sm font-semibold">{holding.ticker}</p><p className="text-[10px] uppercase tracking-[0.12em] text-[#817c73]">{holding.coverage}</p></div></div><div className="text-right"><p className="text-sm font-semibold">{holding.impact === null ? "Unavailable" : formatCurrency(holding.impact)}</p><p className="mt-1 text-[11px] text-[#777269]">{holding.dailyChangePercentage === null ? "No daily move" : formatPercentage(holding.dailyChangePercentage)}</p></div></div>;
            })}
          </div>
        </article>
      </div>

      <div data-pdf-section className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
        <article className={`${card} p-6 sm:p-7`}>
          <SectionTitle eyebrow="Portfolio controls" title="Risk Triggers" />
          <div className="mt-6 space-y-3">{report.risks.map((risk) => <div key={risk.id} className={`rounded-[18px] border p-4 ${risk.triggered ? "border-[#e8cbc4] bg-[#fbf1ee]" : "border-[#d7e2d2] bg-[#f2f7ef]"}`}><div className="flex items-center gap-2">{risk.triggered ? <ShieldAlert className="size-4 text-[#95544b]" /> : <ShieldCheck className="size-4 text-[#51704d]" />}<span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.13em] ${risk.triggered ? "bg-[#efd8d2] text-[#7b413a]" : "bg-[#dfeadc] text-[#456141]"}`}>{risk.triggered ? "Triggered" : "Observed"}</span></div><h4 className="mt-3 text-sm font-semibold">{risk.title}</h4><p className="mt-2 text-xs leading-5 text-[#726d64]">{risk.detail}</p></div>)}</div>
        </article>
        <article className={`${card} overflow-hidden`}>
          <div className="border-b border-[#e4ded2] bg-[#efe7d4] px-6 py-5 sm:px-7"><SectionTitle eyebrow="Advisor synthesis" title="Portfolio Narrative" /></div>
          <div className="p-6 sm:p-8"><span className="text-5xl leading-none text-[#b89a55]">“</span><p className="-mt-4 max-w-3xl text-base leading-8 text-[#4f4c45] sm:text-lg">{report.narrative}</p><p className="mt-5 text-[10px] uppercase tracking-[0.15em] text-[#847f75]">AI synthesis bounded by deterministic evidence</p></div>
        </article>
      </div>

      <div data-pdf-section className="grid gap-5 xl:grid-cols-2">
        <article className={`${card} p-6 sm:p-7`}><SectionTitle eyebrow="Review workflow" title="Action Checklist" detail="Suggested review actions only. No trading instruction is generated." /><ol className="mt-6 space-y-3">{report.checklist.map((item, index) => <li key={`${index}-${item}`} className="flex gap-3 rounded-2xl border border-[#e8e2d7] bg-[#faf7f0] p-4 text-sm leading-6"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#292823] text-[11px] font-semibold text-white">{index + 1}</span><span>{item}</span></li>)}</ol></article>
        <article className={`${card} p-6 sm:p-7`}><SectionTitle eyebrow="Evidence balance" title="Bullish vs Bearish Evidence" detail="A comparison of current inputs, not a prediction or price target." /><div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-[18px] border border-[#d8e2d3] bg-[#f2f7ef] p-4"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-[#466143]"><ArrowUpRight className="size-4" /> Supportive</p><ul className="mt-4 space-y-3">{report.bullishEvidence.map((item) => <li key={item} className="flex gap-2 text-xs leading-5 text-[#5b6557]"><Check className="mt-0.5 size-3.5 shrink-0" />{item}</li>)}</ul></div><div className="rounded-[18px] border border-[#e6cfca] bg-[#fbf1ee] p-4"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-[#814941]"><ArrowDownRight className="size-4" /> Cautionary</p><ul className="mt-4 space-y-3">{report.bearishEvidence.map((item) => <li key={item} className="flex gap-2 text-xs leading-5 text-[#6f5a56]"><AlertTriangle className="mt-0.5 size-3.5 shrink-0" />{item}</li>)}</ul></div></div></article>
      </div>

      <article data-pdf-section className={`${card} p-6 sm:p-7`}>
        <SectionTitle eyebrow="Audit trail" title="Data Source Transparency" detail="Best-effort sources, their coverage state, and market timestamps remain visible." />
        <div className="mt-6 grid gap-3 md:grid-cols-2">{report.sources.map((source) => <div key={source.id} className="rounded-[18px] border border-[#e6e0d5] bg-[#faf8f2] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold">{source.provider}</p><p className="mt-1 text-[11px] text-[#767168]">{source.label}</p></div><span className="rounded-full border border-[#ddd6c8] bg-white px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#716c63]">{source.status}</span></div><p className="mt-3 text-[11px] leading-5 text-[#777269]">{source.detail}</p>{source.url && <a href={source.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-8 items-center gap-1.5 text-[11px] font-semibold text-[#7d622c] hover:underline">Open source <ExternalLink className="size-3" /></a>}</div>)}</div>
        <div className="mt-6 border-t border-[#e5dfd3] pt-5"><p className="flex gap-2 text-[10px] leading-5 text-[#7b766d]"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#8a713b]" />{report.disclaimers.join(" ")}</p></div>
      </article>
    </section>
  );
}
