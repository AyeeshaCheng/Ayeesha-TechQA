"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/FileUpload";
import { User, Plus, X, Save, CheckCircle, Loader2 } from "lucide-react";
import type { ResumeData } from "@/lib/schemas";
import { getResume, saveResume } from "@/lib/store";

interface ResumePanelProps {
  resume: ResumeData | null;
  onResumeChange: (resume: ResumeData) => void;
}

const DEFAULT_RESUME: ResumeData = {
  name: "",
  phone: "",
  email: "",
  yearsOfExperience: 0,
  jobTitle: "",
  expectedSalary: "",
  expectedCity: "",
  skills: [],
  personalAdvantage: "",
  projectExperience: "",
  workExperience: "",
  education: "",
  certifications: "",
};

/** Migrate old localStorage resume schema (6 fields) to new 11-field schema */
function migrateResume(stored: Record<string, unknown>): ResumeData {
  return {
    name: typeof stored.name === "string" ? stored.name : "",
    phone: typeof stored.phone === "string" ? stored.phone : "",
    email: typeof stored.email === "string" ? stored.email : "",
    yearsOfExperience: typeof stored.yearsOfExperience === "number" ? stored.yearsOfExperience : 0,
    // Handle old `title` field → new `jobTitle`
    jobTitle:
      (typeof stored.jobTitle === "string" ? stored.jobTitle : "") ||
      (typeof (stored as any).title === "string" ? (stored as any).title : ""),
    expectedSalary: typeof stored.expectedSalary === "string" ? stored.expectedSalary : "",
    expectedCity: typeof stored.expectedCity === "string" ? stored.expectedCity : "",
    skills: Array.isArray(stored.skills) ? stored.skills.filter((s): s is string => typeof s === "string") : [],
    personalAdvantage: typeof stored.personalAdvantage === "string" ? stored.personalAdvantage : "",
    projectExperience: typeof stored.projectExperience === "string" ? stored.projectExperience : "",
    workExperience: typeof stored.workExperience === "string" ? stored.workExperience : "",
    education: typeof stored.education === "string" ? stored.education : "",
    certifications: typeof stored.certifications === "string" ? stored.certifications : "",
  };
}

export function ResumePanel({ resume, onResumeChange }: ResumePanelProps) {
  const [form, setForm] = useState<ResumeData>(resume || DEFAULT_RESUME);
  const [skillInput, setSkillInput] = useState("");
  const [saved, setSaved] = useState(false);

  // PDF upload state
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfDone, setPdfDone] = useState(false);
  const [pdfError, setPdfError] = useState("");

  useEffect(() => {
    const stored = getResume();
    if (stored) {
      const migrated = migrateResume(stored);
      setForm(migrated);
      onResumeChange(migrated);
    }
  }, []);

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !form.skills.includes(skill)) {
      const updated = { ...form, skills: [...form.skills, skill] };
      setForm(updated);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setForm({ ...form, skills: form.skills.filter((s) => s !== skill) });
  };

  const handleSave = () => {
    saveResume(form);
    onResumeChange(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const parsePdfFile = async (file: File) => {
    setPdfLoading(true);
    setPdfError("");
    setPdfDone(false);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error((err as any).error || "PDF 解析失败");
      }
      const data = await res.json();
      const fullText: string = data.text;
      // Merge fragmented lines: if a line ends with comma/Chinese comma/semicolon, append next line
      const rawLines = fullText.split("\n").map((l: string) => l.trim()).filter(Boolean);
      const lines: string[] = [];
      for (let i = 0; i < rawLines.length; i++) {
        let merged = rawLines[i];
        while (
          i + 1 < rawLines.length &&
          /[,，、;；:：·]\s*$/.test(merged) &&
          rawLines[i + 1].length > 0 &&
          !/^[\d一二三四五六七八九十]+[、.]/.test(rawLines[i + 1]) &&
          !/^(工作|项目|教育|个人|自我|联系|基本|语言|技能|专业)/.test(rawLines[i + 1])
        ) {
          i++;
          merged += " " + rawLines[i];
        }
        lines.push(merged);
      }

      const updated = { ...form };

      // 1) Name: find first short line (2-10 chars, not dominated by digits)
      for (const line of lines) {
        const cleaned = line.replace(/[\s|•·｜]/g, "").trim();
        if (cleaned.length >= 2 && cleaned.length <= 10 && !/\d{4,}/.test(cleaned)) {
          updated.name = cleaned;
          break;
        }
      }

      // 2) Phone: Chinese mobile (1[3-9]\d{9}) or landline
      const phoneMatch = fullText.match(
        /(?:电话|手机|联系方式|Tel|Phone|联系电话)?[：:\s]*(\+?86[-\s]?)?(1[3-9]\d{9}|\d{3,4}[-\s]?\d{7,8})/i,
      );
      if (phoneMatch) {
        const raw = phoneMatch[2] ? phoneMatch[0].replace(/^[^+\d]+/, "") : phoneMatch[0];
        updated.phone = raw.replace(/[^\d+]/g, "").slice(0, 20);
      }

      // 3) Email
      const emailMatch = fullText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) {
        updated.email = emailMatch[1];
      }

      // 4) Years of experience: "X年" pattern
      for (const line of lines) {
        const yrMatch = line.match(/(\d{1,2})\s*年/);
        if (yrMatch) {
          updated.yearsOfExperience = parseInt(yrMatch[1]);
          break;
        }
      }

      // 5) Job title: lines with 求职意向/意向岗位/应聘/期望职位
      for (const line of lines) {
        if (/求职意向|意向[岗职]|应聘[岗职]|期望[岗职位]|目标[岗职位]/.test(line)) {
          updated.jobTitle = line.replace(/(求职意向|意向[岗职]|应聘[岗职]|期望[岗职位]|目标[岗职位])[：:\s]*/, "").trim();
          break;
        }
      }
      // Fallback: use second short meaningful line as job title
      if (!updated.jobTitle) {
        for (const line of lines) {
          const cleaned = line.replace(/[\s|•·｜]/g, "").trim();
          if (cleaned.length >= 3 && cleaned.length <= 20 && !/\d{4,}/.test(cleaned) && cleaned !== updated.name) {
            if (/工程师|经理|设计师|开发|测试|运营|产品|主管|总监|专员|助理|顾问/.test(cleaned)) {
              updated.jobTitle = cleaned;
              break;
            }
          }
        }
      }

      // 6) Expected salary: lines with 薪资/薪酬/期望
      for (const line of lines) {
        if (/薪[资酬]|期望薪资|薪酬|月薪|年薪/.test(line)) {
          updated.expectedSalary = line.replace(/(期望)?薪[资酬]?[：:\s]*/, "").replace(/月薪|年薪/, "").trim();
          break;
        }
      }

      // 7) Expected city: lines with 城市/地点/期望城市
      for (const line of lines) {
        if (/城[市]|地[点址]|期望城|工作地/.test(line)) {
          updated.expectedCity = line.replace(/(期望)?(工作)?(城[市]|地[点址])[：:\s]*/, "").trim();
          break;
        }
      }

      // 8) Skills: block after "技能" / "专业技能" label
      let skillsLines: string[] = [];
      let inSkills = false;
      for (const line of lines) {
        if (/^(专业)?技能[：:\s]*$/.test(line) || /^技能标签/.test(line)) {
          inSkills = true;
          continue;
        }
        if (inSkills) {
          if (line.length < 3 || /^(工作|项目|教育|个人|自我|联系方式|基本|语言)/.test(line)) {
            inSkills = false;
            continue;
          }
          skillsLines.push(line);
        }
      }
      if (skillsLines.length > 0) {
        const skillTokens = skillsLines
          .join(" ")
          .split(/[,，、\s|/·•；;]+/)
          .map((s) => s.trim())
          .filter((s) => s.length >= 2 && s.length <= 25);
        if (skillTokens.length > 0) {
          updated.skills = skillTokens;
        }
      }

      // 9) Personal advantage: "个人优势" / "自我评价" block
      let advantageText = "";
      for (let i = 0; i < lines.length; i++) {
        if (/个人优势|自我评价|个人简介|个人总结|核心竞争力/.test(lines[i])) {
          const block = lines.slice(i + 1, i + 8).join("\n");
          if (block.length > 10) {
            updated.personalAdvantage = block;
            advantageText = block;
          }
          break;
        }
      }

      // 10) Skills from personal advantage: scan for common tech keywords
      if (advantageText) {
        const TECH_KEYWORDS = [
          "Python", "Java", "JavaScript", "TypeScript", "Go", "Rust", "C\\+\\+", "C#", "PHP", "Ruby",
          "Swift", "Kotlin", "Scala", "R", "MATLAB", "Shell", "Bash",
          "React", "Vue", "Angular", "Next\\.js", "Nuxt", "Svelte", "jQuery", "Express", "Koa", "Nest",
          "Django", "Flask", "FastAPI", "Spring", "MyBatis", "Hibernate", "Gin", "Echo", "Rails",
          "Node\\.js", "Deno", "Bun",
          "Selenium", "Playwright", "Cypress", "Puppeteer", "Jest", "Mocha", "JUnit", "TestNG", "Appium",
          "Postman", "Swagger", "OpenAPI", "JMeter", "Locust",
          "Docker", "Kubernetes", "K8s", "Jenkins", "GitLab CI", "GitHub Actions", "CircleCI", "Travis",
          "Terraform", "Ansible", "Pulumi", "Helm", "Prometheus", "Grafana", "ELK",
          "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "Oracle", "SQL Server",
          "SQLite", "Cassandra", "DynamoDB", "Neo4j", "Kafka", "RabbitMQ", "ActiveMQ",
          "Git", "SVN", "Mercurial",
          "AWS", "Azure", "GCP", "Alibaba Cloud", "Cloudflare",
          "HTML", "CSS", "Sass", "Less", "Tailwind", "Bootstrap", "Material UI", "Ant Design",
          "Webpack", "Vite", "Rollup", "esbuild", "Babel", "ESLint", "Prettier",
          "Linux", "Unix", "Windows Server", "Nginx", "Apache", "Tomcat",
          "TCP/IP", "HTTP", "RESTful", "GraphQL", "gRPC", "WebSocket",
          "微服务", "分布式", "敏捷开发", "Scrum", "DevOps", "CI/CD", "自动化测试",
          "Figma", "Sketch", "Adobe XD", "Photoshop",
        ];
        const foundSkills: string[] = [];
        for (const kw of TECH_KEYWORDS) {
          const regex = new RegExp(kw.replace(/\\\\/g, "\\"), "i");
          if (regex.test(advantageText) && !updated.skills.some((s) => regex.test(s))) {
            // Extract the matched keyword in proper case
            foundSkills.push(kw.replace(/\\\\/g, "").replace(/\\/g, ""));
          }
        }
        if (foundSkills.length > 0) {
          updated.skills = [...new Set([...updated.skills, ...foundSkills])];
        }
      }

      // 11) Project experience: "项目经历" / "项目经验" block
      for (let i = 0; i < lines.length; i++) {
        if (/项目[经经]历|项目经验|项目业绩/.test(lines[i])) {
          const block = lines.slice(i + 1, i + 20).join("\n");
          if (block.length > 10) updated.projectExperience = block;
          break;
        }
      }

      // 12) Work experience: "工作经历" / "工作经验" block
      for (let i = 0; i < lines.length; i++) {
        if (/工作[经经]历|工作经验|任职经历|职业经历/.test(lines[i])) {
          const block = lines.slice(i + 1, i + 20).join("\n");
          if (block.length > 10) updated.workExperience = block;
          break;
        }
      }
      // Fallback: if workExperience still empty, fill with full text (user can edit)
      if (!updated.workExperience) {
        updated.workExperience = fullText.slice(0, 2000);
      }

      // 13) Education: "教育经历" / "教育背景" block
      for (let i = 0; i < lines.length; i++) {
        if (/教育[经背]历|教育背景|学历|毕业院校/.test(lines[i])) {
          const block = lines.slice(i + 1, i + 8).join("\n");
          if (block.length > 5) updated.education = block;
          break;
        }
      }

      // 14) Certifications: "资格证书" / "证书" block
      for (let i = 0; i < lines.length; i++) {
        if (/资格证[书明]|证书[奖]|所获证书|专业证书|认证/.test(lines[i])) {
          const block = lines.slice(i + 1, i + 8).join("\n");
          if (block.length > 3) updated.certifications = block;
          break;
        }
      }

      setForm(updated);
      onResumeChange(updated);
      setPdfDone(true);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "PDF 解析失败");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleFillSamplePdf = () => {
    fetch("/samples/resume-sample.pdf")
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], "简历示例.pdf", { type: "application/pdf" });
        parsePdfFile(file);
      })
      .catch(() => setPdfError("加载示例 PDF 失败"));
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4 text-primary" />
          我的简历
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* PDF Upload — always visible at top */}
        <FileUpload
          accept=".pdf"
          maxSizeMB={10}
          label="上传简历 PDF"
          hint="拖拽或点击上传，自动解析并填充下方表单"
          onUpload={parsePdfFile}
        />

        {/* Fill sample link */}
        <button
          type="button"
          onClick={handleFillSamplePdf}
          className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors"
        >
          填入示例PDF
        </button>

        {/* Status indicators */}
        {pdfLoading && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            正在解析 PDF 简历...
          </p>
        )}
        {pdfDone && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            解析完成，已自动填充下方表单，可手动修改
          </p>
        )}
        {pdfError && (
          <p className="text-sm text-destructive">{pdfError}</p>
        )}

        {/* Divider */}
        <div className="border-t border-border/30" />

        {/* Row A: 姓名 / 电话 / 邮箱 */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">姓名</label>
            <Input
              placeholder="你的名字"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">电话</label>
            <Input
              placeholder="手机号"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">邮箱</label>
            <Input
              placeholder="email@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>

        {/* Row B: 求职意向 / 工作经验年限 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">求职意向</label>
            <Input
              placeholder="期望职位"
              value={form.jobTitle}
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">工作经验年限</label>
            <Input
              type="number"
              min={0}
              value={form.yearsOfExperience}
              onChange={(e) => setForm({ ...form, yearsOfExperience: Number(e.target.value) })}
              className="mt-1 w-24"
            />
          </div>
        </div>

        {/* Row C: 期望薪资 / 期望城市 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">期望薪资</label>
            <Input
              placeholder="如: 20K-30K"
              value={form.expectedSalary}
              onChange={(e) => setForm({ ...form, expectedSalary: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">期望城市</label>
            <Input
              placeholder="如: 北京"
              value={form.expectedCity}
              onChange={(e) => setForm({ ...form, expectedCity: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="text-xs text-muted-foreground">技能</label>
          <div className="mt-1 flex gap-2">
            <Input
              placeholder="添加技能，回车确认"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={addSkill}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {form.skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                {skill}
                <button onClick={() => removeSkill(skill)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {form.skills.length === 0 && (
              <span className="text-xs text-muted-foreground">还没有添加技能</span>
            )}
          </div>
        </div>

        {/* 个人优势 */}
        <div>
          <label className="text-xs text-muted-foreground">个人优势</label>
          <Textarea
            placeholder="简述个人优势、自我评价..."
            value={form.personalAdvantage}
            onChange={(e) => setForm({ ...form, personalAdvantage: e.target.value })}
            className="mt-1 min-h-[70px] text-sm"
          />
        </div>

        {/* 项目经历 */}
        <div>
          <label className="text-xs text-muted-foreground">项目经历</label>
          <Textarea
            placeholder="描述项目经历..."
            value={form.projectExperience}
            onChange={(e) => setForm({ ...form, projectExperience: e.target.value })}
            className="mt-1 min-h-[80px] text-sm"
          />
        </div>

        {/* 工作经历 */}
        <div>
          <label className="text-xs text-muted-foreground">工作经历</label>
          <Textarea
            placeholder="描述工作经历..."
            value={form.workExperience}
            onChange={(e) => setForm({ ...form, workExperience: e.target.value })}
            className="mt-1 min-h-[80px] text-sm"
          />
        </div>

        {/* 教育经历 */}
        <div>
          <label className="text-xs text-muted-foreground">教育经历</label>
          <Textarea
            placeholder="学校、专业、学历、起止时间..."
            value={form.education}
            onChange={(e) => setForm({ ...form, education: e.target.value })}
            className="mt-1 min-h-[60px] text-sm"
          />
        </div>

        {/* 资格证书 */}
        <div>
          <label className="text-xs text-muted-foreground">资格证书</label>
          <Textarea
            placeholder="如: PMP、AWS认证、软考高级..."
            value={form.certifications}
            onChange={(e) => setForm({ ...form, certifications: e.target.value })}
            className="mt-1 min-h-[60px] text-sm"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFillSamplePdf}
            className="flex-1"
          >
            填入示例
          </Button>
          <Button onClick={handleSave} size="sm" className="flex-1">
            <Save className="h-3.5 w-3.5" />
            {saved ? "已保存" : "保存简历"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
