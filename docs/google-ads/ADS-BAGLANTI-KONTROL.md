# Google Ads bağlantı + kontrol — Ilyashan

**Durum (2026-07-24):** Yerel toolkit kuruldu (venv + scriptler + Cursor MCP launcher).  
Hesaba bağlanmak için yalnızca `.env.local` kimlikleri eksik.

**Kontrol modeli:** Agent kurulum/işleri yapar; sizden yalnızca **`okey`** (veya `uygula`) yeter.

---

## 1. Ne kuruldu (bu makinede)

| Bileşen | Rol |
|---------|-----|
| `scripts/google-ads/.venv` | `google-ads` Python client |
| `list_campaigns.py` / `pause_all_campaigns.py` | Envanter + pause (yazma) |
| `generate_refresh_token.py` | OAuth → refresh token → `.env.local` |
| `check_connection.py` | Bağlantı doğrulama |
| `run_mcp.sh` + `.cursor/mcp.json` | Resmi **google-ads-mcp** (salt okuma) |

Resmi MCP = rapor / GAQL. Pause / kampanya kurma = bu repo scriptleri.

---

## 2. Sizin tek seferlik panel işi (ben yapamam)

Google hesabınızda bir kez:

### A. Developer token
Google Ads → Araçlar → **API Center** → Developer token kopyala  
(Mümkünse Basic/Standard; Test-only production’a yetmez)

### B. Google Cloud
1. Proje oluştur → Project ID not et  
2. **Google Ads API** enable  
3. OAuth 2.0 Client → **Desktop app** → Client ID + Secret

### C. Hesap ID
- Ilyashan Customer ID (`123-456-7890` → API: `1234567890`)  
- MCC varsa Login customer ID ayrıca

### D. `.env.local` (repo kökü — commit etme)

```bash
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_CUSTOMER_ID=          # tire yok
GOOGLE_ADS_LOGIN_CUSTOMER_ID=    # MCC varsa
GOOGLE_ADS_PROJECT_ID=
# GOOGLE_ADS_REFRESH_TOKEN → script üretir
```

Sonra terminalde (veya chat’te **okey** deyin, agent çalıştırır):

```bash
cd scripts/google-ads
source .venv/bin/activate
python generate_refresh_token.py   # tarayıcı açılır, Google izin
python check_connection.py
```

---

## 3. Sizden beklenen komut

Kimlikler `.env.local`’de + refresh token hazırsa chat’e yazın:

> **okey**

veya kısaca: `hazır` / `bağlan`

Agent sırası (otomatik):

1. `check_connection.py`  
2. `list_campaigns.py` → envanter  
3. `pause_all_campaigns.py` (dry-run)  
4. Pause uygulamak için **ikinci okey** → `--apply`  
5. Wave 1 build → ayrı okey  

İlk mutate her zaman dry-run; production pause/build yalnızca **okey** sonrası.

---

## 4. Güvenlik

- Credential chat’e yapıştırma → `.env.local`  
- `.env*` gitignore’da  
- `google-ads.yaml` auto-generate, commit yok  

---

## 5. Hızlı komutlar

```bash
cd scripts/google-ads && source .venv/bin/activate
python check_connection.py
python list_campaigns.py
python pause_all_campaigns.py          # dry-run
python pause_all_campaigns.py --apply  # yalnız okey sonrası
```

MCP: Cursor reload sonrası `google-ads-mcp` görünür (`.env.local` dolu olmalı).
