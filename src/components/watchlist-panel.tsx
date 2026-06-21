"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function WatchlistPanel({ tickers, onChange }: { tickers: string[]; onChange: (tickers: string[]) => void }) {
  const [ticker, setTicker] = useState("");
  const add = () => { const value = ticker.trim().toUpperCase(); if (/^[A-Z0-9.-]{1,15}$/.test(value) && !tickers.includes(value) && tickers.length < 10) { onChange([...tickers, value]); setTicker(""); } };
  return <Card className="p-5"><h2 className="text-lg font-semibold">Manual watchlist</h2><p className="mt-1 text-xs leading-5 text-[#817d74]">Compared with holdings in Deep Dive; excluded from portfolio value.</p><div className="mt-4 flex gap-2"><Input aria-label="Watchlist ticker" placeholder="e.g. ANTM" value={ticker} onChange={(event) => setTicker(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }} /><Button aria-label="Add to watchlist" variant="secondary" onClick={add}><Plus className="size-4" /></Button></div><div className="mt-4 flex flex-wrap gap-2">{tickers.map((item) => <span key={item} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-[#ded8ca] bg-[#faf8f2] px-3 text-xs font-semibold">{item}<button className="grid size-7 cursor-pointer place-items-center rounded-full hover:bg-[#ece7dc] focus-visible:outline-2 focus-visible:outline-[#9b7b3f]" aria-label={`Remove ${item} from watchlist`} onClick={() => onChange(tickers.filter((value) => value !== item))}><X className="size-3" /></button></span>)}</div><p className="mt-4 text-[10px] text-[#918d84]">{tickers.length}/10 symbols</p></Card>;
}
