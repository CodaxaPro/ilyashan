# PAUSE protokolü — tüm mevcut kampanyalar

**Amaç:** Eski / karma yapı **hemen durur**. Harcama sıfırlanır. Silme yok (audit + geri dönüş).  
**Sonra:** Yalnızca yeni kurumsal Wave 1 yapısı GO ile açılır.

---

## 1. Panelde (Google Ads UI)

1. Sol menü → **Kampanyalar**
2. Filtre: Durum = Etkin / Öğreniyor / uygun olanlar
3. Tüm satırları seç (üst checkbox)
4. **Düzenle → Duraklat** (Pause)
5. Doğrulama: Etkin kampanya sayısı = **0**
6. Performance Max / Display / Demand Gen varsa → ayrıca Pause (yeni yapıda **yeniden açılmayacak**)

## 2. Google Ads Editor (tercih — kurumsal)

1. Hesabı indir
2. Campaigns → Status = **Paused** (hepsi)
3. Post changes
4. UI’de yeniden kontrol: Etkin = 0

## 3. Pause sonrası kilit

| Kural | Değer |
|-------|-------|
| Eski kampanyaları silme | **YASAK** (30 gün sakla) |
| Eski kampanyaya bütçe / enable | **YASAK** |
| Yeni isim öneki | Yalnızca `IL-…` |
| Eski adı taşıma | Yasak — karışıklık |

## 4. Pause kanıtı (sprint log’a yaz)

```
PAUSE_ALL | tarih=YYYY-MM-DD | etkin_kampanya=0 | yapan=… | not=eski yapı arşiv
```

## 5. Yeni yapıya geçiş

Pause tamam → [ADS-ENTERPRISE-BUILD-WAVE1.md](./ADS-ENTERPRISE-BUILD-WAVE1.md)  
Cross-check 12/12 + Search-only → ilk 2 kampanya enable (AAC + BAE).
