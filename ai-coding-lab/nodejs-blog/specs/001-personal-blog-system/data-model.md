# Data Model: 个人博客系统

**Feature**: 001-personal-blog-system
**Date**: 2026-06-24

## Entity-Relationship Diagram

```text
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│     User     │──1:N──│     Article      │──N:1──│   Category   │
│              │       │                  │       │              │
│ id           │       │ id               │       │ id           │
│ email        │       │ title            │       │ name         │
│ passwordHash │       │ slug             │       │ description  │
│ githubId     │       │ content          │       │ createdAt    │
│ nickname     │       │ summary          │       └──────────────┘
│ role         │       │ coverImageUrl    │
│ createdAt    │       │ status           │       ┌──────────────┐
│ lastLoginAt  │       │ viewCount        │       │     Tag      │
└──────────────┘       │ seoTitle         │       │              │
       │               │ seoDescription   │       │ id           │
       │               │ ogImageUrl       │       │ name         │
       │               │ publishedAt      │       │ createdAt    │
       │               │ createdAt        │       └──────────────┘
       │               │ updatedAt        │              │
       │               │ authorId (FK)    │              │
       │               │ categoryId (FK)  │              │
       │               └──────────────────┘              │
       │                        │                        │
       │                        │         N:M            │
       │                        └────────────────────────┘
       │                              ArticleTag
       │                         ┌──────────────────┐
       │                         │ articleId (FK)    │
       │                         │ tagId (FK)        │
       ▼                         └──────────────────┘
┌──────────────┐
│    Media     │       ┌──────────────┐
│              │       │  SiteConfig  │
│ id           │       │              │
│ originalName │       │ id (singleton)│
│ storagePath  │       │ blogName     │
│ url          │       │ aboutContent │
│ fileSize     │       │ socialLinks  │
│ mimeType     │       │ logoUrl      │
│ uploaderId   │       └──────────────┘
│ createdAt    │
└──────────────┘
```

## Entities

### User (用户)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, autoincrement | 用户唯一 ID |
| email | String | UNIQUE, NOT NULL | 邮箱（登录标识之一） |
| passwordHash | String? | nullable | bcrypt 加密的密码（仅邮箱注册用户有值） |
| githubId | String? | nullable, UNIQUE | GitHub OAuth ID（仅 GitHub 登录用户有值） |
| nickname | String | NOT NULL | 显示昵称 |
| role | Enum(admin, author, reader) | NOT NULL, default: reader | 角色，新注册默认 reader |
| createdAt | DateTime | NOT NULL, default: now() | 注册时间 |
| lastLoginAt | DateTime | NOT NULL, default: now() | 最后登录时间 |

**Rules**:
- `email` 唯一，大小写不敏感（存储前转小写）
- `passwordHash` 和 `githubId` 至少有一个不为 null（用户至少绑定一种登录方式）
- GitHub OAuth 登录时，若 `email` 匹配已有用户，自动设置该用户的 `githubId`
- 角色变更（仅管理员可操作）立即生效——下次请求的 JWT 校验会读取最新 role

### Article (文章)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, autoincrement | 文章唯一 ID |
| title | String | NOT NULL | 文章标题 |
| slug | String | NOT NULL | URL 标识符（可手动编辑） |
| content | Text | NOT NULL | Markdown 正文 |
| summary | String | NOT NULL, default: "" | 文章摘要（列表页展示） |
| coverImageUrl | String? | nullable | 封面图 URL |
| status | Enum(draft, published, archived) | NOT NULL, default: draft | 文章状态 |
| viewCount | Int | NOT NULL, default: 0 | 阅读量计数 |
| seoTitle | String? | nullable | SEO 标题（未设置时用 title） |
| seoDescription | String? | nullable | SEO 描述（未设置时用 summary 截断） |
| ogImageUrl | String? | nullable | OG 图片 URL（未设置时用 coverImageUrl） |
| publishedAt | DateTime? | nullable | 发布时间（首次从 draft → published 时设置） |
| createdAt | DateTime | NOT NULL, default: now() | 创建时间 |
| updatedAt | DateTime | NOT NULL, updated automatically | 最后更新时间 |
| authorId | Int | FK → User.id, NOT NULL | 作者 |
| categoryId | Int? | FK → Category.id, nullable | 所属分类 |

**State Transitions**:
```text
draft ──→ published ──→ archived
  │           │              │
  └───────────┴──────────────┘
          (可跳转)
```
- `draft → published`: 设置 `publishedAt = now()`，ISR 缓存重新验证后首页可见
- `draft → archived`: 直接归档（跳过发布步骤）
- `published → draft`: 撤回（从首页移除，回到编辑状态）
- `published → archived`: 归档（从首页移除，详情页仍可访问）
- `archived → published`: 恢复发布
- `archived → draft`: 恢复为草稿

**Rules**:
- `slug` 由标题自动生成（中文→拼音），作者可手动编辑。手动编辑后标题修改不再自动更新 slug。
- `content` 为空时不能保存为 `published` 状态（草稿允许空内容）。
- `title` 为空时任何状态都不能保存。
- 作者只能操作自己的文章（authorId = currentUserId）；管理员可操作所有文章。
- 删除文章时级联删除关联的 `ArticleTag` 记录和 Media 引用。

### Category (分类)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, autoincrement | 分类唯一 ID |
| name | String | UNIQUE, NOT NULL | 分类名称 |
| description | String | NOT NULL, default: "" | 分类描述 |
| createdAt | DateTime | NOT NULL, default: now() | 创建时间 |

**Rules**:
- `name` 唯一（大小写不敏感）
- 删除分类时，该分类下的文章 `categoryId` 置为 null（未分类）
- 仅管理员可增删改分类

### Tag (标签)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, autoincrement | 标签唯一 ID |
| name | String | UNIQUE, NOT NULL | 标签名称 |
| createdAt | DateTime | NOT NULL, default: now() | 创建时间 |

**Rules**:
- `name` 唯一（大小写不敏感，存储为小写）
- 删除标签前检查关联文章数量：有文章使用时拒绝删除并提示关联文章数
- 仅管理员可增删改标签

### ArticleTag (文章-标签关联)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| articleId | Int | FK → Article.id, PK (composite) | 文章 ID |
| tagId | Int | FK → Tag.id, PK (composite) | 标签 ID |

**Rules**:
- 复合主键 `(articleId, tagId)` 防止重复关联
- 文章删除时级联删除关联记录

### Media (媒体文件)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, autoincrement | 媒体唯一 ID |
| originalName | String | NOT NULL | 上传时的原始文件名 |
| storagePath | String | NOT NULL | 存储路径（本地文件系统路径） |
| url | String | NOT NULL | 公开访问 URL |
| fileSize | Int | NOT NULL | 文件大小（bytes） |
| mimeType | String | NOT NULL | MIME 类型 (image/jpeg, image/png, image/webp) |
| uploaderId | Int | FK → User.id, NOT NULL | 上传者 |
| createdAt | DateTime | NOT NULL, default: now() | 上传时间 |

**Rules**:
- 允许的 MIME 类型: `image/jpeg`, `image/png`, `image/webp`
- 文件大小限制: ≤ 10MB
- 文件名使用 `{uuid}.{ext}` 避免冲突
- 作者只能查看/删除自己上传的媒体；管理员可查看/删除所有
- 删除 Media 记录时同时删除物理文件（通过 storage adapter）

### SiteConfig (站点设置)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, singleton (唯一行) | 固定为 1 |
| blogName | String | NOT NULL, default: "My Blog" | 博客名称 |
| aboutContent | Text | NOT NULL, default: "" | 关于页内容（Markdown） |
| socialLinks | Json | NOT NULL, default: {} | 社交链接 `{ "github": "...", "twitter": "..." }` |
| logoUrl | String? | nullable | 博客 Logo URL |

**Rules**:
- 单例模式：表中仅有一行（id=1），通过 upsert 初始化和更新
- `aboutContent` 支持 Markdown，关于页渲染时使用 MarkdownRenderer
- `socialLinks` 以 JSON 格式存储，支持动态扩展
- 仅管理员可编辑

## Indexes

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| User | email | UNIQUE | 登录查找 |
| User | githubId | UNIQUE | GitHub 关联查找 |
| Article | (status, publishedAt) | COMPOSITE | 首页已发布文章排序查询 |
| Article | (authorId, status) | COMPOSITE | 作者文章管理列表 |
| Article | slug | INDEX | slug 冲突检查 |
| Tag | name | UNIQUE | 标签去重查找 |
| Category | name | UNIQUE | 分类去重查找 |
| ArticleTag | (tagId, articleId) | COMPOSITE PK | 标签-文章关联查询 |
| Media | uploaderId | INDEX | 按上传者查询 |

## Prisma Schema Summary

```prisma
enum Role { admin author reader }
enum ArticleStatus { draft published archived }

model User { ... }
model Article { ... }
model Category { ... }
model Tag { ... }
model ArticleTag { ... }
model Media { ... }
model SiteConfig { ... }
```

Full Prisma schema at `prisma/schema.prisma` (to be generated during implementation).
