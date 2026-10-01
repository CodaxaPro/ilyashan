# Çapraz doğrulama protokolü — GO / NO-GO

Her kampanya yayınından önce **12 kapı**. Biri kırmızıysa yayın yok.

---

## Kapı listesi

| # | Kontrol | Nasıl | Geçiş |
|---|---------|-------|-------|
| 1 | Conversion tracking canlı | Test dönüşüm Ads’te görünür (veya tag assistant) | |
| 2 | Location = Presence only | Kampanya ayarları ekranı | |
| 3 | **Google Search ONLY** · Search Partners OFF · PMax/Display yok | Ayarlar + Network raporu 0 € partners | |
| 4 | Final URL HTTP 200 | Mobil + desktop curl/browser | |
| 5 | H1 ↔ birincil Exact keyword | Gözle | |
| 6 | RSA Pin 1 = şehir + hizmet | Ads editör | |
| 7 | Fiyat / USP LP’de var | Gözle | |
| 8 | Negatif liste bağlı | Shared library | |
| 9 | Max CPC ≤ ekonomik tavan | CPA modeli | |
| 10 | UTM kampanya adı = kampanya adı | URL builder | |
| 11 | Call extension doğru numara | 0173 3828354 | |
| 12 | Rakip SERP notu bu geo için var | competitor intel | |

**Skor:** 12/12 = GO · ≤11 = NO-GO

---

## Çapraz sorgu seti (derin)

Aynı iddiayı **üç kaynaktan** doğrula:

| İddia | Kaynak A | Kaynak B | Kaynak C |
|-------|----------|----------|----------|
| CPC bandı | Keyword Planner | Ulusal benchmark tablo | İlk 72s auction |
| LP doğru mu | Canlı site | Ads Final URL preview | GA4 landing page |
| Mesaj uyumu | RSA | LP H1 | GBP kısa açıklama |
| Geo kapsama | Ads location | Site Einsatzgebiet | Operasyon kapasitesi |
| CPA tavanı | Marj hesabı | Close rate CRM | Gerçek 14g CPA |

Çelişki varsa **en muhafazakâr** değerle ilerle (daha düşük bid / daha dar geo).

---

## Yayın sonrası 72 saat smoke

- [ ] Harcama > 0  
- [ ] Tıklama geliyor  
- [ ] Search Terms’de en az 5 negatif adayı işlendi  
- [ ] Dönüşüm veya en az micro-conv (call)  
- [ ] Disapproved ad yok  
- [ ] Yanlış ülke/şehir tıklaması yok  

Fail → kampanyayı pause, playbook’a dön.
