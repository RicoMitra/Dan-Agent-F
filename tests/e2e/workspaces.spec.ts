import { expect, test } from "@playwright/test";

test("Monitoring supports local portfolio editing and mocked market refresh", async ({ page }) => {
  await page.route("**/api/quotes?**", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ quotes: [{ ticker: "BBCA", price: 9700, previousClose: 9600, volume: 100000, dayLow: 9500, dayHigh: 9750, marketTime: "2026-06-21T02:00:00.000Z" }], errors: [] }) }));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Portfolio monitoring" })).toBeVisible();
  const refresh = page.getByRole("button", { name: "Refresh", exact: true });
  await refresh.scrollIntoViewIfNeeded();
  await refresh.click({ force: true });
  await expect(page.getByText(/1 updated; 0 unavailable/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Deep Dive Analysis/i })).toBeVisible();
});

test("Deep Dive explains privacy and remains safe without credentials", async ({ page }) => {
  await page.goto("/analysis");
  await expect(page.getByRole("heading", { name: "Deep Dive Analysis" })).toBeVisible();
  await expect(page.getByText(/server does not store it/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Run DanA-F Engine" })).toBeDisabled();
});
