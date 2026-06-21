"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BrainCircuit, Download, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { AllocationChart } from "@/components/allocation-chart";
import { AppShell } from "@/components/app-shell";
import { DailyMarketWatch } from "@/components/daily-market-watch";
import { MarketSnapshot } from "@/components/market-snapshot";
import { PortfolioEditor } from "@/components/portfolio-editor";
import { SummaryGrid } from "@/components/summary-grid";
import { WatchlistPanel } from "@/components/watchlist-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { calculateHealthScore, calculatePortfolio, calculateScenario, calculateSectorAllocation, generateInsights } from "@/lib/portfolio";
import { downloadPortfolioReport } from "@/lib/report";
import { usePortfolio } from "@/lib/use-portfolio";

const colors = ["#242420", "#b99955", "#77766f", "#d6c8a6", "#90805d"];

export function MonitoringDashboard() {
  const { portfolio, setPortfolio, addHolding, reset } = usePortfolio();
  const [scenarioChange, setScenarioChange] = useState(10);
  const summary = useMemo(() => calculatePortfolio(portfolio), [portfolio]);
  const health = useMemo(() => calculateHealthScore(summary), [summary]);
  const sectors = useMemo(() => calculateSectorAllocation(summary), [summary]);
  const insights = useMemo(() => generateInsights(summary), [summary]);
  const scenario = useMemo(() => calculateScenario(summary, scenarioChange), [summary, scenarioChange]);
  const chartData = [...summary.holdings.map((holding, index) => ({ name: holding.ticker || "Untitled", value: holding.currentValue, color: colors[index % colors.length] })), { name: "Cash", value: summary.cashBalance, color: "#e2d9c7" }];
  return <AppShell active="monitoring"><section><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9b7b3f]">Monitoring workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Portfolio monitoring</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#747168]">A private, evidence-ready view of your IDX holdings. Calculations remain available without external services.</p></div><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => downloadPortfolioReport({ summary, health, sectors, insights, scenario })}><Download className="size-4" /> Export PDF</Button><Button variant="ghost" onClick={reset}><RotateCcw className="size-4" /> Reset</Button></div></div><div className="mt-7"><SummaryGrid summary={summary} /></div></section>
  <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,.7fr)]"><PortfolioEditor portfolio={portfolio} summary={summary} onChange={setPortfolio} onAdd={addHolding} /><div className="space-y-5"><Card className="p-5"><h2 className="text-lg font-semibold">Allocation</h2><p className="mt-1 text-xs text-[#817d74]">Current value including cash</p><AllocationChart data={chartData} /><div className="space-y-2">{chartData.filter((item) => item.value > 0).map((item) => <div key={item.name} className="flex justify-between text-xs"><span>{item.name}</span><b>{summary.totalPortfolioValue ? ((item.value / summary.totalPortfolioValue) * 100).toFixed(1) : "0.0"}%</b></div>)}</div></Card><WatchlistPanel tickers={portfolio.watchlist} onChange={(watchlist) => setPortfolio({ ...portfolio, watchlist })} /></div></section>
  <section className="mt-5 grid gap-5 lg:grid-cols-2"><MarketSnapshot portfolio={portfolio} onChange={setPortfolio} /><Card className="p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9b7b3f]">Portfolio health</p><div className="mt-4 flex items-end gap-3"><p className="text-5xl font-semibold tracking-[-0.06em]">{health.score}</p><p className="pb-1 text-lg text-[#817d74]">/ 10</p><span className="ml-auto rounded-full bg-[#f3efe5] px-3 py-1 text-xs font-semibold text-[#8b7138]">{health.label}</span></div><div className="mt-5 grid grid-cols-2 gap-3">{health.factors.map((factor) => <div key={factor.id} className="rounded-xl bg-[#faf9f5] p-3"><p className="flex justify-between text-xs font-semibold"><span>{factor.label}</span><span>{factor.score}/{factor.maxScore}</span></p><p className="mt-1 text-[10px] text-[#817d74]">{factor.detail}</p></div>)}</div></Card></section>
  <DailyMarketWatch />
  <section className="mt-5 grid gap-5 lg:grid-cols-2"><Card className="p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9b7b3f]">Scenario lab</p><h2 className="mt-2 text-xl font-semibold">What if stock prices move?</h2><div className="mt-5 flex items-end gap-3"><label className="max-w-36 text-xs font-semibold">Price change (%)<Input className="mt-2" type="number" min="-100" max="100" value={scenarioChange} onChange={(event) => setScenarioChange(Math.max(-100, Math.min(100, Number(event.target.value) || 0)))} /></label>{[-10, 0, 10].map((value) => <Button key={value} variant={scenarioChange === value ? "primary" : "secondary"} onClick={() => setScenarioChange(value)}>{value > 0 ? `+${value}%` : `${value}%`}</Button>)}</div><div className="mt-5 rounded-2xl bg-[#22221f] p-5 text-white"><p className="text-[10px] uppercase tracking-[0.15em] text-[#aaa89f]">Estimated portfolio value</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(scenario.projectedPortfolioValue)}</p></div></Card><Card className="p-5"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#f3efe5] text-[#9b7b3f]"><Sparkles className="size-4" /></span><div><h2 className="text-lg font-semibold">Deterministic notes</h2><p className="text-xs text-[#817d74]">Visible trigger values, no recommendations</p></div></div><div className="mt-4 space-y-3">{insights.map((insight) => <div key={insight.id} className="rounded-2xl border border-[#e7e2d8] bg-[#faf9f5] p-4"><b className="text-sm">{insight.title}</b><p className="mt-1 text-xs leading-5 text-[#747168]">{insight.description}</p></div>)}</div></Card></section>
  <section className="mt-5 overflow-hidden rounded-[24px] bg-[#20211f] p-6 text-white sm:p-8"><div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d7bb7a]">DanA-F Engine</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Turn monitoring into cited daily intelligence.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#aaa89f]">Five specialists analyze current evidence in parallel before Advisor synthesis. Your snapshot is sent only after explicit consent.</p><p className="mt-3 flex items-center gap-2 text-[11px] text-[#c4c1b8]"><ShieldCheck className="size-4 text-[#d7bb7a]" /> Read-only · rate-limited · non-advisory</p></div><Link href="/analysis" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#d3b46e] px-5 py-3 text-sm font-semibold text-[#20211f] transition-colors hover:bg-[#e1c988] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><BrainCircuit className="size-4" /> Deep Dive Analysis</Link></div></section>
  <footer className="mt-8 border-t border-[#ddd8ce] pt-5 text-[10px] text-[#817d74]">DanA-F · Yahoo Finance and GDELT are best-effort sources · Not investment advice</footer></AppShell>;
}
