<!--
  Sync Impact Report
  ==================
  Version change: 0.0.0 (template) → 1.0.0
  Bump rationale: MAJOR — initial constitution defining all principles, sections, and governance from user requirements.

  Modified principles: N/A (first real content; template placeholders replaced)

  Added sections:
    - Core Principles (5 principles: Security First, Content-Centric Architecture,
      Performance by Default, Role-Based Access Control, API-First Design)
    - Technology Stack (prescribed stack with rationale)
    - Development Workflow (branching, quality gates, environment config)
    - Governance (amendment procedure, versioning, compliance review)

  Removed sections: None (template placeholders replaced, not removed)

  Templates requiring updates:
    - .specify/templates/plan-template.md       ✅ aligned (Constitution Check gate compatible)
    - .specify/templates/spec-template.md        ✅ aligned (user stories, requirements, success criteria)
    - .specify/templates/tasks-template.md       ✅ aligned (user-story-based phases, test-first)
    - .specify/templates/checklist-template.md   ✅ aligned (no constitution-specific references)

  Follow-up TODOs: None — all placeholders resolved.
-->

# Ayeesha Blog 项目宪法

## 核心原则

### I. 安全优先 (Security First)

所有用户输入 MUST 经过服务端验证和消毒处理。认证系统 MUST 同时支持
GitHub OAuth 和邮箱密码两种方式。授权 MUST 基于角色（RBAC）在每
个 API 端点强制执行，不可仅依赖前端路由隐藏。敏感操作（删除文章、
修改用户角色）MUST 要求二次确认。

**理由**: 个人博客系统涉及用户数据和内容管理，任何权限漏洞都可能导致
内容被篡改或数据泄露。安全是不可妥协的基础设施。

### II. 内容中心架构 (Content-Centric Architecture)

文章 MUST 以 Markdown 为主要内容格式，编辑时 MUST 提供实时预览。
所有已发布文章 MUST 配置 SEO 元信息（title、description、og:image）。
标签（Tag）与文章为多对多关系，分类（Category）与文章为单选关系。
文章 MUST 遵循生命周期：草稿（draft）→ 已发布（published）→ 已归档（archived）。

**理由**: 博客的核心价值在于内容创作与消费体验。Markdown 降低创作门槛，
完善的 SEO 支持确保内容可被发现，清晰的分类标签体系帮助读者导航。

### III. 性能默认 (Performance by Default)

首页和文章详情页 MUST 使用 ISR（Incremental Static Regeneration）策略，
在保证内容新鲜度的同时提供静态页面级别的加载速度。图片 MUST 进行
懒加载和按需缩放。列表页 MUST 实现分页，单页不超过 20 条记录。
前端 MUST 适配移动端和桌面端。

**理由**: 页面加载速度直接影响读者留存率和搜索引擎排名。ISR 在动态内容
和静态性能之间取得最优平衡，是内容型网站的最佳实践。

### IV. 基于角色的访问控制 (Role-Based Access Control)

系统 MUST 定义三种角色：
- **管理员（admin）**: 管理所有内容、用户和系统设置
- **作者（author）**: 创建、编辑、删除自己的文章
- **读者（reader）**: 浏览已发布文章和发表评论

每个角色的权限 MUST 在 API 层面强制校验。标签删除操作 MUST 检查
是否有关联文章在使用中，使用时不可删除。

**理由**: 明确的角色边界防止越权操作，保护内容完整性和系统安全。
三级角色覆盖了个人博客从单人写作到多人协作的所有场景。

### V. API 优先设计 (API-First Design)

前后端交互 MUST 通过 RESTful API 进行。API 响应 MUST 使用统一的
封装格式（包含 code、message、data 字段）。错误响应 MUST 返回明确
的错误码和人类可读的错误信息。所有 API 路由 MUST 有类型定义，
前后端共享类型契约。

**理由**: API 优先确保前端和后端可独立开发和测试，统一的响应格式
降低集成成本，类型契约在编译期捕获接口不匹配问题。

## 技术栈

### 前端
- **Next.js 14+ (App Router)**: 提供 ISR、SSR、文件系统路由等核心能力
- **TypeScript 5+ (strict 模式)**: 类型安全
- **Tailwind CSS 3+**: 响应式设计，实用优先的 CSS 框架
- **react-markdown + rehype/remark 插件**: Markdown 渲染与语法高亮

### 后端
- **Next.js API Routes / Route Handlers**: RESTful API 实现
- **NextAuth.js v5 (Auth.js)**: GitHub OAuth 和 Credentials Provider 认证
- **Prisma ORM**: 数据库访问与迁移管理
- **PostgreSQL**: 关系型数据库（开发阶段可降级使用 SQLite）

### 基础设施
- **本地文件存储**: 图片上传（预留 S3/OSS 云存储接口，通过 storage adapter 抽象）
- **ESLint + Prettier**: 代码规范与格式化
- **Environment Variables (.env)**: 环境差异化配置

### 技术选型理由
Next.js 全栈框架在一个项目中同时解决前端渲染和后端 API，降低运维复杂度，
适合个人博客项目的规模。Prisma 提供类型安全的数据库操作，与 TypeScript
深度集成。Tailwind CSS 的实用优先范式加速 UI 开发并天然支持响应式。

## 开发工作流

### 分支策略
- `main` 分支保持可部署状态
- 功能开发在 `feature/<功能名>` 分支进行
- 修复在 `fix/<问题描述>` 分支进行

### 质量门禁
- TypeScript 编译 MUST 零错误
- ESLint MUST 零警告
- 新功能 SHOULD 包含对应的单元测试或集成测试
- API 路由 SHOULD 有基础的请求验证

### 环境配置
- 所有环境变量 MUST 在 `.env.example` 中声明（不含真实值）
- 密钥和令牌 MUST NOT 提交到版本控制系统
- 开发环境使用 `NODE_ENV=development`

### 代码规范
- 组件文件使用 PascalCase，工具函数使用 camelCase
- API 路由文件遵循 Next.js App Router 约定
- 数据库模型使用 Prisma Schema 的 `PascalCase` 命名

## 治理

本宪法是项目最高指导文件。所有设计决策、代码审查和功能验收 MUST
以本宪法原则为基准。

### 修订流程
1. 提出修订建议并说明理由
2. 评估对现有代码和模板的影响
3. 更新宪法版本号（遵循语义化版本）
4. 同步更新受影响的模板和文档
5. 记录修订历史

### 版本策略
- **MAJOR**: 原则删除或不兼容的重新定义
- **MINOR**: 新增原则或章节，或实质性扩展指导
- **PATCH**: 措辞澄清、错字修正、非语义调整

### 合规审查
- 每个功能分支 MUST 在实现前通过宪法检查（参见 plan-template.md 中的 Constitution Check 门禁）
- 任何违反原则的设计 MUST 在 Complexity Tracking 中记录并说明理由
- 运行时开发指导参见 `CLAUDE.md` 和当前 `.specify/` 下的计划文件

**Version**: 1.0.0 | **Ratified**: 2026-06-24 | **Last Amended**: 2026-06-24
