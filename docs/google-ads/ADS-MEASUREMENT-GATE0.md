# Gate-0 ölçüm — form / WhatsApp / telefon

**Amaç:** Ads’te “kaç tık → kaç lead?” sorusuna cevap. WhatsApp Ads’e yazılmazsa **0 görünür**.

Tag ID (site): `AW-18191480247`  
Hesap: `626-050-2839`

**Ads paneli (doğrudan):** [Dönüşümler](https://ads.google.com/aw/conversions)

### Canlı etiketler (2026-08-05)

| Aksiyon | send_to | Not |
|---------|---------|-----|
| `request_quote` (birincil, Event) | `AW-18191480247/5p7uCKbC2tUcELfrr-JD` | Ads’te adı `request_quote (1)` — birincil |
| `whatsapp_click` | event adı ile (send_to opsiyonel) | Site `gtag('event','whatsapp_click')` yolluyor. Ads’te Event aksiyonu oluştur; **ikincil**. Eski Kişi send_to kaldırıldı. |
| `phone_click` | şimdilik yok | Bilinçli ertelendi |

Eski `request_quote` (WEBPAGE_CODELESS, id `7679301761`) → **duraklat**. Birincil yalnız Event `request_quote (1)`.

**API engeli:** `.env.local` içinde `GOOGLE_ADS_DEVELOPER_TOKEN` + `GOOGLE_ADS_REFRESH_TOKEN` boş → conversion create/pause API ile yapılamıyor. Script hazır: `scripts/google-ads/setup_measurement_whatsapp.py`.

---

## Durum (kod tarafı)

| Olay | Site tetikleyici | Ads’e giden event |
|------|------------------|-------------------|
| Teklif formu / Angebot gönder / Concierge lead | `trackRequestQuoteConversion` | `request_quote` (+ `send_to` varsa) |
| Tüm `tel:` linkleri (Header, Footer, Angebot, Termin, Contact…) | global click bridge | `phone_click` |
| Tüm `wa.me` / WhatsApp (floating + form) | global click bridge | `whatsapp_click` |
| Call asset (arama uzantısı) | Google Ads arama | ≥60 sn arama dönüşümü (panel) |

CSP: `googletagmanager` + `googleadservices` + `doubleclick` connect izinli.  
gtag: cookie **Akzeptieren** sonrası yüklenir (`GoogleAdsTag`).

Hesapta şu an yalnızca eski `request_quote` (**WEBPAGE_CODELESS**) var — Event snippet / WhatsApp / phone **yok**. Bu yüzden geçmişte 0 Ads dönüşümü normal.

---

## 1) Google Ads’te 3 Event dönüşümü (zorunlu — API token yokken panel)

**Araçlar → Ölçüm → Dönüşümler → + Yeni → Web sitesi**

| Aksiyon adı | Tür | Event adı | Sayım | Birincil? |
|-------------|-----|-----------|-------|-----------|
| `request_quote` | Event (Google etiketi) | `request_quote` | Bir tıklamada bir | **Evet** |
| `whatsapp_click` | Event | `whatsapp_click` | Her tıklama | Hayır (gözlem) |
| `phone_click` | Event | `phone_click` | Her tıklama | Hayır |

Ayrıca: **Arama dönüşümleri** → bildirme Açık · ≥ **60 sn**.

Event adı siteyle **birebir** aynı olmalı — site zaten `gtag('event', 'request_quote'|…)` yolluyor.  
İsteğe bağlı ama önerilen: her aksiyonda **Etiket → send_to** kopyala → env.

API token doluysa: `python scripts/google-ads/create_conversion_actions.py`

---

## 2) `.env.local` / Vercel

```bash
NEXT_PUBLIC_GOOGLE_ADS_REQUEST_QUOTE_SEND_TO=AW-18191480247/XXXX
NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_SEND_TO=AW-18191480247/YYYY
NEXT_PUBLIC_GOOGLE_ADS_PHONE_SEND_TO=AW-18191480247/ZZZZ
```

Deploy şart (`NEXT_PUBLIC_*`). Event-adı eşleşmesiyle send_to olmadan da sayılabilir; send_to klasik snippet için önerilir.

---

## 3) Smoke test

1. Incognito → **Akzeptieren** (cookie)  
2. `/de/angebot` form gönder → Tag Assistant / Ads Dönüşümler: `request_quote`  
3. Floating WA → `whatsapp_click`  
4. Header telefon → `phone_click`  
5. Admin first-party analytics’te aynı olaylar (consent sonrası)

**Fail:** cookie reddedilirse gtag yüklenmez (GDPR). Ads’te Event aksiyonları yoksa site event yollar ama Ads **0** gösterir.

---

## 4) Rapor

- Birincil CPA → yalnız `request_quote`  
- Hacim → `whatsapp_click` / `phone_click` (ikincil; teklif ≠ sohbet açma)
