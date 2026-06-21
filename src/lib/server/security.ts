import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const requiredKeys = [
  "OPENAI_API_KEY",
  "OPENAI_SPECIALIST_MODEL",
  "OPENAI_ADVISOR_MODEL",
  "TURNSTILE_SECRET_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

export type DeepDiveConfig = {
  openAIKey: string;
  specialistModel: string;
  advisorModel: string;
  turnstileSecret: string;
  upstashUrl: string;
  upstashToken: string;
};

export function getDeepDiveConfig(environment: Record<string, string | undefined>) {
  const missing = requiredKeys.filter((key) => !environment[key]?.trim());
  if (missing.length > 0) return { ok: false as const, missing: [...missing] };
  return {
    ok: true as const,
    config: {
      openAIKey: environment.OPENAI_API_KEY!,
      specialistModel: environment.OPENAI_SPECIALIST_MODEL!,
      advisorModel: environment.OPENAI_ADVISOR_MODEL!,
      turnstileSecret: environment.TURNSTILE_SECRET_KEY!,
      upstashUrl: environment.UPSTASH_REDIS_REST_URL!,
      upstashToken: environment.UPSTASH_REDIS_REST_TOKEN!,
    } satisfies DeepDiveConfig,
  };
}

type FetchLike = (
  input: string,
  init: RequestInit,
) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

export async function verifyTurnstile(
  token: string,
  remoteIdentifier: string,
  secret: string,
  fetcher: FetchLike = fetch,
) {
  const body = new URLSearchParams({
    secret,
    response: token,
    remoteip: remoteIdentifier,
  });
  const response = await fetcher(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body, signal: AbortSignal.timeout(8_000) },
  );
  if (!response.ok) return false;
  const payload = (await response.json()) as { success?: unknown };
  return payload.success === true;
}

export async function hashIdentifier(identifier: string, secret: string) {
  const bytes = new TextEncoder().encode(`${secret}:${identifier}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function checkRateLimits(config: DeepDiveConfig, identifier: string) {
  const redis = new Redis({ url: config.upstashUrl, token: config.upstashToken });
  const hourly = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    prefix: "dan-agent-f:hour",
  });
  const daily = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(10, "1 d"),
    prefix: "dan-agent-f:day",
  });
  const [hourResult, dayResult] = await Promise.all([
    hourly.limit(identifier),
    daily.limit(identifier),
  ]);
  return {
    allowed: hourResult.success && dayResult.success,
    reset: Math.max(hourResult.reset, dayResult.reset),
    remaining: Math.min(hourResult.remaining, dayResult.remaining),
  };
}
