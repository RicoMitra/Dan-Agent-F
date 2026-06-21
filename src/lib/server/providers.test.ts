import { describe, expect, it } from "vitest";
import { parseYahooChart } from "@/lib/server/market-data";
import { parseGdeltArticles } from "@/lib/server/news-data";

describe("Yahoo chart normalization", () => {
  it("normalizes quote and closing history with source metadata", () => {
    const result = parseYahooChart("BBCA", {
      chart: {
        result: [
          {
            meta: {
              regularMarketPrice: 9_000,
              previousClose: 8_800,
              regularMarketVolume: 100_000,
              regularMarketDayLow: 8_900,
              regularMarketDayHigh: 9_100,
              regularMarketTime: 1_750_470_400,
            },
            timestamp: [1, 2],
            indicators: { quote: [{ close: [8_800, 9_000] }] },
          },
        ],
      },
    });

    expect(result.quote.currentPrice).toBe(9_000);
    expect(result.closes).toEqual([8_800, 9_000]);
  });

  it("rejects a response without a finite market price", () => {
    expect(() => parseYahooChart("BBCA", { chart: { result: [] } })).toThrow("unavailable");
  });
});

describe("GDELT normalization", () => {
  it("keeps article metadata, deduplicates URLs, and never requires body text", () => {
    const result = parseGdeltArticles("BBCA", {
      articles: [
        { title: "Update", url: "https://example.com/a", domain: "example.com", seendate: "20260621T010000Z" },
        { title: "Duplicate", url: "https://example.com/a", domain: "example.com", seendate: "20260621T020000Z" },
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ ticker: "BBCA", title: "Update", domain: "example.com" });
  });
});
