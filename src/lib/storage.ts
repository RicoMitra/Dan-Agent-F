import { isValidPortfolioState } from "@/lib/portfolio";
import type { DeepDiveReport, Holding, PortfolioState } from "@/lib/types";

export const STORAGE_KEY = "dan-agent-f:portfolio:v2";
export const LEGACY_STORAGE_KEY = "portfolio-dashboard:v1";
export const REPORT_STORAGE_KEY = "dan-agent-f:latest-report:v1";

function migrateLegacyPortfolio(value: unknown): PortfolioState | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as {
    version?: unknown;
    cashBalance?: unknown;
    holdings?: unknown;
  };
  if (
    candidate.version !== 1 ||
    typeof candidate.cashBalance !== "number" ||
    candidate.cashBalance < 0 ||
    !Array.isArray(candidate.holdings)
  ) {
    return null;
  }
  const holdings: Holding[] = [];
  for (const raw of candidate.holdings) {
    if (!raw || typeof raw !== "object") return null;
    const item = raw as Record<string, unknown>;
    if (
      typeof item.id !== "string" ||
      typeof item.ticker !== "string" ||
      ![item.lots, item.averageBuyPrice, item.currentPrice].every(
        (field) => typeof field === "number" && Number.isFinite(field) && field >= 0,
      )
    ) {
      return null;
    }
    holdings.push({
      id: item.id,
      ticker: item.ticker,
      lots: item.lots as number,
      averageBuyPrice: item.averageBuyPrice as number,
      currentPrice: item.currentPrice as number,
      priceSource: "manual",
      marketTimestamp: null,
    });
  }
  const migrated: PortfolioState = {
    version: 2,
    cashBalance: candidate.cashBalance,
    holdings,
    watchlist: [],
  };
  return isValidPortfolioState(migrated) ? migrated : null;
}

export function loadPortfolio(): PortfolioState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!legacyRaw) return null;
      const migrated = migrateLegacyPortfolio(JSON.parse(legacyRaw) as unknown);
      if (migrated) savePortfolio(migrated);
      return migrated;
    }
    const parsed: unknown = JSON.parse(raw);
    return isValidPortfolioState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function savePortfolio(state: PortfolioState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The dashboard remains usable if storage is unavailable or full.
  }
}

export function clearPortfolio() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Reset the in-memory state even if browser storage is unavailable.
  }
}

function isStoredReport(value: unknown): value is DeepDiveReport {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<DeepDiveReport>;
  return (
    candidate.version === 1 &&
    typeof candidate.id === "string" &&
    typeof candidate.portfolioFingerprint === "string"
  );
}

export function loadLatestReport(): DeepDiveReport | null {
  try {
    const raw = window.localStorage.getItem(REPORT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isStoredReport(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveLatestReport(report: DeepDiveReport) {
  try {
    window.localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(report));
  } catch {
    // Analysis remains visible in memory if storage is unavailable.
  }
}

export function clearLatestReport() {
  try {
    window.localStorage.removeItem(REPORT_STORAGE_KEY);
  } catch {
    // Clearing the in-memory report remains possible.
  }
}
