# Sprint log — Google Ads Ilyashan

## Sprint 0 — 2026-07-24 · Sistem kurulumu

**Kapsam:** Komuta merkezi dokümantasyonu + Aachen pilot blueprint + kelime/teklif/LP matrisi + sıfır-hata playbook.

**Bulgular:**

- Canlı geo LP’ler mevcut: Aachen, Baesweiler, Würselen (`wurselen`), Alsdorf, Herzogenrath  
- Conversion LP: `/de/angebot` (Live-Preisrechner)  
- Yanlış slug tuzağı: `wuerselen` → 404; doğru `wurselen`  
- Ulusal CPC benchmark’ları matrise işlendi; yerel Planner Gate-0 bekliyor  
- Önceki karma yapı teşhisi: multi-intent / multi-geo tek kampanya → QS ve bütçe israfı  

**Çıktılar:** `docs/google-ads/*`

**Ek (aynı gün):** Kullanıcı politikası netleştirildi — trafik yalnızca Google Arama; Search Partners / ortak siteler kalıcı yasak (`ADS-google-search-only.md`).

**Sonraki sprint:** Gate-0 tracking + `IL-AAC-CORE` + `IL-BAE-CORE` canlı kurulum · `NET=GOOGLE_SEARCH_ONLY`

## Sprint 1 — 2026-07-24 · Kurumsal build paketi

**Kapsam:** Tüm kampanyaları pause protokolü + Wave 1 enterprise hiyerarşi (kampanya→AG→kelime→RSA 15/4→URL→Manual CPC) + SERP asset standardı (≥6 sitelink, dynamic OFF) + LP “Neredeyim?” 5sn standardı.

**Çıktılar:**
- `ADS-PAUSE-PROTOKOL.md`
- `ADS-ENTERPRISE-BUILD-WAVE1.md`
- `ADS-ASSETS-SERP-STANDARD.md`
- `ADS-LP-NERDEYIM-STANDARD.md`

**Panel durumu:** Pause + kurulum operatörde (bu ortam Ads paneline bağlı değil).

**Sonraki:** PAUSE_ALL kanıtı → BAE/AAC enable.

## Sprint 2 — 2026-07-24 · Bağlantı kontrol düzlemi

**Bulgu:** Cursor MCP’te Google Ads yok. Resmi google-ads-mcp salt okuma — pause/kurulum için yetersiz.

**Çıktı:**
- `ADS-BAGLANTI-KONTROL.md`
- `scripts/google-ads/` (`list_campaigns.py`, `pause_all_campaigns.py`)

**Engel:** `.env.local` içinde Ads API credential yok → agent henüz hesaba bağlanamıyor.

**Sonraki:** Credential + “pause apply yetkisi” → list → pause --apply → Wave 1 build.

## Sprint 3 — 2026-07-24 · Wave 1 CORE + tüm semt/Ortsteil AG (PAUSED)

**Supermetrics hesabı:** `6260502839` · hepsi **PAUSED** · Search only · Display OFF · geo hâlâ `DE` (panelde Presence şehir set edilecek)

| Kampanya | ID | Budget | Semt/Ortsteil AG |
|----------|-----|--------|------------------|
| IL-BAE-CORE-SEARCH | 24067658623 | 10 € | AG-ORTSTEIL (Setterich, Oidtweiler, Loverich, Puffendorf, Beggendorf) |
| IL-AAC-CORE-SEARCH | 24058027809 | 15 € | AG-STADTTEIL (Brand, Haaren, Laurensberg, Richterich, Eilendorf, Forst, Kornelimünster, Walheim + Burtscheid, Soers, Vaalserquartier, …) |
| IL-WUR-CORE-SEARCH | 24067684771 | 8 € | AG-ORTSTEIL (Bardenberg, Broichweiden, Weiden) |
| IL-ALS-CORE-SEARCH | 24067688098 | 8 € | AG-ORTSTEIL (Hoengen, Mariadorf, Ofden) |

**URL sync:** AAC Putzer → `/fensterputzer-aachen`, Glas → `/glasreinigung-aachen`; BAE Putzer → synonym LP. Semt AG → şehir CORE LP.

**Site:** Baesweiler home H1 → `Fensterreinigung Baesweiler — klar, fair, streifenfrei.` (`lib/location-builders.ts`)

**LP 200:** WUR/ALS/AAC/BAE CORE + synonym + Herzogenrath ✅ · `uebach-palenberg` ❌ 404 → UBP NO-GO

**Panel TODO (enable öncesi):** her kampanyada Location = şehir Presence only (Interest kapalı). Enable yalnız `okey` sonrası.

## Sprint 4 — 2026-07-24 · PRICE + BRAND + assets (PAUSED) · Enable bekliyor Presence

**Yeni (PAUSED):**
| Kampanya | ID | Budget |
|----------|-----|--------|
| IL-BRAND-SEARCH | 24063034547 | 3 € |
| IL-AAC-PRICE-SEARCH | 24063036185 | 8 € → `/fensterreinigung-preis-aachen` |
| IL-BAE-PRICE-SEARCH | 24063037649 | 6 € → `/fensterreinigung-preis-baesweiler` |

**LP 200:** preis-aachen, kosten-aachen, preis-baesweiler, kosten-baesweiler, `/de` ✅

**Enable kararı:** Kullanıcı `okey` verdi; API şehir Presence set edemiyor (yalnızca DE). Cross-check kapı 2 kırmızı → **enable tutuldu**. Panelde şehir Presence + Interest OFF sonrası `presence okey` → BAE→AAC→WUR→ALS→PRICE→BRAND enable sırası.

## Sprint 5 — 2026-07-24 · Intent kilidi uygulandı (PAUSED, enable yok)

**Politika:** CORE = Reinigung + Putzer (+ AAC Glas) · Wintergarten/Solar/Fassade Ads kapalı + kampanya negatif.

**Yapılan:**
- Playbook Wave 1 intent kilidi yazıldı
- Specialty negatifler: BAE/AAC/WUR/ALS CORE + PRICE (wintergarten, solar, fassade, diy, …)
- BAE RSA: telefon metinden çıkarıldı (policy PHONE_NUMBER_IN_AD_TEXT)
- WUR/ALS: `AG-FENSTERPUTZER` ayrı LP’ye (`/fensterputzer-{slug}`); Putzer KW CORE AG’den ayrıldı
- Assets: BAE/AAC/WUR/ALS sitelink+call+callout

**Hâlâ NO-GO:** Location = DE (Presence şehir yok) → enable yok.
