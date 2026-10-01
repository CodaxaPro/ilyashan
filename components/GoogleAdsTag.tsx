import Script from "next/script";
import { siteConfig } from "@/lib/config";

const tagId = siteConfig.googleAds.tagId;

/**
 * Always load the Google tag with Consent Mode v2 defaults (denied).
 * Ads can verify the tag is installed; cookies/conversions only after consent update.
 */
export function GoogleAdsTag() {
  if (!tagId) return null;

  return (
    <>
      <Script id="google-consent-default" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
            wait_for_update: 500
          });
        `}
      </Script>
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${tagId}`}
        strategy="afterInteractive"
      />
      <Script id="google-ads-gtag" strategy="afterInteractive">
        {`
          gtag('js', new Date());
          gtag('config', '${tagId}', {
            allow_enhanced_conversions: true,
            send_page_view: true
          });
        `}
      </Script>
    </>
  );
}

/** Call after cookie banner accept/reject. */
export function updateGoogleAdsConsent(granted: boolean) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  const value = granted ? "granted" : "denied";
  window.gtag("consent", "update", {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
    analytics_storage: value,
  });
}
