"use client";

import type { CalendarAppointment } from "@/lib/calendar/types";
import { APPOINTMENT_ROLE_LABELS_TR } from "@/lib/calendar/appointment-from-lead";
import { formatGermanDate } from "@/lib/quote-form";

export interface PendingMove {
  item: CalendarAppointment;
  targetDate: string;
}

interface CalendarMoveModalProps {
  pending: PendingMove | null;
  loading: boolean;
  onConfirm: (sendEmail: boolean) => void;
  onCancel: () => void;
}

export function CalendarMoveModal({ pending, loading, onConfirm, onCancel }: CalendarMoveModalProps) {
  if (!pending) return null;

  const canEmail = pending.item.role === "confirmed" && Boolean(pending.item.customerEmail);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      data-testid="calendar-move-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-move-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white border border-border shadow-2xl p-6 space-y-4">
        <div>
          <h2 id="calendar-move-title" className="text-lg font-bold text-foreground">
            Termin taşınsın mı?
          </h2>
          <p className="text-sm text-muted mt-1">
            <strong>{pending.item.customerName}</strong> · {APPOINTMENT_ROLE_LABELS_TR[pending.item.role]}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 border border-border p-4 text-sm space-y-2">
          <div className="flex justify-between gap-4">
            <span className="text-muted">Eski</span>
            <span className="font-semibold">{formatGermanDate(pending.item.eventDate)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted">Yeni</span>
            <span className="font-semibold text-primary">{formatGermanDate(pending.targetDate)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => onConfirm(false)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border font-semibold text-sm hover:bg-slate-50 disabled:opacity-50"
            data-testid="calendar-move-confirm"
          >
            Taşı (e-posta yok)
          </button>
          {canEmail && (
            <button
              type="button"
              disabled={loading}
              onClick={() => onConfirm(true)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 disabled:opacity-50"
              data-testid="calendar-move-confirm-email"
            >
              Taşı + e-posta gönder
            </button>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted hover:bg-slate-50 disabled:opacity-50"
            data-testid="calendar-move-cancel"
          >
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}
