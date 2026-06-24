# Implementation Plan: 个人博客系统 (Personal Blog System)

**Branch**: `001-personal-blog-system` | **Date**: 2026-06-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-personal-blog-system/spec.md`

## Summary

构建一个功能完整的全栈博客系统。核心技术方案：Next.js 14 App Router（ISR + API Routes）、NextAuth.js v5（GitHub OAuth + Credentials）、Prisma ORM + PostgreSQL、Tailwind CSS 响应式布局。系统包含三级角色权限（admin/author/reader）、Markdown 编辑与实时预览、标签分类体系、SEO 元信息配置、仪表盘统计、图片上传等功能。

## Technical Context

**Language/Version**: TypeScript 5+ (strict mode)

**Primary Dependencies**: Next.js 14+ (App Router), NextAuth.js v5 (Auth.js), Prisma ORM, Tailwind CSS 3+, react-markdown + remark/rehype plugins (gfm, rehype-highlight), bcryptjs (password hashing), zod (validation), pinyin-pro (Chinese→pinyin slug)

**Storage**: PostgreSQL (primary, production); SQLite (dev fallback). 图片文件使用本地文件系统存储（`public/uploads/`），通过 storage adapter 接口预留 S3/OSS 扩展。

**Testing**: Vitest (单元测试 + 集成测试), Playwright (E2E 可选), React Testing Library (组件测试)

**Target Platform**: Web (Server: Node.js 18+ runtime; Client: Chrome/Firefox/Safari/Edge recent 2 versions). 响应式适配：Mobile ≥320px, Desktop ≥1280px.

**Project Type**: Web application — single Next.js project (frontend + backend in one)

**Performance Goals**: 首页 ISR revalidate ≤60s; 首次加载 (含图片) <2s; ISR 缓存命中导航 <500ms; 搜索/筛选 100 篇文章规模下 <1s

**Constraints**: 分页每页 ≤20 条; 图片上传 ≤10MB (JPEG/PNG/WebP); 密码 ≥8 位; ISR 内容更新延迟 ≤60s

**Scale/Scope**: 初期单用户博客 (博主=管理员=作者)，架构预留多用户扩展。预计规模：100 篇文章、50 标签、10 分类、<10 用户。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. 安全优先 | ✅ PASS | NextAuth.js v5 (GitHub OAuth + Credentials + session management), bcryptjs 密码哈希, API 路由逐端点 RBAC 校验, Zod 输入验证, middleware 路由保护 |
| II. 内容中心架构 | ✅ PASS | Markdown 写作 + react-markdown 预览, SEO 元信息 (title/description/og:image) 在 Article 模型支持, Tag 多对多 + Category 单选, 文章三态生命周期 (draft→published→archived) |
| III. 性能默认 | ✅ PASS | 首页 + 文章详情页 ISR (revalidate: 60), next/image 懒加载, 分页 ≤20 条/页, Tailwind 响应式设计 (mobile-first) |
| IV. RBAC | ✅ PASS | 三级角色 (admin/author/reader) 在 User.role 枚举, 每个 API 端点服务端校验 role, 标签删除前检查关联文章计数 |
| V. API-First | ✅ PASS | RESTful API 统一响应格式 { code, message, data }, TypeScript strict 前后端共享类型, 错误统一返回 { code, message } |

**Gate Result**: ALL PASS — 可以进入 Phase 0。

## Project Structure

### Documentation (this feature)

```text
specs/001-personal-blog-system/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.yaml         # OpenAPI 3.0 API contracts
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── app/                         # Next.js App Router
│   ├── layout.tsx               # Root layout (providers, metadata)
│   ├── page.tsx                 # Homepage (ISR, article list + pagination)
│   ├── about/
│   │   └── page.tsx             # About page (static, from SiteConfig)
│   ├── posts/
│   │   └── [id]-[slug]/
│   │       └── page.tsx         # Article detail (ISR, Markdown render)
│   ├── tags/
│   │   └── [tag]/
│   │       └── page.tsx         # Tag filter page
│   ├── categories/
│   │   └── [category]/
│   │       └── page.tsx         # Category filter page
│   ├── login/
│   │   └── page.tsx             # Login page
│   ├── register/
│   │   └── page.tsx             # Register page
│   ├── admin/
│   │   ├── layout.tsx           # Admin layout (auth guard)
│   │   ├── page.tsx             # Dashboard
│   │   ├── articles/
│   │   │   ├── page.tsx         # Article management list
│   │   │   ├── new/
│   │   │   │   └── page.tsx     # New article editor
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx # Edit article editor
│   │   ├── categories/
│   │   │   └── page.tsx         # Category management
│   │   ├── tags/
│   │   │   └── page.tsx         # Tag management
│   │   ├── users/
│   │   │   └── page.tsx         # User management
│   │   ├── media/
│   │   │   └── page.tsx         # Media management
│   │   └── settings/
│   │       └── page.tsx         # Site settings
│   └── api/
│       ├── auth/
│       │   ├── register/
│       │   │   └── route.ts
│       │   ├── [...nextauth]/
│       │   │   └── route.ts     # NextAuth.js handler
│       │   └── session/
│       │       └── route.ts
│       ├── articles/
│       │   ├── route.ts         # GET public articles (search, filter, paginate)
│       │   └── [id]/
│       │       └── route.ts     # GET single article (increment view)
│       ├── categories/
│       │   └── route.ts         # GET all categories
│       ├── tags/
│       │   └── route.ts         # GET all tags
│       ├── site-config/
│       │   └── route.ts         # GET site config (public)
│       ├── author/
│       │   └── articles/
│       │       ├── route.ts     # GET own articles / POST new
│       │       └── [id]/
│       │           ├── route.ts # PUT / DELETE own article
│       │           └── status/
│       │               └── route.ts # PATCH status transition
│       ├── admin/
│       │   ├── dashboard/
│       │   │   └── route.ts     # GET stats (cached, 5-min TTL)
│       │   ├── articles/
│       │   │   └── route.ts     # GET/PUT/DELETE any article
│       │   ├── categories/
│       │   │   └── [id]/
│       │   │       └── route.ts # PUT/DELETE category
│       │   ├── tags/
│       │   │   └── [id]/
│       │   │       └── route.ts # PUT/DELETE tag
│       │   ├── users/
│       │   │   ├── route.ts     # GET user list
│       │   │   └── [id]/
│       │   │       └── role/
│       │   │           └── route.ts # PUT role
│       │   └── site-config/
│       │       └── route.ts     # PUT site config
│       └── media/
│           ├── route.ts         # GET media list
│           └── upload/
│               └── route.ts     # POST upload
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── MobileNav.tsx
│   │   └── AdminSidebar.tsx
│   ├── article/
│   │   ├── ArticleCard.tsx      # Article list card
│   │   ├── ArticleList.tsx      # Article list with pagination
│   │   ├── MarkdownEditor.tsx   # Editor with live preview (textarea + preview pane)
│   │   ├── MarkdownRenderer.tsx # Read-only renderer + syntax highlight
│   │   └── ArticleStatusBadge.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── GitHubLoginButton.tsx
│   ├── admin/
│   │   ├── DashboardStats.tsx
│   │   ├── ArticleTable.tsx
│   │   ├── CategoryForm.tsx
│   │   ├── TagForm.tsx
│   │   ├── UserRoleSelect.tsx
│   │   ├── MediaGrid.tsx
│   │   └── SiteSettingsForm.tsx
│   ├── common/
│   │   ├── Pagination.tsx
│   │   ├── SearchBar.tsx
│   │   ├── TagBadge.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   ├── ConfirmDialog.tsx
│   │   └── ImageUpload.tsx
│   └── seo/
│       └── SeoMeta.tsx
├── lib/
│   ├── auth.ts                  # NextAuth.js configuration
│   ├── auth-utils.ts            # getSession, requireRole, requireAdmin helpers
│   ├── prisma.ts                # Prisma client singleton
│   ├── api-response.ts          # Unified { code, message, data } helpers
│   ├── validation.ts           # Zod schemas (register, article, category, etc.)
│   ├── slug.ts                  # Slug generation (pinyin-pro for Chinese)
│   ├── markdown.ts              # Markdown processing options (remark/rehype plugins)
│   ├── stats-cache.ts           # Dashboard stats cache (in-memory, 5-min TTL)
│   └── storage/
│       ├── adapter.ts           # StorageAdapter interface
│       ├── local.ts             # Local filesystem implementation
│       └── s3.ts                # S3/OSS stub (future)
├── middleware.ts                 # Next.js middleware (auth redirects + RBAC)
├── types/
│   ├── api.ts                   # API request/response types
│   ├── article.ts               # Article, Tag, Category types
│   ├── user.ts                  # User, Role types
│   └── media.ts                 # Media types
└── config/
    └── site.ts                  # Constants: PAGE_SIZE=20, MAX_UPLOAD=10MB, ISR_TTL=60s

prisma/
└── schema.prisma                # Database schema (7 models)

public/
└── uploads/                     # Local image storage (.gitkeep)

tests/
├── unit/
│   ├── lib/
│   │   ├── slug.test.ts
│   │   ├── validation.test.ts
│   │   └── api-response.test.ts
│   └── components/
│       └── Pagination.test.tsx
├── integration/
│   ├── api/
│   │   ├── auth.test.ts
│   │   ├── articles.test.ts
│   │   └── admin.test.ts
│   └── flows/
│       ├── registration-flow.test.ts
│       └── article-publish-flow.test.ts
└── e2e/
    └── blog-journey.spec.ts     # Playwright (optional)
```

**Structure Decision**: Single Next.js App Router project — frontend pages and API routes coexist in `src/app/`. Backend logic extracted to `src/lib/`, shared types in `src/types/`. Admin area uses a dedicated `layout.tsx` with auth guard. This is the standard Next.js full-stack pattern consistent with the constitution's "API-First" principle.

## Complexity Tracking

> No constitution violations — no complexity justification required.
