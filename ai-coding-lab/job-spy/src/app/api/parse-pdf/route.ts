import { initDb, saveJdRecord } from "@/lib/db";
import { saveUploadedFile } from "@/lib/storage";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

// pdf-parse v2 uses class-based API: new PDFParse({ data }).getText()
async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text || "";
}

export async function POST(req: NextRequest) {
  initDb();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "No file uploaded" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Save original PDF
  const { relativePath } = saveUploadedFile(buffer, "resumes", file.name);

  // Parse PDF text
  let text = "";
  try {
    text = await parsePdfBuffer(buffer);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("PDF parse error:", msg);
    return Response.json({
      error: `PDF 解析失败: ${msg.slice(0, 200)}。请确认 PDF 包含可提取的文字（非扫描版图片）。`,
    }, { status: 422 });
  }

  if (!text.trim()) {
    return Response.json({ error: "No text extracted from PDF. The file may be scanned/image-based." }, { status: 422 });
  }

  // Save a JD record stub (not a JD, but we track all uploaded docs)
  const id = randomUUID();
  saveJdRecord({
    id,
    raw_text: text,
    parsed_json: null,
    source_image_path: relativePath,
    source_type: "image",
  });

  return Response.json({
    id,
    text: text.trim(),
    filePath: relativePath,
  });
}
