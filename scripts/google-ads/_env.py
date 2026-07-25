"""Shared env loading for Ilyashan Google Ads scripts."""

from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS_DIR = Path(__file__).resolve().parent


def load_ads_env() -> Path:
    load_dotenv(ROOT / ".env.local")
    load_dotenv(ROOT / ".env")
    return ROOT


def require_env(*keys: str) -> None:
    missing = [k for k in keys if not (os.getenv(k) or "").strip()]
    if missing:
        print("MISSING_ENV:" + ",".join(missing), file=sys.stderr)
        print(
            "Fill .env.local — see docs/google-ads/ADS-BAGLANTI-KONTROL.md",
            file=sys.stderr,
        )
        sys.exit(2)


def digits(value: str) -> str:
    return value.replace("-", "").strip()


def client_config_from_env() -> dict:
    require_env(
        "GOOGLE_ADS_DEVELOPER_TOKEN",
        "GOOGLE_ADS_CLIENT_ID",
        "GOOGLE_ADS_CLIENT_SECRET",
        "GOOGLE_ADS_REFRESH_TOKEN",
        "GOOGLE_ADS_CUSTOMER_ID",
    )
    config = {
        "developer_token": os.environ["GOOGLE_ADS_DEVELOPER_TOKEN"].strip(),
        "client_id": os.environ["GOOGLE_ADS_CLIENT_ID"].strip(),
        "client_secret": os.environ["GOOGLE_ADS_CLIENT_SECRET"].strip(),
        "refresh_token": os.environ["GOOGLE_ADS_REFRESH_TOKEN"].strip(),
        "use_proto_plus": True,
    }
    login = (os.getenv("GOOGLE_ADS_LOGIN_CUSTOMER_ID") or "").strip()
    if login:
        config["login_customer_id"] = digits(login)
    return config


def customer_id() -> str:
    require_env("GOOGLE_ADS_CUSTOMER_ID")
    return digits(os.environ["GOOGLE_ADS_CUSTOMER_ID"])
