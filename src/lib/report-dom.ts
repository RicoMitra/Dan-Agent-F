import { jsPDF } from "jspdf";
import type { DeepDiveReport } from "@/lib/types";

type PaginationOptions = {
  pageHeight: number;
  margin: number;
  gap: number;
};

export type PdfSectionPlacement = {
  page: number;
  y: number;
  height: number;
};

export function planPdfSections(
  sectionHeights: number[],
  { pageHeight, margin, gap }: PaginationOptions,
): PdfSectionPlacement[] {
  const usableHeight = pageHeight - margin * 2;
  let page = 1;
  let y = margin;

  return sectionHeights.map((requestedHeight) => {
    const height = Math.min(Math.max(0, requestedHeight), usableHeight);
    if (y > margin && y + height > pageHeight - margin) {
      page += 1;
      y = margin;
    }
    const placement = { page, y, height };
    y += height + gap;
    return placement;
  });
}

export async function downloadRenderedDeepDiveReport(
  root: HTMLElement,
  report: DeepDiveReport,
) {
  const html2canvas = (await import("html2canvas")).default;
  const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-pdf-section]"));
  if (sections.length === 0) throw new Error("No report sections are available for export.");

  const canvases = await Promise.all(
    sections.map((section) =>
      html2canvas(section, {
        backgroundColor: "#f4f0e7",
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (documentClone) => {
          documentClone.querySelectorAll<HTMLElement>("[data-pdf-exclude]").forEach((element) => {
            element.style.visibility = "hidden";
          });
        },
      }),
    ),
  );

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const gap = 5;
  const contentWidth = pageWidth - margin * 2;
  const naturalHeights = canvases.map((canvas) => canvas.height * (contentWidth / canvas.width));
  const placements = planPdfSections(naturalHeights, { pageHeight, margin, gap });
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });

  const paintPage = () => {
    doc.setFillColor(244, 240, 231);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
  };
  paintPage();
  let currentPage = 1;

  canvases.forEach((canvas, index) => {
    const placement = placements[index];
    while (currentPage < placement.page) {
      doc.addPage();
      currentPage += 1;
      paintPage();
    }
    const naturalHeight = naturalHeights[index];
    const width = naturalHeight > placement.height
      ? canvas.width * (placement.height / canvas.height)
      : contentWidth;
    const x = (pageWidth - width) / 2;
    doc.addImage(canvas.toDataURL("image/jpeg", 0.94), "JPEG", x, placement.y, width, placement.height, undefined, "FAST");
  });

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(116, 111, 102);
    doc.text("DanA-F Deep Dive · educational decision support · not investment advice", margin, 291);
    doc.text(`${page}/${pages}`, pageWidth - margin, 291, { align: "right" });
  }
  doc.save(`dan-agent-f-deep-dive-${report.generatedAt.slice(0, 10)}.pdf`);
}
