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
import type { ResumeData, CareerStrategy } from "@/lib/schemas";
import { Sparkles, RotateCcw, FileCheck, TrendingUp, Loader2, Play, Download } from "lucide-react";
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
  const [optimizing, setOptimizing] = useState(false);
  const [showOptimizePopup, setShowOptimizePopup] = useState(false);
  const [editableResumeText, setEditableResumeText] = useState("");

  // History detail popup
  const [historyDetail, setHistoryDetail] = useState<any>(null);
  const [historyDetailLoading, setHistoryDetailLoading] = useState(false);
  const [historyDetailTab, setHistoryDetailTab] = useState<"jd" | "skills" | "competitiveness" | "strategy">("jd");

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
          source_image_path: null, source_type: "text",
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
    } catch { /* non-blocking */ }

    run(jdText, resume, matchId, jdId);
  }, [jdText, resume, run]);

  const handleReset = useCallback(() => {
    reset();
    setJdRecordId(null);
    setMatchResultId(null);
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
      let last: any = {};

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
      setCareerStrategy(last);
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
    try {
      const jdSummary = jdText.slice(0, 500);
      const chatHighlights = ""; // future: from chat panel
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
          chatHighlights,
          matchResultId: matchResultId ?? undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error((err as any).error || "优化失败");
      }

      const text = await res.text();
      setOptimizedResumeText(text);
      setEditableResumeText(text);
      setShowOptimizePopup(true);
    } catch (err) {
      setOptimizedResumeText(`优化失败: ${err instanceof Error ? err.message : "未知错误"}`);
    } finally {
      setOptimizing(false);
    }
  }, [resume, jdText, matchResultId]);

  const [exportingPdf, setExportingPdf] = useState(false);

  const handleExportPdf = useCallback(async () => {
    const content = editableResumeText;
    if (!content.trim()) return;

    setExportingPdf(true);
    try {
      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          matchResultId: matchResultId ?? undefined,
        }),
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
      a.download = "optimized-resume.pdf";
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
  }, [editableResumeText, matchResultId]);

  // ── Common state ──
  const noResume = !resume || !resume.name || resume.skills.length === 0;
  const isRunning = state.phase === "running";
  const isIdle = state.phase === "idle";
  const outputKeys = ["parsedJD", "skillMatch", "competitiveness", "strategy"] as const;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <h1 className="text-base font-bold tracking-tight">JobSpy</h1>
            </div>

            {/* Mode switcher */}
            <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-muted/30 p-0.5">
              <button
                onClick={() => { if (!isRunning) setMode("resume"); }}
                disabled={isRunning}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  mode === "resume"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                  isRunning && "opacity-50 cursor-not-allowed",
                )}
              >
                <FileCheck className="h-3 w-3" />
                JD定制简历
              </button>
              <button
                onClick={() => setMode("strategy")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  mode === "strategy"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <TrendingUp className="h-3 w-3" />
                求职策略
              </button>
            </div>

            <div className="flex items-center gap-3">
              {!isIdle && mode === "resume" && (
                <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 text-xs">
                  <RotateCcw className="h-3 w-3" /> 重置
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* ── Mode 1: JD定制简历 ── */}
        {mode === "resume" && (
          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            {/* Left Panel */}
            <div className="space-y-4 lg:sticky lg:top-[60px] lg:self-start lg:max-h-[calc(100vh-84px)] lg:overflow-auto">
              <Tabs defaultValue="jd">
                <TabsList className="w-full">
                  <TabsTrigger value="jd" className="flex-1">岗位描述</TabsTrigger>
                  <TabsTrigger value="resume" className="flex-1">
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
                        />
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
          <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
            {/* Left: History */}
            <div className="lg:sticky lg:top-[60px] lg:self-start lg:max-h-[calc(100vh-84px)] lg:overflow-hidden flex flex-col">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => { setHistoryDetail(null); setHistoryDetailLoading(false); }}
        >
          <div
            className="bg-background rounded-xl shadow-2xl border border-border/50 w-full max-w-2xl max-h-[80vh] flex flex-col m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <h2 className="text-sm font-semibold">
                {historyDetail?.jd?.parsed_json ? (() => {
                  try {
                    const p = JSON.parse(historyDetail.jd.parsed_json);
                    return `${p.jobTitle || "JD"} ${p.company ? "· " + p.company : ""}`;
                  } catch { return "历史分析详情"; }
                })() : "历史分析详情"}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setHistoryDetail(null); setHistoryDetailLoading(false); }}
              >
                ✕
              </Button>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-border/30 px-4 gap-1">
              {[
                { key: "jd", label: "JD解析" },
                { key: "skills", label: "技能匹配" },
                { key: "competitiveness", label: "竞争力分析" },
                { key: "strategy", label: "求职策略" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setHistoryDetailTab(tab.key as any)}
                  className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowOptimizePopup(false)}
        >
          <div
            className="bg-background rounded-xl shadow-2xl border border-border/50 w-full max-w-3xl max-h-[85vh] flex flex-col m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-green-600" />
                优化后的简历
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOptimizePopup(false)}
              >
                ✕
              </Button>
            </div>

            {/* Body: Editable textarea */}
            <div className="flex-1 overflow-auto p-4">
              <textarea
                className="w-full min-h-[400px] text-sm font-sans leading-relaxed p-4 border border-border/50 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
                value={editableResumeText}
                onChange={(e) => setEditableResumeText(e.target.value)}
              />
            </div>

            {/* Footer: Export button */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-border/30">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOptimizePopup(false)}
              >
                关闭
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleExportPdf}
                disabled={!editableResumeText.trim() || exportingPdf}
              >
                {exportingPdf ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    生成PDF中...
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5 mr-1" />
                    导出简历 (PDF)
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ── Career Strategy Display Component ──
function CareerStrategyView({ data, partial }: { data: CareerStrategy | Partial<CareerStrategy>; partial?: boolean }) {
  const opacity = partial ? "opacity-70" : "";
  const d = data as CareerStrategy;
  const cursor = partial ? <span className="inline-block w-1.5 h-4 bg-primary animate-pulse rounded-sm align-middle ml-0.5" /> : null;

  return (
    <div className={cn("space-y-5", opacity)}>
      <div className="rounded-lg border border-border/50 bg-card p-5">
        <h3 className="text-sm font-semibold mb-2">求职方向总览</h3>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {d.overallDirection || cursor}
          {d.overallDirection && cursor}
        </p>
      </div>

      {d.industryAnalysis && (
        <div className="rounded-lg border border-border/50 bg-card p-5">
          <h3 className="text-sm font-semibold mb-2">行业趋势分析</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{d.industryAnalysis}</p>
        </div>
      )}

      {d.roleRecommendations?.length > 0 && (
        <div className="rounded-lg border border-border/50 bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">推荐岗位方向</h3>
          <div className="space-y-3">
            {d.roleRecommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-3 border-b border-border/30 pb-3 last:border-0">
                <span className="text-2xl font-bold text-primary/30">{r.fitScore || "—"}%</span>
                <div>
                  <p className="text-sm font-medium">{r.role || cursor}</p>
                  <p className="text-xs text-muted-foreground">{r.reason || ""}</p>
                  {r.keyRequirements?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {r.keyRequirements.map((req, j) => (
                        <span key={j} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{req}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {d.skillFocusAreas?.length > 0 && (
        <div className="rounded-lg border border-border/50 bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">技能聚焦方向</h3>
          <div className="space-y-2">
            {d.skillFocusAreas.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className={cn(
                  "mt-0.5 h-2 w-2 rounded-full shrink-0",
                  s.priority === "urgent" ? "bg-destructive" : s.priority === "short_term" ? "bg-warning" : "bg-primary"
                )} />
                <div>
                  <span className="font-medium">{s.skill || cursor}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {s.demandLevel === "high" ? "高需求" : s.demandLevel === "medium" ? "中等需求" : "新兴需求"}
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.learningPath || ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {d.salaryStrategy && (
        <div className="rounded-lg border border-border/50 bg-card p-5">
          <h3 className="text-sm font-semibold mb-2">薪资策略</h3>
          <p className="text-sm text-muted-foreground">市场范围：{d.salaryStrategy.marketRange || cursor}</p>
          <p className="text-xs text-muted-foreground mt-1">{d.salaryStrategy.timingAdvice || ""}</p>
          {d.salaryStrategy.negotiationTips?.length > 0 && (
            <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground space-y-1">
              {d.salaryStrategy.negotiationTips.map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
          )}
        </div>
      )}

      {d.applicationStrategy && (
        <div className="rounded-lg border border-border/50 bg-card p-5">
          <h3 className="text-sm font-semibold mb-2">投递策略</h3>
          <p className="text-sm text-muted-foreground">{d.applicationStrategy.timeline || ""}</p>
          {d.applicationStrategy.recommendedChannels?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {d.applicationStrategy.recommendedChannels.map((ch, i) => (
                <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{ch}</span>
              ))}
            </div>
          )}
          {d.applicationStrategy.resumeCustomizationTips?.length > 0 && (
            <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground space-y-1">
              {d.applicationStrategy.resumeCustomizationTips.map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
          )}
        </div>
      )}

      {d.riskWarnings?.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-5">
          <h3 className="text-sm font-semibold mb-2 text-warning">风险提示</h3>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            {d.riskWarnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Learning Plan Section (receives data from pipeline) ──