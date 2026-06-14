import { streamObject } from "ai";
import { getModel } from "@/lib/model";
import { careerStrategySchema } from "@/lib/schemas";
import { CAREER_STRATEGY_SYSTEM, CAREER_STRATEGY_USER } from "@/lib/prompts";
import { initDb, getJdRecords, getMatchResults } from "@/lib/db";

export async function POST(req: Request) {
  initDb();

  const body = (await req.json()) as { jdIds: string[]; resumeSummary?: string };
  const { jdIds, resumeSummary } = body;

  // Fetch JD records
  const allJds = getJdRecords();
  const selectedJds = jdIds.length > 0
    ? allJds.filter((jd) => jdIds.includes(jd.id))
    : allJds.slice(0, 10); // Default: latest 10

  if (selectedJds.length === 0) {
    return Response.json({ error: "没有可分析的JD，请先上传JD" }, { status: 400 });
  }

  // Build summary of all JDs
  const jdSummaries = selectedJds
    .map((jd, i) => {
      const title = (() => {
        try {
          if (jd.parsed_json) return JSON.parse(jd.parsed_json).jobTitle || "未知岗位";
        } catch { /* ignore */ }
        return jd.raw_text.slice(0, 40);
      })();
      return `\n### JD #${i + 1}: ${title}\n${jd.raw_text.slice(0, 2000)}`;
    })
    .join("\n---\n");

  const result = streamObject({
    model: getModel(),
    schema: careerStrategySchema,
    system: CAREER_STRATEGY_SYSTEM,
    prompt: CAREER_STRATEGY_USER(jdSummaries, resumeSummary || ""),
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const partial of result.partialObjectStream) {
        controller.enqueue(encoder.encode(JSON.stringify(partial) + "\n"));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson" },
  });
}
