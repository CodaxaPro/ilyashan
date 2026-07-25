#!/usr/bin/env python3
"""Set city Presence geo targeting on Wave 1 Search campaigns.

Removes country-level (DE) / leftover criteria, adds city geoTargetConstants,
sets campaign.geo_target_type_setting.positive_geo_target_type = PRESENCE.
"""

from __future__ import annotations

import argparse
import sys

from _env import client_config_from_env, customer_id, load_ads_env

# Campaign ID → location names for GeoTargetConstant suggest (DE locale)
CAMPAIGN_CITIES: dict[str, list[str]] = {
    "24067658623": ["Baesweiler"],  # IL-BAE-CORE-SEARCH
    "24063037649": ["Baesweiler"],  # IL-BAE-PRICE-SEARCH
    "24058027809": ["Aachen"],  # IL-AAC-CORE-SEARCH
    "24063036185": ["Aachen"],  # IL-AAC-PRICE-SEARCH
    "24067684771": ["Würselen", "Wuerselen"],  # IL-WUR-CORE-SEARCH
    "24067688098": ["Alsdorf"],  # IL-ALS-CORE-SEARCH
    "24063034547": ["Baesweiler", "Aachen"],  # IL-BRAND-SEARCH
}


def suggest_city_ids(client, names: list[str]) -> list[tuple[str, str, str]]:
    """Return [(criterion_id, name, target_type), ...] for DE cities/municipalities."""
    gtc = client.get_service("GeoTargetConstantService")
    req = client.get_type("SuggestGeoTargetConstantsRequest")
    req.locale = "de"
    req.country_code = "DE"
    req.location_names.names.extend(names)

    out: list[tuple[str, str, str]] = []
    seen: set[str] = set()
    for suggestion in gtc.suggest_geo_target_constants(request=req):
        g = suggestion.geo_target_constant
        if g.status.name != "ENABLED":
            continue
        # Prefer City / Municipality / Postal Code over Country/Region
        t = g.target_type
        if t in ("Country", "Region", "Province", "State", "Canton"):
            continue
        cid = str(g.id)
        if cid in seen:
            continue
        seen.add(cid)
        out.append((cid, g.name, t))
    return out


def list_location_criteria(ga, cid: str, campaign_id: str) -> list:
    query = f"""
        SELECT
          campaign_criterion.resource_name,
          campaign_criterion.criterion_id,
          campaign_criterion.negative,
          campaign_criterion.location.geo_target_constant,
          campaign_criterion.type
        FROM campaign_criterion
        WHERE campaign.id = {campaign_id}
          AND campaign_criterion.type = 'LOCATION'
    """
    return list(ga.search(customer_id=cid, query=query))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write changes (default: dry-run)",
    )
    parser.add_argument(
        "--campaign-id",
        action="append",
        dest="campaign_ids",
        help="Limit to campaign id(s); default = Wave1 map",
    )
    args = parser.parse_args()

    load_ads_env()
    config = client_config_from_env()
    cid = customer_id()

    from google.ads.googleads.client import GoogleAdsClient
    from google.ads.googleads.errors import GoogleAdsException

    client = GoogleAdsClient.load_from_dict(config)
    ga = client.get_service("GoogleAdsService")
    campaign_service = client.get_service("CampaignService")
    criterion_service = client.get_service("CampaignCriterionService")

    targets = args.campaign_ids or list(CAMPAIGN_CITIES.keys())
    mode = "APPLY" if args.apply else "DRY_RUN"
    print(f"MODE={mode} CUSTOMER={cid}")

    try:
        for campaign_id in targets:
            names = CAMPAIGN_CITIES.get(campaign_id)
            if not names:
                print(f"SKIP\t{campaign_id}\tno city map")
                continue

            suggestions = suggest_city_ids(client, names)
            # Keep best matches: City first, then Municipality
            preferred = [s for s in suggestions if s[2] in ("City", "Municipality")]
            pick = preferred[:3] if preferred else suggestions[:3]
            if not pick:
                print(f"FAIL\t{campaign_id}\tno geo match for {names}")
                continue

            print(f"\nCAMPAIGN\t{campaign_id}\tnames={names}")
            for geo_id, geo_name, geo_type in pick:
                print(f"  GEO\t{geo_id}\t{geo_name}\t{geo_type}")

            existing = list_location_criteria(ga, cid, campaign_id)
            print(f"  EXISTING_LOCATIONS\t{len(existing)}")
            for row in existing:
                print(
                    f"    LOC\t{row.campaign_criterion.resource_name}\t"
                    f"neg={row.campaign_criterion.negative}\t"
                    f"{row.campaign_criterion.location.geo_target_constant}"
                )

            if not args.apply:
                print("  DRY_RUN\tno writes")
                continue

            ops = []
            # Remove all current LOCATION criteria
            for row in existing:
                op = client.get_type("CampaignCriterionOperation")
                op.remove = row.campaign_criterion.resource_name
                ops.append(op)

            # Add city criteria
            for geo_id, _, _ in pick:
                op = client.get_type("CampaignCriterionOperation")
                crit = op.create
                crit.campaign = campaign_service.campaign_path(cid, campaign_id)
                crit.location.geo_target_constant = (
                    f"geoTargetConstants/{geo_id}"
                )
                ops.append(op)

            if ops:
                criterion_service.mutate_campaign_criteria(
                    customer_id=cid, operations=ops
                )
                print(f"  MUTATE_CRITERIA\tok ops={len(ops)}")

            # Presence only
            camp_op = client.get_type("CampaignOperation")
            camp = camp_op.update
            camp.resource_name = campaign_service.campaign_path(cid, campaign_id)
            camp.geo_target_type_setting.positive_geo_target_type = (
                client.enums.PositiveGeoTargetTypeEnum.PRESENCE
            )
            camp.geo_target_type_setting.negative_geo_target_type = (
                client.enums.NegativeGeoTargetTypeEnum.PRESENCE
            )
            from google.protobuf import field_mask_pb2

            camp_op.update_mask.CopyFrom(
                field_mask_pb2.FieldMask(
                    paths=[
                        "geo_target_type_setting.positive_geo_target_type",
                        "geo_target_type_setting.negative_geo_target_type",
                    ]
                )
            )
            campaign_service.mutate_campaigns(
                customer_id=cid, operations=[camp_op]
            )
            print("  PRESENCE\tok")

            # Verify
            verify = list_location_criteria(ga, cid, campaign_id)
            print(f"  VERIFY_LOCATIONS\t{len(verify)}")
            for row in verify:
                print(
                    f"    OK\t{row.campaign_criterion.location.geo_target_constant}"
                )

        print("\nDONE")
    except GoogleAdsException as ex:
        print(f"ADS_ERROR\t{ex.error.code().name}", file=sys.stderr)
        for err in ex.failure.errors:
            print(f"  {err.error_code}\t{err.message}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
