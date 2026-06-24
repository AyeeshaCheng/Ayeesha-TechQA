# API Contracts: 个人博客系统

**Feature**: 001-personal-blog-system
**Date**: 2026-06-24
**Format**: RESTful API 端点定义

## 通用约定

### 响应格式

所有 API 响应使用统一格式：

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

错误响应：

```json
{
  "code": 400,
  "message": "Human-readable error description (Chinese)"
}
```

### HTTP 状态码

| Code | Meaning |
|------|---------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未登录 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 冲突（如邮箱已注册、标签被使用中） |
| 413 | 文件过大 |
| 415 | 不支持的媒体类型 |
| 500 | 服务器内部错误 |

### 认证

- 登录后由 NextAuth.js v5 管理 session（JWT cookie: `authjs.session-token`）
- 需要认证的端点标注 `🔒`（任意登录用户）
- 需要特定角色的端点标注 `🔒 author` 或 `🔒 admin`

---

## 公开端点 (无需认证)

### GET /api/articles

获取已发布文章列表（首页 + 搜索 + 筛选）。

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 1 | 页码 |
| pageSize | int | 20 | 每页条数（≤20） |
| search | string | - | 关键词搜索（标题 + 内容） |
| category | string | - | 分类名称筛选 |
| tag | string | - | 标签名称筛选 |

**Response** (200):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "articles": [
      {
        "id": 1,
        "title": "Hello World",
        "slug": "hello-world",
        "summary": "My first blog post",
        "coverImageUrl": "/uploads/abc.jpg",
        "viewCount": 42,
        "publishedAt": "2026-06-24T10:00:00Z",
        "author": { "nickname": "Ayeesha", "role": "admin" },
        "category": { "id": 1, "name": "Tech" },
        "tags": [{ "id": 1, "name": "javascript" }, { "id": 2, "name": "nextjs" }]
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

**Error Cases**:
- `400` — page 或 pageSize 为负数
- `200` + `articles: []` — 无匹配结果

---

### GET /api/articles/[id]

获取单篇文章详情。每次请求递增阅读量。

**Path Parameters**:
- `id`: 文章 ID（URL 中含 slug 部分，如 `/api/articles/1-hello-world`，仅提取数字 ID）

**Response** (200):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "title": "Hello World",
    "slug": "hello-world",
    "content": "# Hello\n\nThis is **Markdown** content.",
    "summary": "My first blog post",
    "coverImageUrl": "/uploads/abc.jpg",
    "status": "published",
    "viewCount": 43,
    "seoTitle": "Hello World - Ayeesha Blog",
    "seoDescription": "My first blog post about tech",
    "ogImageUrl": "/uploads/abc.jpg",
    "publishedAt": "2026-06-24T10:00:00Z",
    "createdAt": "2026-06-23T08:00:00Z",
    "updatedAt": "2026-06-24T10:00:00Z",
    "author": { "id": 1, "nickname": "Ayeesha" },
    "category": { "id": 1, "name": "Tech" },
    "tags": [{ "id": 1, "name": "javascript" }]
  }
}
```

**Error Cases**:
- `404` — 文章不存在或状态非 published/archived

---

### GET /api/categories

获取所有分类列表。

**Response** (200):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "categories": [
      { "id": 1, "name": "Tech", "description": "技术文章", "articleCount": 15 },
      { "id": 2, "name": "Life", "description": "生活随笔", "articleCount": 5 }
    ]
  }
}
```

---

### GET /api/tags

获取所有标签列表。

**Response** (200):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "tags": [
      { "id": 1, "name": "javascript", "articleCount": 10 },
      { "id": 2, "name": "nextjs", "articleCount": 8 }
    ]
  }
}
```

---

### GET /api/site-config

获取站点设置（关于页内容等）。

**Response** (200):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "blogName": "Ayeesha Blog",
    "aboutContent": "# About Me\n\nI'm a developer.",
    "socialLinks": { "github": "https://github.com/ayeesha", "twitter": "https://twitter.com/ayeesha" },
    "logoUrl": "/uploads/logo.png"
  }
}
```

---

## 认证端点

### POST /api/auth/register

邮箱密码注册。

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "Ayeesha"
}
```

**Validation**:
- `email`: 有效邮箱格式
- `password`: ≥8 位
- `nickname`: 1-50 字符，非空

**Response** (201):

```json
{
  "code": 201,
  "message": "注册成功",
  "data": { "userId": 2, "nickname": "Ayeesha", "role": "reader" }
}
```

**Error Cases**:
- `400` — 参数校验失败（弱密码、昵称过长）
- `409` — 邮箱已注册

---

### POST /api/auth/[...nextauth]

NextAuth.js 统一认证端点，处理：
- `credentials` provider: 邮箱密码登录
- `github` provider: GitHub OAuth 登录和回调

**Credentials Login Request Body**:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200): 设置 session cookie，返回用户信息。

**Error Cases**:
- `401` — 邮箱或密码错误
- `401` — GitHub OAuth 授权失败/取消

---

### POST /api/auth/logout

退出登录。清除 session cookie。

**Response** (200):

```json
{ "code": 200, "message": "已退出登录" }
```

---

### GET /api/auth/session

获取当前登录用户信息。

**Response** (200):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "user": { "id": 1, "email": "admin@example.com", "nickname": "Ayeesha", "role": "admin" },
    "expires": "2026-07-24T10:00:00Z"
  }
}
```

**Error Cases**:
- `401` — 未登录

---

## 作者端点 🔒 author

### GET /api/author/articles

获取当前作者的文章列表（含草稿和已归档）。

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| status | string | - | 筛选状态: draft/published/archived |
| page | int | 1 | 页码 |
| pageSize | int | 20 | 每页条数 |

**Response** (200): 同 `GET /api/articles` 结构，但包含所有状态的文章。

---

### POST /api/author/articles

创建新文章。

**Request Body**:

```json
{
  "title": "Hello World",
  "content": "# Hello\n\nThis is Markdown.",
  "summary": "My first post",
  "coverImageUrl": "/uploads/abc.jpg",
  "status": "draft",
  "seoTitle": "Custom SEO Title",
  "seoDescription": "Custom SEO Description",
  "ogImageUrl": "/uploads/abc.jpg",
  "categoryId": 1,
  "tagIds": [1, 2, 3]
}
```

**Validation**:
- `title`: 非空
- `content`: 非空（若 status 为 published）
- `status`: 必须是 draft/published/archived 之一
- `tagIds`: 每个 ID 必须存在；最多 5 个标签
- `categoryId`: 若提供，必须存在

**Response** (201):

```json
{
  "code": 201,
  "message": "文章创建成功",
  "data": { "id": 2, "slug": "hello-world", "status": "draft" }
}
```

---

### PUT /api/author/articles/[id]

编辑自己的文章。

**Request Body**: 同 POST（所有字段可选更新）。

**Response** (200):

```json
{ "code": 200, "message": "文章更新成功", "data": { "id": 2, "slug": "hello-world-updated" } }
```

**Error Cases**:
- `404` — 文章不存在
- `403` — 非自己的文章

---

### PATCH /api/author/articles/[id]/status

变更文章状态。

**Request Body**:

```json
{ "status": "published" }
```

**Validation**:
- `status` 必须是 draft/published/archived 之一
- 若 `published` 且 `content` 为空 → 400 拒绝

**Response** (200):

```json
{ "code": 200, "message": "状态变更成功", "data": { "id": 2, "status": "published" } }
```

---

### DELETE /api/author/articles/[id]

删除自己的文章。

**Response** (200):

```json
{ "code": 200, "message": "文章已删除" }
```

**Error Cases**:
- `404` — 文章不存在
- `403` — 非自己的文章

---

## 管理员端点 🔒 admin

### GET /api/admin/dashboard

获取仪表盘统计数据（缓存，5 分钟 TTL）。

**Response** (200):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalArticles": 100,
    "publishedArticles": 80,
    "draftArticles": 15,
    "archivedArticles": 5,
    "totalViews": 12050,
    "totalUsers": 3,
    "recentArticles": [
      { "id": 1, "title": "Latest Post", "publishedAt": "2026-06-24T10:00:00Z", "viewCount": 120 }
    ]
  }
}
```

---

### GET /api/admin/articles

获取所有作者的所有文章列表。

**Query Parameters**: 同 `GET /api/author/articles` + `authorId` 筛选。

---

### PUT /api/admin/articles/[id]

编辑任意文章。

**Request Body**: 同 `PUT /api/author/articles/[id]`。

**Error Cases**:
- `404` — 文章不存在

---

### DELETE /api/admin/articles/[id]

删除任意文章。

**Response** (200):

```json
{ "code": 200, "message": "文章已删除" }
```

---

### PUT /api/admin/categories/[id]

更新分类。

**Request Body**:

```json
{ "name": "Technology", "description": "Updated description" }
```

**Response** (200):

```json
{ "code": 200, "message": "分类更新成功", "data": { "id": 1, "name": "Technology" } }
```

**Error Cases**:
- `404` — 分类不存在
- `409` — 名称已被其他分类使用

---

### DELETE /api/admin/categories/[id]

删除分类。该分类下的文章 categoryId 置空。

**Response** (200):

```json
{ "code": 200, "message": "分类已删除" }
```

---

### PUT /api/admin/tags/[id]

更新标签。

**Request Body**:

```json
{ "name": "typescript" }
```

**Response** (200):

```json
{ "code": 200, "message": "标签更新成功", "data": { "id": 1, "name": "typescript" } }
```

---

### DELETE /api/admin/tags/[id]

删除标签（仅当未被使用时）。

**Response** (200):

```json
{ "code": 200, "message": "标签已删除" }
```

**Error Cases**:
- `404` — 标签不存在
- `409` — 标签正被 N 篇文章使用: `{ "code": 409, "message": "该标签正被 3 篇文章使用，无法删除" }`

---

### GET /api/admin/users

获取用户列表。

**Response** (200):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "users": [
      { "id": 1, "email": "admin@example.com", "nickname": "Ayeesha", "role": "admin", "createdAt": "2026-06-20T00:00:00Z", "lastLoginAt": "2026-06-24T10:00:00Z" }
    ]
  }
}
```

---

### PUT /api/admin/users/[id]/role

修改用户角色。

**Request Body**:

```json
{ "role": "author" }
```

**Validation**:
- `role` 必须是 admin/author/reader 之一
- 不可将自己的角色降级（防止锁死）

**Response** (200):

```json
{ "code": 200, "message": "角色更新成功", "data": { "id": 2, "role": "author" } }
```

**Error Cases**:
- `404` — 用户不存在
- `400` — 尝试修改自己的角色

---

### PUT /api/admin/site-config

更新站点设置（upsert）。

**Request Body**:

```json
{
  "blogName": "Ayeesha Blog",
  "aboutContent": "# About Me\n\n...",
  "socialLinks": { "github": "...", "twitter": "..." },
  "logoUrl": "/uploads/logo.png"
}
```

**Response** (200):

```json
{ "code": 200, "message": "站点设置更新成功" }
```

---

## 媒体端点 🔒 author / admin

### POST /api/media/upload

上传图片（multipart/form-data）。

**Request**: `Content-Type: multipart/form-data`
- Field: `file` (single file, max 10MB)

**Validation**:
- MIME 类型: `image/jpeg`, `image/png`, `image/webp`
- 大小: ≤10MB

**Response** (201):

```json
{
  "code": 201,
  "message": "上传成功",
  "data": {
    "id": 1,
    "url": "/uploads/a1b2c3d4.jpg",
    "originalName": "photo.jpg",
    "fileSize": 204800,
    "mimeType": "image/jpeg"
  }
}
```

**Error Cases**:
- `401` — 未登录或角色为 reader
- `413` — 文件超过 10MB
- `415` — 不支持的格式

---

### GET /api/media

获取媒体文件列表。

**Authorization**: 作者看自己的，管理员看所有的。

**Response** (200):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "media": [
      { "id": 1, "url": "/uploads/abc.jpg", "originalName": "photo.jpg", "fileSize": 204800, "createdAt": "2026-06-24T10:00:00Z" }
    ]
  }
}
```

---

### DELETE /api/media/[id]

删除媒体文件。

**Authorization**: 作者只能删自己的，管理员可删所有。

**Response** (200):

```json
{ "code": 200, "message": "文件已删除" }
```

**Error Cases**:
- `404` — 文件不存在
- `403` — 非上传者且非管理员
