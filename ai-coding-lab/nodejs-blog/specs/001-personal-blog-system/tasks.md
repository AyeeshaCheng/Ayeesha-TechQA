# Tasks: 个人博客系统 (Personal Blog System)

**Input**: Design documents from `/specs/001-personal-blog-system/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Core lib functions and critical API endpoints include tests per constitution requirement ("新功能 SHOULD 包含对应的单元测试或集成测试").

**Organization**: Tasks grouped by user story (US1–US4) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Next.js App Router**: `src/app/` for pages and API routes, `src/components/` for UI, `src/lib/` for logic
- **Database**: `prisma/schema.prisma` for schema, `prisma/seed.ts` for seed data
- **Tests**: `tests/unit/`, `tests/integration/`, `tests/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, tooling configuration

- [ ] T001 Initialize Next.js 14 project with TypeScript (strict mode) in `src/`; create `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`
- [ ] T002 [P] Install core dependencies: `next`, `react`, `react-dom`, `typescript`, `@types/react`, `@types/node`, `tailwindcss`, `postcss`, `autoprefixer`
- [ ] T003 [P] Install dev tooling: `eslint`, `eslint-config-next`, `prettier`, `vitest`, `@testing-library/react`, `jsdom`; configure `.eslintrc.json` and `.prettierrc`
- [ ] T004 [P] Create `src/config/site.ts` with constants: PAGE_SIZE=20, MAX_UPLOAD_SIZE=10MB, ISR_TTL=60s, ALLOWED_MIME_TYPES, PASSWORD_MIN_LENGTH=8
- [ ] T005 [P] Create `src/types/api.ts` — unified API response types: `ApiResponse<T>`, `ApiError`, `PaginatedData<T>`
- [ ] T006 [P] Create `src/types/user.ts` — `User`, `Role` enum, `SessionUser`
- [ ] T007 [P] Create `src/types/article.ts` — `Article`, `ArticleStatus` enum, `ArticleListItem`, `Tag`, `Category`, `ArticleCreateInput`, `ArticleUpdateInput`
- [ ] T008 [P] Create `src/types/media.ts` — `MediaItem`, `MediaUploadResult`
- [ ] T009 [P] Create `src/lib/api-response.ts` — `successResponse(data, message?)`, `errorResponse(code, message)` helpers with unified `{ code, message, data }` format
- [ ] T010 [P] Create `src/lib/validation.ts` — Zod schemas: `registerSchema`, `loginSchema`, `articleCreateSchema`, `articleUpdateSchema`, `categorySchema`, `tagSchema`, `siteConfigSchema`, `roleUpdateSchema`
- [ ] T011 Configure environment variables: create `.env.example` with DATABASE_URL, AUTH_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET, AUTH_URL, UPLOAD_DIR, MAX_UPLOAD_SIZE
- [ ] T012 Create global CSS entry: `src/app/globals.css` with Tailwind directives (`@tailwind base/components/utilities`) and custom theme variables for Linear/Vercel-style dark+light modes
- [ ] T013 Create root layout skeleton `src/app/layout.tsx` with HTML metadata, font loading, body wrapper (providers added later)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, authentication framework, middleware, and shared components that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T014 Create Prisma schema `prisma/schema.prisma` with all 7 models (User, Article, Category, Tag, ArticleTag, Media, SiteConfig) per data-model.md — enums Role/ArticleStatus, relations, unique constraints, indexes
- [ ] T015 Run `npx prisma migrate dev --name init` to generate migration; create `src/lib/prisma.ts` — Prisma client singleton with global caching for dev hot-reload
- [ ] T016 Create seed script `prisma/seed.ts`: default admin user (admin@blog.local/admin123), author user (author@blog.local/author123), 3 categories (Tech/Life/Tutorial), 5 tags (javascript/typescript/react/nextjs/css), 1 sample published article
- [ ] T017 [P] Create `src/lib/slug.ts` — `generateSlug(title: string)` using pinyin-pro for Chinese→pinyin, lowercase, dash-separated, special char removal; `isSlugManual(articleId)` checker
- [ ] T018 [P] Create `src/lib/markdown.ts` — unified remark/rehype plugin config (remark-gfm, rehype-highlight), `renderMarkdown(content)` function
- [ ] T019 [P] Create `src/lib/stats-cache.ts` — in-memory Map-based cache with 5-min TTL: `getStats()`, `invalidateStats()`
- [ ] T020 [P] Create `src/lib/storage/adapter.ts` — `StorageAdapter` interface: `upload(file, filename): Promise<UploadResult>`, `delete(filename): Promise<void>`, `getUrl(filename): string`
- [ ] T021 [P] Create `src/lib/storage/local.ts` — `LocalStorageAdapter` implementing StorageAdapter: save to `public/uploads/`, UUID filename, return URL path
- [ ] T022 [P] Create `src/lib/storage/s3.ts` — `S3StorageAdapter` stub implementing StorageAdapter (throw "Not implemented" for future), same interface
- [ ] T023 Set up NextAuth.js v5: create `src/lib/auth.ts` with NextAuth config — GitHub provider (GITHUB_ID/GITHUB_SECRET), Credentials provider (email+password with bcryptjs verify), callbacks (signIn: email-matching auto-link for GitHub; jwt: encode role+userId; session: expose role), pages: { signIn: "/login" }
- [ ] T024 Create `src/app/api/auth/[...nextauth]/route.ts` — NextAuth.js Route Handler exporting GET+POST from `src/lib/auth.ts`
- [ ] T025 [P] Create `src/lib/auth-utils.ts` — `getSessionUser()`, `requireRole(role)`, `requireAdmin()`, `requireAuthor()` helpers that throw 401/403 on failure
- [ ] T026 [P] Create Prisma test seed `prisma/seed-test.ts`: isolated test data (run via `prisma db push --force-reset && tsx prisma/seed-test.ts`)
- [ ] T027 Create `src/middleware.ts` — Next.js middleware protecting `/admin/*` (admin+author), `/api/admin/*` (admin only), `/api/author/*` (author+admin); redirect unauthenticated users to `/login`
- [ ] T028 [P] Create `src/components/common/LoadingSkeleton.tsx` — skeleton loader component for article cards, tables, pages
- [ ] T029 [P] Create `src/components/common/EmptyState.tsx` — empty state component with icon, message, optional action button
- [ ] T030 [P] Create `src/components/common/Pagination.tsx` — pagination component (prev/next + page numbers), props: page, totalPages, baseUrl
- [ ] T031 [P] Create `src/components/common/SearchBar.tsx` — search input with debounce (300ms), onSearch callback
- [ ] T032 [P] Create `src/components/common/TagBadge.tsx` — clickable tag badge component, links to `/tags/[tag]`
- [ ] T033 [P] Create `src/components/common/ConfirmDialog.tsx` — modal confirmation dialog with title/message/confirmLabel/cancelLabel, onConfirm callback
- [ ] T034 [P] Create `src/components/layout/Header.tsx` — responsive header: logo/blog name, nav links (首页/分类/标签/关于), search bar, login/user-menu (avatar dropdown when logged in)
- [ ] T035 [P] Create `src/components/layout/Footer.tsx` — footer with copyright, social links, "Powered by" line
- [ ] T036 [P] Create `src/components/layout/MobileNav.tsx` — hamburger menu slide-out navigation for mobile (triggered by Header)
- [ ] T037 [P] Create `src/components/seo/SeoMeta.tsx` — SEO metadata component: accepts title/description/ogImage, renders `<head>` meta tags (used in page layouts)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — 文章浏览与发现 (Priority: P1) 🎯 MVP

**Goal**: Readers can browse published articles on the homepage with pagination, view article details with rendered Markdown, filter by tag/category, search by keyword, and read the about page. All pages are responsive.

**Independent Test**: Deploy, publish at least one test article, visit homepage → see article list with pagination, click article → see rendered content with author/tags/read-count, click tag → filtered list, use search → matching results, visit about page → see blog intro. No login needed.

### Tests for User Story 1

- [ ] T038 [P] [US1] Unit test for `src/lib/slug.ts` — Chinese→pinyin, English lowercase, special char removal, duplicate suffix in `tests/unit/lib/slug.test.ts`
- [ ] T039 [P] [US1] Unit test for Pagination component — renders pages, prev/next disable at boundaries, click handlers in `tests/unit/components/Pagination.test.tsx`
- [ ] T040 [P] [US1] Integration test for public articles API — GET `/api/articles` with pagination, search, category, tag filters in `tests/integration/api/articles.test.ts`

### Implementation for User Story 1

- [ ] T041 [P] [US1] Create `src/components/article/ArticleCard.tsx` — card component: cover image (next/image with lazy load), title, summary (truncated 200 chars), published date, author nickname, tags (TagBadge list), view count, link to `/posts/[id]-[slug]`
- [ ] T042 [P] [US1] Create `src/components/article/ArticleList.tsx` — article grid/list with ArticleCard children, responsive columns (1 col mobile, 2 col tablet, 3 col desktop)
- [ ] T043 [P] [US1] Create `src/components/article/MarkdownRenderer.tsx` — react-markdown wrapper with remark-gfm + rehype-highlight plugins, custom img→next/image, code block with copy button, responsive table wrapper
- [ ] T044 [P] [US1] Create `src/components/article/ArticleStatusBadge.tsx` — colored badge for draft/published/archived (used later in admin)
- [ ] T045 [US1] Create `src/app/api/articles/route.ts` — GET handler: accept `page`, `pageSize`, `search`, `category`, `tag` query params; query Prisma Article with status=published, include author/category/tags; return paginated `ApiResponse<PaginatedData<ArticleListItem>>`
- [ ] T046 [US1] Create `src/app/api/articles/[id]/route.ts` — GET handler: parse id from URL, find article where status in (published, archived), increment viewCount (`prisma.article.update({ data: { viewCount: { increment: 1 } } })`), include author/category/tags; return 404 if not found or draft
- [ ] T047 [US1] Create `src/app/api/categories/route.ts` — GET handler: query all categories with `_count: { articles: { where: { status: 'published' } } }` for articleCount
- [ ] T048 [US1] Create `src/app/api/tags/route.ts` — GET handler: query all tags with published article count
- [ ] T049 [US1] Create `src/app/api/site-config/route.ts` — GET handler: query SiteConfig singleton (id=1), return blogName/aboutContent/socialLinks/logoUrl
- [ ] T050 [US1] Create `src/app/page.tsx` (Homepage) — ISR with `export const revalidate = 60`; fetch `/api/articles?page=1`; render ArticleList + Pagination; handle empty state ("暂无文章"); include SeoMeta (blog name from site config)
- [ ] T051 [US1] Create `src/app/posts/[id]-[slug]/page.tsx` — ISR with `revalidate = 60` and `generateStaticParams` (fetch first 20 published article IDs); render MarkdownRenderer for content; display author/tags/category/publishedAt/viewCount; include SeoMeta (seoTitle or title, seoDescription or summary, ogImageUrl or coverImageUrl)
- [ ] T052 [US1] Create `src/app/tags/[tag]/page.tsx` — SSR page: fetch `/api/articles?tag={tag}&status=published`; display "标签: {tag}" heading + ArticleList + Pagination; include empty state if no articles
- [ ] T053 [US1] Create `src/app/categories/[category]/page.tsx` — SSR page: fetch `/api/articles?category={category}&status=published`; display "分类: {category}" heading + ArticleList + Pagination; include empty state
- [ ] T054 [US1] Create `src/app/about/page.tsx` — static page: fetch SiteConfig from API or direct Prisma call; render aboutContent via MarkdownRenderer; display social links as icon buttons
- [ ] T055 [US1] Integrate Header/Footer/MobileNav into root layout `src/app/layout.tsx`; wire up navigation links; conditionally render admin link based on session role
- [ ] T056 [US1] Responsive polish: verify all P1 pages at 375px, 768px, 1280px widths; fix any overflow/layout issues in Tailwind classes

**Checkpoint**: Blog frontend fully functional — readers can browse, search, filter, and read articles without login

---

## Phase 4: User Story 2 — 用户注册与登录 (Priority: P2)

**Goal**: Visitors register with email/password, log in with credentials or GitHub OAuth, see role-appropriate UI, and log out. GitHub OAuth auto-links by email.

**Independent Test**: Register new account → auto-login as reader → logout → login with email/password → login with GitHub → verify role-based UI differences → verify `/admin` access blocked for readers.

### Tests for User Story 2

- [ ] T057 [P] [US2] Unit test for validation schemas — registerSchema (valid email, password≥8, nickname 1-50), loginSchema in `tests/unit/lib/validation.test.ts`
- [ ] T058 [P] [US2] Integration test for auth flow — register → login → session → logout in `tests/integration/api/auth.test.ts`

### Implementation for User Story 2

- [ ] T059 [P] [US2] Create `src/components/auth/LoginForm.tsx` — email + password form with validation errors, submit handler calling `signIn("credentials", ...)`, "还没有账号？去注册" link, error display ("邮箱或密码错误")
- [ ] T060 [P] [US2] Create `src/components/auth/RegisterForm.tsx` — email + password + nickname form with Zod validation, submit handler calling `/api/auth/register`, on success auto-login via `signIn("credentials", ...)`
- [ ] T061 [P] [US2] Create `src/components/auth/GitHubLoginButton.tsx` — button calling `signIn("github")`, GitHub icon, "GitHub 登录" label
- [ ] T062 [US2] Create `src/app/api/auth/register/route.ts` — POST handler: validate with registerSchema; check email uniqueness (case-insensitive); hash password with bcryptjs (salt=12); create User with role=reader; auto-sign-in by returning success; return 409 on duplicate, 400 on validation fail
- [ ] T063 [US2] Update `src/lib/auth.ts` — implement Credentials provider `authorize`: find user by email, compare passwordHash with bcryptjs, return user or null; implement GitHub provider callback: on signIn, check if email exists → auto-link githubId → return true; on jwt callback, encode userId + role + githubId into token; on session callback, expose id + email + nickname + role
- [ ] T064 [US2] Create `src/app/api/auth/session/route.ts` — GET handler: return current session user from `auth()`; return 401 if no session
- [ ] T065 [US2] Create `src/app/login/page.tsx` — login page with LoginForm + divider "或" + GitHubLoginButton; redirect to "/" if already logged in
- [ ] T066 [US2] Create `src/app/register/page.tsx` — register page with RegisterForm + "已有账号？去登录" link; redirect to "/" if already logged in
- [ ] T067 [US2] Update `src/middleware.ts` — add auth redirect: unauthenticated access to `/admin/*` or `/api/admin/*` or `/api/author/*` → redirect to `/login?callbackUrl={originalUrl}`; reader access to `/admin/*` → redirect to "/" with "无权访问" toast
- [ ] T068 [US2] Update `src/components/layout/Header.tsx` — integrate `useSession()`: show user avatar/nickname dropdown when logged in (含"退出登录"), show "登录/注册" buttons when not logged in; conditionally show "管理" link if role is admin or author

**Checkpoint**: Authentication complete — users can register, login with email or GitHub, and see role-appropriate UI

---

## Phase 5: User Story 3 — 内容创作与管理 (Priority: P3)

**Goal**: Authors create, edit, delete their own articles with Markdown editor + live preview. Configure tags, category, cover image, SEO metadata, and article status.

**Independent Test**: As author, create draft → preview Markdown → publish → verify on homepage. Edit published article → verify update. Change status draft→published→archived. Try editing another author's article → verify 403. Delete article → verify gone.

### Tests for User Story 3

- [ ] T069 [P] [US3] Unit test for article validation schemas — articleCreateSchema (title required, content required when status=published, tagIds≤5) in `tests/unit/lib/validation.test.ts`
- [ ] T070 [P] [US3] Integration test for author article CRUD — create → read → update → status change → delete in `tests/integration/api/articles.test.ts`

### Implementation for User Story 3

- [ ] T071 [P] [US3] Create `src/components/article/MarkdownEditor.tsx` — split-pane layout: left textarea (controlled, monospace font, 100% height), right MarkdownRenderer preview (同步滚动); props: value, onChange; debounce preview update 300ms
- [ ] T072 [P] [US3] Create `src/components/common/ImageUpload.tsx` — drag-and-drop or click-to-select file input; preview thumbnail; upload to `/api/media/upload`; callback with returned URL; show upload progress; validate type/size before upload
- [ ] T073 [US3] Create `src/app/api/author/articles/route.ts` — GET handler: query articles where authorId = session.user.id, optional status filter, paginated; POST handler: validate with articleCreateSchema, generate slug from title, create article with authorId = session.user.id, connect tags by IDs, connect category; return 201 with id + slug
- [ ] T074 [US3] Create `src/app/api/author/articles/[id]/route.ts` — PUT handler: verify article.authorId === session.user.id (403 if not), validate with articleUpdateSchema, update fields (if title changed and slug not manually edited → regenerate slug), reconnect tags/category on change; DELETE handler: verify ownership, delete article (cascade ArticleTag); return 403 on ownership fail, 404 on not found
- [ ] T075 [US3] Create `src/app/api/author/articles/[id]/status/route.ts` — PATCH handler: verify ownership, validate status transition (must be valid enum), if publishing and content is empty → 400; if first-time publish (draft→published) set publishedAt=now(); return updated article
- [ ] T076 [US3] Create `src/components/admin/ArticleTable.tsx` — table component: columns (title, status badge, author nickname, published date, view count, actions); status filter dropdown; "新建文章" button; action buttons: edit (link to edit page), delete (ConfirmDialog), status toggle (publish/unpublish/archive)
- [ ] T077 [US3] Create `src/app/admin/layout.tsx` — admin layout shell: check session (redirect if no auth); render AdminSidebar + content area; responsive (sidebar collapses on mobile)
- [ ] T078 [P] [US3] Create `src/components/layout/AdminSidebar.tsx` — sidebar nav: Dashboard, 文章管理, 分类管理, 标签管理, 用户管理 (admin only), 媒体管理, 站点设置 (admin only); active link highlight; collapse toggle on mobile
- [ ] T079 [US3] Create `src/app/admin/articles/page.tsx` — article management page: fetch `/api/author/articles` for authors or `/api/admin/articles` for admin; render ArticleTable; handle empty state
- [ ] T080 [US3] Create `src/app/admin/articles/new/page.tsx` — new article editor: MarkdownEditor + sidebar form (title input, slug input with auto-generate button, summary textarea, tag multi-select, category select, cover image upload via ImageUpload, SEO fields collapsible, status select: draft/published); on submit → POST `/api/author/articles` → redirect to edit page
- [ ] T081 [US3] Create `src/app/admin/articles/[id]/edit/page.tsx` — edit article: load article data from API; prefill all fields; same form layout as new page; on submit → PUT `/api/author/articles/[id]`; show "删除文章" button (red, with ConfirmDialog); handle 403 by redirecting with error
- [ ] T082 [US3] Wire article status transition buttons in ArticleTable: publish (draft→published), unpublish (published→draft), archive (published→archived), restore (archived→draft); each calls PATCH `/api/author/articles/[id]/status`
- [ ] T083 [US3] After article publish/update: call `invalidateStats()` to refresh dashboard cache

**Checkpoint**: Content authoring complete — authors can write, preview, publish, edit, and delete their own articles with full Markdown support

---

## Phase 6: User Story 4 — 系统管理与数据统计 (Priority: P4)

**Goal**: Admin dashboard with stats, manage all articles/users/categories/tags, site settings, and media files. Tag deletion protected when in use.

**Independent Test**: As admin, view dashboard → verify stats. Create/edit/delete category and tag. Attempt deleting used tag → verify blocked. Change user role → verify. Edit/delete any author's article → verify. Upload image → verify. Update site settings → verify about page reflects changes.

### Tests for User Story 4

- [ ] T084 [P] [US4] Integration test for admin endpoints — dashboard stats, category CRUD, tag CRUD (including used-tag deletion rejection), user role update in `tests/integration/api/admin.test.ts`

### Implementation for User Story 4

- [ ] T085 [P] [US4] Create `src/components/admin/DashboardStats.tsx` — stats cards grid: total articles, published count, draft count, total views, total users; each card with icon, number, label; responsive grid (2 col mobile, 4 col desktop)
- [ ] T086 [US4] Create `src/app/api/admin/dashboard/route.ts` — GET handler (admin only): call `getStats()` from stats-cache (5-min TTL); Prisma queries: article count groupBy status, sum of viewCount, user count, recent 5 published articles; return dashboard data
- [ ] T087 [US4] Create `src/app/admin/page.tsx` — dashboard page: fetch `/api/admin/dashboard`; render DashboardStats + recent articles table; handle loading/empty states
- [ ] T088 [US4] Create `src/app/api/admin/articles/route.ts` — GET handler (admin only): query ALL articles (any author), optional status+authorId filter, paginated; PUT handler: update any article by id; DELETE handler: delete any article by id (cascade)
- [ ] T089 [US4] Update `src/app/admin/articles/page.tsx` — admin view shows all authors' articles (use `/api/admin/articles`); add author column to ArticleTable
- [ ] T090 [P] [US4] Create `src/components/admin/CategoryForm.tsx` — inline form: name input + description textarea; submit creates/updates category; validation (name required, unique)
- [ ] T091 [US4] Create `src/app/api/admin/categories/[id]/route.ts` — PUT handler (admin only): validate name uniqueness, update category; DELETE handler: update all articles in this category to categoryId=null, then delete category
- [ ] T092 [US4] Create `src/app/admin/categories/page.tsx` — category management: list all categories (name, description, article count); inline CategoryForm for create/edit; delete button per category (ConfirmDialog); empty state
- [ ] T093 [P] [US4] Create `src/components/admin/TagForm.tsx` — inline form: name input; submit creates/updates tag; validation (name required, lowercase, unique)
- [ ] T094 [US4] Create `src/app/api/admin/tags/[id]/route.ts` — PUT handler (admin only): validate name uniqueness (case-insensitive lowercase), update; DELETE handler: count ArticleTag where tagId, if count>0 → 409 with "该标签正被 N 篇文章使用，无法删除", else delete tag
- [ ] T095 [US4] Create `src/app/admin/tags/page.tsx` — tag management: list all tags (name, article count); inline TagForm for create/edit; delete button (with error handling for 409 conflict — show alert); empty state
- [ ] T096 [P] [US4] Create `src/components/admin/UserRoleSelect.tsx` — role dropdown (admin/author/reader) per user row; onChange → PUT `/api/admin/users/[id]/role`; disable self-role-change
- [ ] T097 [US4] Create `src/app/api/admin/users/route.ts` — GET handler (admin only): list all users (id, email, nickname, role, createdAt, lastLoginAt)
- [ ] T098 [US4] Create `src/app/api/admin/users/[id]/role/route.ts` — PUT handler (admin only): validate role enum; refuse if target id === session user id (400 "不能修改自己的角色"); update user role
- [ ] T099 [US4] Create `src/app/admin/users/page.tsx` — user management: table (email, nickname, role with UserRoleSelect, createdAt); admin only access
- [ ] T100 [US4] Create `src/app/api/admin/site-config/route.ts` — PUT handler (admin only): validate with siteConfigSchema; upsert SiteConfig (id=1)
- [ ] T101 [US4] Create `src/components/admin/SiteSettingsForm.tsx` — form: blog name input, about content textarea (Markdown), social links inputs (GitHub/Twitter), logo upload via ImageUpload; load current config on mount; submit → PUT `/api/admin/site-config`
- [ ] T102 [US4] Create `src/app/admin/settings/page.tsx` — site settings page: render SiteSettingsForm; admin only
- [ ] T103 [US4] Create `src/app/api/media/upload/route.ts` — POST handler (author/admin only): parse multipart/form-data; validate file type and size; delegate to LocalStorageAdapter.upload(); create Media record; return 201 with url/id/originalName/fileSize/mimeType
- [ ] T104 [US4] Create `src/app/api/media/route.ts` — GET handler (author/admin): authors see own uploads, admins see all; paginated; DELETE handler (author/admin): verify ownership or admin role; call storage adapter delete(); delete Media record
- [ ] T105 [P] [US4] Create `src/components/admin/MediaGrid.tsx` — image grid: thumbnail previews; click to copy URL; delete button per image (ConfirmDialog, with permission check)
- [ ] T106 [US4] Create `src/app/admin/media/page.tsx` — media management: upload zone (ImageUpload) at top; MediaGrid below; pagination

**Checkpoint**: Admin system complete — dashboard, content governance, user management, and media management fully functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T107 [P] Responsive design audit: verify all pages at 320px, 375px, 768px, 1024px, 1280px, 1440px; fix layout issues; ensure touch targets ≥44×44px on mobile; verify no horizontal scroll
- [ ] T108 [P] Loading states: add Suspense boundaries to page-level components; add LoadingSkeleton to article lists, tables, detail pages; add loading spinners to form submissions
- [ ] T109 [P] Error handling: add error boundaries to key page sections; add toast notifications (sonner or react-hot-toast) for mutation success/error feedback; handle network errors gracefully
- [ ] T110 [P] Add ISR on-demand revalidation: after article publish/update/delete, call `revalidatePath('/')` and `revalidatePath('/posts/[id]-[slug]')` from API routes to refresh cache immediately (supplementing time-based ISR)
- [ ] T111 [P] SEO audit: verify all pages have proper `<title>` and `<meta>` tags; add `robots.ts` and `sitemap.ts` generation; verify og:image renders correctly for social sharing
- [ ] T112 [P] Image optimization: replace all `<img>` tags with `next/image`; configure `next.config.js` `images.remotePatterns` for GitHub avatars; add blur placeholder for article cards
- [ ] T113 [P] Accessibility check: add aria-labels to icon buttons; ensure keyboard navigation works for modals/dropdowns; add skip-to-content link; verify color contrast ratios
- [ ] T114 Security hardening: verify CSRF protection via NextAuth.js; verify all API routes have RBAC checks (audit each route.ts); verify password hashing uses bcryptjs with salt≥12; verify file upload mime type validation is server-side (not just client)
- [ ] T115 [P] Add E2E smoke test: Playwright script `tests/e2e/blog-journey.spec.ts` — register → write draft → publish → verify on homepage → read article (optional, can defer)
- [ ] T116 Run through quickstart.md validation checklist; verify all 30+ acceptance criteria pass
- [ ] T117 Update README.md with project overview, tech stack, setup instructions, and link to full docs in specs/

---

## Dependencies & Execution Order

### Phase Dependencies

```
Setup (Phase 1: T001–T013)
    │
    ▼
Foundational (Phase 2: T014–T037) ← MUST COMPLETE before any user story
    │
    ├──► US1 (Phase 3: T038–T056) — Article browsing (P1) 🎯 MVP
    │
    ├──► US2 (Phase 4: T057–T068) — User auth (P2)
    │         │
    │         ▼
    ├──► US3 (Phase 5: T069–T083) — Content authoring (P3)
    │         │
    │         ▼
    └──► US4 (Phase 6: T084–T106) — Admin system (P4)
              │
              ▼
         Polish (Phase 7: T107–T117)
```

### User Story Dependencies

| Story | Depends On | Can Start After |
|-------|-----------|-----------------|
| US1 (P1) | Phase 2 (Foundational) | Foundational complete |
| US2 (P2) | Phase 2 (Foundational) | Foundational complete |
| US3 (P3) | Phase 2 + US1 (Article model/API exist) + US2 (auth for author role) | US1 + US2 complete |
| US4 (P4) | Phase 2 + US3 (admin extends author features) | US3 complete |

**Key insight**: US1 and US2 can be developed in parallel after Foundational phase. US3 depends on models/APIs from US1 (Article entity) and auth from US2. US4 builds on US3.

### Within Each User Story

- Tests (if included) → Models/Components → API Routes → Pages → Integration
- Shared components marked [P] can be done in parallel
- API routes before pages (pages consume APIs)

### Parallel Opportunities

- **Phase 1**: T002–T010 all [P] — install deps, types, config can all proceed in parallel
- **Phase 2**: T017–T022, T025–T036 all [P] — lib utilities, storage adapter, shared components
- **Phase 3**: T038–T044 all [P] — tests + components; then T045–T049 [P] — public API routes
- **Phase 4**: T059–T061 [P] — auth form components; T057–T058 [P] — auth tests
- **Phase 5**: T071–T072, T078 [P] — editor + image upload + sidebar components
- **Phase 6**: T085, T090, T093, T096, T105 [P] — admin components
- **Phase 7**: All [P] — independent polish tasks

---

## Parallel Example: Phase 2 (Foundational)

```bash
# After T014–T016 (schema + client), launch all [P] tasks together:
Task: "Create src/lib/slug.ts"
Task: "Create src/lib/markdown.ts"
Task: "Create src/lib/stats-cache.ts"
Task: "Create src/lib/storage/adapter.ts"
Task: "Create src/lib/storage/local.ts"
Task: "Create src/lib/storage/s3.ts"
Task: "Create src/lib/auth-utils.ts"
Task: "Create Common UI components (LoadingSkeleton, EmptyState, Pagination, etc.)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T013)
2. Complete Phase 2: Foundational (T014–T037) ← CRITICAL
3. Complete Phase 3: User Story 1 (T038–T056)
4. **STOP**: Verify — homepage shows articles, detail pages render Markdown, search/filter works, about page displays
5. Deploy/demo as read-only blog MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. **+ US1 → Read-only blog** (article browsing, search, filter, about page)
3. **+ US2 → Auth-enabled blog** (register, login, role-based UI)
4. **+ US3 → Full blog platform** (content authoring, Markdown editor, article management)
5. **+ US4 → Complete system** (admin dashboard, user management, media library)
6. Each increment adds value without breaking previous ones

### Solo Developer Strategy

If working alone, follow the sequential dependency chain:
T001→T037 (Setup + Foundation) → US1 → US2 → US3 → US4 → Polish

This ensures each phase builds on fully working previous phases.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in same phase
- [USx] label maps task to user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD for tested tasks)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- After article mutations (publish/update/delete): call `invalidateStats()` (T083) and ISR revalidation (T110)
- Storage adapter pattern (T020–T022) enables future S3/OSS swap without code changes
- All API routes use unified `{ code, message, data }` response format (T009)
