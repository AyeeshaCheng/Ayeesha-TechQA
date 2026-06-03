# api-test-framework

> 接口自动化项目 · API Automation Project

---

## 项目简介 | About

**中文：** 基于 Python 的接口自动化测试实践项目，覆盖用例设计、报告输出与持续集成。

**English:** A Python-based API automation testing project covering test design, reporting, and CI integration.

---

## 技术栈 | Tech Stack

| 中文 | English |
|------|---------|
| pytest | pytest |
| requests | requests |
| allure | Allure Report |
| yaml | YAML Data-Driven |
| logging | Logging |
| config | Configuration Management |
| CI | Continuous Integration |

---

## 目录结构 | Directory Structure

```
api-test-framework/
├── common/       # 公共模块 · Shared modules
├── config/       # 配置 · Configuration
├── data/         # 测试数据 · Test data
├── logs/         # 日志 · Logs
├── reports/      # 报告 · Reports
├── testcases/    # 用例 · Test cases
├── utils/        # 工具 · Utilities
└── README.md
```

| 目录 Directory | 说明 Description |
|----------------|------------------|
| `common/` | 公共封装与基类 · Shared base classes & helpers |
| `config/` | 环境与运行配置 · Environment & runtime config |
| `data/` | YAML/JSON 等测试数据 · Test data files |
| `logs/` | 运行日志输出 · Runtime log output |
| `reports/` | Allure 等测试报告 · Test reports (e.g. Allure) |
| `testcases/` | pytest 用例 · pytest test cases |
| `utils/` | 请求、断言等工具 · HTTP, assert & other utilities |

---

## 说明 | Notes

Personal learning repository. 个人学习仓库，欢迎交流与参考。
