# Geo master map — rollout sırası

**Kaynak:** ilyashan.de Einsatzgebiet (canlı site)  
**Kural:** Wave tamamlanmadan sonraki Wave’e bütçe taşıma. Her Wave’de önce CORE, sonra PRICE.

---

## Wave 1 — Aachen Grubu (pilott) · ŞİMDİ

### 1A Stammgebiet (HQ halkası)

| Öncelik | Yer | Slug | Mesafe sinyali (siteden) | LP durumu | Kampanya kodu |
|---------|-----|------|--------------------------|-----------|---------------|
| 1 | Baesweiler | `baesweiler` | HQ / Kückstr. 29 | ✅ canlı | `IL-BAE-*` |
| 2 | Würselen | `wurselen` | ~10 Dk | ✅ canlı | `IL-WUR-*` |
| 3 | Alsdorf | `alsdorf` | ~12 Dk | ✅ canlı | `IL-ALS-*` |
| 4 | Übach-Palenberg | `uebach-palenberg` | Stammgebiet | ⚠️ doğrula | `IL-UBP-*` |

### 1B Aachen Stadt + Stadtteile

| Öncelik | Yer | Slug / not | LP durumu | Kampanya |
|---------|-----|------------|-----------|----------|
| 1 | Aachen (şehir) | `aachen` | ✅ `/fensterreinigung-aachen` | `IL-AAC-CORE` |
| 2 | Aachen-Mitte | geo target + keyword | LP: aachen hub | aynı kampanya AG |
| 3 | Brand | keyword / radius | hub | `IL-AAC-CORE` |
| 4 | Haaren | keyword / radius | hub | `IL-AAC-CORE` |
| 5 | Laurensberg | keyword / radius | hub | `IL-AAC-CORE` |
| 6 | Richterich | keyword / radius | hub | `IL-AAC-CORE` |
| 7 | Eilendorf | keyword / radius | hub | `IL-AAC-CORE` |
| 8 | Forst | keyword / radius | hub | `IL-AAC-CORE` |
| 9 | Kornelimünster | keyword / radius | hub | `IL-AAC-CORE` |
| 10 | Walheim | keyword / radius | hub | `IL-AAC-CORE` |

**Yapı kararı (kanıt):** Aachen Stadtteile **ayrı kampanya değil** — `IL-AAC-CORE` içinde `AG-STADTTEIL` + Exact `[fensterreinigung brand]` vb. Veri parçalanmasını önler; CPC farkı oluşursa sonra split.

**Aynı model (Wave 1 uygulandı, PAUSED):**
- `IL-BAE-CORE` → `AG-ORTSTEIL` (Setterich, Oidtweiler, Loverich, Puffendorf, Beggendorf)
- `IL-WUR-CORE` → `AG-ORTSTEIL` (Bardenberg, Broichweiden, Weiden)
- `IL-ALS-CORE` → `AG-ORTSTEIL` (Hoengen, Mariadorf, Ofden)
- Semt/Ortsteil Final URL = şehir CORE LP (`utm_content=AG-STADTTEIL` / `AG-ORTSTEIL`)

---

## Wave 2 — Yakın çevre

| Öncelik | Yer | Slug | LP | Kampanya |
|---------|-----|------|-----|----------|
| 1 | Herzogenrath | `herzogenrath` | ✅ | `IL-HER-*` |
| 2 | Eschweiler | `eschweiler` | doğrula | `IL-ESC-*` |
| 3 | Stolberg | `stolberg` | doğrula | `IL-STO-*` |
| 4 | Roetgen | `roetgen` | doğrula | `IL-ROE-*` |

---

## Wave 3 — Geniş halka (yalnızca Wave 1–2 CPA sağlıklıysa)

| Yer | Slug | Not |
|-----|------|-----|
| Düren | `dueren` | Daha uzak — Anfahrts mesajı net |
| Jülich | `juelich` | |
| Geilenkirchen | `geilenkirchen` | |
| Heinsberg | `heinsberg` | |
| Erkelenz | `erkelenz` | |
| Monschau | `monschau` | Turizm / ikinci konut sinyali |

---

## Köy / Ortsteil genişletme kuralı

1. Aylık arama hacmi (Planner, şehir filtresi) ≥ 10 **veya**
2. Organik LP zaten var **veya**
3. Mevcut müşteri yoğunluğu yüksek (CRM / sipariş zip)

Aksi halde: ana şehir kampanyasında **radius Presence** yeterli — her köye ayrı kampanya **yasak** (bütçe parçalanır).

---

## LP slug sözlüğü (doğrulanmış)

| Görünen ad | URL slug |
|------------|----------|
| Würselen | `wurselen` (**ü → ue değil, u**) |
| Übach-Palenberg | muhtemel `uebach-palenberg` — yayın öncesi 200 test |
| Düren | `dueren` |
| Jülich | `juelich` |

**404 kuralı:** `fensterreinigung-wuerselen` → 404. Doğru: `wurselen`.
