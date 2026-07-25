#!/usr/bin/env python3
"""Create Event conversion actions for Gate-0 measurement (API).

Requires GOOGLE_ADS_DEVELOPER_TOKEN + GOOGLE_ADS_REFRESH_TOKEN in .env.local.

Creates (if missing):
  - request_quote  (PRIMARY, ONE_PER_CLICK, SUBMIT_LEAD_FORM)
  - whatsapp_click (SECONDARY / observation)
  - phone_click    (SECONDARY / observation)

Prints tag snippets / send_to when available so you can paste into .env.local.
"""

from __future__ import annotations

import sys

from _env import client_config_from_env, customer_id, load_ads_env


DESIRED = [
    {
        "name": "request_quote",
        "category": "SUBMIT_LEAD_FORM",
        "counting": "ONE_PER_CLICK",
        "primary": True,
    },
    {
        "name": "whatsapp_click",
        "category": "CONTACT",
        "counting": "MANY_PER_CLICK",
        "primary": False,
    },
    {
        "name": "phone_click",
        "category": "CONTACT",
        "counting": "MANY_PER_CLICK",
        "primary": False,
    },
]


def main() -> None:
    load_ads_env()
    config = client_config_from_env()
    cid = customer_id()

    from google.ads.googleads.client import GoogleAdsClient
    from google.ads.googleads.errors import GoogleAdsException

    client = GoogleAdsClient.load_from_dict(config)
    ga = client.get_service("GoogleAdsService")
    ca_service = client.get_service("ConversionActionService")

    existing: dict[str, str] = {}
    rows = ga.search(
        customer_id=cid,
        query="""
            SELECT
              conversion_action.id,
              conversion_action.name,
              conversion_action.status,
              conversion_action.type,
              conversion_action.resource_name
            FROM conversion_action
            WHERE conversion_action.status != 'REMOVED'
        """,
    )
    for row in rows:
        existing[row.conversion_action.name] = row.conversion_action.resource_name
        print(
            f"EXISTING\t{row.conversion_action.name}\t"
            f"id={row.conversion_action.id}\ttype={row.conversion_action.type.name}\t"
            f"status={row.conversion_action.status.name}"
        )

    type_enum = client.enums.ConversionActionTypeEnum
    category_enum = client.enums.ConversionActionCategoryEnum
    counting_enum = client.enums.ConversionActionCountingTypeEnum
    status_enum = client.enums.ConversionActionStatusEnum

    operations = []
    for item in DESIRED:
        if item["name"] in existing:
            print(f"SKIP_CREATE\t{item['name']}\talready exists")
            continue
        action = client.get_type("ConversionAction")
        action.name = item["name"]
        action.type_ = type_enum.WEBPAGE
        action.category = getattr(category_enum, item["category"])
        action.status = status_enum.ENABLED
        action.counting_type = getattr(counting_enum, item["counting"])
        # Primary vs secondary is set via conversion goal / biddable settings in newer APIs;
        # create as standard website conversion; tune Primary in UI if needed.
        op = client.get_type("ConversionActionOperation")
        op.create = action
        operations.append(op)

    if operations:
        try:
            response = ca_service.mutate_conversion_actions(
                customer_id=cid, operations=operations
            )
            for result in response.results:
                print(f"CREATED\t{result.resource_name}")
        except GoogleAdsException as ex:
            print(f"ADS_ERROR\t{ex}", file=sys.stderr)
            for err in ex.failure.errors:
                print(f"  {err.error_code}: {err.message}", file=sys.stderr)
            sys.exit(1)
    else:
        print("NO_CREATES_NEEDED")

    # Re-query tag snippets
    snippet_rows = ga.search(
        customer_id=cid,
        query="""
            SELECT
              conversion_action.name,
              conversion_action.id,
              conversion_action.tag_snippets
            FROM conversion_action
            WHERE conversion_action.name IN ('request_quote', 'whatsapp_click', 'phone_click')
              AND conversion_action.status != 'REMOVED'
        """,
    )
    print("\n# Paste into .env.local / Vercel:")
    for row in snippet_rows:
        name = row.conversion_action.name
        snippets = list(row.conversion_action.tag_snippets)
        send_to = None
        for sn in snippets:
            text = getattr(sn, "event_snippet", "") or getattr(sn, "global_site_tag", "") or ""
            if "send_to" in text:
                # crude extract AW-.../label
                import re

                m = re.search(r"AW-[0-9]+/[A-Za-z0-9_-]+", text)
                if m:
                    send_to = m.group(0)
                    break
        env_key = {
            "request_quote": "NEXT_PUBLIC_GOOGLE_ADS_REQUEST_QUOTE_SEND_TO",
            "whatsapp_click": "NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_SEND_TO",
            "phone_click": "NEXT_PUBLIC_GOOGLE_ADS_PHONE_SEND_TO",
        }.get(name, name)
        print(f"{env_key}={send_to or 'MISSING_SNIPPET_OPEN_ADS_UI'}")


if __name__ == "__main__":
    main()
