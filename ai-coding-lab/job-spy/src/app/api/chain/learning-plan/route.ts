import { streamObject } from "ai";
import { getModel } from "@/lib/model";
import { learningPlanSchema } from "@/lib/schemas";
import { LEARNING_PLAN_SYSTEM, LEARNING_PLAN_USER } from "@/lib/prompts";
import { initDb, updateMatchResultField } from "@/lib/db";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    parsedJD: unknown;
    skillMatch: unknown;
    competitiveness?: unknown;
    matchResultId?: string;
  };

  const result = streamObject({
    model: getModel(),
    schema: learningPlanSchema,
    system: LEARNING_PLAN_SYSTEM,
    prompt: LEARNING_PLAN_USER(
      JSON.stringify(body.parsedJD, null, 2),
      JSON.stringify(body.skillMatch, null, 2),
      body.competitiveness ? JSON.stringify(body.competitiveness, null, 2) : undefined,
    ),
  });

  const encoder = new TextEncoder();
  let lastFull: unknown = null;

  const stream = new ReadableStream({
    async start(controller) {
      for await (const partial of result.partialObjectStream) {
        lastFull = partial;
        controller.enqueue(encoder.encode(JSON.stringify(partial) + "\n"));
      }
      controller.close();

      // Persist to DB
      if (body.matchResultId && lastFull) {
        try {
          updateMatchResultField(
            body.matchResultId,
            "learning_plan_json",
            JSON.stringify(lastFull),
          );
        } catch { /* ignore db errors in stream */ }
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson" },
  });
}
