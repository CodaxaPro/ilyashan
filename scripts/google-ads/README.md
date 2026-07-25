# Google Ads control scripts — Ilyashan

Yazma kontrolü + bağlantı doğrulama. Docs: `docs/google-ads/ADS-BAGLANTI-KONTROL.md`

## Setup (bir kez)

```bash
cd scripts/google-ads
# Python 3.11–3.13 (3.14: grpcio yok)
python3.12 -m venv .venv
source .venv/bin/activate
pip install --prefer-binary -r requirements.txt
```

`.env.local` (repo root) — commit etme. Ardından:

```bash
python generate_refresh_token.py  # tarayıcı OAuth
python check_connection.py
```

## Commands

```bash
python check_connection.py
python list_campaigns.py
python pause_all_campaigns.py          # dry-run
python pause_all_campaigns.py --apply  # yalnız kullanıcı okey sonrası
python set_geo_presence.py             # dry-run: şehir geo resolve
python set_geo_presence.py --apply     # şehir + Presence (token şart)
python sync_yaml_from_env.py           # MCP için yaml
```

## Agent politikası

1. Credential yoksa → `MISSING_ENV` raporla  
2. İlk mutate → dry-run  
3. `--apply` / Wave 1 build → kullanıcı **okey**  
4. Chat’e token yapıştırma  

## Cursor MCP (salt okuma)

`.cursor/mcp.json` → `run_mcp.sh` (resmi google-ads-mcp).  
Pause/kurulum için bu scriptler kullanılır; MCP yazmaz.
