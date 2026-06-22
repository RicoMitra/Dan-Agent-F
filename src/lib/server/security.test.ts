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

  it("allows an explicitly unprotected run only in development when Turnstile is missing", () => {
    const result = getDeepDiveConfig({
      NODE_ENV: "development",
      OPENAI_API_KEY: "openai-key",
      OPENAI_SPECIALIST_MODEL: "specialist-model",
      OPENAI_ADVISOR_MODEL: "advisor-model",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.security.unprotectedDevRun).toBe(true);
      expect(result.security.bypassTurnstile).toBe(true);
      expect(result.security.bypassRateLimit).toBe(true);
    }
  });

  it("fails closed in production when Turnstile is missing", () => {
    const result = getDeepDiveConfig({
      NODE_ENV: "production",
      OPENAI_API_KEY: "openai-key",
      OPENAI_SPECIALIST_MODEL: "specialist-model",
      OPENAI_ADVISOR_MODEL: "advisor-model",
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "redis-token",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.missing).toContain("TURNSTILE_SECRET_KEY");
  });

  it("treats a partial Turnstile pair as an unprotected development run", () => {
    const result = getDeepDiveConfig({
      NODE_ENV: "development",
      OPENAI_API_KEY: "openai-key",
      OPENAI_SPECIALIST_MODEL: "specialist-model",
      OPENAI_ADVISOR_MODEL: "advisor-model",
      TURNSTILE_SECRET_KEY: "server-secret-without-site-key",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.security.bypassTurnstile).toBe(true);
  });

  it("hashes the client identifier before rate-limit storage", async () => {
    const hash = await hashIdentifier("203.0.113.5", "secret");
    expect(hash).not.toContain("203.0.113.5");
    expect(hash).toHaveLength(64);
  });
});
