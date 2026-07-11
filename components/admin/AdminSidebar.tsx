"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ADMIN_NAV, ADMIN_SECTION_LABELS, type AdminMainSection } from "./admin-nav";
import { AdminNavIcon } from "./AdminIcons";
import { useCalendarUpcoming } from "./calendar/useCalendarUpcoming";

const SIDEBAR_KEY = "ilyashan-admin-sidebar-collapsed";

export function AdminSidebar({ onLogout }: { onLogout?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { summary: upcomingSummary } = useCalendarUpcoming(true);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const sections: AdminMainSection[] = ["analytics", "operations", "system"];

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div
        className={`flex items-center border-b border-white/10 ${collapsed ? "justify-center px-3 py-5" : "gap-3 px-5 py-5"}`}
      >
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-white shrink-0">
          I
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-white font-bold leading-tight truncate">Ilyashan</p>
            <p className="text-xs text-slate-400">Yönetim Paneli</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {sections.map((section) => {
          const items = ADMIN_NAV.filter((item) => item.section === section);
          if (items.length === 0) return null;
          return (
            <div key={section}>
              {!collapsed && (
                <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {ADMIN_SECTION_LABELS[section]}
                </p>
              )}
              <ul className="space-y-1">
                {items.map((item) => {
                  const active = item.match(pathname, tab);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        title={collapsed ? item.label : undefined}
                        className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                          active
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-300 hover:bg-white/10 hover:text-white"
                        } ${collapsed ? "justify-center" : ""}`}
                      >
                        <AdminNavIcon name={item.icon} className="w-5 h-5 shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {item.icon === "calendar" && upcomingSummary.badgeCount > 0 && (
                          <span
                            className={`ml-auto inline-flex min-w-[20px] h-5 px-1.5 items-center justify-center rounded-full text-[10px] font-bold ${
                              active ? "bg-red-500 text-white" : "bg-red-500/90 text-white"
                            } ${collapsed ? "absolute -top-1 -right-1" : ""}`}
                            data-testid="calendar-nav-badge"
                          >
                            {upcomingSummary.badgeCount}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3 space-y-1">
        <a
          href="https://ilyashan.de/de"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? "Siteyi aç" : undefined}
        >
          <AdminNavIcon name="globe" className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Siteyi Görüntüle</span>}
        </a>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/10 transition-colors ${collapsed ? "justify-center" : ""}`}
            title={collapsed ? "Çıkış" : undefined}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            {!collapsed && <span>Çıkış Yap</span>}
          </button>
        )}
        <button
          type="button"
          onClick={toggleCollapsed}
          className={`hidden lg:flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/10 hover:text-white transition-colors ${collapsed ? "justify-center" : ""}`}
          aria-label={collapsed ? "Kenar çubuğunu genişlet" : "Kenar çubuğunu daralt"}
        >
          <svg
            className={`w-5 h-5 shrink-0 transition-transform ${collapsed ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
          </svg>
          {!collapsed && <span>Daralt</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-slate-900 text-white shadow-lg"
        aria-label="Menüyü aç"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {mobileOpen && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          aria-label="Menüyü kapat"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen bg-slate-900 shrink-0 transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-[260px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
