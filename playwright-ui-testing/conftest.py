"""Pytest 全局配置 — fixtures、Allure 集成、失败截图钩子
Pytest global configuration — fixtures, Allure integration, failure screenshot hooks.
"""

import json
from pathlib import Path

import allure
import pytest
from playwright.sync_api import Page

from config.settings import BASE_URL


# ═══════════════════════════════════════════════════════════════
#  Session-scoped fixtures
# ═══════════════════════════════════════════════════════════════

@pytest.fixture(scope="session")
def base_url() -> str:
    """被测系统的基础 URL | Base URL of the system under test."""
    return BASE_URL


@pytest.fixture(scope="session")
def login_users() -> dict:
    """登录测试数据 | Login test data loaded from JSON file."""
    data_file = Path(__file__).parent / "data" / "login_users.json"
    with data_file.open(encoding="utf-8") as f:
        return json.load(f)


# ═══════════════════════════════════════════════════════════════
#  Allure 集成 — 失败自动截图
# ═══════════════════════════════════════════════════════════════

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """测试失败时自动截图并附加到 Allure 报告。
    Auto-attach screenshot to Allure report on test failure.
    """
    outcome = yield
    report = outcome.get_result()

    # 只在 call 阶段（实际执行）且失败时截图
    if report.when == "call" and report.failed:
        page: Page | None = item.funcargs.get("page")
        if page is not None:
            try:
                screenshot_bytes = page.screenshot(full_page=True)
                allure.attach(
                    screenshot_bytes,
                    name="failure-screenshot",
                    attachment_type=allure.attachment_type.PNG,
                )
            except Exception:
                # 如果页面已经关闭或其他异常，忽略截图失败
                pass


# ═══════════════════════════════════════════════════════════════
#  pytest-playwright 配置
# ═══════════════════════════════════════════════════════════════

def pytest_configure(config):
    """注册自定义 pytest marker。"""
    config.addinivalue_line(
        "markers",
        "smoke: 冒烟测试 | Smoke tests",
    )
    config.addinivalue_line(
        "markers",
        "regression: 回归测试 | Regression tests",
    )
