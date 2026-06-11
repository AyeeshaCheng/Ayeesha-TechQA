"""结算第一步 — 填写收货信息 | Checkout: enter shipping info"""

import re

import allure
from playwright.sync_api import Page, expect

from pages.base_page import BasePage


class CheckoutStepOnePage(BasePage):
    """结算第一步 — 填写收货信息 | Checkout: enter shipping info"""

    def __init__(self, page: Page) -> None:
        super().__init__(page)
        self.title = page.locator(".title")
        self.first_name_input = page.locator('[data-test="firstName"]')
        self.last_name_input = page.locator('[data-test="lastName"]')
        self.postal_code_input = page.locator('[data-test="postalCode"]')
        self.continue_btn = page.locator('[data-test="continue"]')
        self.cancel_btn = page.locator('[data-test="cancel"]')
        self.error_message = page.locator('[data-test="error"]')

    # ── 页面加载断言 ──────────────────────────────────
    @allure.step("验证结算第一步页面已加载")
    def expect_loaded(self) -> None:
        expect(self.page).to_have_url(
            re.compile(r".*checkout-step-one\.html")
        )
        expect(self.title).to_have_text("Checkout: Your Information")
        self.screenshot("checkout-step-one-loaded")

    # ── 表单操作 ──────────────────────────────────────
    @allure.step("填写收货信息: {first_name} {last_name}, {postal_code}")
    def fill_shipping_info(
        self,
        first_name: str,
        last_name: str,
        postal_code: str,
    ) -> None:
        self.first_name_input.fill(first_name)
        self.last_name_input.fill(last_name)
        self.postal_code_input.fill(postal_code)
        self.screenshot("shipping-info-filled")

    @allure.step("点击 Continue 进入订单总览")
    def continue_to_overview(self) -> None:
        self.continue_btn.click()
        self.screenshot("continue-to-overview")

    @allure.step("点击 Cancel 取消结算")
    def cancel(self) -> None:
        self.cancel_btn.click()
        self.screenshot("cancel-checkout")

    # ── 错误断言 ──────────────────────────────────────
    @allure.step("验证错误信息包含: {text}")
    def expect_error_contains(self, text: str) -> None:
        expect(self.error_message).to_be_visible()
        expect(self.error_message).to_contain_text(text)
        self.screenshot(f"checkout-error-{text[:20]}")
