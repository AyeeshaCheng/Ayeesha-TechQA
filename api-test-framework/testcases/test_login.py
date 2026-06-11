"""登录接口测试 | Login API Test Cases"""

import allure


@allure.feature("用户认证")
class TestLogin:
    """登录接口测试 | Login API Test Cases"""

    base_url = "https://reqres.in/api/login"

    headers = {
        "x-api-key": "free_user_3EGUTcDmWVdbGBVgNXvOzjqwC3o",
        "Content-Type": "application/json",
    }

    @allure.story("正常登录")
    @allure.title("正常登录 — 有效凭据返回 token")
    def test_login_success(self, http):
        """正常登录 | Successful login with valid credentials"""
        payload = {
            "email": "eve.holt@reqres.in",
            "password": "cityslicka",
        }
        response = http("POST", f"{self.base_url}", json=payload, headers=self.headers)
        assert response.status_code == 200
        assert "token" in response.json()

    @allure.story("异常登录")
    @allure.title("密码错误 — 返回固定 token")
    def test_login_wrong_password(self, http):
        """密码错误 | Login with wrong password"""
        payload = {
            "username": "eve.holt@reqres.in",
            "password": "wrong_password",
        }
        response = http("POST", f"{self.base_url}", json=payload, headers=self.headers)
        # ReqRes 演示接口：错误密码仍可能返回 200 与固定 token
        assert response.status_code == 200
        assert response.json()["token"] == "QpwL5tke4Pnpja7X4"

    @allure.story("异常登录")
    @allure.title("缺少用户名 — 返回 400")
    def test_login_missing_username(self, http):
        """缺少用户名 | Login with missing username"""
        payload = {
            "password": "test_password",
        }
        response = http("POST", f"{self.base_url}", json=payload, headers=self.headers)
        assert response.status_code == 400

    @allure.story("异常登录")
    @allure.title("空请求体 — 返回 400")
    def test_login_empty_body(self, http):
        """空请求体 | Login with empty request body"""
        response = http("POST", f"{self.base_url}", json={}, headers=self.headers)
        assert response.status_code == 400
