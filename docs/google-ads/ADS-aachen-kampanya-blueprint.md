# Aachen Grubu — kampanya blueprint (pilot şablon)

Bu dosya **kopyalanarak** diğer şehirlere uygulanır. Aachen grubu: Baesweiler + Würselen + Alsdorf + Übach-Palenberg + Aachen(+Stadtteile).

---

## 0. Hesap ayarları (tüm Aachen grubu)

| Ayar | Değer |
|------|-------|
| Network | **Google Search yalnızca** — ortak siteler yok |
| Search Partners | **OFF (kalıcı / asla açma)** |
| Display / PMax / Demand Gen | **YASAK** — bkz. `ADS-google-search-only.md` |
| Konum | Presence only (interest kapalı) |
| Dil | Deutsch |
| Dönüşüm penceresi | 7 gün tıklama / 1 gün görüntüleme (lead) |
| Müşteri edinme | Yeni müşteri (mevcut liste exclusion opsiyonel) |

---

## 1. Kampanya portföyü (Wave 1)

| Kampanya | Geo hedef | Günlük bütçe (başlangıç) | Intent | Final URL kökü |
|----------|-----------|--------------------------|--------|----------------|
| `IL-AAC-CORE-SEARCH` | Aachen + Stadtteile | 15 € | CORE | `/de/fensterreinigung-aachen` |
| `IL-AAC-PRICE-SEARCH` | Aachen | 8 € | PRICE | `/de/fensterreinigung-preis-aachen` *veya* kosten LP |
| `IL-BAE-CORE-SEARCH` | Baesweiler | 10 € | CORE | `/de/fensterreinigung-baesweiler` |
| `IL-WUR-CORE-SEARCH` | Würselen | 8 € | CORE | `/de/fensterreinigung-wurselen` |
| `IL-ALS-CORE-SEARCH` | Alsdorf | 8 € | CORE | `/de/fensterreinigung-alsdorf` |
| `IL-UBP-CORE-SEARCH` | Übach-Palenberg | 6 € | CORE | LP 200 sonrası |
| `IL-BRAND-SEARCH` | Aachen bölgesi | 3 € | BRAND | `/de` |

**Toplam pilot tavan:** ~58 €/gün → ilk 14 günde performansa göre kırp.

Bütçe dağılım mantığı: **Aachen CORE %35**, Stammgebiet CORE %45, PRICE %15, BRAND %5.

---

## 2. `IL-AAC-CORE-SEARCH` — detay

### Konum

- Aachen (şehir)
- Opsiyonel radius: Aachen merkezi 12 km (Stadtteile kapsama)
- Exclusion: Maastricht / Kerkrade / Heerlen (sızıntı varsa)

### Ad groups

#### AG-FENSTERREINIGUNG

| Match | Keyword |
|-------|---------|
| Exact | `[fensterreinigung aachen]` |
| Exact | `[fenster reinigung aachen]` |
| Exact | `[professionelle fensterreinigung aachen]` |
| Phrase | `"fensterreinigung aachen"` |
| Phrase | `"fensterreinigung in aachen"` |

**Final URL:** `https://ilyashan.de/de/fensterreinigung-aachen`

#### AG-FENSTERPUTZER

| Match | Keyword |
|-------|---------|
| Exact | `[fensterputzer aachen]` |
| Exact | `[fensterputzer in aachen]` |
| Phrase | `"fensterputzer aachen"` |

**Final URL:** `https://ilyashan.de/de/fensterputzer-aachen`

#### AG-GLASREINIGUNG

| Match | Keyword |
|-------|---------|
| Exact | `[glasreinigung aachen]` |
| Phrase | `"glasreinigung aachen"` |

**Final URL:** `https://ilyashan.de/de/glasreinigung-aachen` *(200 değilse CORE LP’ye düş)*

#### AG-STADTTEIL

| Match | Keyword |
|-------|---------|
| Exact | `[fensterreinigung laurensberg]` |
| Exact | `[fensterreinigung brand aachen]` |
| Exact | `[fensterreinigung haaren]` |
| Exact | `[fensterreinigung richterich]` |
| Exact | `[fensterreinigung eilendorf]` |
| Exact | `[fensterreinigung kornelimünster]` |
| Exact | `[fensterreinigung walheim]` |
| Exact | `[fensterputzer brand]` |
| Phrase | `"fensterreinigung forst aachen"` |

**Final URL:** hepsi `fensterreinigung-aachen` (Stadtteil özel LP yoksa hub).

### Teklif (Faz 1 — Manual CPC)

| Ad group | Max CPC başlangıç* | Not |
|----------|-------------------|-----|
| AG-FENSTERREINIGUNG | 1,20 € | Ulusal fensterreinigung ~0,91 €; local uplift +%20–40 |
| AG-FENSTERPUTZER | 1,00 € | Ulusal fensterputzer ~0,71 € |
| AG-GLASREINIGUNG | 1,80 € | Ulusal glasreinigung ~1,95 € — dikkatli |
| AG-STADTTEIL | 0,70 € | Long-tail, düşük rekabet |

\* **Gate-0:** Keyword Planner “Top of page bid (low–high)” ile override. Bu tablo ulusal + yerel uplift varsayımıdır.

### RSA — Pin kuralları

**Pin 1 (Headline):** `Fensterreinigung Aachen`  
**Pin 2:** `Kein Anfahrtszuschlag`  
**Pin 3 (opsiyonel):** `Festpreis in 24 Std.`

Diğer başlık havuzu: [ADS-rsa-ad-copy-bank.md](./ADS-rsa-ad-copy-bank.md)

---

## 3. `IL-AAC-PRICE-SEARCH`

Yüksek niyet, biraz daha yüksek CPC — ayrı kampanya ki CORE’u bozmasın.

| Keyword | Match | Final URL tercihi |
|---------|-------|-------------------|
| `[fensterreinigung preis aachen]` | Exact | preis LP veya CORE |
| `[fensterreinigung kosten aachen]` | Exact | kosten LP |
| `[was kostet fensterreinigung aachen]` | Phrase | kosten / FAQ LP |
| `[fensterputzer preise aachen]` | Exact | preis LP |

**Max CPC başlangıç:** 1,40–1,90 € (ulusal “fensterreinigung preise” ~1,59 €)

**Mesaj:** “Live-Preisschätzung · ab 49 € · Festpreis in 24h”

---

## 4. Stammgebiet kampanyaları (BAE / WUR / ALS / UBP)

Aachen şablonunun kopyası; şehir adı ve Final URL değişir.

| Kampanya | Pin 1 Headline | Final URL |
|----------|----------------|-----------|
| BAE | `Fensterreinigung Baesweiler` | `/de/fensterreinigung-baesweiler` |
| WUR | `Fensterreinigung Würselen` | `/de/fensterreinigung-wurselen` |
| ALS | `Fensterreinigung Alsdorf` | `/de/fensterreinigung-alsdorf` |
| UBP | `Fensterreinigung Übach-Palenberg` | slug 200 sonrası |

**Baesweiler avantajı:** “Ansässig in Baesweiler · Kückstr. 29” — en yüksek QS potansiyeli; burada Impression Share agresif tutulabilir.

---

## 5. Extension seti (tüm kampanyalar)

| Tür | İçerik |
|-----|--------|
| Sitelink 1 | Preis berechnen → `/de/angebot` |
| Sitelink 2 | Leistungen → `/de` #leistungen veya services |
| Sitelink 3 | Bewertungen → `/de` reviews bölümü |
| Sitelink 4 | Gutschein → ilgili URL |
| Call | 0173 3828354 |
| Callout | Streifenfrei garantiert · Vollversichert · 4.9★ Google · 500+ Kunden |
| Snippet | Service: Privatfenster, Gewerbe, Solar, Rahmen & Falz, Wartungsvertrag |

---

## 6. Başarı KPI (Aachen grubu · ilk 30 gün)

| Metrik | Hedef | Alarm |
|--------|-------|-------|
| Search CTR (Exact) | ≥ 6 % | < 3 % → RSA/LP |
| Conv. rate (Landing→Submit) | ≥ 8 % | < 4 % → CRO |
| CPA (angebot_submit) | ≤ 28–35 € | > 50 € → kelime/negatif |
| QS (ana Exact) | ≥ 7 | < 5 → acil |
| Top IS (Exact geo) | ≥ 40 % | Rank kaybı → bid/QS |
| Geçersiz tıklama | < 10 % | IP / bot incele |

---

## 7. Diğer şehirlere kopyalama prosedürü

1. Bu dosyayı `ADS-{geo}-kampanya-blueprint.md` olarak çoğalt  
2. Şehir adı / slug / bütçe / mesafe cümlesi değiştir  
3. Playbook R1–R8  
4. Cross-check 12/12  
5. Sprint log  

**Aachen grubu stabil olmadan Wave 2 açma.**
