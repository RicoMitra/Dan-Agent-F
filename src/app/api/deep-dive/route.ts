import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { deepDiveRequestSchema } from "@/lib/deep-dive-schema";
import { createOpenAIAgents } from "@/lib/server/agents";
import { fetchEngineEvidence } from "@/lib/server/evidence";
import { runDeepDive } from "@/lib/server/engine";
import {
  checkRateLimits,
  getDeepDiveConfig,
  hashIdentifier,
  verifyTurnstile,
} from "@/lib/server/security";
import type { DeepDiveStreamEvent } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const jsonError = (message: string, status: number, extra?: Record<string, unknown>) =>
  NextResponse.json({ error: message, ...extra }, { status });

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }
  const parsed = deepDiveRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Deep Dive input is invalid.", 400, {
      issues: parsed.error.issues.map((issue) => issue.message),
    });
  }

  const configuration = getDeepDiveConfig(process.env);
  if (!configuration.ok) {
    return jsonError("Live Deep Dive is not configured on this deployment.", 503, {
      missing: configuration.missing,
    });
  }
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const verified = await verifyTurnstile(
    parsed.data.turnstileToken,
    clientIp,
    configuration.config.turnstileSecret,
  );
  if (!verified) return jsonError("Human verification failed. Please try again.", 403);

  const identifier = await hashIdentifier(clientIp, configuration.config.turnstileSecret);
  const limit = await checkRateLimits(configuration.config, identifier);
  if (!limit.allowed) {
    return jsonError("Deep Dive limit reached. Try again after the reset time.", 429, {
      resetAt: new Date(limit.reset).toISOString(),
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: DeepDiveStreamEvent) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        const client = new OpenAI({ apiKey: configuration.config.openAIKey });
        const agents = createOpenAIAgents(
          client as unknown as Parameters<typeof createOpenAIAgents>[0],
          configuration.config.specialistModel,
          configuration.config.advisorModel,
        );
        const report = await runDeepDive(
          parsed.data.portfolio,
          {
            fetchEvidence: fetchEngineEvidence,
            runSpecialist: agents.runSpecialist,
            runAdvisor: agents.runAdvisor,
            now: () => new Date(),
            createId: () => crypto.randomUUID(),
          },
          (progress) => emit({ type: "progress", ...progress }),
        );
        emit({ type: "report", report });
      } catch {
        emit({
          type: "error",
          message: "Deep Dive could not complete. Portfolio data was not stored; retry after checking source availability.",
          recoverable: true,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
