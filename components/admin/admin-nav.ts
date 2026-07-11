export type AdminMainSection = "analytics" | "operations" | "system";

export interface AdminNavItem {
  href: string;
  label: string;
  shortLabel?: string;
  section: AdminMainSection;
  icon: "chart" | "users" | "inbox" | "help" | "settings" | "globe" | "pricing" | "calendar" | "staff";
  match: (pathname: string, tab: string | null) => boolean;
}

export const ADMIN_NAV: AdminNavItem[] = [
  {
    href: "/admin/analytics",
    label: "Analitik",
    shortLabel: "Analitik",
    section: "analytics",
    icon: "chart",
    match: (pathname) => pathname.startsWith("/admin/analytics"),
  },
  {
    href: "/admin/calendar",
    label: "Takvim",
    shortLabel: "Takvim",
    section: "operations",
    icon: "calendar",
    match: (pathname) => pathname.startsWith("/admin/calendar"),
  },
  {
    href: "/admin",
    label: "Leadler",
    shortLabel: "Lead",
    section: "operations",
    icon: "users",
    match: (pathname, tab) => pathname === "/admin" && (!tab || tab === "leads"),
  },
  {
    href: "/admin?tab=unknown",
    label: "Bilinmeyen Sorular",
    shortLabel: "Sorular",
    section: "operations",
    icon: "help",
    match: (pathname, tab) => pathname === "/admin" && tab === "unknown",
  },
  {
    href: "/admin?tab=pricing",
    label: "Fenster Preise",
    shortLabel: "Preise",
    section: "operations",
    icon: "pricing",
    match: (pathname, tab) => pathname === "/admin" && tab === "pricing",
  },
  {
    href: "/admin?tab=staff",
    label: "Ekip & Kapasite",
    shortLabel: "Ekip",
    section: "operations",
    icon: "staff",
    match: (pathname, tab) => pathname === "/admin" && tab === "staff",
  },
  {
    href: "/admin?tab=settings",
    label: "Asistan Ayarları",
    shortLabel: "Ayarlar",
    section: "system",
    icon: "settings",
    match: (pathname, tab) => pathname === "/admin" && tab === "settings",
  },
];

export const ADMIN_SECTION_LABELS: Record<AdminMainSection, string> = {
  analytics: "Analitik",
  operations: "Operasyon",
  system: "Sistem",
};
