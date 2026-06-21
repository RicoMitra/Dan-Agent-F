import { describe, expect, it, vi } from "vitest";
import { getDeepDiveConfig, hashIdentifier, verifyTurnstile } from "@/lib/server/security";

describe("Deep Dive security", () => {
  it("reports missing production credentials without exposing partial config", () => {
    const result = getDeepDiveConfig({});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.missing).toContain("OPENAI_API_KEY");
  });

  it("verifies Turnstile server-side", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    await expect(verifyTurnstile("token", "hashed-ip", "secret", fetcher)).resolves.toBe(true);
    expect(fetcher).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("hashes the client identifier before rate-limit storage", async () => {
    const hash = await hashIdentifier("203.0.113.5", "secret");
    expect(hash).not.toContain("203.0.113.5");
    expect(hash).toHaveLength(64);
  });
});
