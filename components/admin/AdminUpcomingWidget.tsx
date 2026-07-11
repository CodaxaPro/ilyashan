"use client";

import Link from "next/link";
import { AdminPanel } from "@/components/admin/AdminShell";
import { CalendarUpcomingPanel } from "@/components/admin/calendar/CalendarUpcomingPanel";
import { useCalendarUpcoming } from "@/components/admin/calendar/useCalendarUpcoming";

export function AdminUpcomingWidget() {
  const { summary, groups, loading } = useCalendarUpcoming();

  if (loading) {
    return (
      <AdminPanel className="p-4 mb-6">
        <p className="text-sm text-muted">Takvim özeti yükleniyor…</p>
      </AdminPanel>
    );
  }

  if (summary.totalActionable === 0) return null;

  return (
    <AdminPanel className="p-4 mb-6 space-y-4" data-testid="admin-upcoming-widget">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">Yaklaşan terminler</h2>
          <p className="text-sm text-muted">
            {summary.badgeCount > 0
              ? `${summary.badgeCount} acil hatırlatma (gecikmiş + bugün + yarın)`
              : "Bu hafta planlanmış işler"}
          </p>
        </div>
        <Link
          href="/admin/calendar"
          className="px-3 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90"
        >
          Takvime git
        </Link>
      </div>
      <CalendarUpcomingPanel summary={summary} groups={groups.slice(0, 2)} onOpenLead={() => {}} compact />
    </AdminPanel>
  );
}
