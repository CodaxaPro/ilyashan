# Google Indexing — Tam Rehber (Ilyashan · 129 URL)

> **Google politikası uyarısı:** [Indexing API](https://developers.google.com/search/docs/indexing-api/overview) resmi olarak yalnızca **JobPosting** ve **BroadcastEvent** yapılandırılmış verisi olan sayfalar içindir. Fensterreinigung landing sayfaları bu kapsamda **değildir** — API istekleri reddedilebilir veya yok sayılabilir.
>
> **Birincil yöntem (her zaman):** Sitemap submit + iç linkleme + organik tarama. Indexing API isteğe bağlı hızlandırıcıdır.

---

## Hızlı komutlar

```bash
cd scripts/google-indexing
npm install

node generate-urls.mjs                              # 129 URL → urls.txt
SITE_URL=https://ilyashan.de/de node audit-seo.mjs   # Pre-flight SEO audit
node verify-gcp.mjs                                 # GCP + GSC yetki testi (1 URL)
DRY_RUN=1 node index.js                            # Parse testi, API yok
node index.js                                        # 129 URL → Indexing API
```

---

## 1. Risk ve Engel Kontrolleri

Indexleme öncesi bu üç engel **129 URL'nin tamamında** temiz olmalıdır.

### 1.1 robots.txt — Disallow kontrolü

**Manuel (30 saniye):**
```bash
curl -s https://ilyashan.de/robots.txt
```

Beklenen çıktı:
```
User-Agent: *
Allow: /
Disallow: /admin
Disallow: /api/admin

Sitemap: https://ilyashan.de/de/sitemap.xml
```

**Ne arıyoruz?**
- `/de/fensterreinigung`, `/de/locations/...`, `/de/intent/...` gibi yollar için `Disallow: /de` veya `Disallow: /` **olmamalı**.
- Sadece `/admin` ve `/api/admin` engellenmeli.

**Tek URL testi:**
```bash
# Path robots'ta engellenmiş mi? (basit grep)
curl -s https://ilyashan.de/robots.txt | grep -i disallow
```

**Otomatik (129 URL):**
```bash
SITE_URL=https://ilyashan.de/de node audit-seo.mjs
```
Script robots.txt'i okur, her URL'nin pathname'ini Disallow kurallarına karşı kontrol eder. Özet satırında `robots.txt block: 0` beklenir.

---

### 1.2 noindex — Meta ve HTTP header kontrolü

**Tek URL hızlı test:**
```bash
URL="https://ilyashan.de/de/fensterreinigung"

# Meta robots
curl -sL "$URL" | grep -i 'name="robots"'

# HTTP X-Robots-Tag
curl -sI "$URL" | grep -i x-robots-tag
```

**Sorunlu değerler:**
- `<meta name="robots" content="noindex">` veya `content="noindex, nofollow"`
- `X-Robots-Tag: noindex`

**Toplu test (129 URL — önerilen):**
```bash
SITE_URL=https://ilyashan.de/de node audit-seo.mjs
```
Her URL için hem HTML `<meta name="robots">` hem `X-Robots-Tag` header taranır. `Clean: 129` hedeflenir.

**Lokal geliştirme (deploy öncesi):**
```bash
# Terminal 1: npm run dev
# Terminal 2:
SITE_URL=http://localhost:3000/de \
CANONICAL_BASE=https://ilyashan.de/de \
URLS_FILE=./urls-local.txt \
node audit-seo.mjs
```
`CANONICAL_BASE` localhost'ta canonical karşılaştırması için production base'i kullanır.

---

### 1.3 Canonical — Self-referencing doğrulama

Her sayfanın `<link rel="canonical">` etiketi **kendi public URL'sini** işaret etmeli (self-referencing).

**Tek URL test:**
```bash
URL="https://ilyashan.de/de/fensterreinigung-aachen"
curl -sL "$URL" | grep -i 'rel="canonical"'
# Beklenen: href="https://ilyashan.de/de/fensterreinigung-aachen"
```

**Yaygın hatalar:**
- Homepage canonical'ına fallback (`https://ilyashan.de/de` her yerde)
- Çift prefix (`https://ilyashan.de/de/de/...`)
- Canonical eksik

**Toplu test:**
```bash
SITE_URL=https://ilyashan.de/de node audit-seo.mjs
```
`canonical mismatch` veya `canonical missing` satırları varsa indexleme **durdurulmalı**.

---

### 1.4 Pre-flight checklist

| # | Kontrol | Komut | Beklenen |
|---|---------|-------|----------|
| 1 | Deploy canlı | `curl -sI https://ilyashan.de/de/fensterreinigung` | HTTP 200 |
| 2 | robots.txt | `curl -s https://ilyashan.de/robots.txt` | Allow /, Disallow sadece admin |
| 3 | 129 URL audit | `SITE_URL=https://ilyashan.de/de node audit-seo.mjs` | Clean: 129 |
| 4 | Sitemap | `curl -s https://ilyashan.de/de/sitemap.xml \| grep -c '<loc>'` | 129 |
| 5 | GSC verify | Search Console → Ownership | Verified |
| 6 | GCP test | `node verify-gcp.mjs` | HTTP 200 |

---

## 2. Google Cloud ve Search Console Ayarları

### 2.1 Google Cloud Console

1. [console.cloud.google.com](https://console.cloud.google.com) → **Select a project** → **New Project**
   - Proje adı: `ilyashan-indexing` (veya istediğiniz ad)
2. Sol menü → **APIs & Services** → **Library**
3. Arama: **Web Search Indexing API** → **Enable**
4. **APIs & Services** → **Credentials** → **Create Credentials** → **Service account**
   - Name: `ilyashan-indexing-bot`
   - Role: gerekmez (Indexing API için SA yeterli)
5. Oluşturulan SA → **Keys** sekmesi → **Add Key** → **Create new key** → **JSON**
6. İndirilen dosyayı bu klasöre kopyala:
   ```
   scripts/google-indexing/service-account.json
   ```
   > Bu dosya `.gitignore`'dadır — asla commit etmeyin.

**JSON içinden not alın:**
```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('service-account.json')).client_email)"
```
Çıkan e-posta (ör. `ilyashan-indexing-bot@ilyashan-indexing.iam.gserviceaccount.com`) Search Console'a eklenecek.

### 2.2 Google Search Console

1. [search.google.com/search-console](https://search.google.com/search-console)
2. Property: `https://ilyashan.de` (veya domain property `ilyashan.de`)
3. Site doğrulaması: meta tag zaten deploy edildi (`app/layout.tsx` → `verification.google`)
4. **Settings** (⚙️) → **Users and permissions** → **Add user**
5. Service account `client_email` adresini yapıştır
6. Permission: **Owner** (Full) — **Indexing API için Owner zorunlu**
7. **Save**

### 2.3 Sitemap submit (birincil indexleme)

GSC → **Sitemaps** → yeni sitemap:
```
https://ilyashan.de/de/sitemap.xml
```

### 2.4 GCP doğrulama (tek URL test)

```bash
cd scripts/google-indexing
npm install
node verify-gcp.mjs
```

Başarılı çıktı: `✓ API yanıtı: HTTP 200`

---

## 3. Node.js Indexing Script (`index.js`)

### Ortam değişkenleri

| Değişken | Varsayılan | Açıklama |
|----------|------------|----------|
| `GOOGLE_SERVICE_ACCOUNT_KEY` | `./service-account.json` | GCP JSON key yolu |
| `URLS_FILE` | `./urls.txt` | URL listesi (satır başına 1 URL) |
| `REQUEST_DELAY_MS` | `1500` | İstekler arası gecikme (ms) |
| `DRY_RUN` | — | `1` = API çağrısı yapma, sadece parse |

### Çalıştırma

```bash
# 1. Dry-run (API yok)
DRY_RUN=1 node index.js

# 2. Gerçek gönderim (~129 × 1.5s ≈ 3.5 dakika)
node index.js
```

### Rate limit

- Script her istek arasında **1500 ms** bekler.
- Google Indexing API günlük kota: tipik olarak **200 URL/gün** (proje başına).
- 129 URL tek seferde kotanın altındadır.

### Örnek başarılı çıktı

```
=== Google Indexing API — URL_UPDATED (Ilyashan) ===

URLs loaded:  129
Key file:     ./service-account.json
Delay:        1500ms between requests

[1/129] ✓ https://ilyashan.de/de (HTTP 200)
[2/129] ✓ https://ilyashan.de/de/fensterreinigung (HTTP 200)
...

=== Summary ===
Total:    129
Success:  129
Failed:   0
```

---

## 4. Önerilen sıra (end-to-end)

```
Deploy production
    ↓
node generate-urls.mjs
    ↓
SITE_URL=https://ilyashan.de/de node audit-seo.mjs  → 129/129 clean
    ↓
GSC: sitemap submit + ownership verified
    ↓
node verify-gcp.mjs  → tek URL OK
    ↓
node index.js  → 129 URL URL_UPDATED
    ↓
GSC → Pages → 3–7 gün izle
```

---

## 5. Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `generate-urls.mjs` | Sitemap'ten 129 URL üretir |
| `audit-seo.mjs` | robots + noindex + canonical audit |
| `verify-gcp.mjs` | GCP key + GSC Owner tek URL testi |
| `index.js` | Indexing API toplu gönderici |
| `urls.txt` | Üretilen URL listesi |
| `service-account.json` | Sizin ekleyeceğiniz GCP key (gitignore) |
