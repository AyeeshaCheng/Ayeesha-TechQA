import { streamText } from "ai";
import { getModel } from "@/lib/model";
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

  const result = streamText({
    model: getModel(),
    system: RESUME_OPTIMIZE_SYSTEM,
    prompt: RESUME_OPTIMIZE_USER(
      body.originalResume,
      body.jdSummary,
      body.chatHighlights || "",
    ),
    onFinish: async ({ text }) => {
      if (body.matchResultId) {
        try {
          updateMatchResultField(body.matchResultId, "optimized_resume_text", text);
        } catch { /* ignore */ }
      }
    },
  });

  return result.toTextStreamResponse();
}
