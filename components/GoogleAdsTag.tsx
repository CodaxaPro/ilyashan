import Script from "next/script";
import { siteConfig } from "@/lib/config";

const tagId = siteConfig.googleAds.tagId;

export function GoogleAdsTag() {
  if (!tagId) return null;

  return (
    <>
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${tagId}`}
        strategy="afterInteractive"
      />
      <Script id="google-ads-gtag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${tagId}');
        `}
      </Script>
    </>
  );
}
