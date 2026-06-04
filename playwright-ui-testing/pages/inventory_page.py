import re

from playwright.sync_api import Page, expect


class InventoryPage:
    """登录后商品列表页 | Products inventory page after login"""

    def __init__(self, page: Page) -> None:
        self.page = page
        self.title = page.locator(".title")
        self.inventory_list = page.locator(".inventory_list")

    def expect_loaded(self) -> None:
        expect(self.page).to_have_url(re.compile(r".*inventory\.html"))
        expect(self.title).to_have_text("Products")
        expect(self.inventory_list).to_be_visible()
