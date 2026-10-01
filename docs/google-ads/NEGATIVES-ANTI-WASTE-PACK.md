# Shared anti-waste negatives — Ilyashan (near-zero waste)

Account: `626-050-2839`  
Purpose: Block DIY / job / free / wrong-vertical / far-geo / portal waste on **all ENABLED** Search campaigns.  
Status: Package ready for Google Ads Editor import (live API apply blocked until Supermetrics write token or `GOOGLE_ADS_DEVELOPER_TOKEN` + `REFRESH_TOKEN` filled in `.env.local`).

## Import (fastest — do this now)

### Option A — Campaign negatives (one CSV)

1. Open **Google Ads Editor** → download account `626-050-2839`
2. **Account → Import → From file** →  
   `docs/google-ads/NEGATIVES-ANTI-WASTE-EDITOR.csv`
3. Review → **Post**
4. Duplicates are fine (Editor skips / merges)

**1259 rows** across 17 campaigns.

### Option B — Shared lists (cleaner long-term)

1. Import `docs/google-ads/NEGATIVES-ANTI-WASTE-SHARED-LISTS.csv` as shared negative lists  
   - `IL-SHARED-ANTI-WASTE-CORE`  
   - `IL-SHARED-ANTI-WASTE-PRICE`  
   - `IL-SHARED-ANTI-WASTE-BRAND`
2. Attach lists via `docs/google-ads/NEGATIVES-ANTI-WASTE-LIST-ASSIGN.csv`
3. Post

---

## Campaign mapping

### CORE → full pack (DIY + geo + portal + **price** negatives)

IL-AAC-CORE-SEARCH, IL-BAE-CORE-SEARCH, IL-WUR-CORE-SEARCH, IL-ALS-CORE-SEARCH,  
IL-ESC-CORE-SEARCH, IL-HER-CORE-SEARCH, IL-STO-CORE-SEARCH, IL-UBP-CORE-SEARCH,  
IL-ROE-CORE-SEARCH, IL-JUL-CORE-SEARCH, IL-GEI-CORE-SEARCH, IL-HEI-CORE-SEARCH,  
IL-ERK-CORE-SEARCH, IL-MON-CORE-SEARCH  

*(IL-DUE-CORE-SEARCH PAUSED — skip until re-enabled)*

### PRICE → same DIY/geo/portal, **exclude** preis/kosten

IL-AAC-PRICE-SEARCH, IL-BAE-PRICE-SEARCH

### BRAND → light DIY/portal only

IL-BRAND-SEARCH

---

## CORE — Broad

auto, autoscheibe, scheibenwischer, fahrzeug, pkw, lkw,  
job, jobs, stellenangebot, stellenanzeige, ausbildung, gehalt, bewerbung, lehrling,  
gratis, kostenlos, kostenfrei, umsonst,  
diy, tipps, anleitung, tutorial, fassade, selber, selbst,  
gebäudereinigung, youtube, hausmitteln, klarspüler, schlieren, osmose,  
spülmittel, essig, zeitungspapier, putzanleitung,  
bonn, köln, limburg, wuppertal, borken, düsseldorf, nippes,  
dortmund, krefeld, mönchengladbach, leverkusen, frankfurt, hamburg, berlin, münchen,  
essen, duisburg, siegen, bochum, gelsenkirchen, münster, maastricht

## CORE — Phrase

preise, preis, kosten, was kostet,  
myhammer, groupon, check24, aroundhome, blauarbeit, kleinanzeigen,  
ohne streifen, wie putze, wie putzt, wie reinige, streifenfrei putzen,  
frag mutti, mit klarspüler, mit hausmitteln, richtig fenster,  
how to clean windows, window cleaning tip

## PRICE — exclude from Phrase

preise, preis, kosten, was kostet

## BRAND — Broad

auto, job, jobs, gratis, kostenlos, diy, anleitung, selber, youtube, hausmitteln, klarspüler, tutorial

## BRAND — Phrase

myhammer, groupon, check24, wie putze, ohne streifen, frag mutti, kleinanzeigen

---

## After import — 48h check

1. Search terms report → 0 spend on DIY/job/far-city/portal  
2. CORE still gets bare `fensterreinigung` in Presence cities  
3. PRICE still gets preis/kosten queries  
4. Abs. top IS / wasted IS% — note trends, do not raise bids for waste recovery

## Why not 100% zero risk

Google still serves close variants. Shared lists + weekly Search Terms review is the residual control. Aim: **wasted click share → near 0**, not “never any bad impression.”
