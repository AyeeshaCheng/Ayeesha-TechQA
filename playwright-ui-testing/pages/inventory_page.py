"""登录后商品列表页 | Products inventory page after login"""

import re

import allure
from playwright.sync_api import Page, expect

from pages.base_page import BasePage


class InventoryPage(BasePage):
    """登录后商品列表页 | Products inventory page after login"""

    def __init__(self, page: Page) -> None:
        super().__init__(page)
        self.title = page.locator(".title")
        self.inventory_list = page.locator(".inventory_list")
        self.cart_badge = page.locator('[data-test="shopping-cart-badge"]')
        self.cart_link = page.locator('[data-test="shopping-cart-link"]')

    # ── 页面加载断言 ──────────────────────────────────
    @allure.step("验证商品列表页已加载")
    def expect_loaded(self) -> None:
        expect(self.page).to_have_url(re.compile(r".*inventory\.html"))
        expect(self.title).to_have_text("Products")
        expect(self.inventory_list).to_be_visible()
        self.screenshot("inventory-loaded")

    # ── 商品操作 ──────────────────────────────────────
    @staticmethod
    def _slugify(name: str) -> str:
        """将商品名转为 data-test 中的 slug 格式
        e.g. "Sauce Labs Backpack" -> "sauce-labs-backpack"
        """
        return name.lower().replace(" ", "-")

    @allure.step("添加商品到购物车: {item_name}")
    def add_item_to_cart(self, item_name: str) -> None:
        slug = self._slugify(item_name)
        add_btn = self.page.locator(f'[data-test="add-to-cart-{slug}"]')
        add_btn.click()
        self.screenshot(f"add-to-cart-{slug}")

    @allure.step("从商品列表页移除商品: {item_name}")
    def remove_item_from_inventory(self, item_name: str) -> None:
        slug = self._slugify(item_name)
        remove_btn = self.page.locator(f'[data-test="remove-{slug}"]')
        remove_btn.click()
        self.screenshot(f"remove-from-inventory-{slug}")

    # ── 购物车徽章 ────────────────────────────────────
    def get_cart_badge_count(self) -> int:
        """获取购物车徽章数字 | Returns cart badge count (0 if invisible)"""
        if self.cart_badge.is_visible():
            return int(self.cart_badge.text_content() or "0")
        return 0

    @allure.step("验证购物车徽章数字为 {expected}")
    def expect_cart_badge_count(self, expected: int) -> None:
        if expected == 0:
            expect(self.cart_badge).not_to_be_visible()
        else:
            expect(self.cart_badge).to_have_text(str(expected))
        self.screenshot(f"cart-badge-{expected}")

    # ── 导航 ──────────────────────────────────────────
    @allure.step("点击购物车图标进入购物车页面")
    def go_to_cart(self) -> None:
        self.cart_link.click()
        self.screenshot("navigate-to-cart")
