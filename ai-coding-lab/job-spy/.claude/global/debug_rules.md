# Debug 专用过滤与读取补充规则

## 一、全局忽略目录/文件（扫描目录树时直接屏蔽）

### 1.1 永远忽略的目录
```
node_modules、dist、build、out、.next、
.git、.vscode、.idea、.venv、venv、
__pycache__、logs、tmp、coverage、
assets 静态打包产物（非源码资源目录）
```

### 1.2 永远忽略的文件类型
```
.log、.cache、.zip、.tar、.gz、
图片（png/jpg/gif/svg/webp/ico）、
字体（woff/woff2/ttf/eot）、
二进制资源（.db/.db-shm/.db-wal 数据文件不读内容）、
lock 文件（package-lock.json、pnpm-lock.yaml）
```

### 1.3 默认忽略但可按需读取
```
.md 文档 — 仅在用户明确指定时读取
.json 配置 — 仅读取 package.json/tsconfig.json 等根配置
.env* — 绝不读取，仅告知存在
```

## 二、目录扫描规则

### 2.1 展示范围
只展示**业务源码目录**，按项目类型适配：
| 项目类型 | 展示目录 |
|---------|---------|
| Next.js App Router | src/app、src/components、src/hooks、src/lib、src/styles |
| 通用 Node | src、routes、controllers、services、models、middleware |
| 前端 SPA | src/pages、src/components、src/store、src/utils、src/api |

### 2.2 层级控制
- 目录树**最多展开 3 层**，深层目录统一折叠标注 `... (N个子目录)`
- 文件夹内文件超过 **12 个**时，只展示后缀分类统计：`[8 *.ts, 4 *.tsx]`
- 单文件直接列出全名，超过 3 个同级文件时用紧凑格式

### 2.3 紧凑输出格式示例
```
src/
├── app/
│   ├── api/jd/        # JD 相关 API [3 *.ts]
│   ├── api/match/     # 匹配 API [2 *.ts]
│   ├── api/parse-pdf/ # PDF 解析 [1 *.ts]
│   └── page.tsx
├── components/        # [5 *.tsx]
├── hooks/             # [2 *.ts]
└── lib/               # [4 *.ts]
```

## 三、文件读取分级策略

### 3.1 三级读取明细

| 级别 | 触发条件 | 操作 | 输出上限 |
|------|---------|------|---------|
| **L1 轻量** | 默认所有读取 | 核心函数体 + 报错行 + 接口/类型定义；删除注释、空行、未用 import | ≤150 行 |
| **L2 片段** | 用户给出行号/函数名 | 仅目标片段 + 前后各 10 行上下文 | ≤50 行 |
| **L3 完整** | 用户明确说"完整文件"/"全文" | 保留注释、配置、所有代码行 | 不限 |

### 3.2 L1 轻量读取裁剪细则
保留：
- 函数签名与函数体
- `interface` / `type` / `enum` 定义
- 报错调用链上的代码行
- `export` 语句
- 错误处理逻辑（try/catch）

剔除：
- `//` 和 `/* */` 注释（JSDoc `@param` `@returns` 保留）
- 连续空行（压缩为单空行）
- 未在文件中使用的 import
- `console.log` / `debugger` 语句
- 字符串常量 / 静态配置数组（超过 5 项截断标注 `// ... N items`）

### 3.3 智能裁剪示例
```
原始（280行）→ L1 输出（~120行）：
- 文件头注释：剔除
- import 块：保留实际使用的 4 条（原 12 条）
- 工具函数：保留签名
- 核心业务函数：保留完整函数体
- 组件 JSX：保留结构，剔除样式细节注释
```

## 四、Bug 分析智能路由

### 4.1 报错 → 文件映射表
| 报错类型 | 优先查看 | 次优先 |
|---------|---------|--------|
| TypeScript 类型错误 | 报错文件 + `lib/schemas.ts` | 上下游调用文件 |
| API 路由 500/404 | `src/app/api/<route>/route.ts` | `lib/` 数据库操作文件 |
| React 渲染错误 | 报错组件 + 父组件 | `hooks/` 相关 Hook |
| 数据库写入失败 | `lib/schemas.ts` → API route | `lib/db.ts` |
| PDF 解析异常 | `api/parse-pdf/route.ts` | 调用方组件 |

### 4.2 分析约束
1. **先推理再读文件**：根据报错信息 + 目录结构推断 2-4 个候选文件
2. **读一个分析一个**：读完 L1 输出后先判断是否足够定位问题，不够再读下一个
3. **禁止无差别扫描**：绝对禁止"把 src 下所有 .ts 文件读一遍"的行为
4. **修复输出用 diff 格式**：只展示改动的代码块，不粘贴完整文件

## 五、多轮对话缓存策略

### 5.1 已读文件追踪
在对话中维护轻量记录：
```
📋 已读文件：
- src/lib/schemas.ts (L1, 行 1-150)
- src/app/api/jd/route.ts (L2, 行 45-80)
```

### 5.2 复用规则
- 已读过 L3（完整）的文件 → 不再输出，直接引用行号
- 已读过 L1/L2 的文件 → 如需看其他部分，按需读取新片段
- 用户说"重新看" → 再次输出（仍遵循等级限制）

## 六、项目特定规则（Job-Spy）

### 6.1 目录语义
| 目录 | 职责 | Debug 优先级 |
|------|------|-------------|
| `src/app/api/` | Next.js API Route 入口 | 🔴 高 |
| `src/lib/schemas.ts` | Zod 类型定义 + 默认值 | 🔴 高 |
| `src/lib/db.ts` | SQLite 操作封装 | 🟡 中 |
| `src/components/` | React UI 组件 | 🟡 中 |
| `src/hooks/` | 自定义 Hooks | 🟢 低 |
| `data/` | SQLite 数据库文件 | ⚪ 不读内容 |

### 6.2 数据文件规则
- `data/*.db` / `*.db-shm` / `*.db-wal` — 永远不读文件内容
- `data/resumes/*.pdf` — 仅在用户指定时通过 parse-pdf API 处理
