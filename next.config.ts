import type { NextConfig } from "next";

import {
  getFensterSeoRewrites,
  getGiftSeoRewrites,
  getIntentRewrites,
  getLocationRewrites,
} from "./lib/seo-config";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      ...getLocationRewrites(),
      ...getIntentRewrites(),
      ...getGiftSeoRewrites(),
      ...getFensterSeoRewrites(),
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "frame-src 'self' https://treuepay.de https://*.treuepay.de",
              "connect-src 'self' https://treuepay.de https://*.treuepay.de https://www.google-analytics.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
