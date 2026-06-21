const SECTOR_BY_TICKER: Record<string, string> = {
  BBCA: "Financials",
  BBRI: "Financials",
  BBNI: "Financials",
  BMRI: "Financials",
  BRIS: "Financials",
  TLKM: "Telecommunication",
  ISAT: "Telecommunication",
  EXCL: "Telecommunication",
  ASII: "Industrials",
  UNTR: "Industrials",
  ICBP: "Consumer",
  INDF: "Consumer",
  UNVR: "Consumer",
  MYOR: "Consumer",
  KLBF: "Healthcare",
  ADRO: "Energy",
  PTBA: "Energy",
  ANTM: "Basic Materials",
  MDKA: "Basic Materials",
};

export function getSector(ticker: string) {
  return SECTOR_BY_TICKER[ticker.trim().toUpperCase().replace(/\.JK$/, "")] ?? "Other";
}
