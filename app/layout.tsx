import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { CookieConsent } from "@/components/CookieConsent";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { ConciergeWidget } from "@/components/ConciergeWidget";
import { siteConfig } from "@/lib/config";
import { getLocalBusinessSchema } from "@/lib/schema";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  preload: true,
  adjustFontFallback: true,
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `Ilyashan – Reinigung in ${siteConfig.contact.region}`,
    template: "%s | Ilyashan",
  },
  description: siteConfig.description,
  keywords: [
    "Reinigungsfirma Aachen",
    "Reinigungsfirma Baesweiler",
    "Büroreinigung",
    "Bauendreinigung",
    "Praxisreinigung",
    "Entrümpelung",
    "Renovierungsreinigung",
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
  icons: {
    icon: [{ url: "/brand/ilyashan-logo.jpg", type: "image/jpeg" }],
    apple: [{ url: "/brand/ilyashan-logo.jpg" }],
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: "Ilyashan",
    title: "Ilyashan – Reinigung in Aachen und Baesweiler",
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
  const schemas = [getLocalBusinessSchema()];

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
      <body className={`${inter.variable} ${sourceSerif.variable} antialiased`}>
        <AnalyticsProvider>
          {children}
          <ConciergeWidget />
          <CookieConsent />
        </AnalyticsProvider>
      </body>
    </html>
  );
}
