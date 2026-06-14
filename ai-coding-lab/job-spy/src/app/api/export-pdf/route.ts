import { initDb, updateMatchResultField, getDataDir } from "@/lib/db";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";

export async function POST(req: Request) {
  initDb();

  const body = (await req.json()) as {
    content: string;
    matchResultId?: string;
  };

  // Generate a simple HTML-based PDF using a pragmatic approach
  // For production @react-pdf/renderer, but for now HTML→PDF via a simple approach
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 2cm; }
    body { font-family: "SimSun", "Microsoft YaHei", sans-serif; font-size: 12pt; line-height: 1.8; color: #333; }
    h1 { font-size: 18pt; text-align: center; margin-bottom: 20px; }
    h2 { font-size: 14pt; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 20px; }
    h3 { font-size: 12pt; margin-top: 16px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 4px; }
    .section { margin-bottom: 16px; }
    pre { white-space: pre-wrap; font-family: inherit; }
  </style>
</head>
<body>
  <pre>${body.content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
</body>
</html>`;

  const dataDir = getDataDir();
  const exportsDir = path.join(dataDir, "exports");
  fs.mkdirSync(exportsDir, { recursive: true });

  const filename = `resume-${randomUUID().slice(0, 8)}.html`;
  const filePath = path.join(exportsDir, filename);
  fs.writeFileSync(filePath, html, "utf-8");

  const relativePath = `/data/exports/${filename}`;

  // Persist to match result
  if (body.matchResultId) {
    try {
      updateMatchResultField(body.matchResultId, "optimized_resume_pdf_path", relativePath);
    } catch { /* ignore */ }
  }

  // Return the HTML file as download (browser can "print to PDF")
  return new Response(fs.readFileSync(filePath), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="optimized-resume.html"`,
    },
  });
}
