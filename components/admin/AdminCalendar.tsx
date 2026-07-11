"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS_TR,
  TIME_SLOT_LABELS_TR,
  canRescheduleAppointment,
} from "@/lib/calendar/appointment-from-lead";
import type { CalendarAppointment } from "@/lib/calendar/types";
import { formatWeekLabel, getWeekRange, shiftWeek, weekdayLabelTr } from "@/lib/calendar/week-range";
import { AdminAlert, AdminPanel, AdminShell } from "@/components/admin/AdminShell";
import { AdminLeadDetailPanel } from "@/components/admin/AdminLeadDetailPanel";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import type { StoredLead } from "@/lib/leads-store";
import { formatGermanDate } from "@/lib/quote-form";

export function AdminCalendar() {
  const { logout, markUnauthenticated } = useAdminAuth();
  const [weekStart, setWeekStart] = useState(() => getWeekRange().start);
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [storage, setStorage] = useState<"supabase" | "kv-fallback">("kv-fallback");
  const [dbConfigured, setDbConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<StoredLead | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const week = useMemo(() => getWeekRange(new Date(weekStart + "T12:00:00")), [weekStart]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/appointments?weekStart=${weekStart}`);
      if (res.status === 401) {
        markUnauthenticated();
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Takvim yüklenemedi");
      setAppointments(data.appointments ?? []);
      setStorage(data.storage ?? "kv-fallback");
      setDbConfigured(Boolean(data.dbConfigured));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yükleme hatası");
    } finally {
      setLoading(false);
    }
  }, [weekStart, markUnauthenticated]);

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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Senkron başarısız");
      setFeedback(`${data.synced} lead takvime senkronlandı.`);
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
    const data = await res.json();
    setSelectedLead(data.lead ?? null);
  }

  async function moveAppointment(item: CalendarAppointment, targetDate: string, notify: boolean) {
    if (item.eventDate === targetDate) return;
    setFeedback(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/appointments/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventDate: targetDate, sendUpdateEmail: notify }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Taşıma başarısız");
      if (data.emailSent) {
        setFeedback("Termin taşındı — müşteriye güncelleme e-postası gönderildi.");
      } else if (data.emailError) {
        setFeedback("Termin taşındı, e-posta gönderilemedi: " + data.emailError);
      } else {
        setFeedback("Termin taşındı ve lead güncellendi.");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Taşıma hatası");
    }
  }

  function appointmentsForDay(day: string) {
    return appointments.filter((a) => a.eventDate === day);
  }

  return (
    <AdminShell
      title="Takvim"
      subtitle="Onaylı ve önerilen terminler — sürükleyerek taşıyın"
      onRefresh={() => void load()}
      onLogout={logout}
      actions={
        dbConfigured ? (
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

      {!dbConfigured && (
        <AdminAlert variant="warning">
          Supabase appointments tablosu yapılandırılmamış — takvim KV lead verisinden gösteriliyor.
          Kalıcı takvim için <code>supabase/migrations/004_appointments.sql</code> çalıştırın.
        </AdminAlert>
      )}

      {storage === "kv-fallback" && dbConfigured && (
        <AdminAlert variant="info">
          Supabase bağlantısı var ancak bu hafta kayıt yok. &quot;Leadlerden senkronla&quot; ile
          mevcut leadleri aktarın.
        </AdminAlert>
      )}

      <AdminPanel className="p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="calendar-prev-week"
              onClick={() => setWeekStart(shiftWeek(weekStart, -1))}
              className="px-3 py-2 rounded-lg border border-border hover:bg-slate-50 text-sm font-semibold"
            >
              ← Önceki
            </button>
            <button
              type="button"
              data-testid="calendar-today"
              onClick={() => setWeekStart(getWeekRange().start)}
              className="px-3 py-2 rounded-lg border border-border hover:bg-slate-50 text-sm font-semibold"
            >
              Bugün
            </button>
            <button
              type="button"
              data-testid="calendar-next-week"
              onClick={() => setWeekStart(shiftWeek(weekStart, 1))}
              className="px-3 py-2 rounded-lg border border-border hover:bg-slate-50 text-sm font-semibold"
            >
              Sonraki →
            </button>
          </div>
          <p className="text-sm font-semibold text-foreground" data-testid="calendar-week-label">
            {formatWeekLabel(week.start, week.end)}
          </p>
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
        </div>
      </AdminPanel>

      {loading ? (
        <p className="text-muted text-sm px-2">Yükleniyor…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {week.days.map((day) => (
            <div
              key={day}
              data-testid={`calendar-day-${day}`}
              className="min-h-[220px] rounded-2xl border border-border bg-white p-3 flex flex-col gap-2"
              onDragOver={(e) => {
                if (draggingId) e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/appointment-id");
                const notify = e.dataTransfer.getData("text/send-email") === "1";
                const item = appointments.find((a) => a.id === id);
                setDraggingId(null);
                if (item && canRescheduleAppointment(item)) {
                  void moveAppointment(item, day, notify);
                }
              }}
            >
              <div className="border-b border-border pb-2">
                <p className="text-xs font-bold text-primary uppercase">{weekdayLabelTr(day)}</p>
                <p className="text-sm font-semibold text-foreground">{formatGermanDate(day)}</p>
                <p className="text-[10px] text-muted">{appointmentsForDay(day).length} iş</p>
              </div>

              <div className="flex-1 space-y-2">
                {appointmentsForDay(day).map((item) => (
                  <div
                    key={item.id}
                    data-testid={`calendar-event-${item.id}`}
                    draggable={canRescheduleAppointment(item)}
                    onDragStart={(e) => {
                      setDraggingId(item.id);
                      e.dataTransfer.setData("text/appointment-id", item.id);
                      e.dataTransfer.setData(
                        "text/send-email",
                        item.role === "confirmed" && item.customerEmail ? "1" : "0"
                      );
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    className={`rounded-xl border p-2 text-xs cursor-pointer transition-shadow hover:shadow-md ${APPOINTMENT_STATUS_COLORS[item.status]} ${draggingId === item.id ? "opacity-50" : ""}`}
                    onClick={() => void openLead(item.leadId)}
                  >
                    <p className="font-bold truncate">{item.customerName}</p>
                    <p className="text-[10px] opacity-80 truncate">{item.city || item.postalCode || "—"}</p>
                    {item.timeSlot && (
                      <p className="text-[10px] mt-1 font-medium">
                        {TIME_SLOT_LABELS_TR[item.timeSlot] ?? item.timeSlot}
                      </p>
                    )}
                    <p className="text-[10px] mt-1">{APPOINTMENT_STATUS_LABELS_TR[item.status]}</p>
                    {item.kind === "wartung" && (
                      <span className="inline-block mt-1 text-[9px] font-bold uppercase text-blue-700">
                        Wartung
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

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
