"""Base page object — provides screenshot capture & Allure step helpers."""

import allure
from playwright.sync_api import Page


class BasePage:
    """所有页面对象的基类，封装截图与 Allure 集成
    Base class for all page objects, encapsulating screenshot & Allure integration.
    """

    def __init__(self, page: Page) -> None:
        self.page = page

    # ── 截图 & Allure 集成 ──────────────────────────────
    def screenshot(self, name: str = "screenshot") -> None:
        """截取当前页面并附加到 Allure 报告
        Capture current page screenshot and attach to Allure report.
        """
        screenshot_bytes = self.page.screenshot(full_page=True)
        allure.attach(
            screenshot_bytes,
            name=name,
            attachment_type=allure.attachment_type.PNG,
        )

    def step(self, title: str):
        """创建 Allure 步骤上下文管理器
        Create an Allure step context manager for grouping actions.
        """
        return allure.step(title)
