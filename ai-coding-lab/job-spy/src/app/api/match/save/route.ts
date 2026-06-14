import { initDb, saveMatchResult } from "@/lib/db";

export async function POST(req: Request) {
  initDb();
  const body = await req.json();
  saveMatchResult(body);
  return Response.json({ ok: true });
}
