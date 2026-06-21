import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  PortfolioHealth,
  PortfolioInsight,
  PortfolioSummary,
  SectorAllocation,
  DeepDiveReport,
} from "@/lib/types";

type ScenarioResult = {
  percentageChange: number;
  projectedPortfolioValue: number;
  valueDifference: number;
};

export type PortfolioReportInput = {
  summary: PortfolioSummary;
  health: PortfolioHealth;
  sectors: SectorAllocation[];
  insights: PortfolioInsight[];
  scenario: ScenarioResult;
  generatedAt?: Date;
};

const idr = (value: number) => `Rp ${Math.round(value).toLocaleString("id-ID")}`;
const signedPercentage = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

export function buildPortfolioReport({
  summary,
  health,
  sectors,
  insights,
  scenario,
  generatedAt = new Date(),
}: PortfolioReportInput) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const ink: [number, number, number] = [34, 34, 31];
  const gold: [number, number, number] = [185, 153, 85];
  const muted: [number, number, number] = [116, 113, 104];
  const border: [number, number, number] = [229, 225, 216];

  doc.setFillColor(...ink);
  doc.rect(0, 0, 210, 27, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Portfolio Summary", 14, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(205, 201, 191);
  doc.text(`Generated ${generatedAt.toLocaleString("en-ID")}`, 14, 19);
  doc.setTextColor(215, 187, 122);
  doc.text(`Health score ${health.score}/${health.maxScore} - ${health.label}`, 196, 16, { align: "right" });

  const cards = [
    ["TOTAL PORTFOLIO", idr(summary.totalPortfolioValue)],
    ["INVESTED CAPITAL", idr(summary.totalInvestedCapital)],
    ["FLOATING P/L", idr(summary.floatingProfitLoss)],
    ["CASH BALANCE", idr(summary.cashBalance)],
  ];
  cards.forEach(([label, value], index) => {
    const x = 14 + index * 46;
    doc.setFillColor(250, 249, 245);
    doc.setDrawColor(...border);
    doc.roundedRect(x, 34, 42, 21, 2, 2, "FD");
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text(label, x + 3, 41);
    doc.setTextColor(...ink);
    doc.setFontSize(9.5);
    doc.text(value, x + 3, 49);
  });

  doc.setTextColor(...ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Holdings", 14, 65);
  autoTable(doc, {
    startY: 69,
    head: [["Ticker", "Lots", "Avg cost", "Market price", "Invested", "Current value", "Return"]],
    body: summary.holdings.map((holding) => [
      holding.ticker || "-",
      holding.lots.toLocaleString("id-ID"),
      idr(holding.averageBuyPrice),
      idr(holding.currentPrice),
      idr(holding.investedCapital),
      idr(holding.currentValue),
      signedPercentage(holding.returnPercentage),
    ]),
    theme: "grid",
    styles: { font: "helvetica", fontSize: 7, cellPadding: 2.2, lineColor: border, lineWidth: 0.2 },
    headStyles: { fillColor: ink, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 249, 245] },
    margin: { left: 14, right: 14 },
  });

  const tableY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  let y = tableY + 10;
  if (y > 205) {
    doc.addPage();
    y = 18;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...ink);
  doc.text("Allocation", 14, y);
  doc.text("Scenario result", 112, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  summary.holdings.forEach((holding, index) => {
    const marker: [number, number, number] = index === 0 ? ink : index === 1 ? gold : [119, 118, 111];
    doc.setFillColor(...marker);
    doc.circle(16, y - 1, 1.2, "F");
    doc.setTextColor(...ink);
    doc.text(`${holding.ticker || "Holding"}: ${holding.allocationPercentage.toFixed(1)}%`, 20, y);
    y += 5;
  });
  doc.setFillColor(235, 229, 215);
  doc.circle(16, y - 1, 1.2, "F");
  doc.text(`Cash: ${summary.cashAllocationPercentage.toFixed(1)}%`, 20, y);

  const scenarioY = tableY + 16 > 205 ? 24 : tableY + 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(`${scenario.percentageChange >= 0 ? "+" : ""}${scenario.percentageChange}%`, 112, scenarioY + 5);
  doc.setFontSize(10);
  doc.text(idr(scenario.projectedPortfolioValue), 112, scenarioY + 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...muted);
  doc.text(`${idr(scenario.valueDifference)} versus current value`, 112, scenarioY + 18);

  y = Math.max(y + 10, scenarioY + 30);
  if (y > 235) {
    doc.addPage();
    y = 18;
  }
  doc.setTextColor(...ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Sector allocation", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  sectors.forEach((sector) => {
    doc.text(`${sector.sector}: ${sector.percentage.toFixed(1)}% (${idr(sector.value)})`, 14, y);
    y += 5;
  });

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Portfolio notes", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  insights.forEach((insight) => {
    const lines = doc.splitTextToSize(`${insight.title}: ${insight.description}`, 180) as string[];
    if (y + lines.length * 4 > 275) {
      doc.addPage();
      y = 18;
    }
    doc.text(lines, 14, y);
    y += lines.length * 4 + 3;
  });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...border);
    doc.line(14, 286, 196, 286);
    doc.setFontSize(6.5);
    doc.setTextColor(...muted);
    doc.text("Educational portfolio analysis - not investment advice", 14, 291);
    doc.text(`${page}/${pageCount}`, 196, 291, { align: "right" });
  }

  return doc;
}

export function downloadPortfolioReport(input: PortfolioReportInput) {
  const date = (input.generatedAt ?? new Date()).toISOString().slice(0, 10);
  buildPortfolioReport(input).save(`portfolio-summary-${date}.pdf`);
}

export function buildDeepDiveReport(report: DeepDiveReport) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const ink: [number, number, number] = [31, 32, 30];
  const gold: [number, number, number] = [185, 153, 85];
  const muted: [number, number, number] = [105, 102, 95];
  const border: [number, number, number] = [226, 222, 213];
  const section = (title: string, y: number) => { doc.setTextColor(...ink); doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text(title, 14, y); return y + 7; };
  const paragraph = (text: string, y: number) => { doc.setFont("helvetica", "normal"); doc.setFontSize(8); const lines = doc.splitTextToSize(text, 182) as string[]; doc.text(lines, 14, y); return y + lines.length * 4 + 3; };

  doc.setFillColor(...ink); doc.rect(0, 0, 210, 42, "F");
  doc.setTextColor(...gold); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text("DAN-AGENT-F DAILY RESEARCH", 14, 12);
  doc.setTextColor(255, 255, 255); doc.setFontSize(20); doc.text("Portfolio Intelligence Report", 14, 23);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(205, 201, 191); doc.text(`Generated ${new Date(report.generatedAt).toLocaleString("en-ID")} - ${report.status.toUpperCase()} COVERAGE`, 14, 32);
  const cards = [["PORTFOLIO VALUE", idr(report.portfolioValue)], ["DAILY IMPACT", idr(report.dailyImpact)], ["SENTIMENT", report.sentiment.score === null ? "Insufficient" : `${report.sentiment.score > 0 ? "+" : ""}${report.sentiment.score}`], ["EVIDENCE", `${report.evidenceBalance.score > 0 ? "+" : ""}${report.evidenceBalance.score} ${report.evidenceBalance.label}`]];
  cards.forEach(([label, value], index) => { const x = 14 + index * 46; doc.setFillColor(250, 249, 245); doc.setDrawColor(...border); doc.roundedRect(x, 50, 42, 22, 2, 2, "FD"); doc.setTextColor(...muted); doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.text(label, x + 3, 58); doc.setTextColor(...ink); doc.setFontSize(8.5); doc.text(value, x + 3, 66); });
  let y = section(report.executivePulse, 86); y = paragraph(report.narrative, y); y = section("Risk triggers", y);
  report.risks.forEach((risk) => { y = paragraph(`${risk.triggered ? "TRIGGERED" : "OBSERVED"} - ${risk.title}: ${risk.detail}`, y); });

  doc.addPage(); y = section("Impact by holding", 18);
  autoTable(doc, { startY: y, head: [["Ticker", "Daily move", "Value impact", "Coverage"]], body: report.holdingImpacts.map((item) => [item.ticker, item.dailyChangePercentage === null ? "Unavailable" : signedPercentage(item.dailyChangePercentage), item.impact === null ? "Unavailable" : idr(item.impact), item.coverage]), theme: "grid", styles: { font: "helvetica", fontSize: 7, cellPadding: 2.2, lineColor: border }, headStyles: { fillColor: ink }, margin: { left: 14, right: 14 } });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10; y = section("Agent intelligence", y);
  for (const item of report.sections) { const text = `${item.agent.toUpperCase()} (${Math.round(item.confidence * 100)}%) - ${item.headline}: ${item.summary}`; const lines = doc.splitTextToSize(text, 182) as string[]; if (y + lines.length * 4 > 270) { doc.addPage(); y = 18; } y = paragraph(text, y); }
  if (y > 230) { doc.addPage(); y = 18; } y = section("Non-trading checklist", y); report.checklist.forEach((item, index) => { y = paragraph(`${index + 1}. ${item}`, y); });

  doc.addPage(); y = section("Sources and methodology", 18);
  report.sources.forEach((source) => { const text = `${source.provider} - ${source.label} [${source.status}]: ${source.detail}${source.url ? ` (${source.url})` : ""}`; const lines = doc.splitTextToSize(text, 182) as string[]; if (y + lines.length * 4 > 270) { doc.addPage(); y = 18; } y = paragraph(text, y); });
  y = section("Methodology", y + 3); report.methodology.forEach((item) => { y = paragraph(`- ${item}`, y); });
  const pages = doc.getNumberOfPages(); for (let page = 1; page <= pages; page += 1) { doc.setPage(page); doc.setDrawColor(...border); doc.line(14, 286, 196, 286); doc.setFontSize(6.5); doc.setTextColor(...muted); doc.text("Educational decision support - not investment advice or a forecast", 14, 291); doc.text(`${page}/${pages}`, 196, 291, { align: "right" }); }
  return doc;
}

export function downloadDeepDiveReport(report: DeepDiveReport) {
  buildDeepDiveReport(report).save(`dan-agent-f-research-${report.generatedAt.slice(0, 10)}.pdf`);
}
