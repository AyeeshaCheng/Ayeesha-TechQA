import { initDb, getJdRecords, getMatchResults, getJdRecord, getMatchResult, deleteJdRecord } from "@/lib/db";

export async function GET(req: Request) {
  initDb();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type") || "list";

  if (id && type === "detail") {
    const jd = getJdRecord(id);
    if (!jd) return Response.json({ error: "Not found" }, { status: 404 });
    const matches = getMatchResults(id);
    return Response.json({ jd, matches });
  }

  // List all JD records with their latest match
  const jdRecords = getJdRecords();
  const enriched = jdRecords.map((jd) => {
    const matches = getMatchResults(jd.id, 1);
    return {
      ...jd,
      latestMatch: matches[0] || null,
    };
  });

  return Response.json({ records: enriched });
}

export async function DELETE(req: Request) {
  initDb();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  deleteJdRecord(id);
  return Response.json({ ok: true });
}
