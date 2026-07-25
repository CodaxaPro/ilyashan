# ADS — Hızlı başlangıç

**Durum:** Kurumsal Wave 1 build paketi hazır · Panelde önce **PAUSE ALL**

---

## Bugün — sıra bozulmaz

### 1) PAUSE

- [ ] [ADS-PAUSE-PROTOKOL.md](./ADS-PAUSE-PROTOKOL.md) — etkin kampanya = 0
- [ ] PMax / Display varsa pause (bir daha açma)

### 2) Gate-0 ölçüm

- [x] Site: form / tüm `tel:` / tüm WhatsApp → gtag event (kod hazır)
- [ ] Ads panel: 3 Event aksiyonu — [ADS-MEASUREMENT-GATE0.md](./ADS-MEASUREMENT-GATE0.md) · [Dönüşümler](https://ads.google.com/aw/conversions)
- [ ] `.env.local` + Vercel: üç `NEXT_PUBLIC_GOOGLE_ADS_*_SEND_TO` (snippet’ten yapıştır)
- [ ] Deploy + smoke: Angebot submit + WA + tel → Ads Dönüşümler
- [ ] Call reporting ≥60sn
- [ ] Keyword Planner Aachen + Stammgebiet export

### 3) Kurumsal kurulum

- [ ] Shared NEG + ASSET-IL-ACCOUNT (6 sitelink) — [ADS-ASSETS-SERP-STANDARD.md](./ADS-ASSETS-SERP-STANDARD.md)
- [ ] Dynamic assets **OFF**
- [ ] Search Partners **OFF**
- [ ] [ADS-ENTERPRISE-BUILD-WAVE1.md](./ADS-ENTERPRISE-BUILD-WAVE1.md) ile BAE → AAC
- [ ] LP 5sn testi — [ADS-LP-NERDEYIM-STANDARD.md](./ADS-LP-NERDEYIM-STANDARD.md)
- [ ] Cross-check 12/12 → Enable

### 4) 72 saat

- [ ] Network raporu: Search partners = **0 €**
- [ ] Search Terms → negatif
- [ ] QS / CTR ilk okuma
