import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";
import type { PortfolioSummary } from "@/lib/types";

export function SummaryGrid({ summary }: { summary: PortfolioSummary }) {
  const items = [
    ["Total portfolio", summary.totalPortfolioValue, formatCurrency(summary.totalPortfolioValue)],
    ["Invested capital", summary.totalInvestedCapital, "Stock cost basis"],
    ["Floating P/L", summary.floatingProfitLoss, `${summary.returnPercentage >= 0 ? "+" : ""}${summary.returnPercentage.toFixed(2)}% vs cost`],
    ["Available cash", summary.cashBalance, `${summary.cashAllocationPercentage.toFixed(1)}% of portfolio`],
  ] as const;
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{items.map(([label, value, detail], index) => <Card key={label} className="p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8f8a80]">{label}</p><div className="mt-4 flex items-end justify-between"><p className="text-2xl font-semibold tracking-[-0.04em]">{formatCompactCurrency(value)}</p>{index === 2 && <span className={summary.returnPercentage >= 0 ? "text-[#4f744b]" : "text-[#9a4b43]"}>{summary.returnPercentage >= 0 ? <ArrowUpRight className="size-5" /> : <ArrowDownRight className="size-5" />}</span>}</div><p className="mt-2 text-[11px] text-[#8a867d]">{detail}</p></Card>)}</div>;
}
