import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AnalysisPage from "@/app/analysis/page";

afterEach(() => vi.unstubAllEnvs());

describe("Analysis page security mode", () => {
  it("passes explicit DEV_MODE from the server environment to the client dashboard", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEV_MODE", "true");

    const page = AnalysisPage() as ReactElement<{ developmentMode?: boolean }>;
    expect(page.props.developmentMode).toBe(true);
  });
});
