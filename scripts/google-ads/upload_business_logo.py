"""Upload Ilyashan square logo as Google Ads BUSINESS_LOGO (customer-level)."""

from __future__ import annotations

import sys
from pathlib import Path

from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

from _env import client_config_from_env, customer_id, load_ads_env

ROOT = load_ads_env()
LOGO_PATH = ROOT / "public" / "brand" / "ilyashan-logo-ads.png"


def main() -> int:
    if not LOGO_PATH.is_file():
        print(f"MISSING_LOGO:{LOGO_PATH}", file=sys.stderr)
        return 2

    client = GoogleAdsClient.load_from_dict(client_config_from_env())
    cid = customer_id()
    asset_service = client.get_service("AssetService")
    customer_asset_service = client.get_service("CustomerAssetService")
    ga_service = client.get_service("GoogleAdsService")

    # Skip if a BUSINESS_LOGO is already linked
    query = """
        SELECT customer_asset.asset, asset.name, asset.type
        FROM customer_asset
        WHERE customer_asset.field_type = BUSINESS_LOGO
          AND customer_asset.status != REMOVED
    """
    existing = list(ga_service.search(customer_id=cid, query=query))
    if existing:
        row = existing[0]
        print(f"ALREADY_LINKED:{row.customer_asset.asset}:{row.asset.name}")
        return 0

    data = LOGO_PATH.read_bytes()
    operation = client.get_type("AssetOperation")
    asset = operation.create
    asset.name = "Ilyashan Business Logo"
    asset.type_ = client.enums.AssetTypeEnum.IMAGE
    asset.image_asset.data = data

    try:
        response = asset_service.mutate_assets(
            customer_id=cid, operations=[operation]
        )
    except GoogleAdsException as exc:
        print(f"ASSET_CREATE_FAILED:{exc}", file=sys.stderr)
        return 1

    asset_rn = response.results[0].resource_name
    print(f"ASSET_CREATED:{asset_rn}")

    link_op = client.get_type("CustomerAssetOperation")
    link = link_op.create
    link.asset = asset_rn
    link.field_type = client.enums.AssetFieldTypeEnum.BUSINESS_LOGO

    try:
        link_resp = customer_asset_service.mutate_customer_assets(
            customer_id=cid, operations=[link_op]
        )
    except GoogleAdsException as exc:
        print(f"LINK_FAILED:{exc}", file=sys.stderr)
        print(f"ASSET_ORPHAN:{asset_rn}", file=sys.stderr)
        return 1

    print(f"LINKED:{link_resp.results[0].resource_name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
