import { streamObject } from "ai";
import { getModel } from "@/lib/model";
import { careerStrategySchema } from "@/lib/schemas";
import { CAREER_STRATEGY_SYSTEM, CAREER_STRATEGY_USER } from "@/lib/prompts";
import { initDb, getJdRecords } from "@/lib/db";

export async function POST(req: Request) {
  initDb();

  let body: { jdIds: string[]; resumeSummary?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const { jdIds, resumeSummary } = body;

  // Fetch JD records
  const allJds = getJdRecords();
  const selectedJds = jdIds && jdIds.length > 0
    ? allJds.filter((jd) => jdIds.includes(jd.id))
    : allJds.slice(0, 10); // Default: latest 10

  if (selectedJds.length === 0) {
    return Response.json({ error: "没有可分析的JD，请先在「JD定制简历」中上传并分析JD" }, { status: 400 });
  }

  // Build summary of all JDs — include parsed JSON fields for richer context
  const jdSummaries = selectedJds
    .map((jd, i) => {
      let title = "未知岗位";
      let company = "";
      let salary = "";
      let location = "";
      try {
        if (jd.parsed_json) {
          const p = JSON.parse(jd.parsed_json);
          // Handle 3 DeepSeek field name formats (schema / Chinese / snake_case)
          title = p.jobTitle || p.岗位名称 || p.job_title || title;
          company = p.company || p.公司名称 || p.company_name || "";
          const sr = p.salaryRange || p.薪资范围 || p.salary;
          if (sr && typeof sr === "object") {
            salary = `${(sr.min || 0) / 1000}K-${(sr.max || 0) / 1000}K ${sr.currency || "CNY"}`;
          }
          location = p.location || p.工作地点 || "";
        }
      } catch { /* ignore */ }

      const header = [title, company, salary, location].filter(Boolean).join(" · ");
      return `\n### JD #${i + 1}: ${header}\n${jd.raw_text.slice(0, 2000)}`;
    })
    .join("\n---\n");

  console.log("[career-strategy] Analyzing", selectedJds.length, "JDs, summary length:", jdSummaries.length);

  // Use streamObject — same approach as chain steps (parse-jd, match-skills, etc.)
  // which works reliably with DeepSeek's json_object mode via the deepseekFetch interceptor
  const result = streamObject({
    model: getModel(),
    schema: careerStrategySchema,
    system: CAREER_STRATEGY_SYSTEM,
    prompt: CAREER_STRATEGY_USER(jdSummaries, resumeSummary || ""),
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
        console.log("[career-strategy] Streamed", count, "partial objects");
      } catch (err) {
        console.error("[career-strategy] Stream error:", err);
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
