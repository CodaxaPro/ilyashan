# Sadece Google Arama ağı — ortak siteler YASAK

**Politika (kesin):** Trafik yalnızca **Google’da yapılan aramalardan** gelsin.  
Google Arama Ortakları (Search Partners), Display, YouTube, Gmail, Discover vb. **kapalı**. Boş harcama kabul edilmez.

---

## 1. Google Ads’te net yapılacaklar (kampanya oluştururken)

### Arama kampanyası (Search) — zorunlu

Kampanya ayarları → **Ağlar (Networks)** / **Netzwerke**:

| Ayar | Değer | Almanca arayüz |
|------|-------|----------------|
| Google Arama | **AÇIK** | Google-Suche |
| Arama ortakları (Search partners) | **KAPALI** | Suchnetzwerkpartner / Suchpartner |
| Display Network | **KAPALI** (Search kampanyasında zaten olmamalı) | Displaynetzwerk |

**Adımlar (UI):**

1. Kampanya → Ayarlar (Einstellungen)  
2. “Ağlar” / “Netzwerke” bölümünü aç  
3. **“Arama ağı ortaklarını dahil et”** kutusunun işaretini kaldır  
4. Kaydet  

Yeni kampanya sihirbazında çoğu hesapta varsayılan olarak ortaklar **açık** gelir — **mutlaka elle kapat**.

### Kampanya türü kısıtı (boş harcamayı kökten keser)

| Tür | Ilyashan politikası |
|-----|---------------------|
| Search (Arama) | **İzinli** — tek kanal |
| Performance Max | **YASAK** (YouTube/Display/Gmail/Discover karışır) |
| Display | **YASAK** |
| Demand Gen / Video | **YASAK** |
| Shopping | Uygulanmaz |
| App | Uygulanmaz |

Local Services Ads (LSA) ayrı üründür; Search ile karıştırma. İleride açılacaksa ayrı karar + ayrı bütçe.

---

## 2. Konum — ortak “ilgi” trafiğini de kes

Ağ kapalı olsa bile yanlış konum ayarı israf üretir:

| Ayar | Değer |
|------|-------|
| Konum seçeneği | **Presence: People in or regularly in your targeted locations** |
| | Almanca: **Personen in Ihren Zielregionen (oder die sich regelmäßig dort aufhalten)** |
| **Kullanma** | “Presence or interest” / “Interessiert an …” |

Bu, Aachen dışı ama “Aachen’e ilgi duyan” tıklamaları keser.

---

## 3. Hesap / kampanya toplu kontrol

### Mevcut tüm Search kampanyaları

1. Kampanyalar listesi → sütunlara **“Ağ” / Network** ekle (mümkünse)  
2. Veya filtre: her kampanyayı tek tek aç → Networks  
3. Google Ads Editor ile toplu:
   - Search partners = Disabled  
   - Campaign type = Search  

### Google Ads Editor (hızlı toplu)

1. Kampanyaları indir  
2. Search campaigns satırlarında `Search partners` / `Partner suchen` = **Disabled**  
3. Post changes  

---

## 4. İsrafı yakalama — haftalık denetim (zorunlu)

Segment / boyut: **Ağ (Network)** veya **Network (with search partners)**

| Segment | Harcama | Politika |
|---------|---------|----------|
| Google search | İzinli | Devam |
| Search partners | **0 € olmalı** | >0 ise derhal OFF + incele |
| Display Network | **0 €** | Kampanya türü hatası |
| Cross-network (PMax) | **0 €** | PMax varsa pause |

**Alarm kuralı:** Search partners’ta tek euro bile harcandıysa → kampanyayı pause → ayarı düzelt → GO kapısından tekrar geç.

GA4’te de `sessionDefaultChannelGroup` / `sessionSource` kontrolü: beklenen `google / cpc` ve landing Ads UTM. Garip referrer’lar varsa Ads Network raporuna bak.

---

## 5. İsimlendirme kilidi

Kampanya adında `-SEARCH` zorunlu.  
`-PMAX`, `-DISP`, `-DG` adlı kampanya **oluşturulmaz**.

Cross-check kapısı #3: Networks = Google Search only; Partners OFF — fail = **NO-GO**.

---

## 6. Sık tuzaklar

| Tuzak | Sonuç | Çözüm |
|-------|--------|-------|
| Sihirbazda “önerilen” ağlar açık | Partner sitelerde tıklama | Elle OFF |
| Eski kampanyada partners açık unutuldu | Sessiz israf | Toplu audit |
| Performance Max “kolay” | Kontrollü olmayan yerler | Kullanma |
| Presence or interest | Bölge dışı tıklama | Presence only |
| Broad match + partners | Çift israf | Partners OFF + Exact/Phrase |

---

## 7. Onay cümlesi (yayın öncesi yazılır)

> Bu kampanya yalnızca Google Arama ağında yayınlanır. Arama ortakları kapalıdır. Display / PMax / Demand Gen yoktur. Konum: Presence only.

Sprint log’a kampanya satırına `NET=GOOGLE_SEARCH_ONLY` yazılır.
