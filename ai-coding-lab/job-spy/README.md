# JobSpy — AI 求职分析工具

基于 Next.js 15，采用 Prompt Chaining（5 步链式调用）。粘贴 JD + 简历 → AI 完成 JD 解析、技能匹配、竞争力分析、求职策略、学习计划。

## 本地运行

```bash
pnpm install && cp .env.example .env   # 填入 API Key
pnpm dev                                # → http://localhost:3000
```

## 架构速览

```
表现层    src/components/ + src/app/page.tsx     React 组件
状态层    src/hooks/                             useReducer 状态机 ×1
服务层    src/app/api/                           Next.js Route Handlers → streamObject() → NDJSON
基础层    src/lib/                               model/prompts/schemas/store/db
```

数据流：`用户输入 → Hook → API Route → AI(DeepSeek/Claude) → NDJSON 流 → dispatch → UI 实时更新`

Chain 5 步：`parse-jd → match-skills → analyze → strategize → learning-plan`，前 4 步致命、第 5 步非致命。

## 代码导航

### 页面 & 状态机

| 文件 | 核心区域 |
|------|----------|
| [src/app/page.tsx](src/app/page.tsx) | `Home`(L:23-765) — 双模式切换、`handleRun`(L:62-94)、`handleOptimize`(L:157-201)、`LearningPlanSection`(L:883-951)、`CareerStrategyView`(L:769-879) |
| [src/app/layout.tsx](src/app/layout.tsx) | ThemeProvider(L:22)、TooltipProvider(L:29) |
| [src/hooks/usePipeline.ts](src/hooks/usePipeline.ts) | `reducer`(L:67-123)、`run`(L:187-321) — 5 步顺序执行，`callStep`(L:126-181) NDJSON 流解析，`persistStep`(L:191-203) DB 持久化 |

### UI 组件

| 文件 | 关键内容 & 行号 |
|------|----------------|
| [JDInput.tsx](src/components/JDInput.tsx) | 图片 OCR `runOcr()`(L:50-73)、去推广文 `cleanJdText()`(L:44-51)、示例图片 `handleFillSampleImage()`(L:85-109)、OCR 完成后隐藏手动输入区 |
| [ResumePanel.tsx](src/components/ResumePanel.tsx) | 13 字段表单：姓名/电话/邮箱→求职意向→薪资→城市→技能→个人优势→项目经历→工作经历→教育经历→资格证书；PDF 解析 `parsePdfFile()`(L:93-305) 14 步提取；旧数据迁移 `migrateResume()`(L:34-52) |
| [FileUpload.tsx](src/components/FileUpload.tsx) | 通用拖拽/点击上传 |
| [PipelineView.tsx](src/components/PipelineView.tsx) | 5 步进度条可视化 |
| [StepCard.tsx](src/components/StepCard.tsx) | JSON 折叠查看(2 层)+Debug 面板 |
| [StrategyOutput.tsx](src/components/StrategyOutput.tsx) | 简历优化/面试准备/Cover Letter/技能补强 4 段渲染 |
| [DebugContent.tsx](src/components/DebugContent.tsx) | System Prompt + User Input + 耗时 |
| [LearningPlanCard.tsx](src/components/LearningPlanCard.tsx) | 阶段卡片：目标/主题/资源链接/预估时间 |
| [ChatPanel.tsx](src/components/ChatPanel.tsx) | 多轮对话流式渲染 |
| [HistoryList.tsx](src/components/HistoryList.tsx) | 历史 JD 列表卡片 |
| [ExportButton.tsx](src/components/ExportButton.tsx) | 导出 HTML 简历 |

### API 路由

| 路由 | 文件 | 输入 | Zod Schema |
|------|------|------|------------|
| `POST /api/chain/parse-jd` | [parse-jd/route.ts](src/app/api/chain/parse-jd/route.ts) | `{rawJD}` | `parsedJDSchema` |
| `POST /api/chain/match-skills` | [match-skills/route.ts](src/app/api/chain/match-skills/route.ts) | `{parsedJD, resume}` | `skillMatchSchema` |
| `POST /api/chain/analyze` | [analyze/route.ts](src/app/api/chain/analyze/route.ts) | `{parsedJD, skillMatch}` | `competitivenessSchema` |
| `POST /api/chain/strategize` | [strategize/route.ts](src/app/api/chain/strategize/route.ts) | `{parsedJD, skillMatch, competitiveness}` | `strategySchema` |
| `POST /api/chain/learning-plan` | [learning-plan/route.ts](src/app/api/chain/learning-plan/route.ts) | `{parsedJD, skillMatch, competitiveness?}` | `learningPlanSchema` |
| `POST /api/ocr-jd` | [ocr-jd/route.ts](src/app/api/ocr-jd/route.ts) | `{imageBase64}` | — （`getVisionModel()+generateText`） |
| `POST /api/parse-pdf` | [parse-pdf/route.ts](src/app/api/parse-pdf/route.ts) | FormData `{file}` | — （`pdf-parse` 提取文本） |
| `POST /api/chat` | [chat/route.ts](src/app/api/chat/route.ts) | `{messages, context}` | — （`streamText`，`onFinish` 提取亮点存 DB） |
| `POST /api/optimize-resume` | [optimize-resume/route.ts](src/app/api/optimize-resume/route.ts) | `{originalResume, jdSummary, chatHighlights}` | — |
| `POST /api/export-pdf` | [export-pdf/route.ts](src/app/api/export-pdf/route.ts) | `{content, matchResultId}` | — （生成 HTML 文件） |
| `POST /api/career-strategy` | [career-strategy/route.ts](src/app/api/career-strategy/route.ts) | `{jdIds[], resumeSummary}` | `careerStrategySchema` |
| `GET/DELETE /api/history` | [history/route.ts](src/app/api/history/route.ts) | query `?id=&type=` | — |
| `POST /api/jd/save` | [jd/save/route.ts](src/app/api/jd/save/route.ts) | 直接透传 body → `saveJdRecord()` | — |
| `POST /api/match/save` | [match/save/route.ts](src/app/api/match/save/route.ts) | 直接透传 body → `saveMatchResult()` | — |

> 所有 Chain API 结构一致：`streamObject({model, schema, system, prompt})` → `partialObjectStream` → `ReadableStream` → NDJSON。

### lib/ 基础设施

| 文件 | 核心职责 & 关键行号 |
|------|--------------------|
| [schemas.ts](src/lib/schemas.ts) | `resumeSchema`(L:5, 13 字段)、`parsedJDSchema`(L:25)、`skillMatchSchema`(L:49)、`competitivenessSchema`(L:65)、`strategySchema`(L:86)、`learningPlanSchema`(L:127)、`careerStrategySchema`(L:154) |
| [prompts.ts](src/lib/prompts.ts) | 8 组 System/User 对：JD_PARSER(L:3)、SKILL_MATCHER(L:32)、COMPETITIVENESS(L:65)、STRATEGY(L:96)、LEARNING_PLAN(L:126, 含 competitiveness)、RESUME_OPTIMIZE(L:156)、CHAT(L:192)、CAREER_STRATEGY(L:228) |
| [model.ts](src/lib/model.ts) | DeepSeek 适配 `deepseekFetch`(L:9-27) — `json_schema→json_object` + 追加 "Respond in JSON format"；`getModel()`(L:53)、`getVisionModel()`(L:66)、`getChatModel()`(L:81) |
| [store.ts](src/lib/store.ts) | localStorage：`getResume/saveResume`(L:18-25)、`getHistory/saveAnalysis/deleteAnalysis`(L:30-46, 最多 20 条) |
| [db.ts](src/lib/db.ts) | SQLite `initDb()`(L:10-55)：3 表 `jd_records/match_results/chat_sessions`；JD CRUD(L:64-102)、Match CRUD(L:106-162, `updateMatchResultField` 按字段更新)、Chat CRUD(L:164-193) |
| [storage.ts](src/lib/storage.ts) | 文件存储 `saveUploadedFile`(L:10)、`deleteFile`(L:38)、`fileExists`(L:47) → `data/` 目录 |
| [utils.ts](src/lib/utils.ts) | `cn()` — Tailwind class 合并(L:4-6) |

### 双层持久化

| 层级 | 技术 | 内容 | 位置 |
|------|------|------|------|
| 客户端 | localStorage | `jobspy_resume`(简历草稿)、`jobspy_history`(分析记录 ≤20) | [store.ts](src/lib/store.ts) |
| 服务端 | SQLite WAL | `data/jobspy.db` — jd_records / match_results / chat_sessions | [db.ts](src/lib/db.ts) |

## Debug 速查表

| 问题 | 先查 | 再查 |
|------|------|------|
| JD 解析结果不对 | [prompts.ts L:3-28](src/lib/prompts.ts) | [parse-jd/route.ts](src/app/api/chain/parse-jd/route.ts) |
| 技能匹配不准确 | [prompts.ts L:32-60](src/lib/prompts.ts) | [match-skills/route.ts](src/app/api/chain/match-skills/route.ts) |
| 竞争力/策略/学习计划问题 | [prompts.ts](src/lib/prompts.ts) 对应区段 | 对应 `chain/*/route.ts` |
| 流式输出中断 | [usePipeline.ts L:126-181](src/hooks/usePipeline.ts) `callStep` | 对应 API route NDJSON 编码 |
| AI 返回 JSON 非法 | [model.ts L:9-27](src/lib/model.ts) DeepSeek 适配 | [schemas.ts](src/lib/schemas.ts) 对应 Zod Schema |
| 图片 OCR 失败 | [ocr-jd/route.ts](src/app/api/ocr-jd/route.ts) | [model.ts L:66-78](src/lib/model.ts) `getVisionModel` |
| PDF 解析字段缺失 | [ResumePanel.tsx L:93-305](src/components/ResumePanel.tsx) | [parse-pdf/route.ts](src/app/api/parse-pdf/route.ts) |
| 前端状态异常 | [usePipeline.ts L:67-123](src/hooks/usePipeline.ts) reducer | [page.tsx L:27](src/app/page.tsx) usePipeline 调用 |
| localStorage 数据损坏 | [ResumePanel.tsx L:34-52](src/components/ResumePanel.tsx) `migrateResume` | [store.ts L:10-25](src/lib/store.ts) |
| 数据库报错 | [db.ts L:10-55](src/lib/db.ts) `initDb` | 对应 API route |
| 环境变量不生效 | `getModel/getVisionModel/getChatModel` in [model.ts](src/lib/model.ts) | `.env` 文件 |
| JD 输入重复显示两份 | [JDInput.tsx L:169-180](src/components/JDInput.tsx) 条件渲染 | OCR 完成后隐藏逻辑 |
| 图片 JD 含推广尾文 | [JDInput.tsx L:44-51](src/components/JDInput.tsx) `cleanJdText()` | 正则替换模式 |

## 修改影响范围

| 改动 | 必改文件 | 建议检查 |
|------|----------|----------|
| 新增/改 Schema | [schemas.ts](src/lib/schemas.ts) | 对应 API route、消费该类型的组件/hook |
| 新增/改 Prompt | [prompts.ts](src/lib/prompts.ts) | 对应 API route、Hook 中 debug 记录 |
| 新增 Chain 步骤 | [schemas.ts](src/lib/schemas.ts) + [usePipeline.ts](src/hooks/usePipeline.ts) + 新 route | [prompts.ts](src/lib/prompts.ts)、[page.tsx](src/app/page.tsx)、[db.ts](src/lib/db.ts) |
| 简历字段增删 | [schemas.ts](src/lib/schemas.ts) `resumeSchema` + [ResumePanel.tsx](src/components/ResumePanel.tsx) | [store.ts](src/lib/store.ts)、[page.tsx L:164-175](src/app/page.tsx) `handleOptimize` 简历字符串 |
| 换模型/换 provider | `.env` 环境变量 | [model.ts](src/lib/model.ts) 3 个 `get*Model()` |
| UI 样式调整 | [globals.css](src/app/globals.css) CSS 变量 | 各组件 className |
