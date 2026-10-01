# SERP görünüm + Asset (eklenti) standardı — kurumsal

**Kanıt:** Google Ads Help — Ad Strength için **≥6 sitelink** önerilir; RSA’da 15 başlık + 4 açıklama; Call-only format 2026’da retired → RSA + Call Asset.  
Yerel hizmette Location + Call asset SERP alanını büyütür, CTR ve “kurumsal” izlenim artar.

**Politika:** Yalnızca Search. Dynamic sitelink / dynamic callout **KAPALI** (kontrol kaybı / yanlış URL riski — amatör israf).

---

## 1. RSA teknik limitler (kanıtlı)

| Alan | Limit | Kurumsal hedef |
|------|-------|----------------|
| Headlines | 15 × 30 karakter | **15/15 dolu** |
| Descriptions | 4 × 90 karakter | **4/4 dolu** |
| Path 1 / 2 | 15 karakter | İkisi de dolu |
| Ad Strength | — | En az **Good**, hedef **Excellent** |
| Pin | Opsiyonel | Pin 1 = şehir+hizmet (zorunlu kurumsal tutarlılık) |

Her headline bağımsız anlamlı olmalı (Google sıra karıştırır).

---

## 2. Hesap seviyesi asset paketi (`ASSET-IL-ACCOUNT`)

Tüm Search kampanyalarına miras.

### 2.1 Call Asset

| Alan | Değer |
|------|-------|
| Telefon | `0173 3828354` |
| Ülke | DE |
| Takvim | İş saatleriyle aynı (ör. Mo–Fr 07–20, Sa 08–14) |
| Call conversion | ≥60 sn konuşma = conversion (Gate-0’da kur) |

### 2.2 Location Asset

- Google Business Profile bağla (Ilyashan / Baesweiler)
- Ads’te Location asset = ON
- NAP = sitedeki adres ile birebir

### 2.3 Callout Assets (en az 4, hedef 6)

1. `Kein Anfahrtszuschlag`  
2. `Streifenfrei garantiert`  
3. `Festpreis in 24 Stunden`  
4. `Vollversichert`  
5. `4,9★ bei Google`  
6. `Live-Preisrechner online`  

### 2.4 Structured Snippet

| Header | Values |
|--------|--------|
| Service / Dienstleistungen | Privatfenster, Gewerbe, Rahmen & Falz, Solaranlagen, Glasfassaden, Wartungsvertrag |

### 2.5 Sitelinks — **6 adet zorunlu** (Ad Strength)

| # | Metin (≤25) | Açıklama 1 (≤35) | Açıklama 2 (≤35) | Final URL |
|---|-------------|------------------|-----------------|-----------|
| 1 | Preis berechnen | Live-Preisschätzung | Festpreis in 24 Std. | `/de/angebot` |
| 2 | Leistungen | Privat, Gewerbe, Solar | Rahmen & Falz | `/de` (Leistungen bölümü) |
| 3 | Einsatzgebiet | Aachen & Umgebung | Kein Anfahrtszuschlag | `/de` (Gebiet) |
| 4 | Bewertungen | 4,9★ Google | 500+ Kunden | `/de` (Reviews) |
| 5 | Gutschein | Zeit schenken | Ideal als Geschenk | gutschein URL* |
| 6 | Kontakt / Anruf | 0173 3828354 | Baesweiler | `/de` veya tel |

\* Gutschein URL 200 değilse sitelink 5 → `Was kostet Fensterreinigung?` fiyat/FAQ sayfası.

**Dynamic sitelinks:** OFF  
**Dynamic callouts:** OFF  
**Dynamic structured snippets:** OFF  

---

## 3. Kampanya seviyesi override

Geo kampanyalarında Path ve sitelink açıklamalarına şehir eklenebilir:

- AAC: Sitelink “Einsatzgebiet” açıklaması → `Aachen & Stadtteile`
- BAE: `Ansässig in Baesweiler`

Call / Callout hesap seviyesinde kalabilir.

---

## 4. SERP “üst düzey görünüm” checklist

Yayın öncesi Ads Preview / canlı arama (konum spoof):

- [ ] 3 başlık + 2 açıklama okunaklı, şehir görünür  
- [ ] 6 sitelink satırı dolu  
- [ ] Call butonu / numara  
- [ ] Callout’lar görünür  
- [ ] Structured snippet görünür  
- [ ] Location (mümkünse)  
- [ ] Yeşil display URL path: `ilyashan.de/Aachen/Angebot` benzeri  
- [ ] Rakip portal reklamlarından daha “yerel işletme” izlenimi  

---

## 5. Yasak (amatör sinyaller)

- “Nr. 1 in Aachen” (kanıtsız)  
- “Günstigste” / “billigste”  
- Tek sitelink / hiç asset yok  
- Dynamic asset’lere güvenip URL kontrolünü bırakmak  
- Call-only kampanya (retired)  
- Ana sayfaya Final URL  
- Search Partners açık  
