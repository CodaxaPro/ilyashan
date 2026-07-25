#!/usr/bin/env python3
"""Pause ALL campaigns in the Ilyashan Google Ads account.

Default is dry-run. Use --apply only after user says okey / apply.
"""

from __future__ import annotations

import argparse

from _env import client_config_from_env, customer_id, load_ads_env


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually pause campaigns (default: dry-run)",
    )
    args = parser.parse_args()

    load_ads_env()
    config = client_config_from_env()
    cid = customer_id()

    from google.ads.googleads.client import GoogleAdsClient
    from google.protobuf import field_mask_pb2

    client = GoogleAdsClient.load_from_dict(config)
    ga = client.get_service("GoogleAdsService")
    campaign_service = client.get_service("CampaignService")

    query = """
        SELECT campaign.id, campaign.name, campaign.status
        FROM campaign
        WHERE campaign.status = 'ENABLED'
    """

    to_pause = []
    for row in ga.search(customer_id=cid, query=query):
        to_pause.append((row.campaign.id, row.campaign.name))

    print(f"CUSTOMER_ID={cid}")
    print(f"ENABLED_COUNT={len(to_pause)}")
    for camp_id, name in to_pause:
        print(f"WOULD_PAUSE\t{camp_id}\t{name}")

    if not to_pause:
        print("ALREADY_PAUSED\tetkin=0")
        return

    if not args.apply:
        print("DRY_RUN\tno changes. Re-run with --apply after okey.")
        return

    operations = []
    for camp_id, _name in to_pause:
        op = client.get_type("CampaignOperation")
        campaign = op.update
        campaign.resource_name = campaign_service.campaign_path(cid, camp_id)
        campaign.status = client.enums.CampaignStatusEnum.PAUSED
        op.update_mask.CopyFrom(field_mask_pb2.FieldMask(paths=["status"]))
        operations.append(op)

    response = campaign_service.mutate_campaigns(
        customer_id=cid, operations=operations
    )
    print(f"PAUSED\tcount={len(response.results)}")
    for r in response.results:
        print(f"PAUSED_OK\t{r.resource_name}")


if __name__ == "__main__":
    main()
