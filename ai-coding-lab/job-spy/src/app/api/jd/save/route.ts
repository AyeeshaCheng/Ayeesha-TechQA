import { initDb, saveJdRecord, updateJdParsedJson } from "@/lib/db";

export async function POST(req: Request) {
  initDb();
  const body = await req.json();

  // Partial update: only update parsed_json (no raw_text / source_type)
  if (
    body.parsed_json !== undefined &&
    body.raw_text === undefined &&
    body.source_type === undefined &&
    body.source_image_path === undefined
  ) {
    updateJdParsedJson(body.id, body.parsed_json);
    return Response.json({ ok: true });
  }

  saveJdRecord(body);
  return Response.json({ ok: true });
}
