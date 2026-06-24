# Quickstart: 个人博客系统

**Feature**: 001-personal-blog-system
**Date**: 2026-06-24

## 前提条件

- Node.js 18+
- PostgreSQL 14+（或 SQLite 用于本地开发）
- Git
- GitHub OAuth App（用于 GitHub 登录，开发环境可选）

## 环境配置

```bash
# 1. 克隆并安装依赖
git clone <repo-url> && cd nodejs-blog
npm install

# 2. 配置环境变量
cp .env.example .env.local
```

编辑 `.env.local`：

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/blog?schema=public"
# 或使用 SQLite: DATABASE_URL="file:./dev.db"

# NextAuth.js
AUTH_SECRET="openssl rand -base64 32 生成的值"
AUTH_URL="http://localhost:3000"

# GitHub OAuth (https://github.com/settings/developers)
AUTH_GITHUB_ID="your_github_client_id"
AUTH_GITHUB_SECRET="your_github_client_secret"

# Upload
UPLOAD_DIR="public/uploads"
MAX_UPLOAD_SIZE=10485760
```

```bash
# 3. 初始化数据库
npx prisma migrate dev --name init
npx prisma db seed    # 创建默认管理员 + 示例数据

# 4. 启动开发服务器
npm run dev
```

打开 http://localhost:3000

## 验证清单

### 1. 前台页面（无需登录）

- [ ] **首页** — http://localhost:3000 — 展示已发布文章列表，有分页。无文章时显示 EmptyState "暂无文章"。
- [ ] **文章详情** — 点击文章 → `/posts/1-hello-world` — Markdown 渲染正确（标题、代码高亮、图片、列表），显示作者昵称、发布时间、标签、阅读量。
- [ ] **标签筛选** — 点击文章详情中的标签 → `/tags/javascript` — 展示含该标签的所有文章。
- [ ] **分类筛选** — 通过导航选择分类 → `/categories/tech` — 展示该分类的所有文章。
- [ ] **搜索** — 在搜索框输入关键词 → 返回匹配文章列表。
- [ ] **关于页** — `/about` — 展示博主介绍（来自站点设置）。
- [ ] **分页** — 文章超过 20 篇时，底部显示分页组件。
- [ ] **404 页面** — 访问 `/posts/99999-nonexistent` → 展示 404 页面。

### 2. 用户认证

- [ ] **注册** — `/register` — 使用邮箱 + 密码 + 昵称注册 → 默认角色 reader → 自动登录。
- [ ] **重复注册** — 使用相同邮箱再次注册 → 提示"该邮箱已被注册"。
- [ ] **弱密码** — 注册时密码少于 8 位 → 提示密码强度不足。
- [ ] **邮箱登录** — `/login` — 使用注册的邮箱密码登录 → 成功跳转首页。
- [ ] **错误密码** — 使用错误密码登录 → 提示"邮箱或密码错误"。
- [ ] **GitHub 登录** — 点击 GitHub 登录按钮 → 授权 → 自动创建/关联账号 → 登录成功。
- [ ] **退出登录** — 登录后退出 → session 清除 → 不显示管理入口。
- [ ] **Reader 权限检查** — reader 用户登录后 → 不显示后台管理入口，直接访问 `/admin` → 重定向或 403。

### 3. 作者内容管理

> 先用管理员将测试用户角色提升为 author

- [ ] **文章列表** — 作者登录 → 访问 `/admin/articles` → 展示自己的文章列表（含草稿/已发布/已归档）。
- [ ] **新建草稿** — 点击新建 → 输入标题 + Markdown 内容 + 摘要 + 选择标签/分类 → 保存为草稿 → 首页不可见。
- [ ] **Markdown 预览** — 在编辑器中输入 Markdown → 右侧预览实时更新。
- [ ] **发布文章** — 草稿状态切换为"已发布" → 首页可见。
- [ ] **设置 SEO** — 编辑文章时填写 SEO 标题/描述/OG 图片 → 保存 → 详情页 HTML head 包含对应 meta 标签。
- [ ] **编辑文章** — 修改已发布文章的内容 → 保存 → 详情页更新。
- [ ] **删除文章** — 删除一篇文章 → 确认对话框 → 文章消失。
- [ ] **状态筛选** — 文章管理页按状态筛选（草稿/已发布/已归档）。
- [ ] **越权保护** — 作者 A 尝试直接访问作者 B 的文章编辑 URL → 403。

### 4. 管理员功能

> 使用种子数据创建的默认管理员账号登录

- [ ] **仪表盘** — `/admin` — 展示文章总数、已发布/草稿/归档数、总阅读量、用户总数。
- [ ] **所有文章** — 管理员文章列表可看到所有作者的文章 → 可编辑、删除任意文章。
- [ ] **分类 CRUD** — `/admin/categories` — 创建/编辑/删除分类 → 作者编辑器可选新分类。
- [ ] **删除有文章的分类** — 删除被使用的分类 → 分类删除成功，原文章变为"未分类"。
- [ ] **标签 CRUD** — `/admin/tags` — 创建/编辑标签。
- [ ] **删除使用中的标签** — 删除被文章使用的标签 → 拒绝并提示关联文章数。
- [ ] **用户管理** — `/admin/users` — 查看用户列表 → 修改用户角色（reader → author）。
- [ ] **站点设置** — `/admin/settings` — 修改博客名称、关于页内容、社交链接 → 前台关于页更新。

### 5. 图片上传

- [ ] **上传图片** — 作者/管理员在媒体管理页上传 JPEG/PNG/WebP (<10MB) → 返回可访问 URL。
- [ ] **格式限制** — 上传 BMP 或 GIF → 提示不支持的格式。
- [ ] **大小限制** — 上传超过 10MB 的图片 → 提示文件过大。
- [ ] **权限检查** — Reader 尝试上传 → 被拒绝。
- [ ] **删除图片** — 上传者或管理员可删除图片。

### 6. 响应式设计

- [ ] **桌面端** (1280px+) — 完整布局，导航水平展示，文章列表使用多列卡片。
- [ ] **移动端** (375px) — 汉堡菜单，单列布局，触摸友好（按钮 ≥44×44px），无横向滚动。

### 7. ISR 验证

- [ ] **首页 ISR** — 发布一篇新文章 → 60 秒内首页刷新可见（开发环境可能按需渲染，生产构建后验证）。
- [ ] **文章详情 ISR** — 更新文章内容 → 60 秒内详情页刷新可见。
- [ ] **后续导航速度** — ISR 缓存命中时页面导航速度明显快于首次冷加载。

## 种子数据

`npx prisma db seed` 创建：

| 账号 | 邮箱 | 密码 | 角色 |
|------|------|------|------|
| 管理员 | admin@blog.local | admin123 | admin |
| 示例作者 | author@blog.local | author123 | author |

同时创建 3 个分类（Tech / Life / Tutorial）和 5 个标签（javascript / typescript / react / nextjs / css），1 篇示例已发布文章。

## 常用命令

```bash
npm run dev          # 开发服务器 (localhost:3000)
npm run build        # 生产构建
npm run start        # 启动生产服务器
npx prisma studio    # 数据库浏览器
npx prisma migrate dev --name <name>  # 创建数据库迁移
npx prisma db seed   # 重新填充种子数据
npm test             # 运行测试
npm run lint         # ESLint 检查
npm run format       # Prettier 格式化
```

## 故障排除

| 问题 | 解决方案 |
|------|---------|
| `DATABASE_URL` 连接失败 | 检查 PostgreSQL 是否运行，或切换到 SQLite |
| GitHub OAuth 回调 `redirect_uri_mismatch` | 确认 GitHub OAuth App 的 callback URL 为 `http://localhost:3000/api/auth/callback/github` |
| Prisma 客户端类型过期 | 运行 `npx prisma generate` |
| 上传目录无权限 | 确保 `public/uploads/` 可写 |
| ISR 不生效 | 开发模式 (`npm run dev`) 不使用 ISR 缓存；需 `npm run build && npm run start` 验证 |
