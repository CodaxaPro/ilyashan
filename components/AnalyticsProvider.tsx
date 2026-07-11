"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initAnalyticsClient, trackPageView } from "@/lib/analytics/client";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    initAnalyticsClient();
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    trackPageView(pathname, document.title);
  }, [pathname]);

  return children;
}
