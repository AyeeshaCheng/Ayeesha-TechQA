---
name: file-reader
description: "On-demand source code file reader for debug sessions. Reads files with 3-tier strategy (light/fragment/full), auto-strips comments and noise, tracks read history. Use ONLY when user explicitly specifies file paths to read."
---

# File Reader Skill — 按需代码文件读取

## 定位
Debug 场景专用 —— 仅当用户明确指定文件路径后才读取，遵循轻量优先、渐进加载原则，最大化节约 token。

## 触发条件
- ✅ 用户在 debug 对话中指定了具体文件路径
- ✅ 用户回复"读取候选文件"或"看第 N 个"
- ❌ 用户没有指定任何文件路径 → 不触发
- ❌ 常规非 debug 对话 → 不触发

---

## 工作流

### Step 1：接收文件路径
从用户指令中提取目标文件路径（支持相对路径和绝对路径）。

### Step 2：判断读取级别
| 用户表述 | 读取级别 |
|---------|---------|
| "看下 xxx.ts" / "读取 xxx"（默认）| **L1 轻量** |
| "看 xxx.ts 第 45-80 行" / "看 xxx 的 handleSubmit 函数" | **L2 片段** |
| "完整输出 xxx.ts" / "全文" / "看全部" | **L3 完整** |

### Step 3：执行读取 & 裁剪
按 [debug_rules.md](../../global/debug_rules.md) 第三章的分级策略执行：

**L1 轻量（默认）**：
```
读取文件 → 保留：函数签名+体、interface/type/enum、报错关联行、export 语句
         → 剔除：注释块、连续空行、未用 import、console.log
         → 输出上限：≤150 行
```

**L2 片段**：
```
读取文件 → 定位目标行/函数 → 输出目标 ± 前后 10 行上下文
         → 输出上限：≤50 行
```

**L3 完整**：
```
读取文件 → 原文完整输出（保留注释、配置、所有代码行）
```

### Step 4：输出 + 记录
输出格式：
```
📄 src/xxx/xxx.ts (L1 轻量 · 行 1-150 · 原始 320 行 → 裁剪后 118 行)
<代码内容>

📋 已读记录：src/xxx/xxx.ts (L1, 行 1-150)
```

---

## 输出规则

### 裁剪细则
1. **import 语句**：仅保留文件中实际引用的导入；类型导入保留
2. **注释处理**：删除 `//` 行注释和 `/* */` 块注释；保留 JSDoc `@param` `@returns` 标注
3. **空行处理**：连续空行压缩为单个空行
4. **长数据/配置**：数组/对象超过 10 项时截断，标注 `// ... (N items total)`
5. **日志语句**：删除 `console.log`、`console.debug`、`debugger` 语句
6. **测试/示例代码**：如果文件混有测试用例（`if (__TEST__)` / `// test`），默认跳过

### 超长文件处理
- 文件 < 300 行 → L1 裁剪后自然输出
- 文件 300~800 行 → 优先输出核心逻辑段 + 末尾标注 `⚠️ 文件共 650 行，已省略工具函数/常量定义区域，回复"展开 L200-350"查看指定区间`
- 文件 > 800 行 → 仅输出函数/类/导出的索引列表，等用户指定具体区域

---

## 多文件读取顺序
当用户给出多个文件路径时：
1. 逐个读取，读完一个先分析
2. 如果第一个文件已能定位问题 → 询问是否需要继续读其他文件
3. 如果第一个文件不足 → 自动继续读下一个

---

## 上下文感知
读取文件时附带输出：
- 该文件被哪些文件 import（上游依赖）
- 该文件 import 了哪些项目内文件（下游依赖）
- 帮助用户判断是否需要读取关联文件

示例：
```
📄 src/lib/schemas.ts (L1 轻量 · 112 行)
🔗 被引用：src/app/api/jd/save/route.ts, src/app/api/match/save/route.ts
🔗 引用了：src/lib/db.ts
<代码内容>
```

---

## 反模式（禁止）
- ❌ 用户没指定路径就主动搜索文件读取
- ❌ 一次性读取超过 3 个文件（除非用户明确说"全部读取"）
- ❌ 在读文件之前先把整个目录树展开搜索
- ❌ L1 能解决的问题升级到 L3 完整读取
