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
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const ink: [number, number, number] = [39, 38, 34];
  const gold: [number, number, number] = [169, 137, 69];
  const muted: [number, number, number] = [116, 111, 102];
  const border: [number, number, number] = [225, 218, 205];
  const cream: [number, number, number] = [244, 240, 231];
  const paper: [number, number, number] = [255, 253, 248];
  const sage: [number, number, number] = [240, 246, 237];
  const rose: [number, number, number] = [250, 240, 237];

  const pageBase = () => {
    doc.setFillColor(...cream);
    doc.rect(0, 0, 210, 297, "F");
    doc.setFillColor(...gold);
    doc.rect(0, 0, 210, 1.4, "F");
  };
  const card = (x: number, y: number, width: number, height: number, fill = paper) => {
    doc.setFillColor(...fill);
    doc.setDrawColor(...border);
    doc.roundedRect(x, y, width, height, 4, 4, "FD");
  };
  const eyebrow = (text: string, x: number, y: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...gold);
    doc.text(text.toUpperCase(), x, y);
  };
  const heading = (text: string, x: number, y: number, size = 13) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(...ink);
    doc.text(text, x, y);
  };
  const paragraph = (text: string, x: number, y: number, width: number, maxLines = 20) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    const lines = (doc.splitTextToSize(text, width) as string[]).slice(0, maxLines);
    doc.text(lines, x, y);
    return y + lines.length * 4;
  };
  const metric = (label: string, value: string, detail: string, x: number) => {
    card(x, 56, 42.5, 30);
    eyebrow(label, x + 4, 65);
    heading(value, x + 4, 75, 10);
    paragraph(detail, x + 4, 81, 35, 1);
  };

  pageBase();
  eyebrow("Daniel Agent Finance / Intelligence Brief", 14, 13);
  heading("DanA-F Deep Dive Report", 14, 27, 23);
  paragraph(report.executivePulse, 14, 35, 118, 2);
  card(145, 10, 51, 35, [249, 245, 235]);
  eyebrow("Portfolio Health Score", 150, 19);
  heading(`${report.health.score}/${report.health.maxScore}`, 150, 31, 18);
  paragraph(report.health.label, 177, 30, 15, 2);
  doc.setFontSize(6.5);
  doc.text(`${new Date(report.generatedAt).toLocaleString("en-ID")} / ${report.status.toUpperCase()}`, 14, 48);
  if (report.security.unprotectedDevRun) {
    doc.setTextColor(116, 89, 35);
    doc.text("UNPROTECTED DEV RUN", 196, 48, { align: "right" });
  }

  metric("Total Portfolio", idr(report.portfolioValue), "Holdings plus cash", 14);
  metric("Invested Capital", idr(report.investedCapital), "Documented cost basis", 60.5);
  metric("Floating P/L", idr(report.floatingProfitLoss), signedPercentage(report.returnPercentage), 107);
  metric("Cash Balance", idr(report.cashBalance), "Excluded from stock return", 153.5);

  card(14, 94, 87, 76);
  eyebrow("Market Pulse", 20, 104);
  heading("Market & Sentiment Overview", 20, 113, 12);
  heading(report.sentiment.score === null ? "Insufficient" : `${report.sentiment.score > 0 ? "+" : ""}${report.sentiment.score}`, 20, 131, 24);
  paragraph(`${Math.round(report.sentiment.confidence * 100)}% confidence / ${report.sentiment.articleCount} linked items`, 20, 139, 70, 2);
  doc.setDrawColor(197, 188, 169);
  doc.setLineWidth(2.5);
  doc.line(20, 151, 94, 151);
  if (report.sentiment.score !== null) {
    const markerX = 20 + ((report.sentiment.score + 100) / 200) * 74;
    doc.setFillColor(...ink);
    doc.circle(markerX, 151, 2.2, "F");
  }
  paragraph("-100 caution       0 mixed       +100 supportive", 20, 160, 74, 1);

  card(106, 94, 90, 76);
  eyebrow("Daily Attribution", 112, 104);
  heading("Portfolio Impact", 112, 113, 12);
  heading(idr(report.dailyImpact), 112, 130, 19);
  paragraph(`${signedPercentage(report.dailyImpactPercentage)} today / ${Math.round(report.dailyImpactCoverage * 100)}% coverage`, 112, 138, 76, 2);
  let impactY = 148;
  report.holdingImpacts.slice(0, 3).forEach((holding) => {
    heading(holding.ticker, 112, impactY, 8);
    const value = holding.impact === null ? "Unavailable" : `${holding.dailyChangePercentage === null ? "" : `${signedPercentage(holding.dailyChangePercentage)} / `}${idr(holding.impact)}`;
    paragraph(value, 132, impactY, 55, 1);
    impactY += 7;
  });

  card(14, 178, 182, 91, [249, 245, 235]);
  eyebrow("Advisor Synthesis", 20, 189);
  heading("Portfolio Narrative", 20, 199, 14);
  paragraph(report.narrative, 20, 211, 166, 10);
  paragraph("AI synthesis bounded by deterministic evidence.", 20, 258, 166, 2);

  doc.addPage();
  pageBase();
  eyebrow("Portfolio Controls", 14, 14);
  heading("Risk Triggers", 14, 25, 18);
  let riskY = 34;
  report.risks.slice(0, 2).forEach((risk) => {
    card(14, riskY, 182, 30, risk.triggered ? rose : sage);
    eyebrow(risk.triggered ? "Triggered" : "Observed", 20, riskY + 9);
    heading(risk.title, 20, riskY + 17, 10);
    paragraph(risk.detail, 20, riskY + 24, 166, 2);
    riskY += 35;
  });

  const checklistY = Math.max(90, riskY + 3);
  const checklistHeight = 267 - checklistY;
  card(14, checklistY, 87, checklistHeight);
  eyebrow("Review Workflow", 20, checklistY + 11);
  heading("Action Checklist", 20, checklistY + 22, 13);
  let actionY = checklistY + 34;
  report.checklist.slice(0, 6).forEach((item, index) => {
    doc.setFillColor(...ink);
    doc.circle(23, actionY - 1.5, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6.5);
    doc.text(`${index + 1}`, 23, actionY, { align: "center" });
    actionY = paragraph(item, 30, actionY, 62, 3) + 4;
  });

  card(106, checklistY, 90, checklistHeight);
  eyebrow("Evidence Balance", 112, checklistY + 11);
  heading("Bullish vs Bearish Evidence", 112, checklistY + 22, 12);
  paragraph("Current evidence, not a prediction.", 112, checklistY + 30, 75, 2);
  card(112, checklistY + 38, 78, 47, sage);
  eyebrow("Supportive", 117, checklistY + 47);
  let bullishY = checklistY + 56;
  report.bullishEvidence.slice(0, 3).forEach((item) => { bullishY = paragraph(`+ ${item}`, 117, bullishY, 67, 2) + 3; });
  card(112, checklistY + 91, 78, 47, rose);
  eyebrow("Cautionary", 117, checklistY + 100);
  let bearishY = checklistY + 109;
  report.bearishEvidence.slice(0, 3).forEach((item) => { bearishY = paragraph(`- ${item}`, 117, bearishY, 67, 2) + 3; });

  doc.addPage();
  pageBase();
  eyebrow("Audit Trail", 14, 14);
  heading("Data Source Transparency", 14, 25, 18);
  paragraph("Best-effort sources, coverage state, and market timestamps used by this report.", 14, 33, 170, 2);
  let sourceY = 44;
  report.sources.slice(0, 4).forEach((source) => {
    card(14, sourceY, 182, 31);
    eyebrow(`${source.provider} / ${source.status}`, 20, sourceY + 9);
    heading(source.label, 20, sourceY + 17, 9.5);
    paragraph(source.detail, 20, sourceY + 24, 166, 2);
    sourceY += 36;
  });
  sourceY += 8;
  card(14, sourceY, 182, 44, [249, 245, 235]);
  eyebrow("Methodology", 20, sourceY + 10);
  let methodY = sourceY + 20;
  report.methodology.slice(0, 4).forEach((item) => { methodY = paragraph(`- ${item}`, 20, methodY, 166, 2) + 2; });
  card(14, sourceY + 50, 182, 33, rose);
  eyebrow("Important", 20, sourceY + 60);
  paragraph(report.disclaimers.join(" "), 20, sourceY + 69, 166, 3);

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...border);
    doc.line(14, 284, 196, 284);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...muted);
    doc.text("DanA-F Deep Dive / educational decision support / not investment advice", 14, 290);
    doc.text(`${page}/${pages}`, 196, 290, { align: "right" });
  }
  return doc;
}

export function downloadDeepDiveReport(report: DeepDiveReport) {
  buildDeepDiveReport(report).save(`dan-agent-f-research-${report.generatedAt.slice(0, 10)}.pdf`);
}
