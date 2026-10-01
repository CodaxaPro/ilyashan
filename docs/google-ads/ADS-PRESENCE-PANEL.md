# Presence geo — durum (otomasyon)

**Kısa:** Ben yapmaya çalıştım. Supermetrics **şehir yazamıyor** (yalnızca ülke `DE`). Native Google Ads API script hazır (`scripts/google-ads/set_geo_presence.py`) ama `.env.local` içinde **developer token + refresh token boş**.

Kampanyalar **PAUSED** — harcama yok. BAE konum denemesinden sonra `DE` geri kondu (güvenlik).

---

## Araştırma sonucu

| Yol | Sonuç |
|-----|--------|
| Supermetrics `targeting.locations: ["Baesweiler"]` | Şehir yok sayılıyor / konum silinebiliyor |
| Supermetrics `locations: ["DE"]` | Çalışıyor (ülke) |
| Supermetrics `targeting_search` type=location | AW’de desteklenmiyor |
| Native Ads API (şehir + PRESENCE) | **Doğru yol** — script yazıldı |
| Script çalıştırma | `GOOGLE_ADS_DEVELOPER_TOKEN` + `GOOGLE_ADS_REFRESH_TOKEN` eksik |

Script (dry-run → `--apply`):

```bash
cd scripts/google-ads
source .venv/bin/activate
python set_geo_presence.py          # dry-run
python set_geo_presence.py --apply  # şehir + Presence
```

Harita: BAE/Baesweiler · AAC/Aachen · WUR/Würselen · ALS/Alsdorf · BRAND/Baesweiler+Aachen

---

## Sistemi ilerletmek için tek eksik (credential)

1. **Developer token** — Google Ads MCC → Tools → API Center → token’ı `.env.local` → `GOOGLE_ADS_DEVELOPER_TOKEN=`
2. **Refresh token** — bir kez:
   ```bash
   cd scripts/google-ads && source .venv/bin/activate
   python generate_refresh_token.py
   ```
   (Tarayıcı açılır, Google izin)

Sonra bana **token okey** de — `set_geo_presence.py --apply` çalıştırırım. Panelde tek tek şehir seçmene gerek kalmaz.

---

## Alternatif (token yoksa)

1. **Ads Editor CSV** (önerilen, eklenti gerekmez): [ADS-EDITOR-GEO-IMPORT.md](./ADS-EDITOR-GEO-IMPORT.md) + [ADS-EDITOR-locations-wave1.csv](./ADS-EDITOR-locations-wave1.csv)  
2. Ads UI’da tek tek konum (aynı etki)

Token yolu tercih — bir kez kurulur, tekrarlanır.
