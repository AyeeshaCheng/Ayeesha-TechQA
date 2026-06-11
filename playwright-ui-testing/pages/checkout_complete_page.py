"""结算完成页 | Order completed confirmation page"""

import re

import allure
from playwright.sync_api import Page, expect

from pages.base_page import BasePage


class CheckoutCompletePage(BasePage):
    """结算完成页 | Order completed confirmation page"""

    def __init__(self, page: Page) -> None:
        super().__init__(page)
        self.title = page.locator(".title")
        self.complete_header = page.locator('[data-test="complete-header"]')
        self.complete_text = page.locator('[data-test="complete-text"]')
        self.pony_express_img = page.locator('[data-test="pony-express"]')
        self.back_to_products_btn = page.locator(
            '[data-test="back-to-products"]'
        )

    # ── 页面加载断言 ──────────────────────────────────
    @allure.step("验证结算完成页面已加载")
    def expect_loaded(self) -> None:
        expect(self.page).to_have_url(
            re.compile(r".*checkout-complete\.html")
        )
        expect(self.title).to_have_text("Checkout: Complete!")
        expect(self.pony_express_img).to_be_visible()
        self.screenshot("checkout-complete-loaded")

    @allure.step("验证下单成功信息")
    def expect_order_complete(self) -> None:
        self.expect_loaded()
        expect(self.complete_header).to_have_text("Thank you for your order!")
        expect(self.complete_text).to_contain_text(
            "Your order has been dispatched"
        )
        self.screenshot("order-complete-confirmed")

    # ── 导航 ──────────────────────────────────────────
    @allure.step("点击返回商品列表")
    def back_to_products(self) -> None:
        self.back_to_products_btn.click()
        self.screenshot("back-to-products")
