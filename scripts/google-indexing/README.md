# Google Indexing — Rehber & Scriptler (Ilyashan)

> **Önemli uyarı (Google politikası):** [Indexing API](https://developers.google.com/search/docs/indexing-api/overview) resmi olarak yalnızca **JobPosting** ve **BroadcastEvent** yapılandırılmış verisi olan sayfalar içindir. Fensterreinigung landing sayfaları bu kapsamda değildir — API istekleri **reddedilebilir**.
>
> **Ilyashan için birincil yöntem:** Sitemap (129 URL — GSC’ye submit) + iç linkleme + organik tarama.

---

## Hızlı başlangıç

```bash
cd scripts/google-indexing
npm install
node generate-urls.mjs    # 129 URL → urls.txt
node audit-seo.mjs        # robots + noindex + canonical (deploy sonrası)
DRY_RUN=1 node index.js   # API çağrısı yok, parse testi
```

**Deploy sonrası audit:**
```bash
SITE_URL=https://ilyashan.de/de node audit-seo.mjs
```

---

## 1. SEO audit

| Kontrol | Script |
|---------|--------|
| robots.txt Allow | `audit-seo.mjs` |
| noindex yok | `audit-seo.mjs` |
| Canonical self-ref | `audit-seo.mjs` |

Beklenen robots.txt:
```
User-Agent: *
Allow: /
Disallow: /admin
Disallow: /api/admin
Sitemap: https://ilyashan.de/de/sitemap.xml
```

---

## 2. Google Cloud & Search Console

1. [console.cloud.google.com](https://console.cloud.google.com) → Proje: `ilyashan-indexing`
2. **Web Search Indexing API** → Enable
3. Service Account → JSON key → `service-account.json` (gitignore’da)
4. [Search Console](https://search.google.com/search-console) → Property: `https://ilyashan.de`
5. **Settings → Users** → service account `client_email` → **Owner**

Doğrulama:
```bash
npm run verify-gcp
npm run index:dry
npm run index   # isteğe bağlı — politika uyarısını okuyun
```

---

## 3. Ortam değişkenleri

| Değişken | Varsayılan | Açıklama |
|----------|------------|----------|
| `SITE_URL` | `https://ilyashan.de/de` | Audit base URL |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | `./service-account.json` | GCP JSON |
| `URLS_FILE` | `./urls.txt` | URL listesi |
| `REQUEST_DELAY_MS` | `1500` | API aralığı |
| `DRY_RUN` | — | `1` = API yok |

---

## 4. Önerilen sıra

1. Deploy → Vercel/production
2. `node generate-urls.mjs`
3. `SITE_URL=https://ilyashan.de/de node audit-seo.mjs` → 129/129 clean
4. GSC → Sitemap submit: `https://ilyashan.de/de/sitemap.xml`
5. 3–7 gün GSC Pages izle
6. İsteğe bağlı Indexing API (politika riski)

---

## Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `generate-urls.mjs` | 129 sitemap URL |
| `audit-seo.mjs` | Pre-index SEO audit |
| `index.js` | Indexing API gönderici |
| `verify-gcp.mjs` | GCP + GSC yetki testi |
| `urls.txt` | Üretilen URL listesi |
| `service-account.json` | Sizin ekleyeceğiniz (gitignore) |
