"""购物车功能测试 | Cart functionality tests"""

import allure

from pages.login_page import LoginPage
from pages.inventory_page import InventoryPage
from pages.cart_page import CartPage
from pages.checkout_step_one_page import CheckoutStepOnePage
from pages.checkout_step_two_page import CheckoutStepTwoPage
from pages.checkout_complete_page import CheckoutCompletePage


@allure.feature("购物车与结算")
class TestCart:
    """购物车功能测试 | Cart functionality tests"""

    # ── 辅助方法：登录并进入商品列表 ──────────────────
    @staticmethod
    def _login(page, base_url, login_users) -> InventoryPage:
        login_page = LoginPage(page, base_url)
        user = login_users["valid_user"]
        login_page.open()
        login_page.login(user["username"], user["password"])
        inventory = InventoryPage(page)
        inventory.expect_loaded()
        return inventory

    # ── 添加商品到购物车 ──────────────────────────────
    @allure.story("添加商品")
    @allure.title("添加单个商品到购物车")
    def test_add_single_item_to_cart(self, page, base_url, login_users):
        """添加单个商品到购物车 | Add single item to cart"""
        inventory = self._login(page, base_url, login_users)

        # 初始徽章不可见
        assert inventory.get_cart_badge_count() == 0

        # 添加商品
        inventory.add_item_to_cart("Sauce Labs Backpack")
        inventory.expect_cart_badge_count(1)

        # 前往购物车验证
        inventory.go_to_cart()
        cart = CartPage(page)
        cart.expect_loaded()
        cart.expect_items_count(1)
        cart.expect_item_in_cart("Sauce Labs Backpack")

    @allure.story("添加商品")
    @allure.title("添加多个商品到购物车")
    def test_add_multiple_items_to_cart(self, page, base_url, login_users):
        """添加多个商品到购物车 | Add multiple items to cart"""
        inventory = self._login(page, base_url, login_users)

        items = [
            "Sauce Labs Backpack",
            "Sauce Labs Bike Light",
            "Sauce Labs Bolt T-Shirt",
        ]
        for item in items:
            inventory.add_item_to_cart(item)

        # 徽章数字应为 3
        inventory.expect_cart_badge_count(3)

        # 购物车应有 3 件商品
        inventory.go_to_cart()
        cart = CartPage(page)
        cart.expect_loaded()
        cart.expect_items_count(3)
        for item in items:
            cart.expect_item_in_cart(item)

    # ── 移除商品 ──────────────────────────────────────
    @allure.story("移除商品")
    @allure.title("在购物车页面移除商品")
    def test_remove_item_from_cart(self, page, base_url, login_users):
        """在购物车页面移除商品 | Remove item from cart page"""
        inventory = self._login(page, base_url, login_users)

        # 先添加两件
        inventory.add_item_to_cart("Sauce Labs Backpack")
        inventory.add_item_to_cart("Sauce Labs Bike Light")
        inventory.expect_cart_badge_count(2)

        inventory.go_to_cart()
        cart = CartPage(page)
        cart.expect_loaded()
        cart.expect_items_count(2)

        # 移除一件
        cart.remove_item("Sauce Labs Backpack")
        cart.expect_items_count(1)
        cart.expect_item_not_in_cart("Sauce Labs Backpack")
        cart.expect_item_in_cart("Sauce Labs Bike Light")

    @allure.story("移除商品")
    @allure.title("在商品列表页移除已添加的商品")
    def test_remove_item_from_inventory_page(self, page, base_url, login_users):
        """在商品列表页移除已添加的商品 | Remove added item on inventory page"""
        inventory = self._login(page, base_url, login_users)

        inventory.add_item_to_cart("Sauce Labs Backpack")
        inventory.expect_cart_badge_count(1)

        # 直接在 inventory 页面点 Remove
        inventory.remove_item_from_inventory("Sauce Labs Backpack")
        inventory.expect_cart_badge_count(0)

    # ── 完整下单流程 ──────────────────────────────────
    @allure.story("下单流程")
    @allure.title("完整下单流程：添加商品 → 结算 → 确认 → 完成")
    def test_complete_checkout_flow(self, page, base_url, login_users):
        """完整下单流程：添加商品 → 结算 → 确认 → 完成
        Full checkout: add items → checkout → overview → complete
        """
        inventory = self._login(page, base_url, login_users)

        # 1. 添加商品
        inventory.add_item_to_cart("Sauce Labs Backpack")
        inventory.add_item_to_cart("Sauce Labs Fleece Jacket")
        inventory.expect_cart_badge_count(2)

        # 2. 进入购物车 → 结算
        inventory.go_to_cart()
        cart = CartPage(page)
        cart.expect_loaded()
        cart.go_to_checkout()

        # 3. 填写收货信息
        step1 = CheckoutStepOnePage(page)
        step1.expect_loaded()
        step1.fill_shipping_info("Alice", "Wang", "200001")
        step1.continue_to_overview()

        # 4. 订单总览
        step2 = CheckoutStepTwoPage(page)
        step2.expect_loaded()
        # 验证金额字段存在并包含 $
        step2.expect_item_total_contains("$")
        step2.expect_tax_contains("$")
        step2.expect_total_contains("$")
        step2.finish()

        # 5. 下单完成
        complete = CheckoutCompletePage(page)
        complete.expect_order_complete()

    # ── 结算表单校验 ──────────────────────────────────
    @allure.story("结算表单校验")
    @allure.title("结算第一步 — 名为空时提示错误")
    def test_checkout_empty_first_name(self, page, base_url, login_users):
        """结算第一步 — 名为空时提示错误 | Empty first name shows error"""
        inventory = self._login(page, base_url, login_users)

        inventory.add_item_to_cart("Sauce Labs Backpack")
        inventory.go_to_cart()

        cart = CartPage(page)
        cart.expect_loaded()
        cart.go_to_checkout()

        step1 = CheckoutStepOnePage(page)
        step1.expect_loaded()
        # 不填写任何信息直接继续
        step1.continue_to_overview()
        step1.expect_error_contains("First Name is required")

    @allure.story("结算表单校验")
    @allure.title("结算第一步 — 姓为空时提示错误")
    def test_checkout_empty_last_name(self, page, base_url, login_users):
        """结算第一步 — 姓为空时提示错误 | Empty last name shows error"""
        inventory = self._login(page, base_url, login_users)

        inventory.add_item_to_cart("Sauce Labs Backpack")
        inventory.go_to_cart()

        cart = CartPage(page)
        cart.go_to_checkout()

        step1 = CheckoutStepOnePage(page)
        step1.fill_shipping_info("Alice", "", "200001")
        step1.continue_to_overview()
        step1.expect_error_contains("Last Name is required")

    @allure.story("结算表单校验")
    @allure.title("结算第一步 — 邮编为空时提示错误")
    def test_checkout_empty_postal_code(self, page, base_url, login_users):
        """结算第一步 — 邮编为空时提示错误 | Empty postal code shows error"""
        inventory = self._login(page, base_url, login_users)

        inventory.add_item_to_cart("Sauce Labs Backpack")
        inventory.go_to_cart()

        cart = CartPage(page)
        cart.go_to_checkout()

        step1 = CheckoutStepOnePage(page)
        step1.fill_shipping_info("Alice", "Wang", "")
        step1.continue_to_overview()
        step1.expect_error_contains("Postal Code is required")

    # ── 取消结算 ──────────────────────────────────────
    @allure.story("导航")
    @allure.title("结算第一步取消 → 返回购物车")
    def test_cancel_checkout_step_one(self, page, base_url, login_users):
        """结算第一步取消 → 返回购物车 | Cancel checkout returns to cart"""
        inventory = self._login(page, base_url, login_users)

        inventory.add_item_to_cart("Sauce Labs Backpack")
        inventory.go_to_cart()

        cart = CartPage(page)
        cart.expect_loaded()
        cart.go_to_checkout()

        step1 = CheckoutStepOnePage(page)
        step1.expect_loaded()
        step1.cancel()

        # 应回到购物车页
        cart.expect_loaded()

    # ── 继续购物 ──────────────────────────────────────
    @allure.story("导航")
    @allure.title("购物车页点击 Continue Shopping 回到商品列表")
    def test_continue_shopping(self, page, base_url, login_users):
        """购物车页点击 Continue Shopping 回到商品列表
        Continue Shopping returns to inventory page
        """
        inventory = self._login(page, base_url, login_users)
        inventory.go_to_cart()

        cart = CartPage(page)
        cart.expect_loaded()
        cart.continue_shopping()

        # 应回到 inventory 页
        inventory.expect_loaded()
