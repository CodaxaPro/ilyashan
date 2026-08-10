"use client";

import Link from "next/link";
import { AdminPanel } from "@/components/admin/AdminShell";
import { CalendarUpcomingPanel } from "@/components/admin/calendar/CalendarUpcomingPanel";
import { useCalendarUpcoming } from "@/components/admin/calendar/useCalendarUpcoming";

interface AdminUpcomingWidgetProps {
  onOpenLead?: (leadId: string) => void;
}

export function AdminUpcomingWidget({ onOpenLead }: AdminUpcomingWidgetProps) {
  const { summary, groups, loading } = useCalendarUpcoming();

  if (loading) {
    return (
      <AdminPanel className="p-4 mb-6">
        <p className="text-sm text-muted">Bugünün işleri yükleniyor…</p>
      </AdminPanel>
    );
  }

  return (
    <AdminPanel className="p-4 mb-6 space-y-4" data-testid="admin-upcoming-widget">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">Bugünün işleri</h2>
          <p className="text-sm text-muted">
            {summary.badgeCount > 0
              ? `${summary.badgeCount} acil (gecikmiş + bugün + yarın)`
              : summary.totalActionable > 0
                ? "Yaklaşan operasyon özeti"
                : "Bugün planlı iş yok"}
          </p>
        </div>
        <Link
          href="/admin/calendar"
          className="px-3 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90"
        >
          Takvime git
        </Link>
      </div>
      <CalendarUpcomingPanel
        summary={summary}
        groups={groups}
        onOpenLead={(leadId) => onOpenLead?.(leadId)}
        compact
      />
    </AdminPanel>
  );
}
