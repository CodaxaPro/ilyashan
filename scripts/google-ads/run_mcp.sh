#!/usr/bin/env bash
# Cursor MCP launcher: load .env.local → sync yaml → run official google-ads-mcp (read-only).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SCRIPTS="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPTS"

if [[ -f "$ROOT/.env.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env.local"
  set +a
fi

if [[ -z "${GOOGLE_ADS_DEVELOPER_TOKEN:-}" || -z "${GOOGLE_ADS_PROJECT_ID:-}" ]]; then
  echo "MISSING_ENV: need GOOGLE_ADS_DEVELOPER_TOKEN + GOOGLE_ADS_PROJECT_ID in .env.local" >&2
  exit 2
fi

if [[ -x "$SCRIPTS/.venv/bin/python" ]]; then
  "$SCRIPTS/.venv/bin/python" "$SCRIPTS/sync_yaml_from_env.py"
else
  python3 "$SCRIPTS/sync_yaml_from_env.py"
fi

export GOOGLE_PROJECT_ID="${GOOGLE_ADS_PROJECT_ID}"
export GOOGLE_ADS_DEVELOPER_TOKEN
if [[ -n "${GOOGLE_ADS_LOGIN_CUSTOMER_ID:-}" ]]; then
  export GOOGLE_ADS_LOGIN_CUSTOMER_ID="${GOOGLE_ADS_LOGIN_CUSTOMER_ID//-/}"
fi

# google-ads-mcp loads google-ads.yaml from CWD when using Python client method
exec pipx run --spec git+https://github.com/googleads/google-ads-mcp.git google-ads-mcp
