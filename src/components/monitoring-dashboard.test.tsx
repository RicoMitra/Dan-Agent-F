import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MonitoringDashboard } from "@/components/monitoring-dashboard";

describe("Monitoring workspace", () => {
  afterEach(cleanup);
  beforeEach(() => window.localStorage.clear());

  it("shows portfolio hierarchy and the Deep Dive entry point", () => {
    render(<MonitoringDashboard />);

    expect(screen.getByRole("heading", { name: /portfolio monitoring/i })).toBeInTheDocument();
    expect(screen.getByText(/total portfolio/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /deep dive analysis/i })).toHaveAttribute("href", "/analysis");
  });

  it("adds a separate manual watchlist ticker", () => {
    render(<MonitoringDashboard />);
    fireEvent.change(screen.getByLabelText(/watchlist ticker/i), { target: { value: "ANTM" } });
    fireEvent.click(screen.getByRole("button", { name: /add to watchlist/i }));

    expect(screen.getByText("ANTM")).toBeInTheDocument();
  });
});
