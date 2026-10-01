#!/usr/bin/env python3
"""Apply account-wide anti-waste campaign negatives (append-only).

Requires GOOGLE_ADS_DEVELOPER_TOKEN + GOOGLE_ADS_REFRESH_TOKEN in .env.local.
Default: dry-run. Pass --apply to write.
"""

from __future__ import annotations

import argparse
import sys

from _env import client_config_from_env, customer_id, load_ads_env

CORE_BROAD = [
    "auto", "autoscheibe", "scheibenwischer", "fahrzeug", "pkw", "lkw",
    "job", "jobs", "stellenangebot", "stellenanzeige", "ausbildung", "gehalt",
    "bewerbung", "lehrling", "gratis", "kostenlos", "kostenfrei", "umsonst",
    "diy", "tipps", "anleitung", "tutorial", "fassade", "selber", "selbst",
    "gebäudereinigung", "youtube", "hausmitteln", "klarspüler", "schlieren",
    "osmose", "spülmittel", "essig", "zeitungspapier", "putzanleitung",
    "bonn", "köln", "limburg", "wuppertal", "borken", "düsseldorf", "nippes",
    "dortmund", "krefeld", "mönchengladbach", "leverkusen", "frankfurt",
    "hamburg", "berlin", "münchen", "essen", "duisburg", "siegen", "bochum",
    "gelsenkirchen", "münster", "maastricht",
]
CORE_PHRASE = [
    "preise", "preis", "kosten", "was kostet", "myhammer", "groupon", "check24",
    "aroundhome", "blauarbeit", "kleinanzeigen", "ohne streifen", "wie putze",
    "wie putzt", "wie reinige", "streifenfrei putzen", "frag mutti",
    "mit klarspüler", "mit hausmitteln", "richtig fenster",
    "how to clean windows", "window cleaning tip",
]
PRICE_EXCLUDE = {"preise", "preis", "kosten", "was kostet"}
BRAND_BROAD = [
    "auto", "job", "jobs", "gratis", "kostenlos", "diy", "anleitung", "selber",
    "youtube", "hausmitteln", "klarspüler", "tutorial",
]
BRAND_PHRASE = [
    "myhammer", "groupon", "check24", "wie putze", "ohne streifen",
    "frag mutti", "kleinanzeigen",
]


def pack_for(name: str) -> list[tuple[str, str]]:
    """Return [(text, match_type), ...] for campaign name."""
    u = name.upper()
    if "PRICE" in u:
        out = [(t, "BROAD") for t in CORE_BROAD]
        out += [(t, "PHRASE") for t in CORE_PHRASE if t not in PRICE_EXCLUDE]
        return out
    if "BRAND" in u:
        return [(t, "BROAD") for t in BRAND_BROAD] + [
            (t, "PHRASE") for t in BRAND_PHRASE
        ]
    if "CORE" in u:
        return [(t, "BROAD") for t in CORE_BROAD] + [
            (t, "PHRASE") for t in CORE_PHRASE
        ]
    return []


def existing_negatives(ga, cid: str, campaign_id: str) -> set[tuple[str, str]]:
    q = f"""
        SELECT
          campaign_criterion.keyword.text,
          campaign_criterion.keyword.match_type
        FROM campaign_criterion
        WHERE campaign.id = {campaign_id}
          AND campaign_criterion.type = 'KEYWORD'
          AND campaign_criterion.negative = TRUE
    """
    out: set[tuple[str, str]] = set()
    for row in ga.search(customer_id=cid, query=q):
        text = (row.campaign_criterion.keyword.text or "").lower()
        mt = row.campaign_criterion.keyword.match_type.name
        out.add((text, mt))
    return out


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    load_ads_env()
    config = client_config_from_env()
    cid = customer_id()

    from google.ads.googleads.client import GoogleAdsClient
    from google.ads.googleads.errors import GoogleAdsException

    client = GoogleAdsClient.load_from_dict(config)
    ga = client.get_service("GoogleAdsService")
    criterion_service = client.get_service("CampaignCriterionService")

    camps = list(
        ga.search(
            customer_id=cid,
            query="""
                SELECT campaign.id, campaign.name, campaign.status
                FROM campaign
                WHERE campaign.status = 'ENABLED'
                  AND campaign.advertising_channel_type = 'SEARCH'
                ORDER BY campaign.name
            """,
        )
    )

    mode = "APPLY" if args.apply else "DRY_RUN"
    print(f"MODE={mode} CUSTOMER={cid} campaigns={len(camps)}")

    try:
        for row in camps:
            camp_id = str(row.campaign.id)
            name = row.campaign.name
            wanted = pack_for(name)
            if not wanted:
                print(f"SKIP\t{name}\tno pack")
                continue
            have = existing_negatives(ga, cid, camp_id)
            missing = [
                (t, m) for t, m in wanted if (t.lower(), m) not in have
            ]
            print(f"{name}\tid={camp_id}\thave={len(have)}\tmissing={len(missing)}")
            if not missing or not args.apply:
                continue
            ops = []
            for text, match in missing:
                op = client.get_type("CampaignCriterionOperation")
                crit = op.create
                crit.campaign = client.get_service("CampaignService").campaign_path(
                    cid, camp_id
                )
                crit.negative = True
                crit.keyword.text = text
                crit.keyword.match_type = client.enums.KeywordMatchTypeEnum[match]
                ops.append(op)
            # batch in chunks of 100
            for i in range(0, len(ops), 100):
                criterion_service.mutate_campaign_criteria(
                    customer_id=cid, operations=ops[i : i + 100]
                )
            print(f"  ADDED\t{len(missing)}")
    except GoogleAdsException as ex:
        print(f"API_ERROR\t{ex}", file=sys.stderr)
        sys.exit(1)

    print("DONE")


if __name__ == "__main__":
    main()
