from playwright.sync_api import Page, expect


class LoginPage:
    """Sauce Demo 登录页 | Swag Labs login page"""

    PATH = "/"

    # 初始化页面元素
    def __init__(self, page: Page, base_url: str) -> None:
        self.page = page
        self.base_url = base_url.rstrip("/")
        self.url = f"{self.base_url}{self.PATH}"

        # CSS属性选择器，专为自动化写的属性data-test，用来定位元素
        # Locator 是 懒查找 + 可自动重试：每次 fill()、click() 时会重新解析 DOM，页面刷新、动画结束后仍能找到元素。
        self.username_input = page.locator('[data-test="username"]')
        self.password_input = page.locator('[data-test="password"]')
        self.login_button = page.locator('[data-test="login-button"]')
        self.error_message = page.locator('[data-test="error"]')

    # 打开登录页
    def open(self) -> None:
        self.page.goto(self.url)

    # 登录操作
    def login(self, username: str, password: str) -> None:
        # Playwright 底层通过 CDP 协议和浏览器通信，每隔 50ms 循环查询 DOM，默认超时30秒
        # Playwright Locator 惰性查询，动作方法自带智能等待 attached/visible，不用手写WebDriverWait
        self.username_input.fill(username)
        self.password_input.fill(password)
        self.login_button.click()

    # 断言错误信息
    def expect_error_contains(self, text: str) -> None:
        expect(self.error_message).to_be_visible()
        expect(self.error_message).to_contain_text(text)
