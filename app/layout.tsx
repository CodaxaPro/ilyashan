import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { CookieConsent } from "@/components/CookieConsent";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { ConciergeWidget } from "@/components/ConciergeWidget";
import { siteConfig } from "@/lib/config";
import { getLocalBusinessSchema, getFAQSchema, getServiceSchema } from "@/lib/schema";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} – ${siteConfig.tagline} in ${siteConfig.contact.region}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "Fensterreinigung",
    "Fenster putzen",
    "Glasreinigung",
    "Fensterreinigung Baesweiler",
    "Fensterreinigung Aachen",
    "Fensterreinigung Preise",
    "professionelle Fensterreinigung",
    "Fensterreinigung Aachen Stadtteile",
    "Fensterreinigung ohne Anfahrtszuschlag",
    siteConfig.contact.region,
  ],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} – Streifenfreie Fensterreinigung`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteConfig.url,
  },
  verification: {
    google: "3TnjGm0osXwHPZ6dl3VdxlxREiJ0f2UQSRZNxjFQHJ8",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const schemas = [getLocalBusinessSchema(), getFAQSchema(), getServiceSchema()];

  return (
    <html lang="de">
      <head>
        {schemas.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </head>
      <body className={`${inter.variable} antialiased`}>
        <AnalyticsProvider>
          {children}
          <ConciergeWidget />
          <CookieConsent />
        </AnalyticsProvider>
      </body>
    </html>
  );
}
