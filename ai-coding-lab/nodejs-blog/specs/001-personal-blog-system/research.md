# Research: 个人博客系统

**Feature**: 001-personal-blog-system
**Date**: 2026-06-24

## 1. NextAuth.js v5 (Auth.js) Setup

**Decision**: 使用 NextAuth.js v5 (Auth.js) 的 `GitHub` provider + `Credentials` provider 组合。

**Rationale**:
- Auth.js v5 是 Next.js App Router 的原生认证方案，原生支持 Route Handlers、Server Components、middleware。
- GitHub Provider 配置简单，只需 `GITHUB_ID` + `GITHUB_SECRET` 环境变量。
- Credentials Provider 支持邮箱密码登录，使用 `bcryptjs` 进行密码哈希和校验。
- 支持 `authorize` 回调中自定义逻辑——按 FR-003 要求检查 email 匹配自动关联已有账号。
- Session 策略使用 JWT（无需数据库存储 session），通过 `callbacks.jwt` 和 `callbacks.session` 自定义 token 中携带 `role` 字段。

**Alternatives Considered**:
- **NextAuth.js v4 (Pages Router)**: 与 App Router 集成需额外配置，且已停止活跃开发。
- **Lucia Auth**: 轻量但需要手动处理更多逻辑（CSRF、session cookie），社区生态不如 Auth.js 成熟。
- **Clerk / Auth0**: 第三方托管方案，功能强大但引入外部依赖和成本，不符合"个人博客"定位。

**Implementation Notes**:
- 文件位置：`src/lib/auth.ts` (Auth.js config) + `src/app/api/auth/[...nextauth]/route.ts` (handler)
- `callbacks.signIn`: 在 Credentials 登录时验证密码；在 GitHub 登录时检查 `user.email` 是否已注册，若匹配则关联 `githubId`
- `callbacks.jwt`: 将 `role`、`userId` 编码到 JWT token
- `callbacks.session`: 将 token 中的 `role` 暴露给客户端 `useSession()`
- Middleware (`src/middleware.ts`): 保护 `/admin/*` 和 `/author/*` 路由，检查 token 中的 role

## 2. Prisma ORM + Database

**Decision**: Prisma ORM + PostgreSQL (production) / SQLite (development fallback)。

**Rationale**:
- Prisma 提供类型安全的数据库操作，与 TypeScript strict 模式深度集成。
- Schema-first 设计：`prisma/schema.prisma` 作为单一数据模型源，自动生成迁移和类型。
- 支持 PostgreSQL 和 SQLite 双 provider 切换（通过 `DATABASE_URL` 环境变量）。
- 关系映射（多对多 Article↔Tag、一对多 Category→Article、一对多 User→Article）简洁直观。
- Prisma Studio (`npx prisma studio`) 可作为开发阶段的简易数据浏览器。

**Alternatives Considered**:
- **Drizzle ORM**: 更轻量，SQL-like API，但迁移工具和类型生成不如 Prisma 成熟。
- **TypeORM**: 功能全面但学习曲线陡峭，对 App Router 的 Edge Runtime 支持有限。
- **Raw SQL (pg)**: 最大灵活性但失去类型安全，不适合快速迭代。

**Implementation Notes**:
- `prisma/schema.prisma` 定义 7 个模型：User, Article, Tag, ArticleTag, Category, Media, SiteConfig
- `src/lib/prisma.ts`: Prisma client 单例（开发环境避免热重载创建多个实例）
- 初始迁移：`npx prisma migrate dev --name init`
- 种子数据：`prisma/seed.ts` 创建默认管理员账号和示例分类

## 3. Markdown 编辑与渲染

**Decision**: 编辑端使用 textarea + 实时预览分栏布局，渲染端使用 `react-markdown` + `rehype-highlight` + `remark-gfm`。

**Rationale**:
- `react-markdown` 生态成熟，支持自定义组件映射（如 `img` → `next/image`），安全性好（默认不渲染 HTML）。
- `rehype-highlight` 提供服务端代码语法高亮（支持 190+ 语言），无需客户端 JS。
- `remark-gfm` 支持 GitHub Flavored Markdown（表格、任务列表、删除线等）。
- 编辑端分栏（左侧编辑/右侧预览）是博客编辑器标准的 UX 模式，实现简单可靠。
- 实时预览通过 React state + debounce（300ms）即可实现，无需引入 CodeMirror 等重型编辑器。

**Alternatives Considered**:
- **MDX**: 功能更强（支持 JSX 嵌入），但博客文章不需要组件化内容，Markdown 足够。
- **CodeMirror / Monaco Editor**: 全功能代码编辑器，但对博客写作场景过重，增加 bundle size。
- **Tiptap (rich text)**: 所见即所得编辑器，但不适合需要精确控制 Markdown 格式的技术博客。

**Implementation Notes**:
- `src/components/article/MarkdownEditor.tsx`: 左右分栏，textarea + `MarkdownRenderer` 预览
- `src/components/article/MarkdownRenderer.tsx`: `react-markdown` 封装，注入 `rehype-highlight` + `remark-gfm`
- `src/lib/markdown.ts`: 统一的 remark/rehype 插件配置
- 文章列表页仅渲染摘要（纯文本，截断前 200 字符）

## 4. ISR (Incremental Static Regeneration)

**Decision**: 首页和文章详情页使用 Next.js App Router 的 `fetch` + `revalidate` 或 `generateStaticParams` + `revalidate` 选项实现 ISR。

**Rationale**:
- Next.js App Router 原生支持 ISR，在 `page.tsx` 中设置 `export const revalidate = 60` 即可。
- 首页：`revalidate = 60` 秒，每 60 秒最多重新生成一次静态页面。新文章发布后最多 60 秒对访问者可见。
- 文章详情页：`generateStaticParams` 预生成已发布文章的静态页面，`dynamicParams = true` + `revalidate = 60` 允许新文章按需生成。
- 标签/分类筛选页：可使用 SSR（`export const dynamic = 'force-dynamic'`）或较短的 ISR（如 120s），因为它们变化频率低。
- ISR 缓存命中时响应时间 <500ms，满足 SC-003 要求。

**Alternatives Considered**:
- **SSR (Server-Side Rendering)**: 每次请求都渲染，性能差且无缓存收益。
- **SSG (Static Site Generation)**: 全静态生成，但内容更新需要重新构建部署，不适合动态发布的博客。
- **On-Demand ISR**: 通过 API 触发重新验证（`revalidateTag` / `revalidatePath`），更精准但需要额外的事件驱动逻辑。暂不作为 MVP 需求。

**Implementation Notes**:
- 首页 `page.tsx`: `export const revalidate = 60`，从 Prisma 查询已发布文章
- 文章详情页: `export const revalidate = 60`，`generateStaticParams` 预取前 20 篇热门文章的 ID/slug
- `next.config.js`: 可能需要配置 `images.remotePatterns` 支持封面图的外部 URL

## 5. Image Upload & Storage

**Decision**: 本地文件系统存储 + Storage Adapter 抽象接口。

**Rationale**:
- MVP 阶段使用 `public/uploads/` 目录存储，直接通过 Next.js 静态文件服务访问。
- Storage Adapter 接口 (`src/lib/storage/adapter.ts`) 定义 `upload(file, filename)`, `delete(filename)`, `getUrl(filename)` 方法。
- 当前实现 `local.ts` 使用 Node.js `fs` + `path` + `crypto.randomUUID()` 生成唯一文件名。
- 未来切换到 S3/OSS 时，只需实现 `adapter.ts` 接口的 `s3.ts` 版本，业务代码无需修改。
- 图片上传通过 `multipart/form-data` POST 到 `/api/media/upload`，API route 校验文件类型和大小后委托给 storage adapter。

**Alternatives Considered**:
- **直接使用 S3**: 实现更简单（无抽象层），但不满足"预留云存储接口"的宪政要求。
- **Cloudinary / Uploadthing**: 第三方托管图片服务，减少运维负担但引入外部依赖和成本。

**Implementation Notes**:
- 上传限制在 `src/config/site.ts`: `MAX_UPLOAD_SIZE = 10 * 1024 * 1024` (10MB)
- 允许的 MIME 类型: `image/jpeg`, `image/png`, `image/webp`
- 文件名生成: `{uuid}.{ext}` 避免冲突
- `public/uploads/` 加入 `.gitignore`，保留 `.gitkeep`

## 6. Slug Generation (Chinese Titles)

**Decision**: 使用 `pinyin-pro` 库将中文标题转换为拼音 slug，同时支持英文标题直转。

**Rationale**:
- `pinyin-pro` 是纯 JS/TS 实现，无 native 依赖，支持全拼和首字母模式。
- Slug 策略：中文 → 全拼（空格替换为 `-`），英文 → 小写 + 空格替换为 `-` + 去除特殊字符。
- 作者可手动编辑 slug（FR-007 要求），系统保存手动编辑标记避免被标题修改覆盖。
- URL 格式 `/posts/[id]-[slug]`：ID 保证唯一性（解决同名标题冲突），slug 提升 SEO。

**Alternatives Considered**:
- **仅使用 ID**: 最简单但不友好，不利于 SEO 和分享。
- **仅使用 slug（无 ID）**: 需要更强的唯一性保证和重定向逻辑（旧 slug → 新 slug）。
- **使用日期前缀**: `/posts/2024-01-15-slug`，增加 URL 长度但携带时间语义。不如 ID-slug 简洁。

**Implementation Notes**:
- `src/lib/slug.ts`: `generateSlug(title: string): string` + `isManualSlug(articleId: number): boolean`
- Slug 生成规则: 检测是否含中文字符 → 拼音转换 → 小写 → 替换空格/特殊字符为 `-` → 去除连续 `-`
- 同名 slug 冲突: 数据库查询是否存在，追加 `-{random(1000,9999)}` 后缀

## 7. Dashboard Stats Cache

**Decision**: 服务端内存缓存（Node.js `Map` + TTL），5 分钟过期。

**Rationale**:
- 仪表盘统计数据（文章数、用户数、阅读量）不需要实时精确（FR-022 明确允许 5 分钟延迟）。
- 内存缓存避免了每次打开仪表盘都执行 5+ 条 COUNT/SUM 查询。
- 实现简单：`Map<string, { data, expiresAt }>`，读取时检查过期，过期则重新计算并更新。
- 5 分钟 TTL 对齐 spec 中定义的缓存窗口，在准确性和性能间取得平衡。

**Alternatives Considered**:
- **不做缓存 (实时计算)**: 适合极小规模，但每打开一次仪表盘就大量 COUNT 查询不优雅。
- **Redis**: 专业缓存方案，但对于个人博客项目的单机部署环境过于重型。
- **数据库物化视图**: PostgreSQL 物化视图可定期刷新，但增加了 DB 复杂度，不如应用层缓存简单。

**Implementation Notes**:
- `src/lib/stats-cache.ts`: `getStats()` → 检查缓存 → 过期则 Prisma 查询重新计算 → 返回
- 暴露 `invalidateStats()` 供关键操作后主动刷新（文章发布/删除时调用）

## 8. Testing Strategy

**Decision**: Vitest（单元测试 + 集成测试）+ React Testing Library（组件测试）+ Playwright（E2E 可选）。

**Rationale**:
- Vitest 与 TypeScript/ESM 原生兼容，配置简单（与 Vite 生态一致），速度比 Jest 快。
- React Testing Library 是 React 组件测试的标准方案。
- Playwright 用于关键用户旅程的 E2E 验证（注册→发布→浏览），优先级低可延后。
- 宪政要求"新功能 SHOULD 包含单元测试或集成测试"——核心 lib 函数和 API 端点必须有覆盖。

**Implementation Notes**:
- `vitest.config.ts`: jsdom 环境用于组件测试，node 环境用于 API/lib 测试
- 集成测试：使用 `node-mocks-http` 或直接调用 handler 函数测试 API route 逻辑
- 测试 seed: `prisma/seed-test.ts` 创建隔离的测试数据
