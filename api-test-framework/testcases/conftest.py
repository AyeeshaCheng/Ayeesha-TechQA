"""Pytest 全局配置 — fixtures、Allure 集成、HTTP 请求/响应追踪
Pytest global config — fixtures, Allure integration, HTTP request/response tracking.
"""

from __future__ import annotations

import json
from typing import Any, Callable, Dict, Optional

import allure
import pytest
import requests

API_BASE_URL = "https://reqres.in/api"
API_KEY = "free_user_3EGUTcDmWVdbGBVgNXvOzjqwC3o"
LOGIN_URL = f"{API_BASE_URL}/login"
LOGIN_PAYLOAD = {"email": "eve.holt@reqres.in", "password": "cityslicka"}


# ═══════════════════════════════════════════════════════════════
#  工具函数 | Utility helpers
# ═══════════════════════════════════════════════════════════════

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


def _pretty_json(data: Any) -> str:
    """将数据转为格式化 JSON 字符串，用于 Allure 附件。"""
    try:
        return json.dumps(data, indent=2, ensure_ascii=False)
    except (TypeError, ValueError):
        return str(data)


def _attach_http_to_allure(resp: requests.Response) -> None:
    """将一次 HTTP 请求/响应的关键信息附加到 Allure 报告。"""
    req = resp.request

    # ── 请求信息 ──────────────────────────────────
    req_info = {
        "method": req.method,
        "url": req.url,
        "headers": dict(req.headers),
    }
    try:
        req_body = json.loads(req.body) if req.body else {}
    except (json.JSONDecodeError, TypeError):
        req_body = str(req.body) if req.body else ""
    req_info["body"] = req_body

    allure.attach(
        _pretty_json(req_info),
        name="Request",
        attachment_type=allure.attachment_type.JSON,
    )

    # ── 响应信息 ──────────────────────────────────
    resp_info = {
        "status_code": resp.status_code,
        "headers": dict(resp.headers),
    }
    try:
        resp_body = resp.json()
    except (json.JSONDecodeError, ValueError):
        resp_body = _safe_text(resp)
    resp_info["body"] = resp_body

    allure.attach(
        _pretty_json(resp_info),
        name="Response",
        attachment_type=allure.attachment_type.JSON,
    )


# ═══════════════════════════════════════════════════════════════
#  Fixtures
# ═══════════════════════════════════════════════════════════════

@pytest.fixture
def http(request: pytest.FixtureRequest) -> Callable[..., requests.Response]:
    """
    发送 HTTP 请求，并在 Allure 报告中记录请求/响应。
    Sends HTTP request and records request/response in Allure report.

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
        with allure.step(f"{method} {url}"):
            # 在请求前附加请求体信息（如果可以序列化）
            req_body_for_report = kwargs.get("json") or kwargs.get("data")
            if req_body_for_report:
                allure.attach(
                    _pretty_json(req_body_for_report),
                    name="Request Body",
                    attachment_type=allure.attachment_type.JSON,
                )

            resp = requests.request(
                method=method,
                url=url,
                headers=headers,
                timeout=timeout,
                **kwargs,
            )

            # 附加完整的请求/响应用到 Allure
            _attach_http_to_allure(resp)

            # 挂到 item 上，供失败时打印
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


# ═══════════════════════════════════════════════════════════════
#  Allure 集成 — 失败时附加 HTTP dump
# ═══════════════════════════════════════════════════════════════

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item: pytest.Item, call: pytest.CallInfo):
    outcome = yield
    report = outcome.get_result()
    if report.when != "call" or report.passed:
        return

    resp = getattr(item, "_last_response", None)
    if resp is None:
        return

    # 终端控制台输出
    dump = _dump_response(resp)
    report.sections.append(("HTTP response dump", dump))

    # Allure 报告附件
    allure.attach(
        dump,
        name="HTTP Debug Dump (Failure)",
        attachment_type=allure.attachment_type.TEXT,
    )
