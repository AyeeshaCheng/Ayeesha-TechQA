"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { JDInput } from "@/components/JDInput";
import { ResumePanel } from "@/components/ResumePanel";
import { PipelineView } from "@/components/PipelineView";
import { StepCard } from "@/components/StepCard";
import { StrategyOutput } from "@/components/StrategyOutput";
import { ChatPanel } from "@/components/ChatPanel";
import { HistoryList } from "@/components/HistoryList";
import { Card, CardContent } from "@/components/ui/card";
import { usePipeline, STEP_NAMES } from "@/hooks/usePipeline";
import type { ResumeData, CareerStrategy, OptimizedResume } from "@/lib/schemas";
import { Sparkles, RotateCcw, FileCheck, TrendingUp, Loader2, Play, Download, Sun, Moon, Eye, Pencil, CheckCircle2 } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import "react18-json-view/src/style.css";
import "react18-json-view/src/dark.css";

const JsonView = dynamic(() => import("react18-json-view"), { ssr: false });

type AppMode = "resume" | "strategy";

export default function Home() {
  const [jdText, setJdText] = useState("");
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [mode, setMode] = useState<AppMode>("resume");
  const { state, run, reset } = usePipeline();
  const { theme, setTheme } = useTheme();
  const [jdRecordId, setJdRecordId] = useState<string | null>(null);
  const [matchResultId, setMatchResultId] = useState<string | null>(null);

  // Career strategy state
  const [selectedJdIds, setSelectedJdIds] = useState<string[]>([]);
  const [careerLoading, setCareerLoading] = useState(false);
  const [careerStrategy, setCareerStrategy] = useState<CareerStrategy | null>(null);
  const [careerPartial, setCareerPartial] = useState<Partial<CareerStrategy> | null>(null);
  const [careerError, setCareerError] = useState<string | null>(null);

  // Optimize resume state
  const [optimizedResumeText, setOptimizedResumeText] = useState<string | null>(null);
  const [optimizedResumeJson, setOptimizedResumeJson] = useState<OptimizedResume | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [showOptimizePopup, setShowOptimizePopup] = useState(false);
  const [editableResumeText, setEditableResumeText] = useState("");
  const [optimizePopupTab, setOptimizePopupTab] = useState<"preview" | "edit">("edit");
  const [chatHighlights, setChatHighlights] = useState<string | null>(null);
  const [savingFinal, setSavingFinal] = useState(false);
  const [finalSaved, setFinalSaved] = useState(false);
  const [jdImagePath, setJdImagePath] = useState<string | null>(null);
  const [jdSourceType, setJdSourceType] = useState<"text" | "image">("text");

  // History detail popup
  const [historyDetail, setHistoryDetail] = useState<any>(null);
  const [historyDetailLoading, setHistoryDetailLoading] = useState(false);
  const [historyDetailTab, setHistoryDetailTab] = useState<"jd" | "skills" | "competitiveness" | "strategy" | "optimized">("jd");

  const handleHistoryDoubleClick = useCallback(async (recordId: string) => {
    setHistoryDetailLoading(true);
    setHistoryDetail(null);
    setHistoryDetailTab("jd");
    try {
      const res = await fetch(`/api/history?id=${recordId}&type=detail`);
      if (!res.ok) return;
      const data = await res.json();
      setHistoryDetail(data);
    } catch { /* ignore */ } finally {
      setHistoryDetailLoading(false);
    }
  }, []);

  // ── JD定制简历: Run Chain Pipeline ──
  const handleRun = useCallback(async () => {
    if (!jdText.trim() || !resume) return;

    const jdId = crypto.randomUUID();
    setJdRecordId(jdId);
    const matchId = crypto.randomUUID();
    setMatchResultId(matchId);

    // Save JD and match records via API
    try {
      await fetch("/api/jd/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: jdId, raw_text: jdText, parsed_json: null,
          source_image_path: jdImagePath, source_type: jdSourceType,
        }),
      });
      await fetch("/api/match/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: matchId, jd_record_id: jdId,
          resume_snapshot: JSON.stringify(resume),
          skill_match_json: null, competitiveness_json: null,
          strategy_json: null, learning_plan_json: null,
          optimized_resume_text: null, optimized_resume_pdf_path: null,
        }),
      });
    } catch (err) {
      console.error("[handleRun] Failed to save initial JD/match records:", err);
    }

    run(jdText, resume, matchId, jdId);
  }, [jdText, resume, run, jdImagePath, jdSourceType]);

  const handleReset = useCallback(() => {
    reset();
    setJdRecordId(null);
    setMatchResultId(null);
    setJdImagePath(null);
    setJdSourceType("text");
  }, [reset]);

  // ── 求职策略: Generate Career Strategy ──
  const handleCareerRun = useCallback(async () => {
    setCareerLoading(true);
    setCareerError(null);
    setCareerStrategy(null);
    setCareerPartial(null);

    try {
      const res = await fetch("/api/career-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jdIds: selectedJdIds,
          resumeSummary: resume
            ? `${resume.jobTitle}，${resume.yearsOfExperience}年经验，技能: ${resume.skills.join("/")}`
            : "",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error((err as any).error || "策略生成失败");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let last: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            last = JSON.parse(line);
            setCareerPartial(last);
          } catch { /* skip */ }
        }
      }
      if (buffer.trim()) {
        try { last = JSON.parse(buffer.trim()); } catch { /* skip */ }
      }
      // Validate we got real data (not empty object)
      if (last && typeof last === "object" && Object.keys(last).length > 0) {
        setCareerStrategy(last);
      } else {
        throw new Error("AI 未返回有效策略数据，请重试");
      }
    } catch (err) {
      setCareerError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setCareerLoading(false);
    }
  }, [selectedJdIds, resume]);

  // ── Optimize Resume ──
  const handleOptimize = useCallback(async () => {
    if (!resume) return;
    setOptimizing(true);
    setOptimizedResumeText(null);
    setOptimizedResumeJson(null);
    try {
      const jdSummary = jdText.slice(0, 500);
      const highlights = chatHighlights || "";
      const resumeStr = [
        `姓名: ${resume.name}`,
        `电话: ${resume.phone}`,
        `邮箱: ${resume.email}`,
        `求职意向: ${resume.jobTitle}`,
        `工作经验: ${resume.yearsOfExperience}年`,
        `期望薪资: ${resume.expectedSalary}`,
        `期望城市: ${resume.expectedCity}`,
        `技能: ${resume.skills.join(", ")}`,
        `个人优势: ${resume.personalAdvantage}`,
        `项目经历: ${resume.projectExperience}`,
        `工作经历: ${resume.workExperience}`,
        `教育经历: ${resume.education || ""}`,
        `资格证书: ${resume.certifications || ""}`,
      ].join("\n");

      const res = await fetch("/api/optimize-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalResume: resumeStr,
          jdSummary,
          chatHighlights: highlights,
          matchResultId: matchResultId ?? undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error((err as any).error || "优化失败");
      }

      // Parse NDJSON stream to get the last complete JSON object
      const text = await res.text();
      const lines = text.trim().split("\n");
      let lastParsed: OptimizedResume | null = null;
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          lastParsed = JSON.parse(line);
        } catch { /* skip incomplete lines */ }
      }

      if (!lastParsed) {
        throw new Error("未能解析优化结果，请重试");
      }

      const jsonStr = JSON.stringify(lastParsed, null, 2);
      setOptimizedResumeText(jsonStr);
      setOptimizedResumeJson(lastParsed);
      setEditableResumeText(jsonStr);
      setOptimizePopupTab("preview");
      setShowOptimizePopup(true);
    } catch (err) {
      setOptimizedResumeText(`优化失败: ${err instanceof Error ? err.message : "未知错误"}`);
    } finally {
      setOptimizing(false);
    }
  }, [resume, jdText, matchResultId, chatHighlights]);

  const [exportingPdf, setExportingPdf] = useState(false);

  const handleExportPdf = useCallback(async () => {
    // Use structured JSON if available, otherwise fall back to editable text
    const resumeJson = optimizedResumeJson;
    const content = editableResumeText;
    if (!resumeJson && !content.trim()) return;

    // Build smart filename: 岗位名称-公司名称-薪资范围.pdf
    let filename = "optimized-resume.pdf";
    try {
      const jdParsed = state.outputs.parsedJD;
      const jobTitle = jdParsed?.jobTitle || resumeJson?.personalInfo?.jobTitle || "";
      const company = jdParsed?.company || "";
      const sr = jdParsed?.salaryRange;
      let salaryPart = "";
      if (sr && typeof sr === "object" && (sr.min || sr.max)) {
        const min = Math.round((sr.min || 0) / 1000);
        const max = Math.round((sr.max || 0) / 1000);
        if (min && max) salaryPart = `${min}K-${max}K`;
        else if (max) salaryPart = `${max}K`;
      }
      const parts = [jobTitle, company, salaryPart].filter(Boolean);
      if (parts.length > 0) {
        filename = parts.join("-") + ".pdf";
      }
    } catch { /* fallback to default name */ }

    setExportingPdf(true);
    try {
      const body: Record<string, unknown> = {
        matchResultId: matchResultId ?? undefined,
      };
      if (resumeJson) {
        body.resumeJson = resumeJson;
      } else {
        body.content = content;
      }

      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "导出失败" }));
        throw new Error((err as any).error || `HTTP ${res.status}`);
      }

      // Trigger browser download of the generated PDF
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF export error:", err);
      alert(`PDF 导出失败: ${err instanceof Error ? err.message : "未知错误"}`);
    } finally {
      setExportingPdf(false);
    }
  }, [editableResumeText, matchResultId, optimizedResumeJson, state.outputs.parsedJD]);

  // ── Confirm (save final draft) ──
  const handleConfirmFinal = useCallback(async () => {
    // Parse current editable text as JSON and save to DB
    let finalJson: OptimizedResume | null = null;
    try {
      finalJson = JSON.parse(editableResumeText);
    } catch {
      alert("当前编辑内容不是有效 JSON，请修正后再保存。");
      return;
    }
    if (!matchResultId) return;

    setSavingFinal(true);
    try {
      await fetch("/api/match/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: matchResultId,
          optimized_resume_text: editableResumeText,
        }),
      });
      setOptimizedResumeJson(finalJson);
      setOptimizedResumeText(editableResumeText);
      setFinalSaved(true);
      setTimeout(() => setFinalSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save final resume:", err);
      alert("保存失败，请重试");
    } finally {
      setSavingFinal(false);
    }
  }, [editableResumeText, matchResultId]);

  // ── Save + Export PDF ──
  const handleSaveAndExport = useCallback(async () => {
    // Step 1: parse current text as final JSON
    let finalJson: OptimizedResume | null = null;
    try {
      finalJson = JSON.parse(editableResumeText);
    } catch {
      alert("当前编辑内容不是有效 JSON，请修正后再导出。");
      return;
    }
    if (!finalJson) return;

    // Step 2: save final draft to DB
    setSavingFinal(true);
    try {
      await fetch("/api/match/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: matchResultId ?? undefined,
          optimized_resume_text: editableResumeText,
        }),
      });
      setOptimizedResumeJson(finalJson);
      setOptimizedResumeText(editableResumeText);
      setFinalSaved(true);
    } catch (err) {
      console.error("Failed to save final resume:", err);
    }
    setSavingFinal(false);

    // Step 3: build filename
    let filename = "optimized-resume.pdf";
    try {
      const jdParsed = state.outputs.parsedJD;
      const jobTitle = jdParsed?.jobTitle || finalJson?.personalInfo?.jobTitle || "";
      const company = jdParsed?.company || "";
      const sr = jdParsed?.salaryRange;
      let salaryPart = "";
      if (sr && typeof sr === "object" && (sr.min || sr.max)) {
        const min = Math.round((sr.min || 0) / 1000);
        const max = Math.round((sr.max || 0) / 1000);
        if (min && max) salaryPart = `${min}K-${max}K`;
        else if (max) salaryPart = `${max}K`;
      }
      const parts = [jobTitle, company, salaryPart].filter(Boolean);
      if (parts.length > 0) filename = parts.join("-") + ".pdf";
    } catch { /* fallback */ }

    // Step 4: export PDF
    setExportingPdf(true);
    try {
      const body: Record<string, unknown> = { matchResultId: matchResultId ?? undefined };
      body.resumeJson = finalJson;
      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF export error:", err);
      alert(`PDF 导出失败: ${err instanceof Error ? err.message : "未知错误"}`);
    } finally {
      setExportingPdf(false);
    }
  }, [editableResumeText, matchResultId, state.outputs.parsedJD]);

  // ── Common state ──
  const noResume = !resume || !resume.name || resume.skills.length === 0;
  const isRunning = state.phase === "running";
  const isIdle = state.phase === "idle";
  const outputKeys = ["parsedJD", "skillMatch", "competitiveness", "strategy"] as const;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight hidden sm:inline">JobSpy</h1>
            </div>

            {/* Mode switcher */}
            <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-muted/30 p-0.5">
              <button
                onClick={() => { if (!isRunning) setMode("resume"); }}
                disabled={isRunning}
                className={cn(
                  "flex items-center gap-1 sm:gap-1.5 rounded-md px-2 sm:px-3 py-1.5 text-xs font-medium transition-all",
                  mode === "resume"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                  isRunning && "opacity-50 cursor-not-allowed",
                )}
              >
                <FileCheck className="h-3 w-3" />
                <span className="hidden sm:inline">JD定制简历</span>
                <span className="sm:hidden">定制</span>
              </button>
              <button
                onClick={() => setMode("strategy")}
                className={cn(
                  "flex items-center gap-1 sm:gap-1.5 rounded-md px-2 sm:px-3 py-1.5 text-xs font-medium transition-all",
                  mode === "strategy"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <TrendingUp className="h-3 w-3" />
                <span className="hidden sm:inline">求职策略</span>
                <span className="sm:hidden">策略</span>
              </button>
            </div>

            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 relative"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="切换主题"
              >
                <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:rotate-90 dark:scale-0" />
                <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
              {!isIdle && mode === "resume" && (
                <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 text-xs">
                  <RotateCcw className="h-3 w-3" />
                  <span className="hidden sm:inline ml-1">重置</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-6">
        {/* ── Mode 1: JD定制简历 ── */}
        {mode === "resume" && (
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[380px_1fr]">
            {/* Left Panel */}
            <div className="space-y-4 lg:sticky lg:top-[56px] lg:self-start lg:max-h-[calc(100vh-80px)] lg:overflow-auto">
              <Tabs defaultValue="jd">
                <TabsList className="w-full">
                  <TabsTrigger value="jd" className="flex-1 text-xs sm:text-sm">岗位描述</TabsTrigger>
                  <TabsTrigger value="resume" className="flex-1 text-xs sm:text-sm">
                    我的简历
                    {noResume && <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-warning inline-block" />}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="jd" className="mt-3">
                  <JDInput
                    value={jdText}
                    onChange={setJdText}
                    onRun={handleRun}
                    isRunning={isRunning}
                    disabled={noResume}
                    onOcrComplete={({ imagePath }) => { setJdImagePath(imagePath); setJdSourceType("image"); }}
                  />
                  {noResume && (
                    <p className="mt-2 text-xs text-warning">请先填写并保存简历信息</p>
                  )}
                </TabsContent>
                <TabsContent value="resume" className="mt-3">
                  <ResumePanel resume={resume} onResumeChange={setResume} />
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Panel: Results */}
            <div className="min-w-0 space-y-5">
              {isIdle ? (
                <div className="flex h-[500px] items-center justify-center rounded-xl border border-dashed border-border/40 bg-card/30">
                  <div className="text-center px-6">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
                      <Sparkles className="h-7 w-7 text-muted-foreground/30" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-muted-foreground">
                      上传或粘贴岗位描述，开始生成 JD 定制简历
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground/50">
                      JD解析 → 技能匹配 → 竞争力分析 → 简历优化 → 导出PDF
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <PipelineView state={state} />

                  {state.error && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                      <p className="text-sm text-destructive">{state.error}</p>
                    </div>
                  )}

                  {STEP_NAMES.slice(0, 3).map((name, i) => (
                    <StepCard
                      key={name}
                      name={name}
                      status={state.stepStatuses[i]}
                      output={state.outputs[outputKeys[i]]}
                      partialOutput={state.partialOutputs[outputKeys[i]]}
                      debug={state.debug[i]}
                      stepIndex={i}
                    />
                  ))}

                  {(state.stepStatuses[3] === "running" || state.stepStatuses[3] === "complete") && (
                    <StrategyOutput
                      strategy={state.outputs.strategy || state.partialOutputs.strategy}
                      isStreaming={state.stepStatuses[3] === "running"}
                      debug={state.debug[3]}
                    />
                  )}

                  {/* Chat Panel */}
                  {state.phase === "done" && resume && (
                    <Card className="border-border/50">
                      <CardContent className="p-4">
                        <ChatPanel
                          context={{
                            jdSummary: jdText.slice(0, 500),
                            resumeGaps: state.outputs.skillMatch?.missingSkills?.join(", ") || "",
                          }}
                          matchResultId={matchResultId ?? undefined}
                          onHighlightsReady={(h) => setChatHighlights(h)}
                        />
                        {chatHighlights && (
                          <p className="text-xs text-success mt-2 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            亮点已提取，将用于优化简历
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Optimize button */}
                  {state.phase === "done" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleOptimize}
                          disabled={optimizing}
                        >
                          {optimizing ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                              优化中...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5 mr-1" />
                              {optimizedResumeText ? "重新优化" : "优化简历"}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Mode 2: 求职策略 ── */}
        {mode === "strategy" && (
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[340px_1fr]">
            {/* Left: History */}
            <div className="lg:sticky lg:top-[56px] lg:self-start lg:max-h-[calc(100vh-80px)] lg:overflow-hidden flex flex-col">
              <div className="text-sm font-medium mb-3 flex items-center justify-between">
                <span>历史 JD 记录</span>
                <span className="text-xs text-muted-foreground">
                  {selectedJdIds.length > 0 ? `已选 ${selectedJdIds.length}` : "全选"}
                </span>
              </div>
              <div className="flex-1 overflow-auto border rounded-lg">
                <HistoryList
                  onSelect={(id) => {
                    setSelectedJdIds((prev) =>
                      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                    );
                  }}
                  activeId={selectedJdIds[selectedJdIds.length - 1]}
                  selectable
                  selectedIds={selectedJdIds}
                  onDoubleClick={handleHistoryDoubleClick}
                />
              </div>
              <Button
                className="mt-3 w-full"
                size="sm"
                onClick={handleCareerRun}
                disabled={careerLoading}
              >
                {careerLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 mr-1" />
                    生成求职策略
                  </>
                )}
              </Button>
            </div>

            {/* Right: Strategy Result */}
            <div className="min-w-0">
              {!careerStrategy && !careerLoading && !careerError && (
                <div className="flex h-[500px] items-center justify-center rounded-xl border border-dashed border-border/40 bg-card/30">
                  <div className="text-center px-6">
                    <TrendingUp className="h-14 w-14 text-muted-foreground/30 mx-auto" />
                    <p className="mt-4 text-sm font-medium text-muted-foreground">
                      选择左侧历史 JD，生成综合求职策略
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground/50">
                      AI 分析多个 JD 的共性需求 → 输出求职方向、技能聚焦、薪资策略
                    </p>
                  </div>
                </div>
              )}

              {careerError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-sm text-destructive">{careerError}</p>
                </div>
              )}

              {careerLoading && (
                <CareerStrategyView
                  data={(careerStrategy || careerPartial || {}) as any}
                  partial={!careerStrategy}
                />
              )}

              {!careerLoading && careerStrategy && <CareerStrategyView data={careerStrategy} />}
            </div>
          </div>
        )}
      </div>

      {/* ── History Detail Popup ── */}
      {(historyDetail || historyDetailLoading) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => { setHistoryDetail(null); setHistoryDetailLoading(false); }}
        >
          <div
            className="bg-background sm:rounded-xl shadow-2xl border border-border/50 w-full h-full sm:max-w-2xl sm:max-h-[80vh] sm:h-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border/30 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-sm font-semibold truncate">
                  {historyDetail?.jd?.parsed_json ? (() => {
                    try {
                      const p = JSON.parse(historyDetail.jd.parsed_json);
                      const jobTitle = p.jobTitle || p.岗位名称 || p.job_title || "JD";
                      const company = p.company || p.公司名称 || p.company_name || "";
                      return `${jobTitle} ${company ? "· " + company : ""}`;
                    } catch { return "历史分析详情"; }
                  })() : "历史分析详情"}
                </h2>
                {historyDetail?.jd?.source_type === "image" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs shrink-0 gap-1"
                    onClick={() => window.open(`/api/jd/image?id=${historyDetail.jd.id}`, "_blank")}
                  >
                    <Eye className="h-3 w-3" />
                    查看JD图片
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => { setHistoryDetail(null); setHistoryDetailLoading(false); }}
              >
                ✕
              </Button>
            </div>

            {/* Tab bar — scroll horizontally on mobile */}
            <div className="flex border-b border-border/30 px-2 sm:px-4 gap-0.5 sm:gap-1 overflow-x-auto shrink-0">
              {[
                { key: "jd", label: "JD解析" },
                { key: "skills", label: "技能匹配" },
                { key: "competitiveness", label: "竞争力分析" },
                { key: "strategy", label: "求职策略" },
                { key: "optimized", label: "优化简历" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setHistoryDetailTab(tab.key as any)}
                  className={`px-2.5 sm:px-3 py-2.5 sm:py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                    historyDetailTab === tab.key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {historyDetailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : historyDetail?.matches?.[0] ? (
                (() => {
                  const m = historyDetail.matches[0];

                  // ── Optimized Resume tab: render structured preview ──
                  if (historyDetailTab === "optimized") {
                    let optimizedData: OptimizedResume | null = null;
                    try {
                      if (m.optimized_resume_text) {
                        optimizedData = JSON.parse(m.optimized_resume_text);
                      }
                    } catch { /* invalid JSON */ }

                    if (!optimizedData) {
                      return (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                          <p className="text-sm text-muted-foreground">暂无优化简历数据</p>
                          <p className="text-xs text-muted-foreground/50">
                            请先在「JD定制简历」中完成分析后点击「优化简历」
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {/* Final draft badge */}
                        <div className="flex items-center justify-center gap-2">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            简历终稿
                          </span>
                          <span className="text-xs text-muted-foreground">
                            可在「JD定制简历」中重新优化以更新
                          </span>
                        </div>
                        <ResumePreview data={optimizedData} />
                        {/* Download PDF button */}
                        <div className="flex justify-center pt-2 border-t border-border/30">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={async () => {
                              try {
                                // Build smart filename from JD info
                                let filename = "optimized-resume.pdf";
                                try {
                                  let jdParsed: Record<string, unknown> | null = null;
                                  if (historyDetail?.jd?.parsed_json) {
                                    jdParsed = JSON.parse(historyDetail.jd.parsed_json);
                                  }
                                  const jt = jdParsed?.jobTitle || jdParsed?.岗位名称 || optimizedData?.personalInfo?.jobTitle || "";
                                  const co = jdParsed?.company || jdParsed?.公司名称 || "";
                                  const sr = (jdParsed?.salaryRange || jdParsed?.薪资范围) as { min?: number; max?: number } | undefined;
                                  let sp = "";
                                  if (sr && (sr.min || sr.max)) {
                                    const min = Math.round((sr.min || 0) / 1000);
                                    const max = Math.round((sr.max || 0) / 1000);
                                    if (min && max) sp = `${min}K-${max}K`;
                                    else if (max) sp = `${max}K`;
                                  }
                                  const parts = [jt, co, sp].filter(Boolean);
                                  if (parts.length > 0) filename = parts.join("-") + ".pdf";
                                } catch { /* fallback */ }

                                const res = await fetch("/api/export-pdf", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ resumeJson: optimizedData }),
                                });
                                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                                const blob = await res.blob();
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = filename;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                              } catch (err) {
                                console.error("PDF download error:", err);
                                alert(`PDF 下载失败: ${err instanceof Error ? err.message : "未知错误"}`);
                              }
                            }}
                          >
                            <Download className="h-3.5 w-3.5 mr-1" />
                            下载简历 (PDF)
                          </Button>
                        </div>
                      </div>
                    );
                  }

                  // ── Other tabs: JSON view ──
                  // Resolve the JSON content for the active tab
                  const resolveJson = (): Record<string, unknown> | null => {
                    try {
                      if (historyDetailTab === "jd" && historyDetail?.jd?.parsed_json) {
                        return JSON.parse(historyDetail.jd.parsed_json);
                      }
                      if (historyDetailTab === "skills" && m.skill_match_json) {
                        return JSON.parse(m.skill_match_json);
                      }
                      if (historyDetailTab === "competitiveness" && m.competitiveness_json) {
                        return JSON.parse(m.competitiveness_json);
                      }
                      if (historyDetailTab === "strategy" && m.strategy_json) {
                        return JSON.parse(m.strategy_json);
                      }
                    } catch { /* fall through */ }
                    return null;
                  };

                  const tabData = resolveJson();

                  const tabLabel =
                    historyDetailTab === "jd" ? "JD解析" :
                    historyDetailTab === "skills" ? "技能匹配" :
                    historyDetailTab === "competitiveness" ? "竞争力分析" : "求职策略";

                  return tabData ? (
                    <div className="text-sm">
                      <JsonView
                        src={tabData}
                        theme="a11y"
                        dark
                        collapsed={false}
                        enableClipboard={false}
                        style={{ fontSize: "12px", background: "transparent" }}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">暂无{tabLabel}数据</p>
                  );
                })()
              ) : (
                <p className="text-sm text-muted-foreground">暂无分析记录</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Optimize Resume Popup ── */}
      {showOptimizePopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => setShowOptimizePopup(false)}
        >
          <div
            className="bg-background sm:rounded-xl shadow-2xl border border-border/50 w-full h-full sm:max-w-4xl sm:max-h-[90vh] sm:h-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with tabs */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border/30 shrink-0">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  优化后的简历
                </h2>
                {/* Tab switcher */}
                <div className="flex rounded-lg bg-muted p-0.5">
                  <button
                    className={`px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1.5 ${
                      optimizePopupTab === "preview"
                        ? "bg-background shadow-sm text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setOptimizePopupTab("preview")}
                  >
                    <Eye className="h-3 w-3" />
                    预览
                  </button>
                  <button
                    className={`px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1.5 ${
                      optimizePopupTab === "edit"
                        ? "bg-background shadow-sm text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setOptimizePopupTab("edit")}
                  >
                    <Pencil className="h-3 w-3" />
                    编辑
                  </button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOptimizePopup(false)}
              >
                ✕
              </Button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto p-3 sm:p-4">
              {optimizePopupTab === "preview" && optimizedResumeJson ? (
                <ResumePreview data={optimizedResumeJson} />
              ) : (
                <textarea
                  className="w-full h-full min-h-[300px] sm:min-h-[400px] text-xs font-mono leading-relaxed p-3 sm:p-4 border border-border/50 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
                  value={editableResumeText}
                  onChange={(e) => {
                    setEditableResumeText(e.target.value);
                    // Try to parse back to JSON for preview
                    try {
                      setOptimizedResumeJson(JSON.parse(e.target.value));
                    } catch { /* editing in progress */ }
                  }}
                />
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-t border-border/30 shrink-0">
              <p className="text-xs text-muted-foreground">
                {finalSaved
                  ? "✅ 简历终稿已保存"
                  : optimizePopupTab === "preview"
                    ? "切换到「编辑」tab 可手动修改内容"
                    : "请在「编辑」tab 检查并修改 AI 优化结果，修改后可切到「预览」查看效果"}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOptimizePopup(false)}
                >
                  关闭
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleConfirmFinal}
                  disabled={!editableResumeText.trim() || savingFinal}
                >
                  {savingFinal ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      {finalSaved ? "已确认终稿" : "确定终稿"}
                    </>
                  )}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveAndExport}
                  disabled={(!optimizedResumeJson && !editableResumeText.trim()) || exportingPdf}
                >
                  {exportingPdf ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      生成PDF中...
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5 mr-1" />
                      保存并导出PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ── Career Strategy Display Component ──
// ── Resume Preview Component (structured JSON → styled preview) ──
function ResumePreview({ data }: { data: OptimizedResume }) {
  const pi = data.personalInfo;
  const hasSkills = data.skills?.length > 0;
  const hasWork = data.workExperience?.length > 0;
  const hasProjects = data.projectExperience?.length > 0;
  const hasEdu = data.education?.length > 0;
  const hasCerts = data.certifications?.length > 0;

  return (
    <div className="max-w-[210mm] mx-auto bg-white text-[#1a1a1a] font-sans shadow-lg rounded-lg overflow-hidden border border-border/20">
      {/* Print-style inner padding */}
      <div className="p-6 sm:p-8">

        {/* Header with photo on the right */}
        <div className="flex items-center justify-between gap-5 border-b-2 border-[#1a56db] pb-4 mb-5">
          <div className="flex-1 text-left">
            <h1 className="text-2xl font-bold tracking-wider text-[#111] mb-1.5">
              {pi?.name || "姓名"}
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#555]">
              {pi?.phone && <span>{pi.phone}</span>}
              {pi?.email && <span>{pi.email}</span>}
              {pi?.jobTitle && <span>{pi.jobTitle}</span>}
              {pi?.yearsOfExperience ? <span>{pi.yearsOfExperience}年经验</span> : null}
            </div>
            {(pi?.expectedSalary || pi?.expectedCity) && (
              <div className="flex flex-wrap gap-x-4 text-xs text-[#777] mt-1">
                {pi?.expectedSalary && <span>期望薪资: {pi.expectedSalary}</span>}
                {pi?.expectedCity && <span>期望城市: {pi.expectedCity}</span>}
              </div>
            )}
          </div>
          {/* Photo */}
          <img
            src="/photo.jpg"
            alt="证件照"
            className="w-[90px] h-[120px] object-cover rounded border border-[#d0d7e8] shrink-0"
          />
        </div>

        {/* Professional Summary */}
        {data.professionalSummary && (
          <div className="mb-5 bg-[#f4f6fb] border-l-[3px] border-[#1a56db] rounded-sm py-2.5 px-3.5 text-[13px] leading-relaxed text-[#333]">
            {data.professionalSummary}
          </div>
        )}

        {/* Skills */}
        {hasSkills && (
          <div className="mb-5">
            <h3 className="text-[15px] font-bold text-[#1a56db] border-b border-[#d0d7e8] pb-1 mb-2.5 tracking-wide">
              专业技能
            </h3>
            {data.skills.map((sg, i) => (
              <div key={i} className="mb-1.5 text-sm">
                <span className="font-semibold text-[#333] inline-block min-w-[90px]">
                  {sg.category}
                </span>
                <span className="inline-flex flex-wrap gap-1">
                  {(sg.items || []).map((item, j) => (
                    <span
                      key={j}
                      className="inline-block bg-[#e8edf5] text-[#2c3e6b] text-xs px-2 py-0.5 rounded-sm"
                    >
                      {item}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Project Experience (before Work Experience) */}
        {hasProjects && (
          <div className="mb-5">
            <h3 className="text-[15px] font-bold text-[#1a56db] border-b border-[#d0d7e8] pb-1 mb-2.5 tracking-wide">
              项目经历
            </h3>
            {data.projectExperience.map((pe, i) => (
              <div key={i} className="mb-3 p-3 bg-[#fafbfd] rounded border border-[#e8ecf2]">
                <div className="flex justify-between items-baseline mb-1">
                  <div>
                    <span className="font-bold text-sm text-[#1a56db]">{pe.name}</span>
                    <span className="text-xs text-[#666] ml-2">{pe.role}</span>
                  </div>
                </div>
                {pe.description && (
                  <p className="text-xs text-[#555] mb-1.5">{pe.description}</p>
                )}
                {(pe.highlights || []).length > 0 && (
                  <ul className="list-none pl-0 space-y-0.5">
                    {pe.highlights.map((h, j) => (
                      <li key={j} className="relative pl-4 text-[13px] leading-relaxed text-[#333] before:content-['▸'] before:absolute before:left-0 before:text-[#1a56db] before:text-[11px]">
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Work Experience (after Project Experience) */}
        {hasWork && (
          <div className="mb-5">
            <h3 className="text-[15px] font-bold text-[#1a56db] border-b border-[#d0d7e8] pb-1 mb-2.5 tracking-wide">
              工作经历
            </h3>
            {data.workExperience.map((we, i) => (
              <div key={i} className="mb-3.5">
                <div className="flex justify-between items-baseline mb-1">
                  <div>
                    <span className="font-bold text-sm text-[#111]">{we.company}</span>
                    <span className="font-medium text-[#444] text-sm ml-2">{we.role}</span>
                  </div>
                  <span className="text-xs text-[#888] shrink-0">{we.period || ""}</span>
                </div>
                {(we.highlights || []).length > 0 && (
                  <ul className="list-none pl-0 space-y-0.5">
                    {we.highlights.map((h, j) => (
                      <li key={j} className="relative pl-4 text-[13px] leading-relaxed text-[#333] before:content-['▸'] before:absolute before:left-0 before:text-[#1a56db] before:text-[11px]">
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {hasEdu && (
          <div className="mb-5">
            <h3 className="text-[15px] font-bold text-[#1a56db] border-b border-[#d0d7e8] pb-1 mb-2.5 tracking-wide">
              教育背景
            </h3>
            {data.education.map((e, i) => (
              <div key={i} className="flex justify-between items-baseline mb-1 text-[13px]">
                <div>
                  <span className="font-semibold text-[#111]">{e.school}</span>
                  <span className="text-[#555] ml-2">{e.degree} · {e.major}</span>
                </div>
                <span className="text-xs text-[#888]">{e.period || ""}</span>
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {hasCerts && (
          <div className="mb-2">
            <h3 className="text-[15px] font-bold text-[#1a56db] border-b border-[#d0d7e8] pb-1 mb-2.5 tracking-wide">
              资格证书
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {data.certifications.map((c, i) => (
                <span
                  key={i}
                  className="bg-[#f0f4e8] text-[#4a5c2e] text-xs px-2.5 py-0.5 rounded-sm border border-[#d8e2c8]"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CareerStrategyView({ data, partial }: { data: CareerStrategy | Partial<CareerStrategy>; partial?: boolean }) {
  const opacity = partial ? "opacity-70" : "";
  const d = data as CareerStrategy;
  const cursor = partial ? <span className="inline-block w-1.5 h-4 bg-primary animate-pulse rounded-sm align-middle ml-0.5" /> : null;
  const isEmpty = !d.jobSelectionCriteria && !d.applicationTiers && !(d.verticalTracks?.length) && !d.growthPlan && !d.overallAdvice;

  // If no valid data and not in partial/streaming mode, show nothing useful
  if (isEmpty && !partial) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed border-border/40 bg-card/30">
        <div className="text-center px-6">
          <p className="text-sm font-medium text-muted-foreground">未能生成有效策略数据</p>
          <p className="mt-1.5 text-xs text-muted-foreground/50">请检查网络连接后重试，或确认已选择有效的 JD 记录</p>
        </div>
      </div>
    );
  }

  const factorLabels: Record<string, string> = {
    salary: "薪资", growth: "成长", stability: "稳定", commute: "通勤", atmosphere: "氛围",
  };

  const tierLabel = { reach: "🚀 冲刺岗", match: "✅ 匹配岗", safety: "🛡️ 保底岗" };
  const tierDesc = {
    reach: "高于当前能力水平，需要重点突破",
    match: "能力完全适配，核心竞争力突出",
    safety: "稳拿offer，作为保底退路",
  };

  return (
    <div className={cn("space-y-5", opacity)}>
      {/* ===== 1. 岗位取舍标准 ===== */}
      {d.jobSelectionCriteria && (
        <div className="rounded-lg border border-border/50 bg-card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-chart-1/10 text-chart-1 text-[10px] font-bold">1</span>
            岗位取舍标准
          </h3>
          {d.jobSelectionCriteria.priorities?.length > 0 && (
            <div className="space-y-2 mb-3">
              {d.jobSelectionCriteria.priorities.map((p, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-12 text-xs font-medium text-muted-foreground shrink-0">
                    {factorLabels[p.factor] || p.label}
                  </span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-chart-1 transition-all"
                      style={{ width: `${(p.weight / 10) * 100}%` }}
                    />
                  </div>
                  <span className="w-5 text-xs font-bold text-chart-1 text-right">{p.weight}</span>
                  <span className="text-xs text-muted-foreground hidden sm:block flex-1">{p.rationale}</span>
                </div>
              ))}
            </div>
          )}
          {d.jobSelectionCriteria.summary && (
            <p className="text-sm text-muted-foreground border-t border-border/30 pt-3">{d.jobSelectionCriteria.summary || cursor}</p>
          )}
        </div>
      )}

      {/* ===== 2. 投递分层策略 ===== */}
      {d.applicationTiers && (
        <div className="rounded-lg border border-border/50 bg-card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-chart-2/10 text-chart-2 text-[10px] font-bold">2</span>
            投递分层策略
          </h3>
          {(["reach", "match", "safety"] as const).map((tier) => {
            const items = d.applicationTiers?.[tier];
            if (!items?.length) return null;
            return (
              <div key={tier} className="mb-3 last:mb-0">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  {tierLabel[tier]} <span className="font-normal">— {tierDesc[tier]}</span>
                </p>
                <div className="space-y-2 pl-3 border-l-2 border-border/50">
                  {items.map((item: any, i: number) => (
                    <div key={i} className="rounded-md border border-border/30 bg-background/50 p-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{item.jobTitle || cursor}</span>
                        {item.companyType && (
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{item.companyType}</span>
                        )}
                        {item.salaryRange && (
                          <span className="text-xs text-success font-medium">{item.salaryRange}</span>
                        )}
                      </div>
                      {tier === "reach" && item.gapDescription && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          <span className="text-warning">差距：</span>{item.gapDescription}
                        </p>
                      )}
                      {tier === "reach" && item.howToCloseGap && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          <span className="text-success">补强方案：</span>{item.howToCloseGap}
                        </p>
                      )}
                      {tier === "match" && item.fitReason && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          <span className="text-success">适配原因：</span>{item.fitReason}
                        </p>
                      )}
                      {tier === "match" && item.highlightPoints?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.highlightPoints.map((hp: string, j: number) => (
                            <span key={j} className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded">{hp}</span>
                          ))}
                        </div>
                      )}
                      {tier === "safety" && item.advantage && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          <span className="text-success">优势：</span>{item.advantage}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {d.applicationTiers.summary && (
            <p className="text-sm text-muted-foreground border-t border-border/30 pt-3 mt-2">{d.applicationTiers.summary || cursor}</p>
          )}
        </div>
      )}

      {/* ===== 3. 垂直赛道锁定 ===== */}
      {d.verticalTracks?.length > 0 && (
        <div className="rounded-lg border border-border/50 bg-card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-chart-3/10 text-chart-3 text-[10px] font-bold">3</span>
            垂直赛道锁定
          </h3>
          <div className="space-y-4">
            {d.verticalTracks.map((track, i) => (
              <div key={i} className="rounded-md border border-border/30 bg-background/50 p-4">
                <p className="text-sm font-semibold">{track.industry || cursor}</p>
                <p className="mt-1 text-xs text-muted-foreground">{track.reason || ""}</p>
                {track.targetCompanies?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[10px] text-muted-foreground mr-1">目标公司：</span>
                    {track.targetCompanies.map((c, j) => (
                      <span key={j} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{c}</span>
                    ))}
                  </div>
                )}
                {track.resumePositioning && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    <span className="text-chart-3 font-medium">简历包装：</span>{track.resumePositioning}
                  </p>
                )}
                {track.keySkillsToHighlight?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {track.keySkillsToHighlight.map((sk, j) => (
                      <span key={j} className="text-[10px] bg-chart-3/10 text-chart-3 px-1.5 py-0.5 rounded">{sk}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== 4. 三年成长规划 ===== */}
      {d.growthPlan && (
        <div className="rounded-lg border border-border/50 bg-card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-chart-4/10 text-chart-4 text-[10px] font-bold">4</span>
            三年成长规划
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {([1, 2, 3] as const).map((year) => {
              const yKey = `year${year}` as "year1" | "year2" | "year3";
              const y = d.growthPlan?.[yKey];
              if (!y) return null;
              return (
                <div key={year} className="rounded-md border border-border/30 bg-background/50 p-3">
                  <p className="text-sm font-semibold">
                    Year {year}
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">{y.theme || ""}</span>
                  </p>
                  {y.goals?.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {y.goals.map((g, j) => (
                        <li key={j} className="text-xs text-muted-foreground flex gap-1.5">
                          <span className="text-chart-4 shrink-0 mt-0.5">•</span>
                          {g}
                        </li>
                      ))}
                    </ul>
                  )}
                  {y.skillsToBuild?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {y.skillsToBuild.map((sk, j) => (
                        <span key={j} className="text-[10px] bg-chart-4/10 text-chart-4 px-1.5 py-0.5 rounded">{sk}</span>
                      ))}
                    </div>
                  )}
                  {y.targetProjects?.length > 0 && (
                    <div className="mt-2">
                      <span className="text-[10px] text-muted-foreground">目标项目：</span>
                      {y.targetProjects.map((p, j) => (
                        <span key={j} className="text-[10px] text-muted-foreground block ml-2">{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {d.growthPlan.nextJumpPreparation && (
            <div className="mt-3 border-t border-border/30 pt-3">
              <span className="text-xs font-medium text-muted-foreground">下次跳槽准备：</span>
              <p className="text-sm text-muted-foreground mt-1">{d.growthPlan.nextJumpPreparation}</p>
            </div>
          )}
        </div>
      )}

      {/* ===== 综合建议 ===== */}
      {d.overallAdvice && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
          <h3 className="text-sm font-semibold mb-2">💡 综合建议</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{d.overallAdvice}</p>
        </div>
      )}

      {/* ===== 风险提示 ===== */}
      {d.riskWarnings?.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-5">
          <h3 className="text-sm font-semibold mb-2 text-warning">⚠️ 风险提示</h3>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            {d.riskWarnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Learning Plan Section (receives data from pipeline) ──