# Ilyashan — Google Ads × Landing Page Komuta Merkezi

**Proje kökü:** `/Users/zeynephancer/Desktop/ilyashan` — tek kaynak. TreuePay’de Ads çalışması yok.
**Site:** https://ilyashan.de

**Proje kökü:** `/Users/zeynephancer/Desktop/ilyashan` (TreuePay değil)  
**Site:** https://ilyashan.de  

**Anahtar kelimeler:** `google ads`, `adwords`, `ilyashan`, `fensterreinigung aachen`, `kampanya`, `teklif`, `landing page`

Bu klasör, **ilyashan.de** için Google Ads + coğrafi landing page ağının **tek devam noktasıdır**. Önceki karmaşık hesap yapılarını buradaki sıfır-hata protokolüyle değiştiririz.

**Son güncelleme:** 2026-07-24  
**Pilot:** Aachen Grubu (Wave 1)  
**Hedef:** Az bütçe ile yüksek verim — ilk sayfa üst sıra, Quality Score odaklı, geo-intent hizalı

---

## 30 saniyede devam

1. **[ADS-BAGLANTI-KONTROL.md](./ADS-BAGLANTI-KONTROL.md)** — API bağlan; agent için yalnızca **okey**  
2. **[ADS-PAUSE-PROTOKOL.md](./ADS-PAUSE-PROTOKOL.md)** — tüm eski kampanyaları duraklat  
3. **[ADS-ENTERPRISE-BUILD-WAVE1.md](./ADS-ENTERPRISE-BUILD-WAVE1.md)** — kurumsal kurulum paketi  
4. **[ADS-ASSETS-SERP-STANDARD.md](./ADS-ASSETS-SERP-STANDARD.md)** — eklentiler / SERP görünüm  
5. **[ADS-LP-NERDEYIM-STANDARD.md](./ADS-LP-NERDEYIM-STANDARD.md)** — landing “neredeyim”  
6. **[ADS-google-search-only.md](./ADS-google-search-only.md)** — yalnızca Google Arama  
7. **[ADS-cross-check-protocol.md](./ADS-cross-check-protocol.md)** — GO kapısı  
8. **[ADS-PRESENCE-PANEL.md](./ADS-PRESENCE-PANEL.md)** — şehir Presence (enable öncesi zorunlu)  

---

## Klasör haritası

| Dosya | Amaç |
|-------|------|
| [ADS-BAGLANTI-KONTROL.md](./ADS-BAGLANTI-KONTROL.md) | API bağlan · agent yazma kontrolü |
| [ADS-PAUSE-PROTOKOL.md](./ADS-PAUSE-PROTOKOL.md) | Tüm kampanyaları pause |
| [ADS-ENTERPRISE-BUILD-WAVE1.md](./ADS-ENTERPRISE-BUILD-WAVE1.md) | Kampanya→AG→kelime→RSA→URL→teklif |
| [ADS-ASSETS-SERP-STANDARD.md](./ADS-ASSETS-SERP-STANDARD.md) | 6+ sitelink, call, callout, snippet |
| [ADS-LP-NERDEYIM-STANDARD.md](./ADS-LP-NERDEYIM-STANDARD.md) | LP geo + SEO uyum standardı |
| [ADS-DEVAM-hizli-baslangic.md](./ADS-DEVAM-hizli-baslangic.md) | Oturum açılışı |
| [ADS-calisma-sekli-playbook.md](./ADS-calisma-sekli-playbook.md) | Görev yönetimi + uzman rolleri |
| [ADS-aachen-kampanya-blueprint.md](./ADS-aachen-kampanya-blueprint.md) | Aachen özet blueprint |
| [ADS-geo-master-map.md](./ADS-geo-master-map.md) | Şehir / semt rollout |
| [ADS-lp-final-url-matrix.md](./ADS-lp-final-url-matrix.md) | Landing ↔ reklam eşlemesi |
| [ADS-keyword-bid-matrix.md](./ADS-keyword-bid-matrix.md) | Kelime + teklif |
| [ADS-competitor-intel.md](./ADS-competitor-intel.md) | Rakip |
| [ADS-rsa-ad-copy-bank.md](./ADS-rsa-ad-copy-bank.md) | Başlık / açıklama |
| [ADS-cross-check-protocol.md](./ADS-cross-check-protocol.md) | Çapraz doğrulama |
| [ADS-google-search-only.md](./ADS-google-search-only.md) | Ortak siteler yasak |
| [ADS-PRESENCE-PANEL.md](./ADS-PRESENCE-PANEL.md) | Panelde şehir Presence · enable kapısı |
| [ADS-BUEROREINIGUNG-POLICY.md](./ADS-BUEROREINIGUNG-POLICY.md) | Büroreinigung Ads/SEO ayrımı (Fenster’den ayrı) |
| [ADS-uzmanlik-kapsama-denetimi.md](./ADS-uzmanlik-kapsama-denetimi.md) | Uzmanlık skorları |
| [ADS-yapilacaklar-backlog.md](./ADS-yapilacaklar-backlog.md) | Backlog |
| [ADS-sprint-log.md](./ADS-sprint-log.md) | Log |

---

## Temel teşhis (neden karmaşıklaştı)

| Hata | Sonuç | Bu sistemde çözüm |
|------|--------|-------------------|
| Tek kampanyada tüm şehirler + tüm niyetler | Düşük Quality Score, pahalı tıklama | Kampanya = **1 geo cluster × 1 intent** |
| Ana sayfaya genel trafik | Mesaj uyumsuzluğu | Final URL = **şehir LP** |
| Angebot’a doğrudan ucuz tıklama | Form terk, yüksek CPA | Fiyat niyeti → fiyat LP; CTA → Angebot + UTM |
| “Presence or interest” geo | Dış bölge israfı | Yalnızca **Presence: people in** |
| Erken Target CPA | Algoritma körlüğü | Önce Manual/Max Conv → veri eşiği → tCPA |

---

## Dönüşüm zinciri (tek gerçek)

```
Arama (şehir + hizmet)
  → RSA (şehir + vaat + fiyat sinyali)
  → Final URL: /de/fensterreinigung-{slug}  (veya intent varyantı)
  → CTA: /de/angebot?utm_source=google&utm_medium=cpc&...
  → Conversion: Wizard submit / Call / WhatsApp
```

**Angebot (tek conversion LP):** `https://ilyashan.de/de/angebot`  
**HQ:** Baesweiler · Kückstr. 29 · Tel. 0173 3828354 · 4.9★ Google

---

## Uzmanlık rolleri (Cursor + insan)

Her sprint’te aynı roller **zorunlu checklist** olarak çalışır — tek kişi bile olsa rol sırası bozulmaz:

1. Account Architect — yapı / isimlendirme / bütçe  
2. Keyword Analyst — Planner + negatifler + match type  
3. Bid Strategist — Manual → Max Conv → tCPA merdiveni  
4. Competitive Intel — SERP + LSA + portal rakipler  
5. Landing Page CRO / SEO — mesaj uyumu, hız, CTA  
6. Tracking Engineer — GA4 / Ads / call / UTM  
7. QA Gatekeeper — yayın öncesi çapraz kontrol  

Detay: [ADS-calisma-sekli-playbook.md](./ADS-calisma-sekli-playbook.md)

---

## Kaynak güven seviyesi

| Veri | Kaynak | Güven |
|------|--------|-------|
| DE ulusal SV / CPC (fensterreinigung vb.) | Performance Suite Keyword DB · 17.06.2026 | Orta-yüksek (ulusal) |
| Yerel Aachen exact CPC | Google Keyword Planner (hesap içi) | **Gate-0 zorunlu** |
| LP canlılık | HTTP 200 doğrulama | Yüksek |
| Bid best practice | Google Ads Help + 2026 yerel hizmet rehberleri | Yüksek |

**Kural:** Ulusal CPC tahminleri **bütçe tavanı değil, başlangıç aralığıdır**. Canlı teklif yalnızca Keyword Planner + ilk 7 gün auction insight sonrası kilitlenir.
