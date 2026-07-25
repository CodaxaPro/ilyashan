#!/usr/bin/env python3
"""List Google Ads campaigns for Ilyashan control plane."""

from __future__ import annotations

from _env import client_config_from_env, customer_id, load_ads_env


def main() -> None:
    load_ads_env()
    config = client_config_from_env()
    cid = customer_id()

    from google.ads.googleads.client import GoogleAdsClient

    client = GoogleAdsClient.load_from_dict(config)
    ga = client.get_service("GoogleAdsService")

    query = """
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.advertising_channel_type,
          campaign_budget.amount_micros
        FROM campaign
        ORDER BY campaign.status, campaign.name
    """

    print(f"CUSTOMER_ID={cid}")
    print("id\tstatus\tchannel\tbudget_eur\tname")
    active = 0
    total = 0
    for row in ga.search(customer_id=cid, query=query):
        total += 1
        status = row.campaign.status.name
        if status == "ENABLED":
            active += 1
        budget = (row.campaign_budget.amount_micros or 0) / 1_000_000
        channel = row.campaign.advertising_channel_type.name
        print(
            f"{row.campaign.id}\t{status}\t{channel}\t{budget:.2f}\t{row.campaign.name}"
        )

    print(f"SUMMARY\ttotal={total}\tenabled={active}")
    if active == 0:
        print("PAUSE_OK\tetkin=0")
    else:
        print(f"PAUSE_PENDING\tetkin={active}")


if __name__ == "__main__":
    main()
