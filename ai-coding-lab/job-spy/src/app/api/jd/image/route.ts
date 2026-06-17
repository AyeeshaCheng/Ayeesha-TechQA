import { initDb, getJdRecord } from "@/lib/db";
import fs from "fs";
import path from "path";

export async function GET(req: Request) {
  initDb();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  const record = getJdRecord(id);
  if (!record || !record.source_image_path) {
    return Response.json({ error: "Image not found" }, { status: 404 });
  }

  // Resolve to absolute path (handles both old relative and new absolute paths)
  const imagePath = path.resolve(record.source_image_path);
  if (!fs.existsSync(imagePath)) {
    return Response.json({ error: "Image file missing" }, { status: 404 });
  }

  const ext = path.extname(imagePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
  };
  const mimeType = mimeTypes[ext] || "image/png";

  const buffer = fs.readFileSync(imagePath);
  return new Response(buffer, {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "public, max-age=86400",
      "Content-Length": String(buffer.length),
    },
  });
}
