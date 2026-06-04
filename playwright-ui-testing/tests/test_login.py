from pages.inventory_page import InventoryPage
from pages.login_page import LoginPage


class TestLogin:
    """Sauce Demo 登录功能测试 | Login tests on Swag Labs"""

    def test_login_success(self, page, base_url, login_users):
        """正确账号密码登录成功 | Valid credentials redirect to inventory"""
        user = login_users["valid_user"]
        login_page = LoginPage(page, base_url)
        inventory_page = InventoryPage(page)

        login_page.open()
        login_page.login(user["username"], user["password"])
        inventory_page.expect_loaded()

    def test_login_locked_out_user(self, page, base_url, login_users):
        """锁定账号无法登录 | Locked out user shows error message"""
        user = login_users["locked_out_user"]
        login_page = LoginPage(page, base_url)

        login_page.open()
        login_page.login(user["username"], user["password"])
        login_page.expect_error_contains("locked out")

    def test_login_invalid_password(self, page, base_url, login_users):
        """错误密码登录失败 | Wrong password shows error message"""
        user = login_users["invalid_user"]
        login_page = LoginPage(page, base_url)

        login_page.open()
        login_page.login(user["username"], user["password"])
        login_page.expect_error_contains(
            "Username and password do not match"
        )

    def test_login_empty_username(self, page, base_url, login_users):
        """用户名为空 | Empty username shows required error"""
        user = login_users["valid_user"]
        login_page = LoginPage(page, base_url)

        login_page.open()
        login_page.login("", user["password"])
        login_page.expect_error_contains("Username is required")
