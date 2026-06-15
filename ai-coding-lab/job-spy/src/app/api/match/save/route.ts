import { initDb, saveMatchResult, updateMatchResultField } from "@/lib/db";

export async function POST(req: Request) {
  initDb();
  const body = await req.json();

  // Single-field partial update: only id + one JSON field (no jd_record_id / resume_snapshot)
  const jsonFields = [
    "skill_match_json",
    "competitiveness_json",
    "strategy_json",
    "optimized_resume_text",
    "optimized_resume_pdf_path",
    "learning_plan_json",
  ] as const;
  const presentJsonFields = jsonFields.filter((f) => body[f] !== undefined);

  if (
    presentJsonFields.length === 1 &&
    body.jd_record_id === undefined &&
    body.resume_snapshot === undefined
  ) {
    updateMatchResultField(
      body.id,
      presentJsonFields[0] as (typeof jsonFields)[number],
      body[presentJsonFields[0]],
    );
    return Response.json({ ok: true });
  }

  saveMatchResult(body);
  return Response.json({ ok: true });
}
