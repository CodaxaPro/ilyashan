# ENTERPRISE BUILD — Wave 1 (kurumsal Ads + LP ağı)

**Durum:** Uygulama paketi — paneli buradan kur.  
**Önkoşul:** [ADS-PAUSE-PROTOKOL.md](./ADS-PAUSE-PROTOKOL.md) tamam (`etkin=0`).  
**Ağ:** [ADS-google-search-only.md](./ADS-google-search-only.md) — Partners OFF.  
**LP:** [ADS-LP-NERDEYIM-STANDARD.md](./ADS-LP-NERDEYIM-STANDARD.md)  
**SERP:** [ADS-ASSETS-SERP-STANDARD.md](./ADS-ASSETS-SERP-STANDARD.md)  
**Teklif:** Faz 1 = **Manual CPC** (Planner override sonrası).

Karakter sayıları elle doğrulanmıştır (≤30 / ≤90). `ü/ä/ö/ß/★/€/·` = 1 karakter.

---

## 0. Kurumsal hiyerarşi (tek model)

```
Account: Ilyashan
└─ Shared: NEG-IL-GLOBAL | ASSET-IL-ACCOUNT
   ├─ IL-AAC-CORE-SEARCH
   │    ├─ AG-FENSTERREINIGUNG
   │    ├─ AG-FENSTERPUTZER
   │    ├─ AG-GLASREINIGUNG
   │    └─ AG-STADTTEIL
   ├─ IL-AAC-PRICE-SEARCH
   │    └─ AG-PREIS-KOSTEN
   ├─ IL-BAE-CORE-SEARCH
   │    ├─ AG-FENSTERREINIGUNG
   │    └─ AG-FENSTERPUTZER
   ├─ IL-WUR-CORE-SEARCH
   │    ├─ AG-FENSTERREINIGUNG
   │    └─ AG-FENSTERPUTZER
   ├─ IL-ALS-CORE-SEARCH
   │    ├─ AG-FENSTERREINIGUNG
   │    └─ AG-FENSTERPUTZER
   ├─ IL-UBP-CORE-SEARCH   ← yalnızca LP 200 sonrası
   │    └─ AG-FENSTERREINIGUNG
   └─ IL-BRAND-SEARCH
        └─ AG-BRAND
```

**Enable sırası:** BAE → AAC → WUR → ALS → PRICE → BRAND → UBP  
Günde max 2 enable.

---

## 1. Ortak hesap ayarları (her kampanya)

| Ayar | Değer |
|------|-------|
| Type | Search |
| Networks | Google Search **ON** · Search partners **OFF** |
| Location | Presence only |
| Language | Deutsch |
| Bid strategy | Manual CPC (eCPC: OFF ilk 14 gün) |
| EU political ads | No |
| URL options | Tracking template yok (UTM Final URL’de) veya hesap seviyesinde standart |

### Shared negative — `NEG-IL-GLOBAL`

```
gratis
kostenlos
diy
selber
anleitung
tipps
job
stelle
gehalt
ausbildung
lehrling
praktikum
youtube
forum
pdf
unger
teleskop
gerät
kaufen
amazon
ebay
reinigungsmittel
chemie
belgien
nederland
holland
maastricht
kerkrade
heerlen
putzfrau
putzhilfe
stundenlohn
software
app
```

---

## 2. Kampanya: `IL-BAE-CORE-SEARCH` (önce aç — HQ / en yüksek QS)

| Alan | Değer |
|------|-------|
| Daily budget | 10,00 € |
| Location | Baesweiler |
| Final URL kök | `https://ilyashan.de/de/fensterreinigung-baesweiler` |

### AG-FENSTERREINIGUNG · Max CPC 1,10 €

| Match | Keyword |
|-------|---------|
| Exact | `[fensterreinigung baesweiler]` |
| Exact | `[fenster reinigung baesweiler]` |
| Exact | `[professionelle fensterreinigung baesweiler]` |
| Phrase | `"fensterreinigung baesweiler"` |
| Phrase | `"fensterreinigung in baesweiler"` |

**Final URL:** `https://ilyashan.de/de/fensterreinigung-baesweiler?utm_source=google&utm_medium=cpc&utm_campaign=IL-BAE-CORE-SEARCH&utm_content=AG-FENSTERREINIGUNG`

### AG-FENSTERPUTZER · Max CPC 0,95 €

| Match | Keyword |
|-------|---------|
| Exact | `[fensterputzer baesweiler]` |
| Phrase | `"fensterputzer baesweiler"` |

**Final URL:** `https://ilyashan.de/de/fensterputzer-baesweiler?...` *(404 ise CORE LP)*

### RSA — Baesweiler (15H / 4D)

Pin1 = H01 · Pin2 = H02 · Pin3 = H03

| ID | Metin | Len |
|----|-------|-----|
| H01 | Fensterreinigung Baesweiler | 27 |
| H02 | Ansässig in Baesweiler | 22 |
| H03 | Festpreis in 24 Stunden | 23 |
| H04 | Kein Anfahrtszuschlag | 20 |
| H05 | Live-Preis online berechnen | 26 |
| H06 | Ab 49 € Privatfenster | 20 |
| H07 | 4,9★ bei Google | 14 |
| H08 | Streifenfrei garantiert | 23 |
| H09 | Vollversichert & pünktlich | 25 |
| H10 | Kückstr. 29 · vor Ort | 20 |
| H11 | 500+ zufriedene Kunden | 22 |
| H12 | Rahmen, Falz & Solar | 20 |
| H13 | Jetzt Preis berechnen | 21 |
| H14 | Transparenter Festpreis | 23 |
| H15 | Ohne versteckte Kosten | 22 |

| ID | Description | Len |
|----|-------------|-----|
| D1 | Fensterreinigung in Baesweiler. Live-Preisschätzung online — Festpreis in 24 Stunden. | 82 |
| D2 | Ansässig vor Ort · kein Anfahrtszuschlag. Streifenfrei, versichert, pünktlich. | 76 |
| D3 | Privat ab 49 €, Rahmen & Falz ab 79 €, Solar ab 99 €. 4,9★ Google · 500+ Kunden. | 78 |
| D4 | Festes Team — kein Vermittler. Jetzt Preis berechnen oder anrufen: 0173 3828354. | 79 |

**Paths:** `Baesweiler` / `Festpreis`

---

## 3. Kampanya: `IL-AAC-CORE-SEARCH`

| Alan | Değer |
|------|-------|
| Daily budget | 15,00 € |
| Location | Aachen + (opsiyonel) 12 km radius; exclude NL sınır |
| Stadtteile | Keyword ile AG-STADTTEIL |

### AG-FENSTERREINIGUNG · Max CPC 1,25 €

| Match | Keyword |
|-------|---------|
| Exact | `[fensterreinigung aachen]` |
| Exact | `[fenster reinigung aachen]` |
| Exact | `[professionelle fensterreinigung aachen]` |
| Phrase | `"fensterreinigung aachen"` |
| Phrase | `"fensterreinigung in aachen"` |

**Final URL:** `https://ilyashan.de/de/fensterreinigung-aachen?utm_source=google&utm_medium=cpc&utm_campaign=IL-AAC-CORE-SEARCH&utm_content=AG-FENSTERREINIGUNG`

### AG-FENSTERPUTZER · Max CPC 1,05 €

| Match | Keyword |
|-------|---------|
| Exact | `[fensterputzer aachen]` |
| Exact | `[fensterputzer in aachen]` |
| Phrase | `"fensterputzer aachen"` |

**Final URL:** `https://ilyashan.de/de/fensterputzer-aachen?utm_...&utm_content=AG-FENSTERPUTZER`

### AG-GLASREINIGUNG · Max CPC 1,70 €

| Match | Keyword |
|-------|---------|
| Exact | `[glasreinigung aachen]` |
| Phrase | `"glasreinigung aachen"` |

**Final URL:** `https://ilyashan.de/de/glasreinigung-aachen?...` *(404 → CORE LP)*

### AG-STADTTEIL · Max CPC 0,75 €

| Match | Keyword |
|-------|---------|
| Exact | `[fensterreinigung laurensberg]` |
| Exact | `[fensterreinigung brand]` |
| Exact | `[fensterreinigung brand aachen]` |
| Exact | `[fensterreinigung haaren]` |
| Exact | `[fensterreinigung richterich]` |
| Exact | `[fensterreinigung eilendorf]` |
| Exact | `[fensterreinigung forst]` |
| Exact | `[fensterreinigung kornelimünster]` |
| Exact | `[fensterreinigung walheim]` |
| Exact | `[fensterputzer brand]` |
| Exact | `[fensterputzer laurensberg]` |
| Phrase | `"fensterreinigung aachen mitte"` |

**Final URL:** hepsi CORE Aachen LP (+ utm_content=AG-STADTTEIL)

### RSA — Aachen

Pin1 H01 · Pin2 H02 · Pin3 H03

| ID | Metin | Len |
|----|-------|-----|
| H01 | Fensterreinigung Aachen | 23 |
| H02 | Kein Anfahrtszuschlag | 20 |
| H03 | Festpreis in 24 Stunden | 23 |
| H04 | Live-Preis online berechnen | 26 |
| H05 | Ab 49 € Privatfenster | 20 |
| H06 | 4,9★ bei Google | 14 |
| H07 | Streifenfrei garantiert | 23 |
| H08 | Vollversichert & pünktlich | 25 |
| H09 | Aus Baesweiler · nah dran | 24 |
| H10 | ca. 15 Min. nach Aachen | 23 |
| H11 | 500+ zufriedene Kunden | 22 |
| H12 | Rahmen, Falz & Solar | 20 |
| H13 | Jetzt Preis berechnen | 21 |
| H14 | Aachen & alle Stadtteile | 24 |
| H15 | Ohne versteckte Kosten | 22 |

| ID | Description | Len |
|----|-------------|-----|
| D1 | Professionelle Fensterreinigung in Aachen. Live-Preis online — Festpreis in 24 Stunden. | 84 |
| D2 | Kein Anfahrtszuschlag. Streifenfrei, versichert, pünktlich. Jetzt Preis berechnen. | 81 |
| D3 | Privat ab 49 €, Rahmen & Falz ab 79 €, Solar ab 99 €. 4,9★ · 500+ Kunden. | 72 |
| D4 | Team aus Baesweiler — kein Portal. Anruf 0173 3828354 oder Online-Angebot. | 73 |

**Paths:** `Aachen` / `Angebot`

---

## 4. Kampanya: `IL-AAC-PRICE-SEARCH`

| Alan | Değer |
|------|-------|
| Daily budget | 8,00 € |
| Location | Aachen (Presence) |
| Max CPC | 1,70 € |

### AG-PREIS-KOSTEN

| Match | Keyword |
|-------|---------|
| Exact | `[fensterreinigung preis aachen]` |
| Exact | `[fensterreinigung preise aachen]` |
| Exact | `[fensterreinigung kosten aachen]` |
| Exact | `[fensterputzer preise aachen]` |
| Exact | `[fensterputzer kosten aachen]` |
| Phrase | `"was kostet fensterreinigung aachen"` |
| Phrase | `"fensterreinigung preis aachen"` |

**Final URL tercihi:**  
1) `/de/fensterreinigung-preis-aachen` (200 ise)  
2) değilse `/de/fensterreinigung-kosten-aachen`  
3) değilse CORE Aachen LP  

### RSA — Price (Pin1 fiyat sinyali)

| ID | Metin | Len |
|----|-------|-----|
| H01 | Fensterreinigung Preis | 22 |
| H02 | Live-Preis in Aachen | 20 |
| H03 | Festpreis in 24 Stunden | 23 |
| H04 | Ab 49 € berechnen | 17 |
| H05 | Kein Anfahrtszuschlag | 20 |
| H06 | Transparent kalkuliert | 22 |
| H07 | Online Preisrechner | 19 |
| H08 | 4,9★ bei Google | 14 |
| H09 | Ohne versteckte Kosten | 22 |
| H10 | Rahmen & Falz ab 79 € | 21 |
| H11 | Solar reinigen ab 99 € | 22 |
| H12 | Jetzt Preis berechnen | 21 |
| H13 | Streifenfrei garantiert | 23 |
| H14 | Aachen & Umgebung | 17 |
| H15 | Verbindliches Angebot | 21 |

| ID | Description | Len |
|----|-------------|-----|
| D1 | Was kostet Fensterreinigung in Aachen? Live-Preisschätzung — Festpreis in 24 Std. | 80 |
| D2 | Ab 49 € Privat · kein Anfahrtszuschlag. Transparent, versichert, streifenfrei. | 77 |
| D3 | Kein Stundenchaos: klare Kalkulation im Wizard. 4,9★ Google · 500+ Kunden. | 74 |
| D4 | Jetzt online berechnen oder anrufen: 0173 3828354 — Ilyashan Fensterreinigung. | 77 |

**Paths:** `Aachen` / `Preis`

---

## 5. Kampanya: `IL-WUR-CORE-SEARCH`

| Budget | 8 € | Location | Würselen | Max CPC CORE | 1,10 € |

**Final URL:** `https://ilyashan.de/de/fensterreinigung-wurselen?...`

### Keywords

| Match | Keyword |
|-------|---------|
| Exact | `[fensterreinigung würselen]` |
| Exact | `[fensterreinigung wuerselen]` |
| Exact | `[fensterputzer würselen]` |
| Phrase | `"fensterreinigung würselen"` |

### RSA Pin1

`Fensterreinigung Würselen` (25)

H02: `Kein Anfahrtszuschlag` · H03: `Festpreis in 24 Stunden`  
H09: `ca. 10 Min. entfernt` (20)  
Paths: `Wuerselen` / `Festpreis` (ü path’te sorun olursa `Wuerselen`)

D1: `Professionelle Fensterreinigung in Würselen. Live-Preis — Festpreis in 24 Stunden.` (~78)

---

## 6. Kampanya: `IL-ALS-CORE-SEARCH`

| Budget | 8 € | Location | Alsdorf | Max CPC | 1,10 € |

**Final URL:** `https://ilyashan.de/de/fensterreinigung-alsdorf?...`

### Keywords

| Match | Keyword |
|-------|---------|
| Exact | `[fensterreinigung alsdorf]` |
| Exact | `[fensterputzer alsdorf]` |
| Phrase | `"fensterreinigung alsdorf"` |

Pin1: `Fensterreinigung Alsdorf` (24)  
H09: `ca. 12 Min. entfernt`  
Paths: `Alsdorf` / `Festpreis`

---

## 7. Kampanya: `IL-UBP-CORE-SEARCH` (LP kapısı)

**NO-GO** ta ki `https://ilyashan.de/de/fensterreinigung-uebach-palenberg` (veya doğru slug) **200**.

Pin1 uzunluk sorunu: `Fensterreinigung Übach-Palenberg` = 32 → **geçersiz**.

| Pin1 seçenekleri (≤30) | Len |
|------------------------|-----|
| `Fensterreinigung Übach` | 22 |
| `Fensterreinig. Übach-Pal.` | 24 |
| `Übach-Palenberg Fenster` | 23 |

Keyword Exact: `[fensterreinigung übach-palenberg]`, `[fensterreinigung uebach-palenberg]`

Budget 6 € · Max CPC 1,00 €

---

## 8. Kampanya: `IL-BRAND-SEARCH`

| Budget | 3 € | Max CPC | 0,40 € | Location | Aachen + Stammgebiet |

| Match | Keyword |
|-------|---------|
| Exact | `[ilyashan]` |
| Exact | `[ilyashan fensterreinigung]` |
| Phrase | `"ilyashan baesweiler"` |

**Final URL:** `https://ilyashan.de/de?...utm_campaign=IL-BRAND-SEARCH`

RSA: Pin1 `Ilyashan Fensterreinigung` (25) · H02 `Kückstr. 29 Baesweiler` (22)

---

## 9. CTA / Angebot URL (tüm sitelink + LP butonları)

```
https://ilyashan.de/de/angebot
  ?utm_source=google
  &utm_medium=cpc
  &utm_campaign={CampaignName}
  &utm_content={AdGroupName}
```

---

## 10. Kurulum sırası (operatör checklist)

1. [ ] PAUSE_ALL kanıtı  
2. [ ] Shared NEG-IL-GLOBAL  
3. [ ] ASSET-IL-ACCOUNT (6 sitelink + call + callout + snippet + location)  
4. [ ] Dynamic assets OFF  
5. [ ] IL-BAE-CORE oluştur · RSA · keywords · Manual CPC · Partners OFF · Presence  
6. [ ] Cross-check 12/12 → Enable BAE  
7. [ ] IL-AAC-CORE aynı → Enable  
8. [ ] 72s smoke (Network=Google search only; partners harcama=0)  
9. [ ] WUR + ALS  
10. [ ] PRICE  
11. [ ] BRAND  
12. [ ] UBP (LP 200)  
13. [ ] Sprint log satırları  

---

## 11. Çapraz uzmanlık imzası (yayın öncesi)

| Rol | Kontrol | İmza |
|-----|---------|------|
| R1 Architect | Hiyerarşi + isimler + bütçe | |
| R2 Keywords | Exact/Phrase + negatif | |
| R3 Competitor | SERP notu Aachen/BAE | |
| R4 Bids | Manual CPC tavanları | |
| R5 Landing | 200 + Neredeyim 5sn | |
| R6 RSA | 15H/4D + char + Pin | |
| R7 Tracking | Conv + UTM + call 60sn | |
| R8 QA | Search-only + 12/12 | |

Hepsi dolu olmadan **Enable yok**.
