import type { NewsArticle } from "@/lib/server/engine";
import type { SourceRecord } from "@/lib/types";

type GdeltPayload = {
  articles?: Array<{
    title?: unknown;
    url?: unknown;
    domain?: unknown;
    seendate?: unknown;
  }>;
};

function parseGdeltDate(value: string) {
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  return `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
}

export function parseGdeltArticles(ticker: string, payload: unknown): NewsArticle[] {
  const data = payload as GdeltPayload;
  const seen = new Set<string>();
  return (data.articles ?? []).flatMap((article, index) => {
    if (
      typeof article.title !== "string" ||
      typeof article.url !== "string" ||
      typeof article.domain !== "string" ||
      typeof article.seendate !== "string" ||
      seen.has(article.url)
    ) {
      return [];
    }
    const publishedAt = parseGdeltDate(article.seendate);
    if (!publishedAt) return [];
    seen.add(article.url);
    return [{
      id: `gdelt-${ticker.toUpperCase()}-${index}`,
      ticker: ticker.toUpperCase(),
      title: article.title.trim(),
      url: article.url,
      domain: article.domain,
      publishedAt,
    }];
  });
}

async function fetchTickerNews(ticker: string) {
  const query = encodeURIComponent(`\"${ticker}\" OR \"${ticker}.JK\"`);
  const response = await fetch(
    `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=artlist&maxrecords=5&sort=datedesc&timespan=72h&format=json`,
    { signal: AbortSignal.timeout(8_000), cache: "no-store" },
  );
  if (!response.ok) throw new Error(`GDELT returned ${response.status}`);
  return parseGdeltArticles(ticker, (await response.json()) as unknown);
}

export async function fetchNewsBundle(symbols: string[]) {
  const fetchedAt = new Date().toISOString();
  const results = await Promise.allSettled(symbols.map(fetchTickerNews));
  const articles = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const sources: SourceRecord[] = results.map((result, index) => ({
    id: `gdelt-${symbols[index].toUpperCase()}`,
    provider: "GDELT",
    label: `${symbols[index].toUpperCase()} recent news metadata`,
    url: "https://www.gdeltproject.org/",
    fetchedAt,
    marketTimestamp: null,
    status:
      result.status === "rejected"
        ? "unavailable"
        : result.value.length > 0
          ? "available"
          : "partial",
    detail:
      result.status === "rejected"
        ? "News metadata unavailable."
        : `${result.value.length} linked article metadata record(s); full article text was not collected.`,
  }));
  return { articles, sources };
}
