"""结算第二步 — 订单总览 | Checkout: overview before confirming"""

import re

import allure
from playwright.sync_api import Page, expect

from pages.base_page import BasePage


class CheckoutStepTwoPage(BasePage):
    """结算第二步 — 订单总览 | Checkout: overview before confirming"""

    def __init__(self, page: Page) -> None:
        super().__init__(page)
        self.title = page.locator(".title")
        self.summary_info = page.locator(".summary_info")
        self.cart_list = page.locator(".cart_list")
        self.subtotal_label = page.locator('[data-test="subtotal-label"]')
        self.tax_label = page.locator('[data-test="tax-label"]')
        self.total_label = page.locator('[data-test="total-label"]')
        self.finish_btn = page.locator('[data-test="finish"]')
        self.cancel_btn = page.locator('[data-test="cancel"]')

    # ── 页面加载断言 ──────────────────────────────────
    @allure.step("验证订单总览页面已加载")
    def expect_loaded(self) -> None:
        expect(self.page).to_have_url(
            re.compile(r".*checkout-step-two\.html")
        )
        expect(self.title).to_have_text("Checkout: Overview")
        expect(self.summary_info).to_be_visible()
        self.screenshot("checkout-overview-loaded")

    # ── 金额校验 ──────────────────────────────────────
    @allure.step("验证小计金额包含: {amount}")
    def expect_item_total_contains(self, amount: str) -> None:
        expect(self.subtotal_label).to_contain_text(amount)
        self.screenshot(f"item-total-{amount}")

    @allure.step("验证税费包含: {amount}")
    def expect_tax_contains(self, amount: str) -> None:
        expect(self.tax_label).to_contain_text(amount)
        self.screenshot(f"tax-{amount}")

    @allure.step("验证总计金额包含: {amount}")
    def expect_total_contains(self, amount: str) -> None:
        expect(self.total_label).to_contain_text(amount)
        self.screenshot(f"total-{amount}")

    # ── 操作 ──────────────────────────────────────────
    @allure.step("点击 Finish 确认下单")
    def finish(self) -> None:
        self.finish_btn.click()
        self.screenshot("order-finished")

    @allure.step("点击 Cancel 取消返回商品列表")
    def cancel(self) -> None:
        self.cancel_btn.click()
        self.screenshot("cancel-overview")
