"""购物车页面 | Cart page"""

import re

import allure
from playwright.sync_api import Page, expect

from pages.base_page import BasePage


class CartPage(BasePage):
    """购物车页面 | Cart page"""

    def __init__(self, page: Page) -> None:
        super().__init__(page)
        self.title = page.locator(".title")
        self.cart_list = page.locator(".cart_list")
        self.cart_items = page.locator('[data-test="inventory-item"]')
        self.checkout_btn = page.locator('[data-test="checkout"]')
        self.continue_shopping_btn = page.locator(
            '[data-test="continue-shopping"]'
        )

    # ── 页面加载断言 ──────────────────────────────────
    @allure.step("验证购物车页面已加载")
    def expect_loaded(self) -> None:
        expect(self.page).to_have_url(re.compile(r".*cart\.html"))
        expect(self.title).to_have_text("Your Cart")
        expect(self.cart_list).to_be_visible()
        self.screenshot("cart-loaded")

    # ── 商品操作 ──────────────────────────────────────
    @staticmethod
    def _slugify(name: str) -> str:
        """将商品名转为 data-test 中的 slug 格式"""
        return name.lower().replace(" ", "-")

    @allure.step("从购物车移除商品: {item_name}")
    def remove_item(self, item_name: str) -> None:
        slug = self._slugify(item_name)
        remove_btn = self.page.locator(f'[data-test="remove-{slug}"]')
        remove_btn.click()
        self.screenshot(f"cart-remove-{slug}")

    def get_items_count(self) -> int:
        """获取购物车中商品数量 | Returns count of cart items"""
        return self.cart_items.count()

    @allure.step("验证购物车商品数量为 {expected}")
    def expect_items_count(self, expected: int) -> None:
        expect(self.cart_items).to_have_count(expected)
        self.screenshot(f"cart-items-count-{expected}")

    def _item_name_locator(self, item_name: str):
        """定位购物车中指定名称的商品 | Locate cart item by name"""
        return self.page.locator(
            '[data-test="inventory-item-name"]'
        ).filter(has_text=item_name)

    @allure.step("验证商品存在于购物车: {item_name}")
    def expect_item_in_cart(self, item_name: str) -> None:
        expect(self._item_name_locator(item_name)).to_be_visible()
        self.screenshot(f"cart-contains-{item_name[:30]}")

    @allure.step("验证商品不存在于购物车: {item_name}")
    def expect_item_not_in_cart(self, item_name: str) -> None:
        expect(self._item_name_locator(item_name)).to_have_count(0)
        self.screenshot(f"cart-not-contains-{item_name[:30]}")

    # ── 导航 ──────────────────────────────────────────
    @allure.step("点击 Checkout 进入结算页面")
    def go_to_checkout(self) -> None:
        self.checkout_btn.click()
        self.screenshot("navigate-to-checkout")

    @allure.step("点击 Continue Shopping 返回商品列表")
    def continue_shopping(self) -> None:
        self.continue_shopping_btn.click()
        self.screenshot("navigate-back-to-inventory")
