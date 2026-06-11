"""登录后用户业务接口测试 | Post-login user API tests"""

import allure

API_BASE_URL = "https://reqres.in/api"


@allure.feature("用户管理")
class TestUsersBusiness:
    """登录后用户业务接口测试 | Post-login user API tests"""

    @allure.story("查询用户")
    @allure.title("登录后查询用户列表 — 验证分页与数据结构")
    def test_list_users_after_login(self, http, auth_headers, api_base_url):
        """登录后查询用户列表 | List users after login"""
        response = http("GET", f"{api_base_url}/users?page=1", headers=auth_headers)
        body = response.json()

        assert response.status_code == 200
        assert body["page"] == 1
        assert body["per_page"] == 6
        assert len(body["data"]) > 0
        assert "email" in body["data"][0]

    @allure.story("查询用户")
    @allure.title("登录后查询用户详情 — 验证用户 ID 与邮箱")
    def test_get_user_detail_after_login(self, http, auth_headers, api_base_url):
        """登录后查询用户详情 | Get user detail after login"""
        user_id = 2
        response = http("GET", f"{api_base_url}/users/{user_id}", headers=auth_headers)
        data = response.json()["data"]

        assert response.status_code == 200
        assert data["id"] == user_id
        assert data["email"] == "janet.weaver@reqres.in"

    @allure.story("创建用户")
    @allure.title("登录后创建用户 — 验证 name、job、id、createdAt")
    def test_create_user_after_login(self, http, auth_headers):
        """登录后创建用户 | Create user after login"""
        payload = {"name": "Ayeesha", "job": "QA Engineer"}
        response = http("POST", f"{API_BASE_URL}/users", json=payload, headers=auth_headers)
        body = response.json()

        assert response.status_code == 201
        assert body["name"] == payload["name"]
        assert body["job"] == payload["job"]
        assert "id" in body
        assert "createdAt" in body

    @allure.story("更新用户")
    @allure.title("登录后全量更新用户 (PUT) — 验证 name、job、updatedAt")
    def test_update_user_after_login(self, http, auth_headers):
        """登录后全量更新用户 | Full update user after login (PUT)"""
        user_id = 2
        payload = {"name": "Ayeesha Updated", "job": "Senior QA"}
        response = http(
            "PUT",
            f"{API_BASE_URL}/users/{user_id}",
            json=payload,
            headers=auth_headers,
        )
        body = response.json()

        assert response.status_code == 200
        assert body["name"] == payload["name"]
        assert body["job"] == payload["job"]
        assert "updatedAt" in body

    @allure.story("更新用户")
    @allure.title("登录后部分更新用户 (PATCH) — 仅更新 job 字段")
    def test_patch_user_after_login(self, http, auth_headers):
        """登录后部分更新用户 | Partial update user after login (PATCH)"""
        user_id = 2
        payload = {"job": "QA Lead"}
        response = http(
            "PATCH",
            f"{API_BASE_URL}/users/{user_id}",
            json=payload,
            headers=auth_headers,
        )
        body = response.json()

        assert response.status_code == 200
        assert body["job"] == payload["job"]
        assert "updatedAt" in body

    @allure.story("删除用户")
    @allure.title("登录后删除用户 — 验证 204 状态码与空响应体")
    def test_delete_user_after_login(self, http, auth_headers):
        """登录后删除用户 | Delete user after login"""
        user_id = 2
        response = http("DELETE", f"{API_BASE_URL}/users/{user_id}", headers=auth_headers)

        assert response.status_code == 204
        assert response.text == ""
