# Ads Editor — şehir konum (eklenti alternatifi)

Supermetrics şehir yazamıyor. Resmi `google-ads-mcp` **salt okuma** ve şu an bağlı değil (developer token boş). Yazabilen community MCP’ler de **aynı Ads API token** ister — yeni eklenti bu engeli aşmaz.

**Çalışan yol (API token olmadan):** Google Ads Editor + hazır CSV.

## Dosya

[`ADS-EDITOR-locations-wave1.csv`](./ADS-EDITOR-locations-wave1.csv)

- Almanya’yı kaldırır  
- Baesweiler / Aachen / Würselen / Alsdorf ekler  

## Adımlar (~3 dk)

1. [Google Ads Editor](https://ads.google.com/home/tools/ads-editor/) indir / aç  
2. Hesap `626-050-2839` → **Download**  
3. **Account → Import → From file** → CSV’yi seç  
4. Sarı “Unresolved location” varsa listeden doğru şehri seç (DE)  
5. Her kampanya: **Settings → Locations → Location options → Presence: People in…**  
6. **Post** (gönder) — kampanyalar PAUSED kalsın  

Sonra chat: `presence okey` → enable.

## API yolu (tercih, tekrar kullanılabilir)

`.env.local` doldur → `scripts/google-ads/set_geo_presence.py --apply`
