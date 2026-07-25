#!/usr/bin/env python3
"""Write scripts/google-ads/google-ads.yaml from .env.local (gitignored).

Used by Cursor MCP (read-only google-ads-mcp) and optional YAML-based clients.
"""

from __future__ import annotations

import os
from pathlib import Path

from _env import digits, load_ads_env, require_env

OUT = Path(__file__).resolve().parent / "google-ads.yaml"


def main() -> None:
    load_ads_env()
    require_env(
        "GOOGLE_ADS_DEVELOPER_TOKEN",
        "GOOGLE_ADS_CLIENT_ID",
        "GOOGLE_ADS_CLIENT_SECRET",
        "GOOGLE_ADS_REFRESH_TOKEN",
    )

    login = (os.getenv("GOOGLE_ADS_LOGIN_CUSTOMER_ID") or "").strip()
    login_line = f"login_customer_id: {digits(login)}\n" if login else ""

    content = f"""# Auto-generated from .env.local — do not commit
developer_token: {os.environ['GOOGLE_ADS_DEVELOPER_TOKEN'].strip()}
client_id: {os.environ['GOOGLE_ADS_CLIENT_ID'].strip()}
client_secret: {os.environ['GOOGLE_ADS_CLIENT_SECRET'].strip()}
refresh_token: {os.environ['GOOGLE_ADS_REFRESH_TOKEN'].strip()}
use_proto_plus: True
{login_line}"""
    OUT.write_text(content)
    print(f"WROTE {OUT}")


if __name__ == "__main__":
    main()
