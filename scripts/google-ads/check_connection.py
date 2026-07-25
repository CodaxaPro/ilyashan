#!/usr/bin/env python3
"""Verify Google Ads API credentials and list accessible customers."""

from __future__ import annotations

import os
import sys

from _env import client_config_from_env, customer_id, load_ads_env


def main() -> None:
    load_ads_env()
    config = client_config_from_env()
    cid = customer_id()

    from google.ads.googleads.client import GoogleAdsClient
    from google.ads.googleads.errors import GoogleAdsException

    client = GoogleAdsClient.load_from_dict(config)
    try:
        cust = client.get_service("CustomerService")
        accessible = cust.list_accessible_customers()
        print("ACCESSIBLE_CUSTOMERS")
        for rn in accessible.resource_names:
            print(f"  {rn}")

        ga = client.get_service("GoogleAdsService")
        query = """
            SELECT customer.id, customer.descriptive_name, customer.currency_code
            FROM customer
            LIMIT 1
        """
        rows = list(ga.search(customer_id=cid, query=query))
        if not rows:
            print(f"FAIL\tno customer row for {cid}", file=sys.stderr)
            sys.exit(1)
        row = rows[0]
        print(
            f"OK\tcustomer={row.customer.id}\t"
            f"name={row.customer.descriptive_name}\t"
            f"currency={row.customer.currency_code}"
        )
        project = (os.getenv("GOOGLE_ADS_PROJECT_ID") or "").strip()
        if project:
            print(f"PROJECT_ID={project}")
        else:
            print("WARN\tGOOGLE_ADS_PROJECT_ID empty (needed for MCP read-only)")
    except GoogleAdsException as ex:
        print(f"ADS_ERROR\t{ex}", file=sys.stderr)
        for err in ex.failure.errors:
            print(f"  {err.error_code}: {err.message}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
