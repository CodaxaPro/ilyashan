"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS_TR,
  canRescheduleAppointment,
} from "@/lib/calendar/appointment-from-lead";
import type { CalendarViewMode, CalendarFilters } from "@/lib/calendar/filters";
import { DEFAULT_CALENDAR_FILTERS } from "@/lib/calendar/filters";
import type { CalendarAppointment } from "@/lib/calendar/types";
import type { MonthWeekRow } from "@/lib/calendar/month-range";
import { getMonthRange, shiftMonth } from "@/lib/calendar/month-range";
import type { CalendarRangeStats } from "@/lib/calendar/stats";
import type { UpcomingGroup, UpcomingSummary } from "@/lib/calendar/upcoming";
import { getWeekRange, shiftWeek } from "@/lib/calendar/week-range";
import { AdminAlert, AdminPanel, AdminShell } from "@/components/admin/AdminShell";
import { AdminLeadDetailPanel } from "@/components/admin/AdminLeadDetailPanel";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import type { StoredLead } from "@/lib/leads-store";
import { CalendarAgendaView } from "@/components/admin/calendar/CalendarAgendaView";
import { CalendarFiltersBar } from "@/components/admin/calendar/CalendarFiltersBar";
import { CalendarMonthView } from "@/components/admin/calendar/CalendarMonthView";
import { CalendarMoveModal, type PendingMove } from "@/components/admin/calendar/CalendarMoveModal";
import { CalendarStatsBar } from "@/components/admin/calendar/CalendarStatsBar";
import { CalendarToolbar } from "@/components/admin/calendar/CalendarToolbar";
import { CalendarUpcomingPanel } from "@/components/admin/calendar/CalendarUpcomingPanel";
import { CalendarWeekView } from "@/components/admin/calendar/CalendarWeekView";

interface CalendarApiResponse {
  appointments: CalendarAppointment[];
  byDay: Record<string, CalendarAppointment[]>;
  range: { from: string; to: string; days: string[] };
  stats: CalendarRangeStats;
  upcoming: UpcomingSummary;
  today: string;
  view: CalendarViewMode;
  week?: { start: string; end: string; days: string[] };
  month?: { year: number; month: number };
  storage: "supabase" | "kv-fallback";
  dbConfigured: boolean;
}

function buildQuery(
  view: CalendarViewMode,
  weekStart: string,
  monthYear: number,
  month: number,
  filters: CalendarFilters
) {
  const params = new URLSearchParams({ view });
  if (view === "week") params.set("weekStart", weekStart);
  if (view === "month") params.set("month", `${monthYear}-${String(month).padStart(2, "0")}`);
  if (filters.search) params.set("search", filters.search);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.kind !== "all") params.set("kind", filters.kind);
  if (filters.role !== "actionable") params.set("role", filters.role);
  return params.toString();
}

export function AdminCalendar() {
  const { logout, markUnauthenticated } = useAdminAuth();
  const now = new Date();
  const [view, setView] = useState<CalendarViewMode>("week");
  const [weekStart, setWeekStart] = useState(() => getWeekRange().start);
  const [monthYear, setMonthYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [filters, setFilters] = useState<CalendarFilters>(DEFAULT_CALENDAR_FILTERS);
  const [data, setData] = useState<CalendarApiResponse | null>(null);
  const [upcomingGroups, setUpcomingGroups] = useState<UpcomingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<StoredLead | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragItem, setDragItem] = useState<CalendarAppointment | null>(null);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);

  const monthGrid = useMemo(() => getMonthRange(monthYear, month), [monthYear, month]);
  const week = useMemo(
    () => data?.week ?? getWeekRange(new Date(weekStart + "T12:00:00")),
    [data?.week, weekStart]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = buildQuery(view, weekStart, monthYear, month, filters);
      const [calRes, upRes] = await Promise.all([
        fetch(`/api/admin/appointments?${qs}`),
        fetch("/api/admin/appointments/upcoming"),
      ]);
      if (calRes.status === 401) {
        markUnauthenticated();
        return;
      }
      const calData = await calRes.json();
      if (!calRes.ok) throw new Error(calData.error ?? "Takvim yüklenemedi");
      setData(calData as CalendarApiResponse);

      if (upRes.ok) {
        const upData = await upRes.json();
        setUpcomingGroups(upData.groups ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yükleme hatası");
    } finally {
      setLoading(false);
    }
  }, [view, weekStart, monthYear, month, filters, markUnauthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  async function syncAll() {
    setSyncing(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync-all" }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Senkron başarısız");
      setFeedback(`${body.synced} lead takvime senkronlandı.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Senkron hatası");
    } finally {
      setSyncing(false);
    }
  }

  async function openLead(leadId: string) {
    const res = await fetch(`/api/admin/leads/${leadId}`);
    if (!res.ok) return;
    const body = await res.json();
    setSelectedLead(body.lead ?? null);
  }

  function handleDragStart(item: CalendarAppointment, e: React.DragEvent) {
    setDraggingId(item.id);
    setDragItem(item);
    e.dataTransfer.setData("text/appointment-id", item.id);
  }

  function handleDrop(targetDate: string) {
    if (!dragItem || !canRescheduleAppointment(dragItem)) return;
    if (dragItem.eventDate === targetDate) {
      setDraggingId(null);
      setDragItem(null);
      return;
    }
    setPendingMove({ item: dragItem, targetDate });
    setDraggingId(null);
    setDragItem(null);
  }

  async function confirmMove(sendEmail: boolean) {
    if (!pendingMove) return;
    setMoving(true);
    setFeedback(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/appointments/${pendingMove.item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventDate: pendingMove.targetDate,
          sendUpdateEmail: sendEmail,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Taşıma başarısız");
      if (body.emailSent) setFeedback("Termin taşındı — müşteriye güncelleme e-postası gönderildi.");
      else if (body.emailError) setFeedback("Termin taşındı, e-posta gönderilemedi: " + body.emailError);
      else setFeedback("Termin taşındı ve lead güncellendi.");
      setPendingMove(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Taşıma hatası");
    } finally {
      setMoving(false);
    }
  }

  function jumpToDate(iso: string) {
    setView("week");
    setWeekStart(getWeekRange(new Date(iso + "T12:00:00")).start);
    const [y, m] = iso.split("-").map(Number);
    setMonthYear(y);
    setMonth(m);
  }

  const monthWeeks: MonthWeekRow[] = monthGrid.weeks;

  return (
    <AdminShell
      title="Takvim"
      subtitle="Haftalık, aylık ve liste görünümü · yaklaşan termin uyarıları"
      onRefresh={() => void load()}
      onLogout={logout}
      actions={
        data?.dbConfigured ? (
          <button
            type="button"
            data-testid="calendar-sync-all"
            disabled={syncing}
            onClick={() => void syncAll()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40"
          >
            {syncing ? "Senkron…" : "Leadlerden senkronla"}
          </button>
        ) : null
      }
    >
      {error && <AdminAlert variant="error">{error}</AdminAlert>}
      {feedback && <AdminAlert variant="success">{feedback}</AdminAlert>}

      {data && !data.dbConfigured && (
        <AdminAlert variant="warning">
          Kalıcı takvim için Supabase <code>appointments</code> tablosu gerekli. Şu an lead verisinden
          gösteriliyor.
        </AdminAlert>
      )}

      {data && data.storage === "kv-fallback" && data.dbConfigured && (
        <AdminAlert variant="info">
          Bu aralıkta Supabase kaydı yok. Mevcut leadleri aktarmak için senkronlayın.
        </AdminAlert>
      )}

      {data && (
        <AdminPanel className="p-4 mb-4 space-y-4">
          <CalendarUpcomingPanel
            summary={data.upcoming}
            groups={upcomingGroups}
            onOpenLead={(id) => void openLead(id)}
            onJumpToDate={jumpToDate}
          />
        </AdminPanel>
      )}

      <AdminPanel className="p-4 mb-4 space-y-4">
        <CalendarToolbar
          view={view}
          weekStart={week.start}
          weekEnd={week.end}
          monthYear={monthYear}
          month={month}
          onViewChange={setView}
          onPrev={() => {
            if (view === "month") {
              const next = shiftMonth(monthYear, month, -1);
              setMonthYear(next.year);
              setMonth(next.month);
            } else if (view === "week") {
              setWeekStart(shiftWeek(weekStart, -1));
            }
          }}
          onNext={() => {
            if (view === "month") {
              const next = shiftMonth(monthYear, month, 1);
              setMonthYear(next.year);
              setMonth(next.month);
            } else if (view === "week") {
              setWeekStart(shiftWeek(weekStart, 1));
            }
          }}
          onToday={() => {
            const todayWeek = getWeekRange();
            setWeekStart(todayWeek.start);
            const t = new Date();
            setMonthYear(t.getFullYear());
            setMonth(t.getMonth() + 1);
          }}
          onMonthYearChange={(y, m) => {
            setMonthYear(y);
            setMonth(m);
            if (view === "month") return;
            setWeekStart(getWeekRange(new Date(y, m - 1, 1)).start);
          }}
          onWeekJump={(iso) => {
            setWeekStart(getWeekRange(new Date(iso + "T12:00:00")).start);
            const [y, m] = iso.split("-").map(Number);
            setMonthYear(y);
            setMonth(m);
          }}
        />

        <CalendarFiltersBar filters={filters} onChange={setFilters} />

        {data && <CalendarStatsBar stats={data.stats} upcoming={data.upcoming} />}

        <div className="flex flex-wrap gap-2 text-xs">
          {(Object.keys(APPOINTMENT_STATUS_LABELS_TR) as Array<keyof typeof APPOINTMENT_STATUS_LABELS_TR>).map(
            (key) => (
              <span
                key={key}
                className={`px-2 py-1 rounded-full border ${APPOINTMENT_STATUS_COLORS[key]}`}
              >
                {APPOINTMENT_STATUS_LABELS_TR[key]}
              </span>
            )
          )}
        </div>
      </AdminPanel>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 px-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[240px] rounded-2xl bg-slate-200/70 animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <>
          {view === "week" && (
            <CalendarWeekView
              days={week.days}
              byDay={data.byDay}
              dayStats={data.stats.byDay}
              today={data.today}
              draggingId={draggingId}
              onOpenLead={(id) => void openLead(id)}
              onDragStart={handleDragStart}
              onDragEnd={() => {
                setDraggingId(null);
                setDragItem(null);
              }}
              onDrop={handleDrop}
              setDraggingId={setDraggingId}
            />
          )}

          {view === "month" && (
            <CalendarMonthView
              weeks={monthWeeks}
              byDay={data.byDay}
              today={data.today}
              onSelectDay={jumpToDate}
            />
          )}

          {view === "agenda" && (
            <CalendarAgendaView items={data.appointments} onOpenLead={(id) => void openLead(id)} />
          )}
        </>
      ) : null}

      <CalendarMoveModal
        pending={pendingMove}
        loading={moving}
        onConfirm={(sendEmail) => void confirmMove(sendEmail)}
        onCancel={() => setPendingMove(null)}
      />

      {selectedLead && (
        <AdminLeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdated={(updated) => {
            setSelectedLead(updated);
            void load();
          }}
        />
      )}
    </AdminShell>
  );
}
