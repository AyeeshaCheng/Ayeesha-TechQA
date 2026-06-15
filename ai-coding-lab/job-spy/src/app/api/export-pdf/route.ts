import { initDb, updateMatchResultField, getDataDir } from "@/lib/db";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";

async function getBrowser() {
  const puppeteer = (await import("puppeteer-core")).default;
  // Use system Microsoft Edge (Chromium-based, pre-installed on Windows 10/11)
  const edgePaths = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  for (const ep of edgePaths) {
    if (fs.existsSync(ep)) {
      return await puppeteer.launch({ headless: true, executablePath: ep });
    }
  }
  throw new Error("Microsoft Edge not found. PDF generation requires a Chromium-based browser.");
}

export async function POST(req: Request) {
  initDb();

  const body = (await req.json()) as {
    content: string;
    matchResultId?: string;
  };

  if (!body.content?.trim()) {
    return Response.json({ error: "Content is empty" }, { status: 400 });
  }

  // Build styled HTML for the resume
  const safeContent = body.content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>优化简历</title>
  <style>
    @page { size: A4; margin: 2cm 2.5cm; }
    body {
      font-family: "Microsoft YaHei", "PingFang SC", "SimSun", "Noto Sans SC", sans-serif;
      font-size: 12pt;
      line-height: 1.8;
      color: #222;
      max-width: 100%;
    }
    h1 { font-size: 20pt; text-align: center; margin-bottom: 8px; color: #111; }
    h2 { font-size: 14pt; border-bottom: 1.5px solid #2563eb; padding-bottom: 4px; margin-top: 22px; color: #2563eb; }
    h3 { font-size: 12pt; margin-top: 14px; color: #333; }
    p { margin: 4px 0; }
    ul { padding-left: 22px; margin: 4px 0; }
    li { margin-bottom: 3px; }
    pre {
      white-space: pre-wrap;
      font-family: "Microsoft YaHei", "PingFang SC", "SimSun", sans-serif;
      font-size: 11pt;
      line-height: 1.7;
    }
    .header-info {
      text-align: center;
      font-size: 10pt;
      color: #666;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <pre>${safeContent}</pre>
</body>
</html>`;

  let browser;
  try {
    browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 15000 });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "2cm", bottom: "2cm", left: "2.5cm", right: "2.5cm" },
      displayHeaderFooter: false,
    });
    await browser.close();
    browser = undefined;

    // Save PDF to disk
    const dataDir = getDataDir();
    const exportsDir = path.join(dataDir, "exports");
    fs.mkdirSync(exportsDir, { recursive: true });

    const filename = `resume-${randomUUID().slice(0, 8)}.pdf`;
    const filePath = path.join(exportsDir, filename);
    fs.writeFileSync(filePath, pdfBuffer);

    const relativePath = `/data/exports/${filename}`;

    // Persist path to match result
    if (body.matchResultId) {
      try {
        updateMatchResultField(body.matchResultId, "optimized_resume_pdf_path", relativePath);
      } catch { /* ignore */ }
    }

    // Return PDF as downloadable response
    return new Response(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="optimized-resume.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("PDF generation error:", msg);
    return Response.json({ error: `PDF 生成失败: ${msg}` }, { status: 500 });
  } finally {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
  }
}
