"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatGermanDate } from "@/lib/quote-form";
import { TIME_SLOT_LABELS_DE, type BookableTimeSlot } from "@/lib/scheduling/slot-engine";
import type { DayAvailability } from "@/lib/scheduling/slot-engine";
import { siteConfig } from "@/lib/config";

interface TerminLeadSummary {
  id: string;
  anfrageNr?: string;
  name: string;
  status?: string;
  proposedDate?: string;
  confirmedDate?: string;
  timeSlot?: BookableTimeSlot;
  timeSlotLabel?: string;
  proposedDateLabel?: string;
  confirmedDateLabel?: string;
  preferredStartTime?: string;
  plannedStartTime?: string;
  plannedStartLabel?: string;
  windowCount?: number;
  city?: string;
  postalCode?: string;
}

interface TerminContextResponse {
  lead: TerminLeadSummary;
  availability: { days: DayAvailability[] };
  canConfirmProposed: boolean;
  canPickSlot: boolean;
  alreadyBooked: boolean;
  error?: string;
}

interface TerminBookingClientProps {
  token: string;
}

export function TerminBookingClient({ token }: TerminBookingClientProps) {
  const [context, setContext] = useState<TerminContextResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<BookableTimeSlot>("flexibel");
  const [preferredStartTime, setPreferredStartTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/termin/context?token=${encodeURIComponent(token)}`);
      const data = (await res.json()) as TerminContextResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Laden fehlgeschlagen");
      setContext(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Laden fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const availableDays = useMemo(
    () => context?.availability.days.filter((d) => d.available) ?? [],
    [context]
  );

  const selectedDay = useMemo(
    () => availableDays.find((d) => d.date === selectedDate) ?? null,
    [availableDays, selectedDate]
  );

  async function book(action: "confirm_proposed" | "pick_slot") {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/termin/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          action,
          date: action === "pick_slot" ? selectedDate : undefined,
          timeSlot: action === "pick_slot" ? selectedSlot : undefined,
          preferredStartTime: preferredStartTime || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Buchung fehlgeschlagen");
      setSuccess(
        data.confirmedDate
          ? `Ihr Termin am ${formatGermanDate(data.confirmedDate)} ist bestätigt.`
          : "Termin bestätigt."
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Buchung fehlgeschlagen");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-muted">
        <span className="inline-block w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        Termine werden geladen…
      </div>
    );
  }

  if (error && !context) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <h1 className="text-2xl font-bold text-foreground mb-3">Link ungültig</h1>
        <p className="text-muted mb-6">{error}</p>
        <a
          href={`tel:${siteConfig.contact.phone}`}
          className="inline-flex px-5 py-2.5 rounded-xl bg-primary text-white font-semibold"
        >
          {siteConfig.contact.phoneDisplay} anrufen
        </a>
      </div>
    );
  }

  if (!context) return null;

  const { lead, canConfirmProposed, canPickSlot, alreadyBooked } = context;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold text-primary uppercase tracking-wide">Online-Terminbuchung</p>
        <h1 className="text-3xl font-bold text-foreground mt-1">Termin bestätigen</h1>
        <p className="text-muted mt-2">
          {lead.anfrageNr && <span className="font-medium">{lead.anfrageNr}</span>}
          {lead.anfrageNr && " · "}
          {lead.name}
          {lead.windowCount ? ` · ${lead.windowCount} Flügel` : ""}
          {lead.city ? ` · ${lead.city}` : ""}
        </p>
      </div>

      {success && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">{error}</div>
      )}

      {alreadyBooked && lead.confirmedDateLabel && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 mb-8">
          <p className="text-sm font-semibold text-emerald-800 uppercase">Bestätigter Termin</p>
          <p className="text-2xl font-bold text-foreground mt-2">{lead.confirmedDateLabel}</p>
          {lead.plannedStartLabel && (
            <p className="text-lg font-semibold text-foreground mt-2">{lead.plannedStartLabel}</p>
          )}
          {lead.timeSlotLabel && <p className="text-muted mt-1">{lead.timeSlotLabel}</p>}
          <p className="text-sm text-muted mt-4">
            Bei Änderungswünschen erreichen Sie uns unter{" "}
            <a href={`tel:${siteConfig.contact.phone}`} className="text-primary font-semibold">
              {siteConfig.contact.phoneDisplay}
            </a>
            .
          </p>
        </div>
      )}

      {!alreadyBooked && canConfirmProposed && lead.proposedDateLabel && (
        <section className="rounded-2xl border border-border bg-white p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-bold text-foreground">Vorgeschlagener Termin</h2>
          <p className="text-muted mt-1 text-sm">Wir haben folgenden Termin für Sie reserviert:</p>
          <p className="text-2xl font-bold text-primary mt-4">{lead.proposedDateLabel}</p>
          {lead.timeSlotLabel && <p className="text-sm text-muted mt-1">{lead.timeSlotLabel}</p>}
          <button
            type="button"
            disabled={submitting}
            onClick={() => void book("confirm_proposed")}
            className="mt-6 w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? "Wird bestätigt…" : "Termin bestätigen"}
          </button>
        </section>
      )}

      {!alreadyBooked && canPickSlot && (
        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground">
            {canConfirmProposed ? "Alternativen Termin wählen" : "Termin wählen"}
          </h2>
          <p className="text-sm text-muted mt-1">
            Verfügbare Termine basieren auf unserer aktuellen Einsatzplanung.
          </p>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {availableDays.map((day) => (
              <button
                key={day.date}
                type="button"
                onClick={() => {
                  setSelectedDate(day.date);
                  const firstOpen = day.slots.find((s) => s.available);
                  if (firstOpen) setSelectedSlot(firstOpen.timeSlot);
                }}
                className={`px-3 py-2 rounded-xl border text-sm font-medium transition ${
                  selectedDate === day.date
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/40"
                }`}
              >
                {formatGermanDate(day.date)}
              </button>
            ))}
          </div>

          {selectedDay && (
            <div className="mt-6 space-y-2">
              <p className="text-sm font-semibold text-muted">Uhrzeit / Tageszeit</p>
              {selectedDay.slots.map((slot) => (
                <label
                  key={slot.timeSlot}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer ${
                    !slot.available ? "opacity-40 cursor-not-allowed" : ""
                  } ${selectedSlot === slot.timeSlot ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <input
                    type="radio"
                    name="timeSlot"
                    disabled={!slot.available}
                    checked={selectedSlot === slot.timeSlot}
                    onChange={() => setSelectedSlot(slot.timeSlot)}
                    className="accent-primary"
                  />
                  <span className="text-sm font-medium">{TIME_SLOT_LABELS_DE[slot.timeSlot]}</span>
                </label>
              ))}
            </div>
          )}

          <label className="block mt-6 text-sm">
            <span className="font-semibold text-muted">Wunsch-Uhrzeit (optional, unverbindlich)</span>
            <input
              type="time"
              value={preferredStartTime}
              onChange={(e) => setPreferredStartTime(e.target.value)}
              className="mt-2 w-full rounded-xl border border-border px-3 py-2"
            />
            <span className="text-xs text-muted mt-1 block">
              Die genaue Ankunftszeit bestätigen wir nach der Einsatzplanung.
            </span>
          </label>

          <button
            type="button"
            disabled={submitting || !selectedDate}
            onClick={() => void book("pick_slot")}
            className="mt-6 w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? "Wird gebucht…" : "Termin verbindlich buchen"}
          </button>
        </section>
      )}

      {!alreadyBooked && availableDays.length === 0 && (
        <p className="text-muted text-center py-8">
          Aktuell sind keine freien Termine online buchbar. Bitte rufen Sie uns an:{" "}
          <a href={`tel:${siteConfig.contact.phone}`} className="text-primary font-semibold">
            {siteConfig.contact.phoneDisplay}
          </a>
        </p>
      )}
    </div>
  );
}
