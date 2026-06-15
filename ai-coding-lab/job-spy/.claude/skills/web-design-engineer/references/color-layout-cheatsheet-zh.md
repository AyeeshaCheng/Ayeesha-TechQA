# 配色 & 布局速查卡（中文）

> 面向网页配色优化、布局重构场景的快速参考。配合主 SKILL.md 使用，不替代完整工作流。

---

## 一、配色决策树

### 1.1 起点：用 oklch 而非 hex
```
为什么？oklch 是感知均匀色彩空间——亮度值相同 = 人眼看起来一样亮。
HSL 做不到：亮度 50% 的黄色比亮度 50% 的蓝色亮得多。
```

### 1.2 配色公式（按场景选）

| 场景 | 公式 | 示例 |
|------|------|------|
| **SaaS / 工具** | 暖暗底(灰黑) + 单点缀色 + 白/灰文字 | Linear 暗夜 + 紫色点缀 |
| **高端品牌** | 乳白底 + 深墨色文字 + 无彩点缀 | Aesop 暖驼底 + 鼠尾草绿 |
| **数据仪表盘** | 深海军蓝底 + 琥珀/青蓝数据色 | Bloomberg Terminal |
| **消费/B2C** | 暖白底 + 珊瑚/焦糖暖色 + 圆润要素 | Mailchimp 黄 + 手绘风格 |
| **编辑/内容** | 浅灰底 + 衬线标题 + 极简黑白 | NYT / Monocle 杂志风 |
| **开发者工具** | 纯黑底 + 单色点缀 + 发丝边框 | Vercel Geist + 几何渐变 |

### 1.3 配色禁忌（AI 俗套清单）
| ❌ 禁止 | ✅ 替代 |
|--------|--------|
| 紫→粉→蓝三色渐变背景 | 单一品牌色 + 不同亮度层次 |
| `#3b82f6` 蓝 + `#8b5cf6` 紫组合 | 用 oklch 从品牌色派生 |
| 霓虹色在 `#0D1117` 暗底上 | 暖灰暗底 + 单色点缀（Linear 模式） |
| 超过 4 种独立色相 | ≤3 功能色 + 灰度阶梯 |
| 彩虹色图表 | 语义色编码（绿涨/红跌/蓝类目） |

### 1.4 oklch 色彩派生速算
```
主色 oklch(L, C, H) →
  浅色变体：oklch(L+0.15, C×0.6, H)    # hover 背景
  深色变体：oklch(L-0.2,  C×0.8, H)    # active/press
  边框变体：oklch(L+/-0,  C×0.3, H)    # border
  文字变体：oklch(L-0.35, C×0.2, H)    # text on light bg
```

---

## 二、CSS 自定义属性体系（Token 化）

### 2.1 最小完整 Token 集
```css
:root {
  /* 色彩阶梯 */
  --color-bg:            oklch(0.98 0 0);       /* 页面底色 */
  --color-surface:       oklch(1 0 0);          /* 卡片/面板底色 */
  --color-text-primary:  oklch(0.15 0 0);       /* 主文字 */
  --color-text-secondary:oklch(0.45 0 0);       /* 辅助文字 */
  --color-accent:        oklch(0.55 0.18 260);  /* 品牌点缀色 */
  --color-accent-hover:  oklch(0.62 0.22 260);  /* hover */
  --color-border:        oklch(0.88 0 0);       /* 边框 */

  /* 间距 */
  --space-unit: 8px;
  --space-xs:   calc(var(--space-unit) * 0.5);  /* 4px */
  --space-sm:   calc(var(--space-unit) * 1);     /* 8px */
  --space-md:   calc(var(--space-unit) * 2);     /* 16px */
  --space-lg:   calc(var(--space-unit) * 3);     /* 24px */
  --space-xl:   calc(var(--space-unit) * 5);     /* 40px */
  --space-2xl:  calc(var(--space-unit) * 8);     /* 64px */

  /* 圆角 */
  --radius-sm:  4px;   /* 输入框、标签 */
  --radius-md:  8px;   /* 卡片 */
  --radius-lg:  16px;  /* 大容器、模态框 */
  --radius-full: 9999px; /* 按钮、头像 */

  /* 阴影层级 */
  --shadow-1: 0 1px 2px oklch(0 0 0 / 0.05);   /* 卡片 */
  --shadow-2: 0 4px 12px oklch(0 0 0 / 0.08);  /* 下拉 */
  --shadow-3: 0 12px 32px oklch(0 0 0 / 0.12); /* 模态框 */

  /* 字体 */
  --font-heading: 'Space Grotesk', sans-serif;
  --font-body:    'Inter', sans-serif;
  --font-mono:    'JetBrains Mono', monospace;
}
```

### 2.2 暗色模式一键切换
```css
[data-theme="dark"] {
  --color-bg:            oklch(0.12 0.01 260);
  --color-surface:       oklch(0.16 0.01 260);
  --color-text-primary:  oklch(0.92 0 0);
  --color-text-secondary:oklch(0.65 0 0);
  --color-border:        oklch(0.24 0.01 260);
}
```
> 只需改 Token 值，组件代码零修改。

---

## 三、布局模式速查

### 3.1 布局选择决策
```
内容类型
├── 单页落地页   → Hero（全屏）+ 分段纵向滚动
├── 仪表盘       → 网格卡片 + 固定侧栏
├── 列表/Feed    → 单列滚动 + 固定顶栏
├── 详情页       → 两栏（主内容 + 侧栏）
├── 表单/设置    → 单列居中（max-width: 640px）
├── 数据对比     → 多列并排 + 等宽卡片
└── 编辑/原型    → 分栏（导航 + 列表 + 内容 + 属性面板）
```

### 3.2 Grid 布局模板

**仪表盘网格**：
```css
.dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-md);
  padding: var(--space-lg);
}
/* 大卡片占 2 列 */
.card--wide { grid-column: span 2; }
```

**经典两栏**：
```css
.page-layout {
  display: grid;
  grid-template-columns: 1fr 320px;  /* 主内容 + 侧栏 */
  gap: var(--space-xl);
  max-width: 1200px;
  margin: 0 auto;
}
@media (max-width: 768px) {
  .page-layout { grid-template-columns: 1fr; }
}
```

**居中窄内容**：
```css
.article {
  max-width: 680px;
  margin: 0 auto;
  padding: var(--space-lg);
}
```

### 3.3 Flexbox 微布局

| 需求 | 代码 |
|------|------|
| 水平居中 | `display: flex; justify-content: center; align-items: center;` |
| 两端对齐 | `display: flex; justify-content: space-between; align-items: center;` |
| 自动换行卡片 | `display: flex; flex-wrap: wrap; gap: 16px;` |
| 粘性底部 | `display: flex; flex-direction: column; min-height: 100vh;` 内容区 `flex: 1;` |
| 等宽子项 | `flex: 1 1 0;`（所有子项上） |

### 3.4 间距节奏
```
始终使用 8px 基准网格（--space-unit: 8px）：
- 组件内部间距：8px / 16px
- 区块之间间距：24px / 40px / 64px
- 页面级留白：64px / 96px / 128px

用 padding/margin 时只用这些倍数，绝不出现 7px / 13px / 23px 等随机值。
```

---

## 四、字体 & 排版层次

### 4.1 避坑字体表
| ❌ 过于常见 | ✅ 推荐替代（仍可免费使用） |
|------------|--------------------------|
| Inter | Space Grotesk、Outfit、Plus Jakarta Sans |
| Roboto | Sora、DM Sans、Geist Sans |
| Arial | system-ui（仅限正文）、Instrument Sans |
| Fraunces | Newsreader、Instrument Serif、Lora |

### 4.2 字号比例（流体）
```css
h1 { font-size: clamp(2rem, 5vw, 4rem); }        /* ~32px→64px */
h2 { font-size: clamp(1.5rem, 3.5vw, 2.5rem); }  /* ~24px→40px */
h3 { font-size: clamp(1.25rem, 2.5vw, 1.75rem); }/* ~20px→28px */
body { font-size: clamp(1rem, 1.5vw, 1.125rem); }/* ~16px→18px */
small { font-size: 0.875rem; }                     /* 14px */
/* 标题/正文比例 ≥ 2.5× —— 才能建立清晰的视觉层次 */
```

### 4.3 排版检查清单
- [ ] 标题与正文字号比例 ≥ 2.5×
- [ ] 全局不超过 2 种字体家族（1 标题 + 1 正文，或 1 通用 + 1 代码）
- [ ] 行高：正文 ≥ 1.6，标题 1.1–1.3
- [ ] 段落宽度 ≤ 75ch（~600px）
- [ ] `text-wrap: pretty` 应用于标题

---

## 五、常见页面配色方案速查

### 方案 A：现代 SaaS（Linear 风格）
```css
--bg:      oklch(0.13 0.01 260);  /* 暖暗底 */
--surface: oklch(0.17 0.01 260);  /* 卡片 */
--text:    oklch(0.92 0 0);       /* 亮文字 */
--accent:  oklch(0.62 0.18 280);  /* 紫色点缀 */
--border:  oklch(0.24 0.01 260);  /* 发丝边框 */
font: 'Space Grotesk' heading, 'Inter' body
```

### 方案 B：极简白（Apple HIG 风格）
```css
--bg:      oklch(0.99 0 0);       /* 近白 */
--surface: oklch(1 0 0);          /* 纯白卡片 */
--text:    oklch(0.12 0 0);       /* 近黑 */
--accent:  oklch(0.58 0.18 240);  /* 蓝 */
--shadow:  0 2px 8px oklch(0 0 0 / 0.06);
font: 'SF Pro Display' heading, system-ui body
```

### 方案 C：编辑质感（Aesop / Monocle 风格）
```css
--bg:      oklch(0.96 0.01 85);   /* 暖纸色 */
--text:    oklch(0.18 0.01 80);   /* 深棕 */
--accent:  oklch(0.45 0.06 140);  /* 鼠尾草 */
--border:  oklch(0.85 0.01 85);   /* 淡驼 */
font: 'Newsreader' heading, 'Outfit' body
```

### 方案 D：暗色仪表盘（Bloomberg 风格）
```css
--bg:      oklch(0.1 0.01 250);   /* 深海军蓝 */
--text:    oklch(0.6 0.12 85);    /* 琥珀文字 */
--accent:  oklch(0.55 0.15 190);  /* 青蓝数据 */
font: monospace primary, system-ui secondary
```

---

## 六、布局优化 5 步法

1. **缩略图测试**：页面缩小到 25%，能否看清主次结构？不能 → 字号对比不够
2. **删除测试**：删掉每个元素，页面变差了吗？没变差 → 删掉
3. **间距审计**：检查所有 padding/margin，必须是 8px 倍数
4. **色相审计**：页面用了超过 3 个独立色相？超过 → 合并
5. **字体审计**：超过 2 种字体家族？超过 → 去掉一种
