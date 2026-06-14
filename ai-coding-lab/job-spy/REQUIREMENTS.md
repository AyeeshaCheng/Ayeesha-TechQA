# JobSpy v2 需求规格文档

> 目标读者：AI 编程助手（如 DeepSeek Coder）。文档采用结构化描述，便于 AI 理解后生成代码。

---

## 1. 项目背景

**现有项目**：`agent/job-spy` — 中文 AI 求职分析工具。

**现有能力**：
- 用户手动粘贴 JD 文本 + 填写简历表单
- 4 步 Chain 流水线：解析 JD → 技能匹配 → 竞争力分析 → 求职策略
- 支持 Single Prompt 模式（一次调用完成全部分析）
- 支持 Compare 模式（Chain vs Single 对比）
- 流式结构化 JSON 输出（NDJSON）
- 多模型抽象层（OpenAI/Anthropic，已适配 DeepSeek）
- 浏览器 localStorage 存储简历和分析历史

**目标**：升级为支持 PDF/图片输入、多轮对话、PDF 导出、服务端持久化的完整求职助手。

---

## 2. 环境约束

| 约束项 | 值 |
|--------|-----|
| 用户数量 | ≤ 5 人，纯私用 |
| 开发环境 | Windows (x86_64) |
| 部署环境 | ARM64 家用 NAS |
| 部署方式 | Docker 单容器 |
| 网络 | 仅局域网，无需 HTTPS/域名/公网鉴权 |
| 性能要求 | 无并发压力，单用户顺序操作即可 |

---

## 3. 功能需求清单

### R1: 文件上传 + OCR 识别 + 简历优化 + PDF 导出

**用户故事**：用户上传 PDF 简历和 JD 截图 → 系统提取文字 → 多轮对话挖掘经历亮点 → 根据 JD 优化简历 → 导出 PDF。

**子功能拆解**：

| ID | 功能 | 输入 | 输出 | 技术要点 |
|----|------|------|------|---------|
| R1.1 | PDF 简历上传 | `.pdf` 文件 | 纯文本简历内容 | 用 `pdf-parse` 提取文本；解析后存入 `ResumeData`（复用 `resumeSchema`） |
| R1.2 | JD 截图上传 | `.png/.jpg` 图片 | JD 纯文本 | 前端把图片转 base64 → POST `/api/ocr-jd` → 服务端调 Vision LLM 识别文字 → 返回 JD 文本 |
| R1.3 | 多轮问答挖掘 | 聊天消息列表 | 优化后的简历亮点文本 | POST `/api/chat` → 服务端维护对话历史 → 逐步挖掘用户未写出的项目经历/技能细节 |
| R1.4 | 简历优化 | 原始简历 + JD + 对话总结 | 优化后的简历文本 | 复用现有 chain 流水线，增加优化专用 prompt |
| R1.5 | PDF 导出 | 优化后的简历文本 | `.pdf` 文件下载 | POST `/api/export-pdf` → 服务端用 `@react-pdf/renderer` 生成 PDF → 返回 binary stream |

### R2: 历史数据持久化

**用户故事**：用户可查看历史上传的 JD、匹配结果、优化后的简历、导出的 PDF。

**存储对象**：

| 数据类型 | 存储方式 | 字段 |
|---------|---------|------|
| JD 结构化数据 | SQLite 表 `jd_records` | id, raw_text, parsed_json, source_image_path, created_at |
| 匹配结果 | SQLite 表 `match_results` | id, jd_record_id, resume_snapshot, skill_match_json, competitiveness_json, strategy_json, learning_plan_json, created_at |
| 优化后简历文本 | SQLite 表 `optimized_resumes` | id, match_result_id, content_text, version, created_at |
| JD 原始图片 | 文件系统 `/data/jd-images/` | 以 UUID 命名 |
| 导出的 PDF | 文件系统 `/data/exports/` | 以 UUID 命名 |
| 原始简历 PDF | 文件系统 `/data/resumes/` | 以 UUID 命名 |

### R3: 学习计划生成

**用户故事**：系统对比简历和 JD 的技能缺口，自动生成分阶段学习计划。

**处理逻辑**：
1. 从 `skillMatch` 结果中提取 `missingSkills` 和 `partialMatches`
2. 调用 LLM 生成学习计划
3. 输出包含：阶段划分（短期/中期/长期）、每个阶段的学习目标、推荐资源、预估时间

**API**: `POST /api/chain/learning-plan`
- 入参: `{ parsedJD, skillMatch, competitiveness }`
- 出参: `LearningPlan` (Zod Schema 约束)
- Prompt: `LEARNING_PLAN_SYSTEM` + `LEARNING_PLAN_USER`

### R4: 求职执行策略（扩展现有）

**用户故事**：系统输出定制化投递、面试、谈薪全套策略。

**实现**：扩展现有 `strategize/route.ts` 的 prompt，新增维度：
- 投递渠道建议
- 面试节奏规划
- 薪资谈判策略
- 入职前准备清单

### R5: Docker ARM64 打包

**用户故事**：一键部署到 ARM64 NAS。

**要求**：
- `next.config.ts` 添加 `output: 'standalone'`
- Dockerfile 多阶段构建，目标平台 `linux/arm64`
- `docker-compose.yml` 挂载 `/data` 目录持久化
- Windows 上可构建 ARM64 镜像

---

## 4. 技术规格

### 4.1 新增依赖

```json
{
  "pdf-parse": "^1.1.1",
  "better-sqlite3": "^11.0.0",
  "@react-pdf/renderer": "^3.0.0"
}
```

### 4.2 新增 API 路由规格

#### `POST /api/ocr-jd`

```typescript
// Request
{ imageBase64: string }  // "data:image/png;base64,iVBORw0..."

// Response (JSON)
{ jdText: string }       // 提取出的 JD 纯文本

// 内部调用 getVisionModel()，prompt: "提取图片中所有招聘JD文字，保持原有格式"
```

#### `POST /api/chat`

```typescript
// Request
{
  messages: Array<{ role: "user" | "assistant", content: string }>,
  context: { jdText: string, resumeText: string }
}

// Response (NDJSON stream, 复用 streamText)
// 每行: { delta: string }  流式对话回复

// System prompt 预设角色: "你是资深职业顾问，帮用户挖掘简历中未写出的项目经历和技能亮点"
```

#### `POST /api/export-pdf`

```typescript
// Request
{ content: string }       // 优化后的简历 Markdown/文本

// Response
// Content-Type: application/pdf
// Body: PDF binary stream
```

#### `POST /api/chain/learning-plan`

```typescript
// Request
{ parsedJD: ParsedJD, skillMatch: SkillMatch, competitiveness: CompetitivenessAnalysis }

// Response (NDJSON stream)
// 流式返回 LearningPlan 对象
```

### 4.3 新增 Zod Schema

```typescript
// 学习计划
const learningPlanSchema = z.object({
  summary: z.string(),
  phases: z.array(z.object({
    name: z.string(),           // "短期（1-4周）"
    duration: z.string(),       // "4周"
    goals: z.array(z.string()),
    topics: z.array(z.string()),
    resources: z.array(z.object({
      title: z.string(),
      url: z.string().optional(),
      type: z.enum(["book", "course", "doc", "project"])
    })),
    estimatedHours: z.number()
  }))
})

// 对话消息
const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string()
})
```

### 4.4 model.ts 扩展

```typescript
// 新增 Vision 模型入口（用于 OCR）
export function getVisionModel() {
  const provider = process.env.VISION_MODEL_PROVIDER || process.env.MODEL_PROVIDER || "openai"
  const modelName = process.env.VISION_MODEL_NAME || "gpt-4o"
  
  if (provider === "openai") {
    return openai.chat(modelName)
  }
  // ... 其他 provider
}
```

新增环境变量：
```
VISION_MODEL_PROVIDER=openai     # Vision 模型可能不同于文本模型
VISION_MODEL_NAME=gpt-4o
```

### 4.5 数据库表设计 (SQLite)

```sql
CREATE TABLE jd_records (
  id TEXT PRIMARY KEY,           -- UUID
  raw_text TEXT NOT NULL,
  parsed_json TEXT,              -- JSON string of ParsedJD
  source_image_path TEXT,        -- 原图路径，null if 手动输入
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE match_results (
  id TEXT PRIMARY KEY,           -- UUID
  jd_record_id TEXT NOT NULL REFERENCES jd_records(id),
  resume_snapshot TEXT NOT NULL, -- JSON string of ResumeData
  skill_match_json TEXT,
  competitiveness_json TEXT,
  strategy_json TEXT,
  learning_plan_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE optimized_resumes (
  id TEXT PRIMARY KEY,           -- UUID
  match_result_id TEXT NOT NULL REFERENCES match_results(id),
  content_text TEXT NOT NULL,
  pdf_path TEXT,
  version INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_sessions (
  id TEXT PRIMARY KEY,           -- UUID
  match_result_id TEXT REFERENCES match_results(id),
  messages_json TEXT NOT NULL,   -- JSON array of chat messages
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4.6 db.ts 接口（替代 store.ts）

```typescript
// 导出的函数签名
export function initDb(): void                    // 启动时初始化，创建表
export function saveJdRecord(record: JdRecord): void
export function getJdRecords(): JdRecord[]
export function saveMatchResult(result: MatchResult): void
export function getMatchResults(jdId?: string): MatchResult[]
export function saveOptimizedResume(resume: OptimizedResume): void
export function getOptimizedResumes(matchId?: string): OptimizedResume[]
export function saveChatSession(session: ChatSession): void
export function getChatSession(id: string): ChatSession | null
export function deleteJdRecord(id: string): void   // 级联删除关联数据
```

### 4.7 文件存储工具

```typescript
// lib/storage.ts
export function saveUploadedFile(buffer: Buffer, category: "jd-images" | "resumes" | "exports", ext: string): string
// 返回: "/data/jd-images/uuid.png"

export function getFilePath(relativePath: string): string
// 返回绝对路径

export function deleteFile(relativePath: string): void
```

---

## 5. 前端组件规格

### 5.1 新增组件

| 组件名 | 职责 | 关键 Props |
|--------|------|-----------|
| `FileUpload.tsx` | PDF/图片拖拽上传，预览 | `accept`, `onUpload: (file: File) => void`, `maxSize` |
| `ChatPanel.tsx` | 多轮对话界面（聊天气泡） | `context`, `onComplete: (summary: string) => void` |
| `LearningPlanCard.tsx` | 学习计划展示（阶段时间轴） | `data: LearningPlan` |
| `HistoryList.tsx` | 历史记录侧边栏 | `onSelect: (id: string) => void` |
| `ExportButton.tsx` | 导出 PDF 按钮（含 loading） | `content: string`, `filename: string` |

### 5.2 修改组件

| 组件名 | 改动 |
|--------|------|
| `page.tsx` | 增加左侧历史列表、增加"上传简历""上传JD截图"入口、增加多轮对话面板 |
| `ResumePanel.tsx` | 保留手动填写，增加 PDF 上传按钮，上传后自动填充 |
| `PipelineView.tsx` | 步骤数从 4 扩展到 6（新增学习计划、PDF导出步骤） |

---

## 6. 页面交互流程

### 6.1 端到端主流程

```
┌─────────────────────────────────────────────────────────────┐
│  步骤1: 上传简历                                              │
│  [上传PDF] → pdf-parse 提取文本 → 自动填充简历字段             │
│  用户可手动补充/修改                                          │
├─────────────────────────────────────────────────────────────┤
│  步骤2: 上传JD                                               │
│  选择: [上传截图] 或 [粘贴文本]                                │
│  截图 → Vision LLM OCR → 提取JD文本                          │
├─────────────────────────────────────────────────────────────┤
│  步骤3: 开始分析                                              │
│  [开始分析] → Chain流水线执行 → 实时展示4步结果                │
│  步骤3.1 解析JD                                              │
│  步骤3.2 技能匹配 → 自动触发步骤5 学习计划                     │
│  步骤3.3 竞争力分析                                           │
│  步骤3.4 求职策略                                             │
│  步骤3.5 学习计划（新增）                                      │
├─────────────────────────────────────────────────────────────┤
│  步骤4: 多轮对话挖掘（可选）                                   │
│  AI提问 → 用户回答 → AI追问 → 挖掘隐藏亮点                    │
│  对话总结自动合并到简历优化上下文中                             │
├─────────────────────────────────────────────────────────────┤
│  步骤5: 优化简历 + 导出                                       │
│  [优化简历] → LLM基于JD+对话总结优化 → 展示优化后文本          │
│  [导出PDF] → 服务端生成PDF → 浏览器下载                        │
├─────────────────────────────────────────────────────────────┤
│  步骤6: 历史查看                                              │
│  左侧历史列表 → 点击任意记录 → 回溯查看完整分析                 │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 页面布局（升级后）

```
┌──────────┬──────────────────────────────────────────────┐
│ 历史列表  │  主内容区                                      │
│          │  ┌──────────────────────────────────────────┐ │
│ 记录1    │  │ Tab: [简历] [JD输入] [分析结果] [对话]     │ │
│ 记录2 ←  │  ├──────────────────────────────────────────┤ │
│ 记录3    │  │                                          │ │
│          │  │  简历面板: PDF上传 / 手动填写              │ │
│          │  │  JD面板:   截图上传 / 文本粘贴              │ │
│          │  │  分析面板: PipelineView + StepCards       │ │
│          │  │  对话面板: ChatPanel                      │ │
│          │  │                                          │ │
│          │  └──────────────────────────────────────────┘ │
│          │  [开始分析] [优化简历] [导出PDF] [学习计划]      │
└──────────┴──────────────────────────────────────────────┘
```

---

## 7. 环境变量（完整）

```env
# 文本模型（分析/策略/学习计划）
MODEL_PROVIDER=openai
MODEL_NAME=deepseek-chat
MODEL_BASE_URL=https://api.deepseek.com/v1

# Vision 模型（JD截图OCR，需要支持多模态）
VISION_MODEL_PROVIDER=openai
VISION_MODEL_NAME=gpt-4o
# VISION_MODEL_BASE_URL=https://api.openai.com/v1  # 可选

# API Keys
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx

# 数据存储路径（Docker内）
DATA_DIR=/app/data
```

---

## 8. Docker 部署规格

```yaml
# docker-compose.yml
services:
  job-spy:
    build:
      context: .
      platforms:
        - linux/arm64
    image: job-spy:latest
    ports:
      - "3000:3000"
    env_file:
      - .env
    volumes:
      - ./data:/app/data          # 持久化数据库 + 文件
    restart: unless-stopped
```

```dockerfile
# Dockerfile
FROM --platform=linux/arm64 node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM --platform=linux/arm64 node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
RUN mkdir -p /app/data
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 9. 开发优先级

| 优先级 | 模块 | 理由 |
|--------|------|------|
| P0 | SQLite + 文件系统持久化 (R2) | 是所有其他功能的底座，必须先有 |
| P0 | model.ts Vision 模型扩展 | OCR 入口，R1 的前置依赖 |
| P1 | PDF 简历解析 + JD 截图 OCR (R1) | 核心输入能力 |
| P1 | 学习计划 API (R3) | 新 Chain 步骤，独立可测 |
| P2 | 多轮对话 (R1.3) | 增强体验，非阻塞功能 |
| P2 | PDF 导出 (R1.5) | 最终输出物 |
| P2 | 策略扩展 (R4) | 改 prompt 即可，低工作量 |
| P3 | Docker 打包 (R5) | 开发完成后再打包 |
| P3 | 历史记录前端 | 展示层，依赖 P0 数据层就绪 |
