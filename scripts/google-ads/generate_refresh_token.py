#!/usr/bin/env python3
"""One-time OAuth: open browser, write GOOGLE_ADS_REFRESH_TOKEN into .env.local.

Requires GOOGLE_ADS_CLIENT_ID + GOOGLE_ADS_CLIENT_SECRET already in .env.local
(OAuth Desktop client from Google Cloud).
"""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
ENV_LOCAL = ROOT / ".env.local"
SCOPE = "https://www.googleapis.com/auth/adwords"


def upsert_env(key: str, value: str) -> None:
    text = ENV_LOCAL.read_text() if ENV_LOCAL.exists() else ""
    pattern = re.compile(rf"^{re.escape(key)}=.*$", re.M)
    line = f"{key}={value}"
    if pattern.search(text):
        text = pattern.sub(line, text)
    else:
        if text and not text.endswith("\n"):
            text += "\n"
        text += f"\n# Google Ads API\n{line}\n"
    ENV_LOCAL.write_text(text)
    print(f"WROTE {key} → {ENV_LOCAL}")


def main() -> None:
    load_dotenv(ENV_LOCAL)
    load_dotenv(ROOT / ".env")

    client_id = (os.getenv("GOOGLE_ADS_CLIENT_ID") or "").strip()
    client_secret = (os.getenv("GOOGLE_ADS_CLIENT_SECRET") or "").strip()
    if not client_id or not client_secret:
        print(
            "MISSING_ENV:GOOGLE_ADS_CLIENT_ID,GOOGLE_ADS_CLIENT_SECRET\n"
            "Put OAuth Desktop Client ID/Secret into .env.local first.",
            file=sys.stderr,
        )
        sys.exit(2)

    from google_auth_oauthlib.flow import InstalledAppFlow

    flow = InstalledAppFlow.from_client_config(
        {
            "installed": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": ["http://localhost"],
            }
        },
        scopes=[SCOPE],
    )
    print("Opening browser for Google Ads OAuth…")
    creds = flow.run_local_server(port=0, prompt="consent")
    if not creds.refresh_token:
        print("NO_REFRESH_TOKEN — revoke app access and retry with prompt=consent", file=sys.stderr)
        sys.exit(1)

    upsert_env("GOOGLE_ADS_REFRESH_TOKEN", creds.refresh_token)
    print("OK — refresh token saved. Next: python check_connection.py")


if __name__ == "__main__":
    main()
