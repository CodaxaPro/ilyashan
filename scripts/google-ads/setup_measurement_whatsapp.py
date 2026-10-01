#!/usr/bin/env python3
"""Gate-0 measurement: pause CODELESS request_quote, ensure whatsapp_click Event.

Does NOT create phone_click (optional per business decision).
Prints send_to values for .env / Vercel.
"""

from __future__ import annotations

import re
import sys

from _env import client_config_from_env, customer_id, load_ads_env


CODELESS_REQUEST_QUOTE_ID = "7679301761"  # WEBPAGE_CODELESS / MANY_PER_CLICK
EVENT_REQUEST_QUOTE_NAME = "request_quote (1)"  # existing Event — keep ENABLED


def main() -> None:
    load_ads_env()
    config = client_config_from_env()
    cid = customer_id()

    from google.ads.googleads.client import GoogleAdsClient
    from google.ads.googleads.errors import GoogleAdsException

    client = GoogleAdsClient.load_from_dict(config)
    ga = client.get_service("GoogleAdsService")
    ca_service = client.get_service("ConversionActionService")

    type_enum = client.enums.ConversionActionTypeEnum
    category_enum = client.enums.ConversionActionCategoryEnum
    counting_enum = client.enums.ConversionActionCountingTypeEnum
    status_enum = client.enums.ConversionActionStatusEnum

    existing: dict[str, dict] = {}
    rows = ga.search(
        customer_id=cid,
        query="""
            SELECT
              conversion_action.id,
              conversion_action.name,
              conversion_action.status,
              conversion_action.type,
              conversion_action.resource_name,
              conversion_action.tag_snippets
            FROM conversion_action
            WHERE conversion_action.status != 'REMOVED'
        """,
    )
    for row in rows:
        ca = row.conversion_action
        existing[ca.name] = {
            "id": str(ca.id),
            "resource_name": ca.resource_name,
            "status": ca.status.name,
            "type": ca.type_.name,
            "tag_snippets": list(ca.tag_snippets),
        }
        print(
            f"EXISTING\t{ca.name}\tid={ca.id}\ttype={ca.type_.name}\tstatus={ca.status.name}"
        )

    # Pause CODELESS duplicate request_quote
    ops = []
    for name, meta in existing.items():
        if meta["id"] == CODELESS_REQUEST_QUOTE_ID or (
            name == "request_quote" and meta["type"] == "WEBPAGE_CODELESS"
        ):
            if meta["status"] == "ENABLED":
                action = client.get_type("ConversionAction")
                action.resource_name = meta["resource_name"]
                action.status = status_enum.PAUSED
                op = client.get_type("ConversionActionOperation")
                op.update = action
                field_mask = client.get_type("FieldMask")
                field_mask.paths.append("status")
                client.copy_from(op.update_mask, field_mask)
                ops.append(op)
                print(f"WILL_PAUSE\t{name}\tid={meta['id']}")
            else:
                print(f"ALREADY_PAUSED\t{name}\tid={meta['id']}")

    # Create whatsapp_click if missing
    if "whatsapp_click" not in existing:
        action = client.get_type("ConversionAction")
        action.name = "whatsapp_click"
        action.type_ = type_enum.WEBPAGE
        action.category = category_enum.CONTACT
        action.status = status_enum.ENABLED
        action.counting_type = counting_enum.MANY_PER_CLICK
        op = client.get_type("ConversionActionOperation")
        op.create = action
        ops.append(op)
        print("WILL_CREATE\twhatsapp_click")
    else:
        print(
            f"SKIP_CREATE\twhatsapp_click\talready exists status={existing['whatsapp_click']['status']}"
        )

    if ops:
        try:
            response = ca_service.mutate_conversion_actions(
                customer_id=cid, operations=ops
            )
            for result in response.results:
                print(f"MUTATED\t{result.resource_name}")
        except GoogleAdsException as ex:
            print(f"ADS_ERROR\t{ex}", file=sys.stderr)
            for err in ex.failure.errors:
                print(f"  {err.error_code}: {err.message}", file=sys.stderr)
            sys.exit(1)
    else:
        print("NO_MUTATIONS")

    # Re-query snippets for env paste
    snippet_rows = ga.search(
        customer_id=cid,
        query="""
            SELECT
              conversion_action.name,
              conversion_action.id,
              conversion_action.status,
              conversion_action.type,
              conversion_action.tag_snippets
            FROM conversion_action
            WHERE conversion_action.status != 'REMOVED'
              AND conversion_action.name IN (
                'request_quote', 'request_quote (1)', 'whatsapp_click'
              )
        """,
    )

    def extract_send_to(snippets) -> str | None:
        for sn in snippets:
            text = getattr(sn, "event_snippet", "") or ""
            m = re.search(r"AW-[0-9]+/[A-Za-z0-9_-]+", text)
            if m:
                return m.group(0)
        return None

    print("\n# Final status / env:")
    for row in snippet_rows:
        ca = row.conversion_action
        send_to = extract_send_to(list(ca.tag_snippets))
        print(
            f"{ca.name}\tid={ca.id}\ttype={ca.type_.name}\tstatus={ca.status.name}\tsend_to={send_to or 'N/A'}"
        )


if __name__ == "__main__":
    main()
