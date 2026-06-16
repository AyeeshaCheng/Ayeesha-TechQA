import { initDb, updateMatchResultField, getDataDir } from "@/lib/db";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";

// ── HTML escape helper ──
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Render a single highlight bullet ──
function renderHighlight(h: string): string {
  return `<li>${esc(h)}</li>`;
}

// ── Photo path (relative to project root) ──
const PHOTO_PATH = path.join(process.cwd(), "public", "photo.jpg");

// ── Build the full resume HTML from JSON ──
function buildResumeHtml(json: Record<string, unknown>, photoBase64?: string): string {
  const photoSrc = photoBase64 ? `data:image/jpeg;base64,${photoBase64}` : "";
  const pi = (json.personalInfo || {}) as Record<string, unknown>;
  const name = esc(String(pi.name || ""));
  const phone = esc(String(pi.phone || ""));
  const email = esc(String(pi.email || ""));
  const jobTitle = esc(String(pi.jobTitle || ""));
  const yearsExp = pi.yearsOfExperience ? `${pi.yearsOfExperience}年经验` : "";
  const salary = esc(String(pi.expectedSalary || ""));
  const city = esc(String(pi.expectedCity || ""));

  // Contact line
  const contactParts = [phone, email, jobTitle, yearsExp].filter(Boolean);
  const metaParts = [salary, city].filter(Boolean);

  // Skills
  const skills = (Array.isArray(json.skills) ? json.skills : []) as Array<{
    category: string;
    items: string[];
  }>;

  // Work experience
  const workExp = (Array.isArray(json.workExperience) ? json.workExperience : []) as Array<{
    company: string;
    role: string;
    period: string;
    highlights: string[];
  }>;

  // Project experience
  const projExp = (Array.isArray(json.projectExperience) ? json.projectExperience : []) as Array<{
    name: string;
    role: string;
    description: string;
    highlights: string[];
  }>;

  // Education
  const edu = (Array.isArray(json.education) ? json.education : []) as Array<{
    school: string;
    degree: string;
    major: string;
    period: string;
  }>;

  // Certifications
  const certs = (Array.isArray(json.certifications) ? json.certifications : []) as string[];

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${name} - 个人简历</title>
<style>
  @page { size: A4; margin: 1.8cm 2cm 1.8cm 2cm; }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", sans-serif;
    font-size: 11pt;
    line-height: 1.7;
    color: #1a1a1a;
    max-width: 100%;
  }

  /* ── Header ── */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
    padding-bottom: 16px;
    border-bottom: 2px solid #1a56db;
    gap: 20px;
  }
  .header-left {
    flex: 1;
    text-align: left;
  }
  .header .name {
    font-size: 22pt;
    font-weight: 700;
    color: #111;
    letter-spacing: 2px;
    margin-bottom: 6px;
  }
  .header .contact {
    font-size: 10pt;
    color: #555;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 18px;
  }
  .header .contact span { white-space: nowrap; }
  .header .meta {
    font-size: 10pt;
    color: #777;
    margin-top: 4px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 18px;
  }
  .header-photo {
    width: 90px;
    height: 120px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid #d0d7e8;
    flex-shrink: 0;
  }

  /* ── Sections ── */
  .section {
    margin-top: 18px;
  }
  .section-title {
    font-size: 13pt;
    font-weight: 700;
    color: #1a56db;
    border-bottom: 1px solid #d0d7e8;
    padding-bottom: 4px;
    margin-bottom: 10px;
    letter-spacing: 1px;
  }

  /* ── Professional Summary ── */
  .summary {
    background: #f4f6fb;
    border-left: 3px solid #1a56db;
    padding: 10px 14px;
    border-radius: 3px;
    font-size: 10.5pt;
    line-height: 1.75;
    color: #333;
  }

  /* ── Skills ── */
  .skill-group {
    margin-bottom: 8px;
  }
  .skill-cat {
    font-weight: 600;
    font-size: 10.5pt;
    color: #333;
    display: inline-block;
    min-width: 90px;
  }
  .skill-tags {
    display: inline;
  }
  .skill-tag {
    display: inline-block;
    background: #e8edf5;
    color: #2c3e6b;
    font-size: 9.5pt;
    padding: 1px 8px;
    border-radius: 2px;
    margin: 2px 4px 2px 0;
  }

  /* ── Experience items ── */
  .exp-item {
    margin-bottom: 14px;
  }
  .exp-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 4px;
  }
  .exp-company {
    font-weight: 700;
    font-size: 11pt;
    color: #111;
  }
  .exp-role {
    font-weight: 500;
    color: #444;
    margin-left: 8px;
  }
  .exp-period {
    font-size: 10pt;
    color: #888;
    white-space: nowrap;
  }
  .exp-highlights {
    list-style: none;
    padding-left: 0;
  }
  .exp-highlights li {
    position: relative;
    padding-left: 16px;
    margin-bottom: 3px;
    font-size: 10.5pt;
    line-height: 1.65;
    color: #333;
  }
  .exp-highlights li::before {
    content: "▸";
    position: absolute;
    left: 0;
    color: #1a56db;
    font-size: 9pt;
  }

  /* ── Project items ── */
  .proj-item {
    margin-bottom: 12px;
    padding: 8px 12px;
    background: #fafbfd;
    border-radius: 4px;
    border: 1px solid #e8ecf2;
  }
  .proj-name {
    font-weight: 700;
    font-size: 11pt;
    color: #1a56db;
  }
  .proj-role {
    font-size: 10pt;
    color: #666;
    margin-left: 8px;
  }
  .proj-desc {
    font-size: 10pt;
    color: #555;
    margin: 4px 0;
  }

  /* ── Education ── */
  .edu-item {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 5px;
    font-size: 10.5pt;
  }
  .edu-school { font-weight: 600; color: #111; }
  .edu-degree { color: #555; margin-left: 8px; }
  .edu-period { font-size: 10pt; color: #888; white-space: nowrap; }

  /* ── Certifications ── */
  .cert-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .cert-tag {
    background: #f0f4e8;
    color: #4a5c2e;
    font-size: 9.5pt;
    padding: 2px 10px;
    border-radius: 3px;
    border: 1px solid #d8e2c8;
  }

  /* ── Utility ── */
  .text-muted { color: #999; font-size: 10pt; font-style: italic; }
</style>
</head>
<body>

<!-- HEADER -->
<div class="header">
  <div class="header-left">
    <div class="name">${name}</div>
    <div class="contact">
      ${contactParts.map((c) => `<span>${c}</span>`).join("")}
    </div>
    ${metaParts.length > 0 ? `<div class="meta">${metaParts.map((m) => `<span>${m}</span>`).join("")}</div>` : ""}
  </div>
  ${photoSrc ? `<img class="header-photo" src="${photoSrc}" alt="证件照" />` : ""}
</div>

<!-- PROFESSIONAL SUMMARY -->
${json.professionalSummary ? `
<div class="section">
  <div class="section-title">职业摘要</div>
  <div class="summary">${esc(String(json.professionalSummary))}</div>
</div>` : ""}

<!-- SKILLS -->
${skills.length > 0 ? `
<div class="section">
  <div class="section-title">专业技能</div>
  ${skills.map((sg) => `
  <div class="skill-group">
    <span class="skill-cat">${esc(sg.category)}</span>
    <span class="skill-tags">${(sg.items || []).map((item) => `<span class="skill-tag">${esc(item)}</span>`).join("")}</span>
  </div>`).join("")}
</div>` : ""}

<!-- PROJECT EXPERIENCE -->
${projExp.length > 0 ? `
<div class="section">
  <div class="section-title">项目经历</div>
  ${projExp.map((pe) => `
  <div class="proj-item">
    <div class="exp-header">
      <div>
        <span class="proj-name">${esc(pe.name)}</span>
        <span class="proj-role">${esc(pe.role)}</span>
      </div>
    </div>
    ${pe.description ? `<div class="proj-desc">${esc(pe.description)}</div>` : ""}
    ${(pe.highlights || []).length > 0 ? `
    <ul class="exp-highlights">
      ${pe.highlights.map(renderHighlight).join("")}
    </ul>` : ""}
  </div>`).join("")}
</div>` : ""}

<!-- WORK EXPERIENCE -->
${workExp.length > 0 ? `
<div class="section">
  <div class="section-title">工作经历</div>
  ${workExp.map((we) => `
  <div class="exp-item">
    <div class="exp-header">
      <div>
        <span class="exp-company">${esc(we.company)}</span>
        <span class="exp-role">${esc(we.role)}</span>
      </div>
      <span class="exp-period">${esc(we.period || "")}</span>
    </div>
    ${(we.highlights || []).length > 0 ? `
    <ul class="exp-highlights">
      ${we.highlights.map(renderHighlight).join("")}
    </ul>` : ""}
  </div>`).join("")}
</div>` : ""}

<!-- EDUCATION -->
${edu.length > 0 ? `
<div class="section">
  <div class="section-title">教育背景</div>
  ${edu.map((e) => `
  <div class="edu-item">
    <div>
      <span class="edu-school">${esc(e.school)}</span>
      <span class="edu-degree">${esc(e.degree)} · ${esc(e.major)}</span>
    </div>
    <span class="edu-period">${esc(e.period || "")}</span>
  </div>`).join("")}
</div>` : ""}

<!-- CERTIFICATIONS -->
${certs.length > 0 ? `
<div class="section">
  <div class="section-title">资格证书</div>
  <div class="cert-list">
    ${certs.map((c) => `<span class="cert-tag">${esc(c)}</span>`).join("")}
  </div>
</div>` : ""}

</body>
</html>`;
}

// ── Browser launcher ──
async function getBrowser() {
  const puppeteer = (await import("puppeteer-core")).default;
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

// ── POST handler ──
export async function POST(req: Request) {
  initDb();

  const body = (await req.json()) as {
    resumeJson?: Record<string, unknown>;
    content?: string; // legacy: plain text fallback
    matchResultId?: string;
  };

  // Load photo as base64 if available
  let photoBase64: string | undefined;
  try {
    if (fs.existsSync(PHOTO_PATH)) {
      photoBase64 = fs.readFileSync(PHOTO_PATH).toString("base64");
    }
  } catch { /* photo not available */ }

  // If we got structured JSON, render it; otherwise fall back to legacy plain-text mode
  let html: string;
  if (body.resumeJson && typeof body.resumeJson === "object") {
    html = buildResumeHtml(body.resumeJson, photoBase64);
  } else if (body.content?.trim()) {
    // Legacy: plain text wrapped in <pre>
    const safeContent = body.content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    html = `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>优化简历</title>
<style>
  @page { size: A4; margin: 2cm 2.5cm; }
  body { font-family: "Microsoft YaHei", "PingFang SC", sans-serif; font-size: 12pt; line-height: 1.8; color: #222; }
  h1 { font-size: 20pt; text-align: center; margin-bottom: 8px; }
  h2 { font-size: 14pt; border-bottom: 1.5px solid #2563eb; padding-bottom: 4px; margin-top: 22px; color: #2563eb; }
  pre { white-space: pre-wrap; font-family: "Microsoft YaHei", "PingFang SC", sans-serif; font-size: 11pt; line-height: 1.7; }
</style></head>
<body><pre>${safeContent}</pre></body></html>`;
  } else {
    return Response.json({ error: "Content is empty" }, { status: 400 });
  }

  let browser;
  try {
    browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 15000 });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0.6cm", bottom: "0.6cm", left: "0.6cm", right: "0.6cm" },
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
