import { describe, expect, it } from "vitest";
import { planPdfSections } from "@/lib/report-dom";

describe("Deep Dive DOM PDF pagination", () => {
  it("keeps report sections intact and starts a new page when the next card does not fit", () => {
    expect(planPdfSections([70, 120, 100], { pageHeight: 297, margin: 12, gap: 5 })).toEqual([
      { page: 1, y: 12, height: 70 },
      { page: 1, y: 87, height: 120 },
      { page: 2, y: 12, height: 100 },
    ]);
  });

  it("scales a single oversized report section to the printable page height", () => {
    expect(planPdfSections([320], { pageHeight: 297, margin: 12, gap: 5 })).toEqual([
      { page: 1, y: 12, height: 273 },
    ]);
  });
});
