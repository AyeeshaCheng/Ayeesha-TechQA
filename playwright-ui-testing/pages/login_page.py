"""Sauce Demo 登录页 | Swag Labs login page"""

import allure
from playwright.sync_api import Page, expect

from pages.base_page import BasePage


class LoginPage(BasePage):
    """Sauce Demo 登录页 | Swag Labs login page"""

    PATH = "/"

    def __init__(self, page: Page, base_url: str) -> None:
        super().__init__(page)
        self.base_url = base_url.rstrip("/")
        self.url = f"{self.base_url}{self.PATH}"

        # CSS属性选择器，专为自动化写的属性data-test，用来定位元素
        # Locator 是 懒查找 + 可自动重试：每次 fill()、click() 时会重新解析 DOM，页面刷新、动画结束后仍能找到元素。
        self.username_input = page.locator('[data-test="username"]')
        self.password_input = page.locator('[data-test="password"]')
        self.login_button = page.locator('[data-test="login-button"]')
        self.error_message = page.locator('[data-test="error"]')

    # ── 页面操作 ──────────────────────────────────────
    @allure.step("打开登录页")
    def open(self) -> None:
        self.page.goto(self.url)
        self.screenshot("login-page")

    @allure.step("执行登录: {username}")
    def login(self, username: str, password: str) -> None:
        self.username_input.fill(username)
        self.screenshot(f"login-input-{username}")
        self.password_input.fill(password)
        self.login_button.click()
        self.screenshot(f"login-submitted-{username}")

    # ── 断言 ──────────────────────────────────────────
    @allure.step("验证错误信息包含: {text}")
    def expect_error_contains(self, text: str) -> None:
        expect(self.error_message).to_be_visible()
        expect(self.error_message).to_contain_text(text)
        self.screenshot(f"error-{text[:20]}")
