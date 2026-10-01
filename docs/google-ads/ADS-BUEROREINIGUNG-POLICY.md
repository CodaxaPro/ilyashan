# Büroreinigung — Google Ads / SEO Policy (P5)

**Status:** Separate product line from Fensterreinigung. Do not mix campaigns, LP finals, or RSA copy.

**Site URLs (canonical base `https://ilyashan.de/de`):**
- Hub: `/bueroreinigung`
- Offer / calculator: `/bueroreinigung/angebot`
- Admin (noindex): `/admin/reinigung`

## Hard separation

| Rule | Detail |
|------|--------|
| Final URL | Only `/de/bueroreinigung` or `/de/bueroreinigung/angebot` (+ UTM). Never Fenster LP as Büro final URL. |
| Keywords | Büro / Unterhalt / Gewerbe-Reinigung intent only. No Fensterputzer / Glasreinigung / Solar as positives. |
| Negatives | Add Fenster/Glas/Solar/privat DIY cluster as campaign negatives on any Büro search campaign. |
| RSA | Copy = Büroreinigung / Gewerbe / strukturiertes Angebot. No “Fenster streifenfrei”. |
| Measurement | Same GTM/Ads tag stack; conversion events must distinguish `serviceLine=buero` (quote submit). |
| Geo | Same service region (Aachen / Baesweiler circle). Presence panel before enable. |

## Organic SEO

- Schema: `getBueroServiceSchema()` on hub + Angebot only (not homepage Fenster catalog).
- Sitemap includes both Büro URLs.
- Hub stays short conversion landing (no 2.500+ word overlay).
- Long-form geo/intent Büro articles: only under `/intent/*` or `/ratgeber/*` if/when created — never inject into Fenster money pages.

## Launch gate

1. Hub + Angebot live, schema present, sitemap listed.
2. Ads campaign PAUSED until Presence + negatives + final URL QA.
3. Fenster Wave-1 campaigns untouched.
