const idr = new Intl.NumberFormat("en-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const compactIdr = new Intl.NumberFormat("en-ID", {
  style: "currency",
  currency: "IDR",
  notation: "compact",
  maximumFractionDigits: 1,
});

export const formatCurrency = (value: number) => idr.format(value);
export const formatCompactCurrency = (value: number) => compactIdr.format(value);
export const formatPercentage = (value: number) =>
  `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
