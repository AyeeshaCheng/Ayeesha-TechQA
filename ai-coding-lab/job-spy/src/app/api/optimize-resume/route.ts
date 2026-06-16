import { streamObject } from "ai";
import { getModel } from "@/lib/model";
import { optimizedResumeSchema } from "@/lib/schemas";
import { RESUME_OPTIMIZE_SYSTEM, RESUME_OPTIMIZE_USER } from "@/lib/prompts";
import { initDb, updateMatchResultField } from "@/lib/db";

export async function POST(req: Request) {
  initDb();

  const body = (await req.json()) as {
    originalResume: string;
    jdSummary: string;
    chatHighlights?: string;
    matchResultId?: string;
  };

  // Use streamObject — same approach as chain steps, works reliably with DeepSeek
  const result = streamObject({
    model: getModel(),
    schema: optimizedResumeSchema,
    system: RESUME_OPTIMIZE_SYSTEM,
    prompt: RESUME_OPTIMIZE_USER(
      body.originalResume,
      body.jdSummary,
      body.chatHighlights || "",
    ),
    onFinish: async ({ object }) => {
      if (body.matchResultId && object) {
        try {
          updateMatchResultField(
            body.matchResultId,
            "optimized_resume_text",
            JSON.stringify(object),
          );
          console.log("[optimize-resume] Persisted to DB for matchResultId:", body.matchResultId);
        } catch (err) {
          console.error("[optimize-resume] DB persist error:", err);
        }
      }
    },
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let count = 0;
        for await (const partial of result.partialObjectStream) {
          count++;
          controller.enqueue(encoder.encode(JSON.stringify(partial) + "\n"));
        }
        console.log("[optimize-resume] Streamed", count, "partial objects");
      } catch (err) {
        console.error("[optimize-resume] Stream error:", err);
        controller.error(err);
        return;
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson" },
  });
}
