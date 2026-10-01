# Landing page ↔ Final URL ↔ Angebot matrisi

**Kural:** Reklam tıklaması asla “yanlış şehir” veya genel DE anasayfasına gitmez (BRAND hariç).  
**Conversion URL:** her zaman Angebot + UTM.

---

## 1. URL rolleri

| Rol | URL | Ads kullanımı |
|-----|-----|---------------|
| Hub | `https://ilyashan.de/de` | Brand / genel remarketing |
| Geo CORE LP | `https://ilyashan.de/de/fensterreinigung-{slug}` | CORE kampanya Final URL |
| Synonym LP | `https://ilyashan.de/de/fensterputzer-{slug}` | Fensterputzer AG |
| Price LP | `https://ilyashan.de/de/fensterreinigung-preis-{slug}` | PRICE kampanya |
| Kosten LP | `https://ilyashan.de/de/fensterreinigung-kosten-{slug}` | PRICE varyant |
| Conversion | `https://ilyashan.de/de/angebot` | Sitelink + tüm CTA |
| Gutschein | (sitedeki gutschein path) | Sitelink / ayrı düşük bütçe |

---

## 2. Wave 1 — doğrulanmış eşleme

| Geo | Intent | Final URL | CTA / Sitelink | UTM campaign |
|-----|--------|-----------|----------------|--------------|
| Aachen | CORE | `/de/fensterreinigung-aachen` | `/de/angebot` | `IL-AAC-CORE-SEARCH` |
| Aachen | Fensterputzer | `/de/fensterputzer-aachen` | `/de/angebot` | `IL-AAC-CORE-SEARCH` |
| Aachen | PRICE | `/de/fensterreinigung-preis-aachen` * | `/de/angebot` | `IL-AAC-PRICE-SEARCH` |
| Baesweiler | CORE | `/de/fensterreinigung-baesweiler` | `/de/angebot` | `IL-BAE-CORE-SEARCH` |
| Würselen | CORE | `/de/fensterreinigung-wurselen` | `/de/angebot` | `IL-WUR-CORE-SEARCH` |
| Alsdorf | CORE | `/de/fensterreinigung-alsdorf` | `/de/angebot` | `IL-ALS-CORE-SEARCH` |
| Herzogenrath | CORE | `/de/fensterreinigung-herzogenrath` | `/de/angebot` | Wave 2 |
| Brand / vs. | CORE | Aachen hub | `/de/angebot` | `IL-AAC-CORE-SEARCH` |

\* Price/Kosten LP 404 ise geçici olarak CORE LP + RSA’da fiyat vurgusu; LP backlog’a yaz.

---

## 3. Aachen LP’den keşfedilen intent ağı (organik + Ads aday)

Aachen CORE sayfasındaki “Passend zu Aachen” grid’i — her biri potansiyel Exact AG veya sitelink:

| Tema | Beklenen path kalıbı | Ads öncelik |
|------|----------------------|-------------|
| Fensterputzer Aachen | `/fensterputzer-aachen` | P0 — ayrı AG |
| Fenster putzen Aachen | `/fenster-putzen-aachen` | P2 — DIY riski |
| Glasreinigung Aachen | `/glasreinigung-aachen` | P1 |
| Fensterreiniger Aachen | `/fensterreiniger-aachen` | P1 |
| Preis Aachen | `/fensterreinigung-preis-aachen` | P0 PRICE |
| Kosten Aachen | `/fensterreinigung-kosten-aachen` | P0 PRICE |
| Firma Aachen | `/fensterreinigung-firma-aachen` | P2 |
| Professionelle … | `/professionelle-fensterreinigung-aachen` | P1 |
| Solar | `/solaranlagen-reinigung-aachen` | P1 SERVICE |
| Glasfassaden | `/glasfassaden-reinigung-aachen` | P2 |
| Schaufenster | `/schaufenster-reinigung-aachen` | P2 |
| Wintergarten | `/wintergarten-reinigung-aachen` | P2 |
| Wartungsvertrag | `/wartungsvertrag-fenster-aachen` | P1 |
| Hausmeister | `/hausmeister-fenster-aachen` | P2 |
| Geschenk | gutschein | P3 |

**Yayın öncesi:** her path için 200 kontrolü. 404 → Ads’te kullanma.

---

## 4. Mesaj uyumu (Quality Score motoru)

| Reklam vaadi | LP’de karşılık (zorunlu) |
|--------------|---------------------------|
| Şehir adı | H1 + title |
| Kein Anfahrtszuschlag | Hero + FAQ |
| Festpreis in 24h | Hero + CTA altı |
| ab 49 € | Leistungen / fiyat bloğu |
| 4.9★ / 500+ | Trust satırı |
| Versichert | Why / FAQ |
| Preis berechnen | CTA → Angebot |

Uyumsuzluk = QS düşüşü = daha pahalı tıklama.

---

## 5. Angebot derin link parametreleri (öneri)

Wizard’a niyet taşımak için (site destekliyorsa):

```
/de/angebot?utm_campaign=IL-AAC-CORE-SEARCH&service=privat
/de/angebot?utm_campaign=IL-AAC-PRICE-SEARCH&intent=price
```

Destek yoksa yalnızca UTM yeterli; geliştirme backlog’una yazılır.

---

## 6. LP yayın kapısı (Ads’ten önce)

- [ ] 200 OK mobil + desktop  
- [ ] H1 = birincil keyword teması  
- [ ] Tek birincil CTA  
- [ ] Telefon click-to-call  
- [ ] Form / wizard erişilebilir  
- [ ] Yasal: Impressum / Datenschutz link  
- [ ] Reklam metniyle birebir vaat eşleşmesi  

Fail → kampanya oluşturma **yasak**.
