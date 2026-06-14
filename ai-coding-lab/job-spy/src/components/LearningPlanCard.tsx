"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Target, ExternalLink } from "lucide-react";
import type { LearningPlan } from "@/lib/schemas";

interface LearningPlanCardProps {
  data: LearningPlan;
}

const priorityColors: Record<string, string> = {
  high: "destructive",
  medium: "default",
  low: "secondary",
};

export function LearningPlanCard({ data }: LearningPlanCardProps) {
  // Defensive: guard against empty/incomplete data from streaming
  if (!Array.isArray(data?.phases) || !data.phases.length) {
    return <p className="text-sm text-muted-foreground">学习计划数据不完整，请重试。</p>;
  }
  return (
    <div className="space-y-4">
      {data.summary && <p className="text-sm text-muted-foreground">{data.summary}</p>}
      {data.phases.map((phase, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                {phase.name}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {phase.duration} · ~{phase.estimatedHours}h
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-1">学习目标</p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-0.5">
                {Array.isArray(phase.goals) && phase.goals.map((g, j) => (
                  <li key={j}>{g}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">学习主题</p>
              <div className="flex flex-wrap gap-1">
                {Array.isArray(phase.topics) && phase.topics.map((t, j) => (
                  <Badge key={j} variant="outline" className="text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
            {Array.isArray(phase.resources) && phase.resources.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1 flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  推荐资源
                </p>
                <ul className="space-y-1">
                  {phase.resources.map((r, j) => (
                    <li key={j} className="text-sm flex items-center gap-1">
                      <Badge variant="secondary" className="text-[10px] px-1 py-0">
                        {r.type === "book" ? "书" : r.type === "course" ? "课程" : r.type === "project" ? "项目" : "文档"}
                      </Badge>
                      {r.url ? (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-0.5"
                        >
                          {r.title}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span>{r.title}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
