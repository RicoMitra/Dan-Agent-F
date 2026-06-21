import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DeepDiveDashboard } from "@/components/deep-dive-dashboard";

describe("Deep Dive workspace", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(cleanup);

  it("explains consent, agents, and unconfigured live access", () => {
    render(<DeepDiveDashboard />);
    expect(screen.getByRole("heading", { name: /deep dive analysis/i })).toBeInTheDocument();
    expect(screen.getByText(/snapshot is sent only after consent/i)).toBeInTheDocument();
    expect(screen.getByText("Market Agent")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run dana-f engine/i })).toBeDisabled();
  });
});
