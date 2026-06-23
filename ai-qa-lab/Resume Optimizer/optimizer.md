# 简历智能优化助手 - 架构需求文档（单用户版）

> **文档用途**：提供给 AI Coder（Claude/DeepSeek Coder V4）作为项目实现完整参考，所有代码块可直接复制使用。  
> **项目定位**：个人或家庭内网使用，仅内置一个用户，无注册功能，凭证通过环境变量配置。

---

## 1. 项目概述

**项目名称**：Resume Optimizer（简历智能优化助手）  
**最终部署环境**：ARM64 架构的家用 NAS（群晖/威联通），通过 Docker Compose 运行  
**开发环境**：Windows 本地开发，最终构建 ARM64 镜像  
**使用人群**：个人/家庭内部 1~3 人（共用同一账号）  
**访问方式**：内网 HTTP（如需外网通过 VPN/内网穿透，不作为核心功能）

**核心价值**：
- 上传 PDF 简历 + JD 截图 → AI 自动评估匹配度
- 通过多轮对话挖掘经历，针对性优化简历
- 生成优化后的 PDF 简历
- 保存历史 JD 及匹配记录
- 根据技能缺口生成学习计划

---

## 2. 功能需求

### 2.1 用户认证（简化版）
- 系统仅存在一个内置用户，账号密码通过环境变量 `APP_USERNAME` 和 `APP_PASSWORD` 设定。
- 前端仅保留登录界面，无注册入口。
- 登录成功后颁发 JWT，所有后续 API 请求需携带 `Authorization: Bearer <token>`。
- JWT 有效期 30 天（单用户场景可适当延长，减少登录频率）。

### 2.2 简历管理
- 上传 PDF 格式简历，系统提取文本内容。
- 简历列表展示，支持删除、查看原文。
- 系统仅维护一份“当前激活”的简历（或多份，由用户管理），用于匹配与优化。

### 2.3 JD 岗位管理
- 上传 JD 截图（PNG/JPG/JPEG），调用多模态模型进行 OCR 和结构化提取。
- 支持手动输入/编辑 JD 文本（可选备用方案）。
- JD 列表展示，关联匹配记录。

### 2.4 匹配度分析与优化
- 选择简历 + JD → 调用 AI 模型输出匹配度评分、匹配点、缺失要求、建议。
- 多轮对话：系统根据缺失点自动追问，用户补充经历。
- 实时流式返回对话内容（Server-Sent Events）。
- 整合原始简历 + 补充经历 + JD 要求 → 生成优化后的简历文本。
- 将优化后的简历生成 PDF 文件并提供下载。

### 2.5 历史记录
- 保存每次匹配的完整记录：简历、JD、匹配分数、优化简历、技能缺口。
- 历史列表支持按时间排序、查看详情、重新导出 PDF。

### 2.6 学习计划
- 基于匹配记录的技能缺口，调用 AI 生成结构化学习路线（主题、学习资源、建议时长）。
- 学习计划可保存，支持简单的进度标记（完成/未完成）。

### 2.7 全局要求
- 所有数据属于同一用户，无需数据隔离逻辑。
- 文件上传大小限制：单个文件不超过 10MB。
- 支持基本错误处理和友好提示。

---

## 3. 非功能需求

- **轻量级**：整个系统在 2 核 2GB 内存的 ARM NAS 上流畅运行。
- **低资源占用**：后端基础内存 < 500MB。
- **数据持久化**：SQLite + 文件系统，备份简便。
- **无外部依赖服务**：不使用 Redis、PostgreSQL 等重型中间件。
- **容器化部署**：所有服务通过 Docker Compose 编排，一键启动。
- **跨架构兼容**：开发期可在 Windows 上直接运行，最终构建 ARM64 镜像。
- **API 优先**：后端提供 RESTful API，前端通过 HTTP 通信。

---

## 4. 系统架构设计

### 4.1 总体拓扑
[用户浏览器]
│ HTTP:80 (内网)
▼
[ Nginx 容器 ]
│ /api/* → 反向代理（支持 SSE）
│ /* → 静态文件 (Vue SPA)
▼
[ FastAPI 后端容器 ]
│
├── SQLite (本地文件)
├── 文件存储 (本地目录)
└── 云端 AI API (OpenAI/DeepSeek 等)


### 4.2 分层架构

| 分层 | 组件 | 职责 |
|------|------|------|
| **接入层** | Nginx (Alpine) | 反向代理、静态资源服务 |
| **应用层** | FastAPI (Python 3.12) | 认证、业务逻辑、AI 调用、PDF 生成、文件处理 |
| **服务层** | 第三方 AI API | 文本对话、多模态识别、结构化提取 |
| **数据层** | SQLite (WAL 模式) + 文件系统 | 简历、JD、匹配记录、学习计划；原始文件存储 |

### 4.3 关键设计决策

- **为什么使用 SQLite？**  
  数据量极小，单用户访问，WAL 模式读写并发足够，零维护成本，备份只需拷贝文件。
- **为什么没有 Redis？**  
  JWT 长期有效，无需黑名单，所有处理同步完成，无消息队列需求。
- **为什么 OCR 不单独部署？**  
  通过云端多模态模型（如 GPT-4o-mini、通义千问 VL）直接处理图片，既能识别文字又能结构化提取 JD 要求，极简化系统。
- **为什么选择 WeasyPrint 生成 PDF？**  
  支持 HTML→PDF，样式丰富，Python 集成简单，缺点需要少量系统库（已在 Dockerfile 中处理）。

---

## 5. 技术栈明细

| 层级 | 技术 | 版本/说明 |
|------|------|-----------|
| 前端 | Vue 3 + Vite | SPA 模式，打包为纯静态文件 |
| UI 框架 | Tailwind CSS | 轻量、响应式 |
| 状态管理 | Pinia | 替代 Vuex |
| HTTP 客户端 | Axios | 请求拦截自动附加 JWT |
| 后端 | FastAPI | 异步框架，原生支持 SSE |
| 数据库 ORM | SQLAlchemy | 配合 SQLite |
| 用户认证 | python-jose (JWT) + passlib (bcrypt) | 仅校验内置用户 |
| PDF 解析 | pdfplumber | 提取 PDF 文本 |
| PDF 生成 | WeasyPrint | HTML 转 PDF |
| AI 接口 | openai Python 库 | 兼容 OpenAI/DeepSeek/通义千问 |
| 反向代理 | Nginx | Alpine 版本 |
| 容器化 | Docker + Docker Compose | 单机多容器管理 |
| CI/CD | GitHub Actions | 多架构构建 |

---

## 6. 数据库设计（SQLite）

> 仅一张用户表，但只存在一条记录，通过环境变量初始化。

### 6.1 表结构

```sql
PRAGMA foreign_keys = ON;

-- 用户表（仅一条记录）
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 简历表
CREATE TABLE resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255),
    content TEXT NOT NULL,          -- 提取后的纯文本
    file_path VARCHAR(500),         -- 原始文件存储路径
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 岗位描述表
CREATE TABLE job_descriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255),
    company VARCHAR(255),
    raw_text TEXT NOT NULL,         -- 从截图识别或手动输入的原始文本
    structured_text TEXT,           -- AI 结构化处理后的要点（JSON 字符串）
    screenshot_path VARCHAR(500),   -- 截图文件路径
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 优化匹配历史
CREATE TABLE match_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER,
    jd_id INTEGER,
    match_score INTEGER,            -- 0-100
    optimized_resume TEXT,          -- 优化后的简历文本（Markdown）
    missing_skills TEXT,            -- 技能缺口（JSON 数组字符串）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL,
    FOREIGN KEY (jd_id) REFERENCES job_descriptions(id) ON DELETE SET NULL
);

-- 对话记录（可选，用于重现优化过程）
CREATE TABLE conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    role TEXT NOT NULL,             -- 'user' | 'assistant'
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES match_history(id) ON DELETE CASCADE
);

-- 学习计划
CREATE TABLE study_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER,
    plan_content TEXT NOT NULL,     -- JSON 结构化学习计划
    progress TEXT DEFAULT '{}',     -- JSON 对象存储各条目的完成状态
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES match_history(id) ON DELETE SET NULL
);

6.2 索引
sql
CREATE INDEX idx_resumes_created ON resumes(created_at);
CREATE INDEX idx_job_descriptions_created ON job_descriptions(created_at);
CREATE INDEX idx_match_history_created ON match_history(created_at);
CREATE INDEX idx_study_plans_created ON study_plans(created_at);

6.3 应用启动时初始化内置用户
后端启动时检查 users 表是否有记录，若无则根据环境变量 APP_USERNAME 和 APP_PASSWORD 创建内置用户（密码使用 bcrypt 哈希）。

7. API 设计概要
统一前缀：/api/v1
认证方式：Authorization: Bearer <access_token>

7.1 认证模块
方法	路径	说明
POST	/api/v1/auth/login	登录，body: {username, password}，返回 {access_token, token_type: "bearer"}

7.2 简历模块
方法	路径	说明
POST	/api/v1/resumes/upload	上传 PDF，multipart/form-data
GET	/api/v1/resumes	获取简历列表
GET	/api/v1/resumes/{id}	获取简历详情及文本
DELETE	/api/v1/resumes/{id}	删除简历及文件

7.3 JD 岗位模块
方法	路径	说明
POST	/api/v1/jds/upload	上传截图，调用多模态解析并存储
GET	/api/v1/jds	列表
GET	/api/v1/jds/{id}	详情
DELETE	/api/v1/jds/{id}	删除
PUT	/api/v1/jds/{id}	手动编辑 JD 文本（可选）

7.4 优化匹配模块
方法	路径	说明
POST	/api/v1/match/analyze	开始匹配分析，body: {resume_id, jd_id}，返回基础评分和缺口
POST	/api/v1/match/chat	多轮对话优化，body: {match_id, message}，SSE 流式返回
POST	/api/v1/match/generate	生成优化简历，body: {match_id}，返回优化后简历文本
GET	/api/v1/match/{id}/export-pdf	下载优化后的 PDF
GET	/api/v1/match/history	获取历史记录列表
GET	/api/v1/match/{id}	获取某次匹配详情

7.5 学习计划模块
方法	路径	说明
POST	/api/v1/study/generate	根据 match_id 生成学习计划
GET	/api/v1/study/plans	获取所有学习计划
PUT	/api/v1/study/{id}/progress	更新学习进度

8. 前端页面路由设计
路由	页面	说明
/login	登录	仅登录，无注册链接
/	仪表板/简历列表	展示简历，上传、删除
/jobs	JD 岗位管理	上传截图，查看解析结果
/match/new	新建匹配	选择简历和 JD，发起分析
/match/:id	优化对话	多轮对话界面，流式输出
/match/history	历史记录	列表展示
/match/:id/result	结果展示	查看优化简历、匹配分数、导出 PDF
/study	学习计划列表	查看所有计划
/study/:id	学习计划详情	进度跟踪

9. 项目目录结构建议
text
resume-optimizer/
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py                    # FastAPI 应用入口，启动时初始化内置用户
│   ├── config.py                  # 配置读取（环境变量）
│   ├── database.py                # SQLAlchemy 初始化，表创建
│   ├── models/                    # ORM 模型
│   │   ├── user.py
│   │   ├── resume.py
│   │   ├── job_description.py
│   │   ├── match_history.py
│   │   └── study_plan.py
│   ├── schemas/                   # Pydantic 请求/响应模型
│   ├── api/                       # 路由分组
│   │   ├── auth.py
│   │   ├── resumes.py
│   │   ├── jds.py
│   │   ├── match.py
│   │   └── study.py
│   ├── services/                  # 业务逻辑
│   │   ├── ai_service.py          # 调用 AI 模型的统一封装
│   │   ├── pdf_service.py         # PDF 解析与生成
│   │   └── file_service.py        # 文件存储处理
│   ├── utils/
│   │   ├── security.py            # JWT 生成/校验、密码哈希
│   │   └── dependencies.py        # 依赖注入
│   └── data/                      # 运行时挂载的持久化目录
│       ├── db/                    # SQLite 文件存放
│       ├── uploads/               # 上传的原始文件
│       └── outputs/               # 生成的 PDF
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.js
│   │   ├── App.vue
│   │   ├── router/
│   │   ├── stores/                # Pinia（auth, resume等）
│   │   ├── views/                 # 页面组件
│   │   ├── components/            # 通用组件
│   │   └── utils/
│   │       ├── api.js             # Axios 实例及拦截器
│   │       └── auth.js
│   └── dist/                      # 构建产物（部署时挂载到 nginx）
├── nginx/
│   └── conf.d/
│       └── default.conf
├── docker-compose.yml
├── .env.example
└── .github/
    └── workflows/
        └── build-multiarch.yml
