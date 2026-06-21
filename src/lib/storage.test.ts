import { beforeEach, describe, expect, it } from "vitest";
import {
  LEGACY_STORAGE_KEY,
  REPORT_STORAGE_KEY,
  clearLatestReport,
  loadLatestReport,
  loadPortfolio,
  saveLatestReport,
} from "@/lib/storage";
import type { DeepDiveReport } from "@/lib/types";

beforeEach(() => window.localStorage.clear());

describe("portfolio storage migration", () => {
  it("migrates valid version-1 holdings to version 2", () => {
    window.localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        cashBalance: 100,
        holdings: [
          { id: "bbca", ticker: "BBCA", lots: 1, averageBuyPrice: 8_000, currentPrice: 9_000 },
        ],
      }),
    );

    expect(loadPortfolio()).toEqual({
      version: 2,
      cashBalance: 100,
      watchlist: [],
      holdings: [
        {
          id: "bbca",
          ticker: "BBCA",
          lots: 1,
          averageBuyPrice: 8_000,
          currentPrice: 9_000,
          priceSource: "manual",
          marketTimestamp: null,
        },
      ],
    });
  });
});

describe("latest report storage", () => {
  const report = { version: 1, id: "report-1", portfolioFingerprint: "abc" } as DeepDiveReport;

  it("stores and deletes only the latest report", () => {
    saveLatestReport(report);
    expect(loadLatestReport()).toMatchObject({ id: "report-1" });
    clearLatestReport();
    expect(loadLatestReport()).toBeNull();
    expect(window.localStorage.getItem(REPORT_STORAGE_KEY)).toBeNull();
  });

  it("rejects malformed report JSON", () => {
    window.localStorage.setItem(REPORT_STORAGE_KEY, "not-json");
    expect(loadLatestReport()).toBeNull();
  });
});
