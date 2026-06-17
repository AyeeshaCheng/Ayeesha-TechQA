"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { History, Trash2, FileText, Image, Loader2, Eye } from "lucide-react";

interface ParsedJDInfo {
  jobTitle?: string;
  company?: string;
  location?: string;
  salaryRange?: { min: number; max: number; currency: string };
}

interface HistoryRecord {
  id: string;
  raw_text: string;
  parsed_json: string | null;
  source_type: "text" | "image";
  created_at: string;
  latestMatch: {
    id: string;
    resume_snapshot: string;
    skill_match_json: string | null;
  } | null;
}

interface HistoryListProps {
  onSelect: (recordId: string, matchId?: string) => void;
  activeId?: string;
  selectable?: boolean;
  selectedIds?: string[];
  onDoubleClick?: (recordId: string) => void;
}

function parseJDInfo(record: HistoryRecord): ParsedJDInfo {
  if (record.parsed_json) {
    try {
      const parsed = JSON.parse(record.parsed_json);
      // Handle 3 DeepSeek field name formats:
      // 1. Schema-defined: jobTitle, company, location, salaryRange
      // 2. Chinese: 岗位名称, 公司名称, 工作地点, 薪资范围
      // 3. snake_case: job_title, company_name, location, salary
      const jobTitle = parsed.jobTitle || parsed.岗位名称 || parsed.job_title || undefined;
      const company = parsed.company || parsed.公司名称 || parsed.company_name || undefined;
      const location = parsed.location || parsed.工作地点 || undefined;

      // Salary can be { min, max, currency } or { min, max } or string
      let salaryRange: ParsedJDInfo["salaryRange"] | undefined;
      const rawSalary = parsed.salaryRange || parsed.薪资范围 || parsed.salary || undefined;
      if (rawSalary) {
        if (typeof rawSalary === "object" && rawSalary !== null) {
          salaryRange = {
            min: Number(rawSalary.min) || 0,
            max: Number(rawSalary.max) || 0,
            currency: rawSalary.currency || "CNY",
          };
        } else if (typeof rawSalary === "string") {
          // Parse "15K-25K" or "15,000-25,000 CNY" format
          const match = rawSalary.match(/([\d,.]+)\s*[-~–]\s*([\d,.]+)/);
          if (match) {
            const min = parseFloat(match[1].replace(/,/g, "")) * (rawSalary.includes("K") ? 1000 : 1);
            const max = parseFloat(match[2].replace(/,/g, "")) * (rawSalary.includes("K") ? 1000 : 1);
            salaryRange = { min, max, currency: "CNY" };
          }
        }
      }

      return { jobTitle, company, location, salaryRange };
    } catch { /* ignore */ }
  }
  return {};
}

function formatSalary(sr?: { min: number; max: number; currency: string }): string {
  if (!sr || (sr.min === 0 && sr.max === 0)) return "";
  const curr = sr.currency === "CNY" ? "¥" : sr.currency || "";
  if (sr.min && sr.max) return `${curr}${(sr.min / 1000).toFixed(0)}K-${(sr.max / 1000).toFixed(0)}K`;
  if (sr.max) return `${curr}${(sr.max / 1000).toFixed(0)}K`;
  return `${curr}${sr.min}`;
}

export function HistoryList({ onSelect, activeId, selectable, selectedIds = [], onDoubleClick }: HistoryListProps) {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/history");
      if (!res.ok) return;
      const data = await res.json();
      setRecords(data.records || []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await fetch(`/api/history?id=${id}`, { method: "DELETE" });
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
        暂无历史记录
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-2">
        {records.map((record) => {
          const jdInfo = parseJDInfo(record);
          const matchScore = (() => {
            if (record.latestMatch?.skill_match_json) {
              try {
                const sm = JSON.parse(record.latestMatch.skill_match_json);

                // Helper: map Chinese evaluation label → numeric score (0-10 scale)
                const evalToScore = (label: string): number | null => {
                  const map: Record<string, number> = {
                    "完全匹配": 10, "高度匹配": 10, "匹配": 8,
                    "部分匹配": 5, "较高": 7.5, "中等": 5, "中": 5,
                    "一般": 4, "较低": 2.5, "低": 2, "缺失": 0, "弱": 1,
                  };
                  // Also try prefix match
                  for (const [k, v] of Object.entries(map)) {
                    if (label.includes(k)) return v;
                  }
                  return null;
                };

                // (1) Standard Zod schema: overallMatchScore (number 0-100)
                if (typeof sm.overallMatchScore === "number") return sm.overallMatchScore;

                // (2) DeepSeek: { matching_analysis: { required_skills: { name: { score: 10 } } } }
                if (sm.matching_analysis && typeof sm.matching_analysis === "object") {
                  const ma = sm.matching_analysis as Record<string, unknown>;
                  const skillsObj = (ma.required_skills || ma.requiredSkills || {}) as Record<string, unknown>;
                  const scores = Object.values(skillsObj)
                    .map((v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>).score : null))
                    .filter((n): n is number => typeof n === "number");
                  if (scores.length > 0) {
                    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                    return Math.round(avg * 10); // 0-10 scale → 0-100
                  }
                }

                // (3) DeepSeek Chinese: { 匹配项: { 必需技能: { name: { 评估: "完全匹配" } } } }
                const matchItems = sm["匹配项"] || sm["匹配详情"];
                if (matchItems && typeof matchItems === "object") {
                  const mi = matchItems as Record<string, unknown>;
                  // Collect all evaluations from 必需技能 + 加分技能
                  const allEvals: string[] = [];
                  for (const cat of ["必需技能", "加分技能", "required_skills", "preferred_skills"]) {
                    const catObj = mi[cat];
                    if (catObj && typeof catObj === "object") {
                      for (const skillVal of Object.values(catObj as Record<string, unknown>)) {
                        if (skillVal && typeof skillVal === "object") {
                          const eval_ = (skillVal as Record<string, unknown>)["评估"] || (skillVal as Record<string, unknown>)["match"] || (skillVal as Record<string, unknown>)["匹配"];
                          if (typeof eval_ === "string") allEvals.push(eval_);
                        }
                      }
                    }
                  }
                  if (allEvals.length > 0) {
                    const numeric = allEvals.map(evalToScore).filter((n): n is number => n !== null);
                    if (numeric.length > 0) {
                      const avg = numeric.reduce((a, b) => a + b, 0) / numeric.length;
                      return Math.round(avg * 10); // 0-10 scale → 0-100
                    }
                  }
                }

                // (4) DeepSeek Chinese: { 评分: number | string | { score: number } }
                if (sm["评分"] !== undefined) {
                  const r = sm["评分"];
                  if (typeof r === "number") return r;
                  if (typeof r === "string" && /^\d+%?$/.test(r)) return parseInt(r);
                  if (typeof r === "object" && r !== null && typeof (r as Record<string, unknown>).score === "number") {
                    return (r as Record<string, unknown>).score as number;
                  }
                }

                // (5) DeepSeek: { 总分说明: "总分: 85/100" }
                if (typeof sm["总分说明"] === "string") {
                  const m = (sm["总分说明"] as string).match(/(\d+)\s*\/\s*100/);
                  if (m) return parseInt(m[1]);
                }

                // (6) Try Chinese key: 整体匹配度 (number or string label)
                if (sm["整体匹配度"] !== undefined) {
                  const v = sm["整体匹配度"];
                  if (typeof v === "number") return v;
                  if (typeof v === "string") {
                    if (/^\d+%?$/.test(v)) return parseInt(v);
                    const labels: Record<string, number> = { 高: 85, 强: 90, 较高: 75, 中等: 60, 中: 55, 一般: 45, 低: 30, 弱: 20 };
                    if (labels[v]) return labels[v];
                  }
                  if (typeof v === "object" && v !== null) {
                    const cn = v as Record<string, unknown>;
                    if (typeof cn.score === "number") return cn.score;
                    if (typeof cn.percent === "number") return cn.percent;
                  }
                }

                // (7) Try skill_match array: average score from { score } objects
                if (Array.isArray(sm.skill_match)) {
                  const scores = (sm.skill_match as Array<{ score?: number }>)
                    .map((s) => s.score)
                    .filter((n): n is number => typeof n === "number");
                  if (scores.length > 0) return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                }

                // (8) Try nested score object: { score: { total: 95 } }
                if (sm.score && typeof sm.score === "object" && typeof (sm.score as Record<string, unknown>).total === "number") {
                  return (sm.score as Record<string, unknown>).total as number;
                }
                if (typeof sm.score === "number") return sm.score;

                // (9) Try DeepSeek alternate keys: matchScore, final_score, total_score
                if (typeof sm.matchScore === "number") return sm.matchScore;
                if (typeof sm.final_score === "number") return sm.final_score;
                if (typeof sm.total_score === "number") return sm.total_score;

                return null;
              } catch { return null; }
            }
            return null;
          })();
          const salaryStr = formatSalary(jdInfo.salaryRange);

          return (
            <Card
              key={record.id}
              className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                activeId === record.id ? "border-primary bg-accent/30" : ""
              } ${
                selectable && selectedIds.includes(record.id) ? "border-primary bg-primary/5 ring-1 ring-primary/30" : ""
              }`}
              onClick={() =>
                onSelect(record.id, record.latestMatch?.id)
              }
              onDoubleClick={() => onDoubleClick?.(record.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {/* Job Title + Company */}
                    <p className="text-sm font-medium truncate">
                      {jdInfo.jobTitle || record.raw_text.slice(0, 40)}
                    </p>
                    {jdInfo.company && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {jdInfo.company}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {/* Match Score Badge */}
                      {matchScore !== null && (
                        <Badge variant={matchScore >= 70 ? "default" : matchScore >= 40 ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0">
                          匹配 {matchScore}%
                        </Badge>
                      )}
                      {/* Location */}
                      {jdInfo.location && (
                        <span className="text-[10px] text-muted-foreground">{jdInfo.location}</span>
                      )}
                      {/* Salary */}
                      {salaryStr && (
                        <span className="text-[10px] text-muted-foreground">{salaryStr}</span>
                      )}
                      {/* Source type */}
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {record.source_type === "image" ? (
                          <span className="flex items-center gap-0.5">
                            <Image className="h-3 w-3" />
                            图片
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5">
                            <FileText className="h-3 w-3" />
                            文本
                          </span>
                        )}
                      </Badge>
                      {/* View image button — only for image-sourced JDs */}
                      {record.source_type === "image" && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="h-5 w-5 text-muted-foreground hover:text-primary"
                          title="查看JD图片"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/api/jd/image?id=${record.id}`, "_blank");
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {record.created_at?.slice(0, 10)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                    onClick={(e) => handleDelete(e, record.id)}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
