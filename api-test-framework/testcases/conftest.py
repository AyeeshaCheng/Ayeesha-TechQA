from __future__ import annotations

from typing import Any, Callable, Dict, Optional

import pytest
import requests

API_BASE_URL = "https://reqres.in/api"
API_KEY = "free_user_3EGUTcDmWVdbGBVgNXvOzjqwC3o"
LOGIN_URL = f"{API_BASE_URL}/login"
LOGIN_PAYLOAD = {"email": "eve.holt@reqres.in", "password": "cityslicka"}


def _safe_text(resp: requests.Response, limit: int = 4000) -> str:
    try:
        text = resp.text
    except Exception as e:  # pragma: no cover
        return f"<failed to read resp.text: {e!r}>"
    return text if len(text) <= limit else text[:limit] + "...<truncated>"


def _dump_response(resp: requests.Response) -> str:
    req = resp.request
    lines: list[str] = []
    lines.append("\n===== HTTP DEBUG DUMP =====")
    lines.append(f"request : {req.method} {req.url}")
    lines.append(f"req_hdr : {dict(req.headers)}")
    lines.append(f"req_body: {req.body!r}")
    lines.append(f"status  : {resp.status_code}")
    lines.append(f"resp_hdr: {dict(resp.headers)}")
    lines.append(f"body    : {_safe_text(resp)}")
    return "\n".join(lines)


@pytest.fixture
def http(request: pytest.FixtureRequest) -> Callable[..., requests.Response]:
    """
    用法 | Usage:
      resp = http("POST", url, json=payload, headers=headers)

    失败时会在用例报告里打印请求/响应 | On failure, prints request/response dump.
    """

    def _request(
        method: str,
        url: str,
        *,
        timeout: float = 30,
        headers: Optional[Dict[str, str]] = None,
        **kwargs: Any,
    ) -> requests.Response:
        resp = requests.request(
            method=method,
            url=url,
            headers=headers,
            timeout=timeout,
            **kwargs,
        )
        # 挂到 item 上，供失败时打印 | Attach to item for failure dump
        setattr(request.node, "_last_response", resp)
        return resp

    return _request


@pytest.fixture
def api_base_url() -> str:
    """API 根地址 | API base URL"""
    return API_BASE_URL


@pytest.fixture
def api_headers() -> Dict[str, str]:
    """公共请求头（含 x-api-key）| Common headers with API key"""
    return {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
    }


@pytest.fixture
def auth_token(http: Callable[..., requests.Response], api_headers: Dict[str, str]) -> str:
    """登录并返回 token | Login and return token"""
    resp = http("POST", LOGIN_URL, json=LOGIN_PAYLOAD, headers=api_headers)
    assert resp.status_code == 200, "login failed before business tests"
    token = resp.json().get("token")
    assert token, "token missing in login response"
    return token


@pytest.fixture
def auth_headers(api_headers: Dict[str, str], auth_token: str) -> Dict[str, str]:
    """登录后的鉴权请求头 | Authenticated headers after login"""
    return {**api_headers, "Authorization": f"Bearer {auth_token}"}


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item: pytest.Item, call: pytest.CallInfo):
    outcome = yield
    report = outcome.get_result()
    if report.when != "call" or report.passed:
        return

    resp = getattr(item, "_last_response", None)
    if resp is None:
        return

    report.sections.append(("HTTP response dump", _dump_response(resp)))

