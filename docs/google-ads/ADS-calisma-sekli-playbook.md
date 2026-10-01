# ADS çalışma şekli — sıfır-hata playbook

**Amaç:** Her şehir / her kampanya / her landing page aynı disiplinle çıkar. Regresyon yok, “hepsini bir kampanyaya koy” yok.

---

## 1. Uzmanlık rolleri (zorunlu sıra)

| # | Rol | Çıktı | Gate |
|---|-----|-------|------|
| R1 | Account Architect | Kampanya isimleri, bütçe, network ayarları | Yapı onayı |
| R2 | Keyword Analyst | Exact/Phrase set + negatifler + Planner export | Kelime onayı |
| R3 | Competitive Intel | SERP 1. sayfa + LSA + portal (MyHammer) notu | Rakip notu |
| R4 | Bid Strategist | Teklif merdiveni + max CPC / tCPA | Teklif onayı |
| R5 | Landing / CRO | Final URL 200 + H1 ↔ keyword uyumu + CTA | LP onayı |
| R6 | Creative (RSA) | 15 başlık / 4 açıklama + pin kuralları | Reklam onayı |
| R7 | Tracking | UTM + conversion + call | Ölçüm onayı |
| R8 | QA Gatekeeper | Cross-check protokolü geçildi | **GO / NO-GO** |

Cursor oturumunda: her rol için checklist satırları işaretlenmeden sonraki role geçilmez.

---

## 2. Kampanya anatomisi (tek model)

```
Campaign = GEO_CLUSTER × INTENT × NETWORK
Ad Group = KEYWORD_THEME (tek niyet)
Keywords = Exact + Phrase (Broad yalnızca kontrollü deney)
Ads     = 1 RSA (A/B sonra)
Final URL = şehir/intent LP (asla genel DE anasayfa — istisna: brand)
CTA deep = /de/angebot + UTM
```

### Intent sınıfları

| Intent kodu | Arama sinyali | Final URL tipi | Teklif önceliği |
|-------------|---------------|----------------|-----------------|
| `CORE` | fensterreinigung / fensterputzer + şehir | `/fensterreinigung-{slug}` | Yüksek |
| `PRICE` | preis / kosten + şehir | `/fensterreinigung-preis-{slug}` veya `-kosten-` | Yüksek |
| `SERVICE` | solar / glasfassade / wartungsvertrag | hizmet LP | Orta |
| `BRAND` | ilyashan | `/de` | Düşük bütçe koruma |
| `COMP` | rakip marka | genelde **yok** (ROI düşük) | Kapalı |

### Wave 1 intent kilidi (2026-07-24 — üst düzey QS)

**Açık (Presence sonrası enable):**
- CORE AG: `FENSTERREINIGUNG` + `FENSTERPUTZER` (+ `GLASREINIGUNG` yalnız LP 200)
- Semt/Ortsteil AG → şehir CORE LP
- PRICE (BAE + AAC) · BRAND

**Ads kapalı (site/SEO’da kalabilir):** Wintergarten, Solar, Rahmen, Fassade, Schaufenster, Firma, DIY `fenster putzen`, Gebäudereinigung.

**Kampanya negatif (CORE/PRICE):** `wintergarten`, `solar`, `solaranlage`, `fassade`, `schaufenster`, `rahmen`, `falz`, `anleitung`, `putzen selber`, `diy` (+ mevcut job/auto/kostenlos).

SERVICE kampanyası = Wave 2+ ve yalnızca Planner + LP 200 + ayrı bütçe ile.

### İsimlendirme (zorunlu)

```
IL-{GEO}-{INTENT}-SEARCH
```

Örnekler:

- `IL-AAC-CORE-SEARCH`
- `IL-AAC-PRICE-SEARCH`
- `IL-BAE-CORE-SEARCH`
- `IL-WUR-CORE-SEARCH`

Ad group:

```
AG-{THEME}
```

Örnek: `AG-FENSTERREINIGUNG`, `AG-FENSTERPUTZER`, `AG-PREIS`

---

## 3. Yeni şehir kampanyası — sprint checklist

Şehir: `____________` · Slug: `____________` · Wave: `____`

### A. Önkoşul (NO-GO engelleri)

- [ ] Geo master map’te şehir listeli
- [ ] LP URL canlı: `https://ilyashan.de/de/fensterreinigung-{slug}` → **200**
- [ ] Synonym LP varsa doğrula (`fensterputzer-{slug}` vb.)
- [ ] Keyword Planner export (şehir + 15 km) dosyaya eklendi
- [ ] Rakip SERP ekran görüntüsü / not (en az 5 sonuç)

### B. Yapı

- [ ] Kampanya türü: **Search only** (PMax / Display / Demand Gen **YASAK**)
- [ ] Ağlar: Google Arama **AÇIK** · **Arama ortakları (Search Partners) KAPALI**
- [ ] Onay: [ADS-google-search-only.md](./ADS-google-search-only.md) okundu
- [ ] Location = şehir + semtler (**Presence only** — interest kapalı)
- [ ] Hariç: NL/BE sınır taşmaları (gerekirse PLZ exclusion)
- [ ] Ad schedule: Pzt–Cum 07–20, Cmt 08–14 (çağrı kapasitesine göre)
- [ ] Budget: Wave 1 şehirleri için başlangıç **8–15 €/gün** (Aachen üst bant)

### C. Kelime & teklif

- [ ] Exact set (matris şablonundan)
- [ ] Phrase set
- [ ] Shared negative list bağla: `NEG-IL-GLOBAL`
- [ ] Max CPC tavanı matristen (Planner ile override)
- [ ] Bid stratejisi: **Manual CPC** (ilk 14 gün) veya Maximize Clicks **yalnızca** tracking yoksa — tercih Manual

### D. Reklam & LP

- [ ] RSA: şehir adı H1/Pin 1’de
- [ ] Fiyat sinyali: “ab 49 €” veya “Festpreis in 24h”
- [ ] USP: “Kein Anfahrtszuschlag” + “4.9★”
- [ ] Final URL = şehir LP
- [ ] Sitellinks: Angebot, Leistungen, Bewertungen, Gutschein
- [ ] Callout / structured snippets

### E. Tracking

- [ ] UTM zorunlu parametreler (aşağıda)
- [ ] Conversion smoke test (test submit + Ads’te görünüm)

### F. QA Gatekeeper

- [ ] [ADS-cross-check-protocol.md](./ADS-cross-check-protocol.md) 12/12 yeşil
- [ ] Sprint log’a satır ekle
- [ ] Yayına al

---

## 4. UTM standardı (tek format)

```
https://ilyashan.de/de/angebot
  ?utm_source=google
  &utm_medium=cpc
  &utm_campaign=IL-{GEO}-{INTENT}-SEARCH
  &utm_content={adgroup}
  &utm_term={keyword}
```

Landing page Final URL’de de aynı `utm_campaign` taşınır (GA4 path analizi için).

---

## 5. Teklif merdiveni (kanıtlanmış sıra)

| Faz | Süre / koşul | Strateji | Amaç |
|-----|--------------|----------|------|
| 0 | Yayın öncesi | Keyword Planner bid range | Tavan belirle |
| 1 | Gün 1–14 | Manual CPC + Top of page bid estimate × 0.85–1.0 | Kontrol + QS öğrenme |
| 2 | ≥ 15 conv / 30 gün **kampanya başına** | Maximize Conversions (hedef yok) | Hacim |
| 3 | Stabilize CPA 14 gün | Target CPA = son 30g medyan CPA × 0.95 | Verim |
| 4 | Impression Share kaybı (rank) > %20 | tCPA’yı %10 yükselt VEYA QS iyileştir | Üst sıra |

**Yasak:** Veri yokken Target Impression Share / agresif Target ROAS.

**Üst sıra ucuza:** Quality Score 8–10 + Exact geo+hizmet + Presence targeting. Bu, yüksek max CPC’den daha ucuz pozisyon verir.

---

## 6. Haftalık operasyon ritmi

| Gün | İş |
|-----|-----|
| Pazartesi | Search Terms → negatif; QS audit |
| Çarşamba | Location / device / hour breakout |
| Cuma | CPA / Conv rate / LP bounce; RSA asset report |
| Ay sonu | Wave ilerleme; zayıf şehir pause; güçlü şehir scale |

---

## 7. Shared Negative List — `NEG-IL-GLOBAL` (çekirdek)

```
gratis, kostenlos, diy, selber, anleitung, job, stelle, gehalt, ausbildung,
lehrling, youtube, forum, pdf, unger, teleskop, gerät, kaufen, amazon,
reinigungsmittel, chemie, belgien, nederland, maastricht, kerkrade,
putzfrau, putzhilfe stunde (gerekirse ayrı liste)
```

Şehir bazlı ek negatifler playbook’ta kampanya notuna yazılır.

---

## 8. Landing page uzman checklist (her LP)

- [ ] Title / H1 şehir + hizmet
- [ ] “Kein Anfahrtszuschlag” + mesafe / adres
- [ ] Fiyat sinyali (ab 49 € / 24h Festpreis)
- [ ] Birincil CTA → Angebot
- [ ] Telefon tıklanabilir
- [ ] Social proof (4.9★ / 500+)
- [ ] FAQ şehir adıyla
- [ ] Mobil LCP kabul edilebilir
- [ ] Reklam vaadi LP’de birebir karşılanıyor (Policy / QS)

---

## 9. Cursor oturum komutu (kopyala)

```
Ilyashan Google Ads sprint: {ŞEHİR}
Playbook: docs/google-ads/ADS-calisma-sekli-playbook.md
Blueprint: ADS-aachen-kampanya-blueprint.md (şablon)
Rolleri R1→R8 sırayla uygula; Gate NO-GO varsa dur.
Çıktı: kampanya yapısı + kelime seti + RSA + Final URL + teklif + sprint-log satırı.
```
