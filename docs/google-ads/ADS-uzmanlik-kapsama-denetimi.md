# Uzmanlık kapsama denetimi — genelleme

**Soru:** Tüm ilgili AdWords uzmanlıklarında araştırma yapıldı mı?  
**Cevap (dürüst):** **Hayır — %100 canlı hesap derinliği yok.**  
**Evet olan:** Yerel Search lead-gen için kritik uzmanlıkların **çoğu çerçevelendi** ve playbook’a bağlandı.  
**Hayır / kısmi olan:** Hesap erişimi, Keyword Planner yerel export, canlı SERP/Auction ve CRM close-rate olmadan kapanmayan katmanlar.

**Denetim tarihi:** 2026-07-24  
**Kapsam:** Ilyashan · Google Search only · Aachen grubu

---

## Skor özeti

| Durum | Anlam | Adet (yaklaşık) |
|-------|-------|-----------------|
| **A — Tam çerçeve** | Politika + checklist + şablon hazır; canlı veri ile kilitlemeye hazır | 14 |
| **B — Kısmi** | Araştırıldı / not edildi; derin uygulama veya yerel veri eksik | 9 |
| **C — Bilinçli ertelendi** | Search-only / Wave politikası gereği sonra veya ayrı karar | 4 |
| **D — Hesapsız kapanmaz** | Gate-0: Ads hesabı + Planner + tracking şart | 5 |

---

## A — Tam çerçeve (araştırıldı + sisteme işlendi)

| Uzmanlık | Kanıt dosyası | Araştırma temeli |
|----------|---------------|------------------|
| Account / kampanya mimarisi | playbook, aachen blueprint | 2026 Search lead-gen: intent×geo ayrımı |
| Network (Search only, Partners OFF) | `ADS-google-search-only.md` | İsraf kesimi — kullanıcı politikası + best practice |
| Geo targeting (Presence) | playbook, geo map | Yerel hizmet rehberleri |
| Keyword taxonomy + match type | keyword-bid-matrix | Ulusal SV/CPC (Performance Suite 17.06.2026) |
| Negatif kelime disiplini | playbook, matrix | Search Terms ritmi |
| Bid strateji merdiveni | keyword-bid-matrix, blueprint | Manual → Max Conv → tCPA (Google eşikleri) |
| RSA / reklam metni | ENTERPRISE BUILD + rsa bank | 15H/4D char doğruluğu |
| Assets / extensions | ADS-ASSETS-SERP-STANDARD | ≥6 sitelink; dynamic OFF; Call-only retired→Call asset |
| Landing ↔ Final URL / QS | LP-NERDEYIM + matrix | 5sn geo testi |
| Pause / hesap hijyeni | ADS-PAUSE-PROTOKOL | Tüm eski kampanya pause |
| Conversion tanımı (lead) | DEVAM Gate-0 | Angebot / call / WhatsApp |
| UTM / ölçüm isimlendirme | playbook | Campaign = UTM kilidi |
| Rakip tipolojisi (masaüstü) | competitor-intel | Inmaculado, MyHammer, Gebäudereinigung |
| QA / cross-check | cross-check-protocol | 12 kapı GO/NO-GO |
| Görev / sprint yönetimi | README, backlog, sprint-log | SEO playbook modeli |

---

## B — Kısmi (biliniyor, derinleştirilmedi)

| Uzmanlık | Ne var | Eksik |
|----------|--------|-------|
| Yerel Exact CPC / SV | Ulusal band + uplift kuralı | **Keyword Planner Aachen export** |
| Auction Insights / IS | KPI hedefleri yazıldı | Canlı rakip share |
| SERP reklam envanteri | Checklist + boş not defteri | Güncel Aachen ekran kaydı |
| Ad schedule / daypart | Örnek saat yazıldı | Gerçek çağrı kapasitesi × saat analizi |
| Device (mobil/masaüstü) | — | Bid adjustment politikası yok |
| RLSA / müşteri listesi | Backlog’da Customer Match | Liste yükleme + bid modifier yok |
| Offline conversion (CRM→Ads) | Best practice biliniyor | OCI kurulumu yok |
| Call tracking derinliği | Numara + call click | 60sn+ call conversion, DNI opsiyonel |
| Policy / reklam onayı riski | Streifenfrei vb. uyarı | Tam policy audit yok |
| Consent Mode / DE gizlilik | — | Tag/Consent Mode v2 kontrolü yok |
| Invalid click / fraud | Smoke’da kısa not | IP / bot süreci yok |
| Experiments (A/B RSA) | “A/B sonra” | Deney protokolü yok |
| Budget pacing / shared budget | Günlük tavan | Shared portfolio yok |
| GBP ↔ Ads bağlantısı | competitor’ta checklist | Canlı GBP audit yok |

---

## C — Bilinçli ertelendi (politika / sıra)

| Uzmanlık | Neden sonra |
|----------|-------------|
| Performance Max | Kullanıcı: yalnızca Google Arama — **YASAK** |
| Display / Demand Gen / Video | Aynı — boş harcama riski |
| Broad match agresif otomasyon | Pilotta Exact/Phrase; veri sonrası kontrollü |
| LSA (Local Services Ads) | Ayrı ürün + ayrı bütçe kararı; Search stabilize olunca değerlendir |

LSA 2026’da yerel hizmette güçlü kanal; **Search-only politikasıyla çelişmez** (ayrı yüzey) ama şimdi açmak Wave 1 disiplinini böler → backlog P2.

---

## D — Hesap / veri olmadan “araştırıldı” sayılamaz

Bunlar masaüstü araştırmayla **tamamlanmış sayılmaz**:

1. Aachen Exact için **gerçek** Top-of-page bid (low/high)  
2. Canlı hesapta mevcut kampanya israf audit (partners harcaması?)  
3. Conversion tag’lerin gerçek tetiklenmesi  
4. Close rate / ortalama sipariş → kesin Max CPA  
5. Auction Insights ile rakip bid baskısı  

→ Hepsi **Gate-0**.

---

## Genelleme hükmü

| İfade | Doğru mu? |
|-------|-----------|
| “Tüm ilgili uzmanlıklar için sistem / görev çerçevesi kuruldu” | **Evet** |
| “Her uzmanlıkta Aachen için kanıtlanmış canlı teklif ve rakip verisi var” | **Hayır** |
| “Search-only + yapı + kelime + teklif merdiveni + LP + RSA + QA yeterince derin” | **Evet (çerçeve)** |
| “Device, RLSA, OCI, Consent, LSA, Experiments tam işlendi” | **Hayır (B/C)** |

**Pratik çeviri:** Uzmanlık haritasının **iskeleti ve yayın kuralları** hazır.  
“Net fiyatlarla çıkmak” ve “sıfır boş harcama kanıtı” için sıradaki iş Gate-0 canlı hesap — yoksa iddia abartılır.

---

## Kapanış için önerilen sıra (eksikleri kapat)

1. Gate-0 Planner + tracking (D bloğu)  
2. B bloğu mini sprint: device + ad schedule + call 60sn + GBP  
3. Wave 1 Search stabilize  
4. Karar: LSA ayrı kanal mı?  
5. OCI + RLSA (kalite sinyali)

Bu dosya: genelleme sorusunun kalıcı cevabıdır; skor değişince güncellenir.
