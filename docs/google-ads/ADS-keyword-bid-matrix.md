# Keyword + teklif matrisi

**Kaynak (ulusal DE):** Performance Suite Keyword DB · güncelleme 17.06.2026  
**Yerel Aachen:** Google Keyword Planner zorunlu (Gate-0) — aşağıdaki CPC’ler **başlangıç bandı**, nihai teklif değil.

---

## 1. Intent × değer matrisi

| Intent | Örnek sorgu | Ticari değer | Tipik CPC bandı (DE) | Teklif önceliği |
|--------|-------------|--------------|----------------------|-----------------|
| Transactional local | fensterreinigung aachen | Çok yüksek | 0,90–1,60 € | Max |
| Price local | fensterreinigung preis aachen | Çok yüksek | 1,40–2,10 € | Max |
| Synonym local | fensterputzer aachen | Yüksek | 0,70–1,30 € | Yüksek |
| Service upsell | solaranlagen reinigung aachen | Yüksek (ticket) | 1,00–2,00 €* | Orta |
| Generic national | fensterreinigung | Orta (geo’suz israf) | ~0,91 € | **Yalnızca Presence geo ile** veya kapalı |
| DIY / bilgi | fenster putzen anleitung | Düşük | düşük | Negatif |
| Job | fensterputzer job | Sıfır | — | Negatif |
| Broad reinigung | gebäudereinigung aachen | Düşük-orta (yanlış hizmet) | 3–4 €+ | Dikkat / ayrı veya kapalı |

\* Tahmin — Planner ile doğrula.

---

## 2. Ulusal benchmark (doğrulanmış rakamlar)

| Keyword | SV (DE/ay) | CPC (DE) | Ads rekabet sinyali |
|---------|------------|----------|---------------------|
| fensterreinigung | 14.800 | 0,91 € | Çekirdek |
| fensterputzer | 8.100 | 0,71 € | Çekirdek synonym |
| glasreinigung | 2.900 | 1,95 € | Daha pahalı |
| fenster reinigung | 2.400 | 1,59 € | Varyasyon |
| fenster reinigen | 1.900 | 1,09 € | DIY karışık — negatif izle |
| fensterputzer für privathaushalt | 1.600 | 1,27 € | Güçlü B2C |
| fensterreinigung preise | 720 | 1,59 € | Price intent |
| preis für fensterreinigung | 720 | 1,49 € | Price |
| kosten fensterputzer | 590 | 1,16 € | Price |
| fensterputzen preise | 210 | 1,83 € | Price |
| gebäudereinigung | 22.200 | 4,18 € | **Genelde kaçın** (yanlış niyet + pahalı) |
| reinigungsfirma | 12.100 | 2,75 € | Dikkat |

**Yerel uplift kuralı:** Aachen gibi rekabetli alanda Exact local CPC ≈ ulusal × **1,15–1,40**. Planner low/high bid bunu geçersiz kılar.

---

## 3. Aachen Exact set — önerilen max CPC tavanı (Faz 1)

| Keyword | Match | Önerilen max CPC | Final URL |
|---------|-------|------------------|-----------|
| fensterreinigung aachen | Exact | 1,25 € | `/fensterreinigung-aachen` |
| fensterputzer aachen | Exact | 1,05 € | `/fensterputzer-aachen` |
| glasreinigung aachen | Exact | 1,70 € | glas LP veya CORE |
| fensterreinigung preis aachen | Exact | 1,70 € | PRICE LP |
| fensterreinigung kosten aachen | Exact | 1,60 € | kosten LP |
| professionelle fensterreinigung aachen | Exact | 1,20 € | CORE |
| fensterreinigung laurensberg | Exact | 0,75 € | CORE hub |
| fensterreinigung brand | Exact | 0,75 € | CORE hub |
| fensterreinigung haaren | Exact | 0,70 € | CORE hub |
| ilyashan | Exact | 0,35 € | `/de` |

---

## 4. Teklif stratejisi karşılaştırma (bu hesap için karar)

| Strateji | Ne zaman | Artı | Eksi | Ilyashan kararı |
|----------|----------|------|------|-----------------|
| Manual CPC | İlk 14 gün / düşük veri | Tam kontrol, israf az | İş yükü | **Wave 1 varsayılan** |
| Maximize Clicks | Tracking yoksa | Trafik | Düşük kalite tıklama | Kullanma (tracking var) |
| Maximize Conversions | ≥15 conv/30g | Otomasyon | Erken pahalı | Faz 2 |
| Target CPA | Stabilize CPA | Verim | Erken hedef = ölüm | Faz 3 |
| Target Impression Share | Brand / savunma | Üst sıra | Pahalı | Yalnızca BRAND veya BAE Exact |
| Enhanced CPC | Manual ile | Küçük otomatik | Kontrol azalır | Opsiyonel +% |
| Portfolio bid | Çok kampanya | Merkezi | Pilot için erken | Wave 2+ |

**“İlk sıra ucuza” formülü:**  
`Ad Rank = QS × Bid` → QS 9 + 1,00 € bid, çoğu zaman QS 5 + 2,00 €’dan üstte çıkar.  
Bu yüzden LP↔keyword↔headline hizası, teklif yükseltmekten önce gelir.

---

## 5. CPA ekonomisi (teklif tavanı hesabı)

```
Max CPA = Ortalama net sipariş değeri × Hedef kâr payı × Close rate
```

Örnek senaryo (düzeltin):

| Varsayım | Değer |
|----------|-------|
| Ort. sipariş (Privat) | 120 € |
| Brüt marj | %55 → 66 € |
| Lead→müşteri close | %40 |
| Max CPA | 66 × 0,40 = **26,40 €** |

Güvenli operasyon bandı: **CPA 20–32 €**.  
CPC 1,20 € ve CR %8 → CPA ≈ 15 € (sağlıklı).  
CPC 1,20 € ve CR %3 → CPA ≈ 40 € (alarm).

---

## 6. Keyword Planner doğrulama protokolü (her geo)

1. Location: şehir + “People in”  
2. Dil: Deutsch  
3. Network: Google  
4. Export: Keyword + Avg. monthly searches + Competition + Top of page bid (low/high) + Ad impression share  
5. Bu matrise yapıştır → “Planner override” sütunu doldur  
6. High bid’in %85’i ile başla; 72 saat auction insight sonrası ayarla  

**Çıktı dosya adı:** `planner-{slug}-{YYYYMMDD}.csv` (hesap dışına güvenli sakla; repo’ya secret koyma)

---

## 7. Negatif öncelik (Search Terms’den beslenir)

İlk hafta beklenen:

- DIY: selber, anleitung, tipps, putzen lernen  
- E-ticaret: kaufen, amazon, set, gerät, unger  
- İş: job, gehalt, ausbildung  
- Yanlış hizmet: büroreinigung only, treppenhaus (isteğe bağlı), holzreinigung  
- Coğrafi sızıntı: maastricht, kerkrade, heerle, belgien  

---

## 8. Derin analiz kuyruğu (her kelime için)

Her Exact için doldurulacak mini kart:

```
Keyword:
SV local:
Competition:
Bid low/high:
Rakip 1-3 (Ads):
Bizim QS tahmini:
Final URL:
RSA pin uyumu: E/H
Max CPC:
Status: GO / HOLD / KILL
```

Aachen çekirdek 10 kelime için kartlar Sprint 0’da tamamlanır (Gate-0).
