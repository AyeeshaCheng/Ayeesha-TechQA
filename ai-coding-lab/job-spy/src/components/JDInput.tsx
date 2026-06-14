"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/FileUpload";
import { FileText, Play, Loader2, CheckCircle } from "lucide-react";

interface JDInputProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  isRunning: boolean;
  disabled: boolean;
}

const SAMPLE_JD = `高级前端工程师 — 字节跳动

工作地点：北京 / 上海 / 深圳（混合办公）
薪资范围：35K-60K · 15薪

岗位职责：
1. 负责公司核心产品的前端架构设计与开发
2. 优化前端性能，提升用户体验和页面加载速度
3. 参与前端基础设施建设，包括组件库、工具链、CI/CD
4. 与产品、设计、后端团队紧密协作，推动技术方案落地
5. 主导技术选型和代码审查，提升团队整体技术水平

任职要求：
- 5年以上前端开发经验，3年以上 React 项目经验
- 精通 TypeScript，熟悉 React 生态（Next.js、Redux/Zustand）
- 熟悉前端工程化，有 Webpack/Vite 构建优化经验
- 了解 Node.js，有 BFF 或 SSR 开发经验
- 熟悉前端性能优化方法论（Lighthouse、Core Web Vitals）
- 良好的系统设计能力，能独立完成技术方案设计

加分项：
- 有大规模 Monorepo 管理经验（Turborepo/Nx）
- 了解 WebAssembly 或 Rust
- 有开源项目贡献经历
- 有跨端开发经验（React Native / Flutter）`;

/** 去掉招聘平台图片末尾的推广文字 */
function cleanJdText(text: string): string {
  return text
    .replace(/扫码查看职位详情\s*/g, "")
    .replace(/找工作[，,]?\s*BOSS直聘直接谈[！!]\s*/g, "")
    .replace(/BOSS直聘\s*APP\s*扫码\s*/g, "")
    .replace(/打开\s*BOSS直聘\s*查看更多职位详情\s*/g, "")
    .replace(/—\s*BOSS直聘\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function JDInput({ value, onChange, onRun, isRunning, disabled }: JDInputProps) {
  const [ocrText, setOcrText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrDone, setOcrDone] = useState(false);
  const [ocrError, setOcrError] = useState("");

  const runOcr = async (imageBase64: string) => {
    setOcrLoading(true);
    setOcrError("");
    setOcrDone(false);
    try {
      const res = await fetch("/api/ocr-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error((err as any).error || "OCR 识别失败");
      }
      const data = await res.json();
      // 去掉 BOSS 直聘等平台的推广尾部文字
      const cleaned = cleanJdText(data.jdText);
      setOcrText(cleaned);
      onChange(cleaned);
      setOcrDone(true);
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : "OCR 识别失败");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    await runOcr(base64);
  };

  const handleFillSampleImage = () => {
    setOcrLoading(true);
    setOcrError("");
    setOcrDone(false);
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL("image/jpeg", 0.9);
        await runOcr(base64);
      } catch (err) {
        setOcrLoading(false);
        setOcrError(err instanceof Error ? err.message : "图片处理失败");
      }
    };
    img.onerror = () => {
      setOcrLoading(false);
      setOcrError("示例图片加载失败，请检查网络或手动上传截图。");
    };
    img.src = "/samples/jd-sample.jpg";
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-primary" />
          岗位描述（JD）
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Image Upload — always visible at top */}
        <FileUpload
          accept="image/*"
          maxSizeMB={10}
          label="上传 JD 截图"
          hint="支持 PNG / JPG / WebP，自动 OCR 识别文字"
          onUpload={handleImageUpload}
        />

        {/* Fill sample image link */}
        <button
          type="button"
          onClick={handleFillSampleImage}
          disabled={isRunning || ocrLoading}
          className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          填入示例图片
        </button>

        {/* OCR status indicators */}
        {ocrLoading && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            正在识别图片中的文字...
          </p>
        )}
        {ocrDone && ocrText && (
          <div className="space-y-2">
            <p className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              识别完成，可在下方编辑后开始分析
            </p>
            <Textarea
              value={ocrText}
              onChange={(e) => {
                setOcrText(e.target.value);
                onChange(e.target.value);
              }}
              className="min-h-[200px] resize-y font-mono text-sm border-green-200"
              disabled={isRunning}
            />
          </div>
        )}
        {ocrError && (
          <p className="text-sm text-destructive">{ocrError}</p>
        )}

        {/* Divider + manual textarea — only when no OCR result */}
        {!(ocrDone && ocrText) && (
          <>
            <div className="border-t border-border/30" />
            <Textarea
              placeholder="粘贴岗位描述文本..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="min-h-[280px] resize-y font-mono text-sm"
              disabled={isRunning}
            />
          </>
        )}

        {/* Bottom action bar */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground shrink-0">{value.length} 字符</span>
          {disabled && !isRunning && (
            <span className="text-xs text-amber-600 flex-1 text-center">
              请先在"我的简历"中保存简历信息
            </span>
          )}
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange(SAMPLE_JD)}
              disabled={isRunning || ocrLoading}
            >
              填入示例文本
            </Button>
            <Button
              size="sm"
              onClick={onRun}
              disabled={disabled || isRunning || !value.trim()}
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  开始分析
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
