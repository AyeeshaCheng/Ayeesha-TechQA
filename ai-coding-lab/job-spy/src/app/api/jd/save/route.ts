import { initDb, saveJdRecord } from "@/lib/db";

export async function POST(req: Request) {
  initDb();
  const body = await req.json();
  saveJdRecord(body);
  return Response.json({ ok: true });
}
