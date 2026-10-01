# Landing page — “Neredeyim?” kurumsal standardı

**Kanıt temeli (2026 yerel hizmet / contractor LP araştırması):**  
Ziyaretçi 5 saniyede şunu görmeli: *Hizmet + Şehir + Bizi kapsıyor musunuz + Ne yapmalıyım.*  
Şehir sinyali above-the-fold yoksa → bounce + QS Landing Page Experience düşer + CPC şişer.

Kaynak özeti: Bluegrid / Simply Digital / PipelineOn yerel LP kılavuzları — şehir H1, telefon above-fold, tek CTA, yerel trust.

---

## 1. 5 saniye testi (zorunlu geçiş)

Sayfa açılınca scroll **olmadan** görünür olmalı:

| # | Element | Örnek (Aachen) |
|---|---------|----------------|
| 1 | H1 = hizmet + şehir | `Fensterreinigung Aachen — klar, fair, streifenfrei.` |
| 2 | Konum rozeti | `Aachen · ca. 15 Min. von Aachen-Mitte` |
| 3 | Adres / HQ | `Kückstr. 29, 52499 Baesweiler` |
| 4 | Trust | `4.9★ Google · 500+ Kunden · Kein Anfahrtszuschlag` |
| 5 | Birincil CTA | `Preis jetzt berechnen` → `/de/angebot` |
| 6 | Telefon | `0173 3828354` (click-to-call) |

**Fail:** Genel “Willkommen bei Ilyashan” H1, şehir yok, yalnızca logo.

---

## 2. Mesaj eşleşmesi (Ads ↔ LP ↔ SEO)

| Katman | Kural |
|--------|-------|
| Arama | `fensterreinigung aachen` |
| RSA Pin 1 | `Fensterreinigung Aachen` |
| Title (SEO) | `Fensterreinigung Aachen \| …` (zaten canlı LP’lerde var) |
| H1 | Şehir + hizmet |
| Meta description | Festpreis / Anfahrts / CTA sinyali |
| Final URL | `/de/fensterreinigung-aachen` — **anasayfa değil** |

Zincir kırılırsa: amatör görünüm + pahalı tıklama.

---

## 3. SEO / SERP kalitesi (organik + Ads uyumu)

Her geo CORE LP için:

- [ ] Unique title (şehir adı)
- [ ] Unique meta description (şehir + USP)
- [ ] H1 tek ve şehirli
- [ ] FAQ şehir adıyla
- [ ] İç link: synonym / preis / angebot
- [ ] Canonical doğru
- [ ] Mobil LCP kabul edilebilir
- [ ] NAP tutarlı (GBP ile aynı adres/telefon)

Ads Final URL bu LP’ye gider; organik SEO aynı sayfayı güçlendirir → çift kanal kurumsal görünüm.

---

## 4. Conversion alanı

- Tek dominant hedef: **Angebot wizard**
- İkincil: telefon / WhatsApp
- Formda şehir önceden biliniyorsa (UTM/geo) mümkünse ön-doldur — yoksa backlog
- “Kein Anfahrtszuschlag” FAQ’da şehirle tekrar

---

## 5. Wave 1 LP yayın matrisi

| Geo | CORE URL | “Neredeyim” sinyali (siteden) | Ads Final |
|-----|----------|------------------------------|-----------|
| Aachen | `/de/fensterreinigung-aachen` | ca. 15 Min. Mitte | Evet |
| Baesweiler | `/de/fensterreinigung-baesweiler` | Ansässig · Kückstr. 29 | Evet |
| Würselen | `/de/fensterreinigung-wurselen` | ca. 10 Min. | Evet |
| Alsdorf | `/de/fensterreinigung-alsdorf` | ca. 12 Min. | Evet |
| Herzogenrath | `/de/fensterreinigung-herzogenrath` | ca. 15 Min. | Wave 2 |
| Übach-Palenberg | doğrula 200 | — | LP yoksa kampanya yok |

Synonym: `/de/fensterputzer-aachen` → AG-FENSTERPUTZER Final URL.

---

## 6. LP iyileştirme backlog (üst düzey için)

Mevcut LP’ler iyi temel; kurumsal ekstra:

- [ ] Sticky mobil call bar
- [ ] Stadtteil listesi Aachen sayfasında görünür (Brand, Haaren, …)
- [ ] Schema LocalBusiness / Service
- [ ] Before/after şehir bağlamı
- [ ] Angebot’a `?stadt=aachen` query (izinliyse)

Ads açılışı bunları **beklemez**; paralel sprint.
