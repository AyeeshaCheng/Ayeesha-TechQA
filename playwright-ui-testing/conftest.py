import json
from pathlib import Path

import pytest

from config.settings import BASE_URL


@pytest.fixture(scope="session")
def base_url() -> str:
    return BASE_URL


@pytest.fixture(scope="session")
def login_users() -> dict:
    data_file = Path(__file__).parent / "data" / "login_users.json"
    with data_file.open(encoding="utf-8") as f:
        return json.load(f)
