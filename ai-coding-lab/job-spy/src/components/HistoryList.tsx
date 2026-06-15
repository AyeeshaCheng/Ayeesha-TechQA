"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { History, Trash2, FileText, Image, Loader2 } from "lucide-react";

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
      return {
        jobTitle: parsed.jobTitle,
        company: parsed.company,
        location: parsed.location,
        salaryRange: parsed.salaryRange,
      };
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
                // Try standard Zod schema: overallMatchScore (number 0-100)
                if (typeof sm.overallMatchScore === "number") return sm.overallMatchScore;
                // Try DeepSeek Chinese key: 整体匹配度 (could be number or label)
                if (sm["整体匹配度"] !== undefined) {
                  const v = sm["整体匹配度"];
                  if (typeof v === "number") return v;
                  if (typeof v === "string") {
                    if (/^\d+%?$/.test(v)) return parseInt(v); // "85%" → 85
                    const labels: Record<string, number> = { 高: 85, 强: 90, 较高: 75, 中等: 60, 中: 55, 一般: 45, 低: 30, 弱: 20 };
                    if (labels[v]) return labels[v];
                  }
                }
                // Try skill_match array: average score
                if (Array.isArray(sm.skill_match)) {
                  const scores = (sm.skill_match as Array<{ score?: number }>)
                    .map((s) => s.score)
                    .filter((n): n is number => typeof n === "number");
                  if (scores.length > 0) return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                }
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
