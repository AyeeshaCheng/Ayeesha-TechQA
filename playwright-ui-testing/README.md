# playwright-ui-testing

> UI 自动化项目 · UI Automation Project

---

## 项目简介 | About

**中文：** 基于 Playwright 的 Web UI 自动化测试实践，聚焦可维护的页面对象模型与高效执行。

**English:** Web UI automation with Playwright, focused on maintainable page objects and efficient test execution.

---

## 练习目标网站 | Practice Site

**Sauce Demo（Swag Labs）**  
https://www.saucedemo.com/

常用测试账号 | Demo accounts：

| 账号 Username | 密码 Password | 说明 Description |
|---------------|---------------|------------------|
| `standard_user` | `secret_sauce` | 正常登录 · Valid login |
| `locked_out_user` | `secret_sauce` | 账号锁定 · Locked out |

## 核心主题 | Core Topics

| 中文 | English |
|------|---------|
| Page Object | Page Object Model (POM) |
| fixture | Fixtures |
| parallel execution | Parallel Execution |

```整体架构
PO/PageObject 页面驱动（目前行业主流，你日常 Playwright 首选）
核心思想：页面和用例分层
Page 层（页面对象类）：一个页面一个 Class，存放页面所有元素定位器、页面操作方法（输入账号、点击登录），只维护页面元素与页面行为
Case 用例层：调用 Page 类的方法写业务用例，只关注业务逻辑，看不到元素定位器
```

---

## 目录结构 | Directory Structure

```
playwright-ui-testing/
├── tests/          # 测试用例
├── pages/          # 页面对象（POM）
├── components/     # 可复用 UI 组件封装
├── fixtures/       # 自定义 fixture
├── utils/          # 工具函数
├── data/           # 测试数据
├── config/         # 环境与运行配置
├── reports/        # 测试报告
├── logs/           # 运行日志
├── screenshots/    # 截图产物
├── traces/         # Playwright Trace 文件
└── README.md
```

| 目录 Directory | 说明 Description |
|----------------|------------------|
| `tests/` | 存放 E2E / UI 测试脚本（如 `test_*.spec.ts` 或 `test_*.py`），只写测试步骤与断言，不写复杂定位逻辑。 · E2E test specs: steps and assertions only. |
| `pages/` | **Page Object Model（POM）**：每个页面对应一个类/模块，封装 URL、元素定位与页面操作（点击、输入、跳转等）。 · One page object per screen; encapsulates locators and actions. |
| `components/` | 跨页面复用的 UI 片段（导航栏、弹窗、表格、登录框等），避免在多个 Page 中重复写定位器。 · Reusable UI blocks shared across pages. |
| `fixtures/` | Playwright **fixture** 扩展：如已登录态、浏览器上下文、测试账号、前置数据等，供 `tests/` 注入使用。 · Custom fixtures: auth state, browser context, test accounts. |
| `utils/` | 通用工具：等待封装、截图、日志、随机数据、文件读写、API 辅助等。 · Helpers: waits, logging, data generation, file I/O. |
| `data/` | 测试数据（JSON / YAML / CSV）：账号、表单输入、期望结果等，实现数据驱动。 · Test data for data-driven tests. |
| `config/` | 环境配置：baseURL、超时、浏览器类型、并行 worker 数、环境变量映射（dev / staging / prod）。 · Environment and runtime config. |
| `reports/` | 测试报告输出目录（HTML Report、JUnit XML 等），便于 CI 归档与查看。 · HTML / JUnit reports for CI and review. |
| `logs/` | 运行日志，记录用例执行过程、错误栈、关键步骤，便于失败排查。 · Runtime logs for debugging failures. |
| `screenshots/` | 失败截图或关键步骤截图，配合报告快速定位 UI 问题。 · Screenshots on failure or at key steps. |
| `traces/` | Playwright **Trace** 文件（`trace.zip`），可回放操作时间线、DOM、网络请求，适合复杂失败分析。 · Trace archives for timeline / DOM / network replay. |

### 推荐协作关系 | How They Work Together

```text
config/ + data/  →  fixtures/  →  pages/ + components/  →  tests/
                                      ↑
                                   utils/
reports/  logs/  screenshots/  traces/  ← 测试运行产物
```


1. `config/`、`data/` 提供环境与数据；
2. `fixtures/` 准备浏览器、登录态等；
3. `pages/`、`components/` 封装页面操作；
4. `tests/` 编写用例并调用上层封装；
5. 运行结果写入 `reports/`、`logs/`、`screenshots/`、`traces/`。

---

## 快速开始 | Quick Start

```bash
cd playwright-ui-testing
pip install -r requirements.txt
playwright install chromium
pytest tests/test_login.py
```

有界面运行（调试用）| Run with browser UI:

```bash
pytest tests/test_login.py --headed
```

### 已实现登录用例 | Login Tests

| 用例 | 文件 | 说明 |
|------|------|------|
| 登录成功 | `tests/test_login.py` | `standard_user` → 跳转商品页 |
| 锁定用户 | `tests/test_login.py` | `locked_out_user` → 错误提示 |
| 密码错误 | `tests/test_login.py` | 错误密码 → 不匹配提示 |
| 用户名为空 | `tests/test_login.py` | 空用户名 → 必填提示 |

页面对象：`pages/login_page.py`、`pages/inventory_page.py`  
测试数据：`data/login_users.json`

---

## 说明 | Notes

Personal learning repository. 个人学习仓库，欢迎交流与参考。
