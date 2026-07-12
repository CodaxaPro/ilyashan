"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatGermanDate } from "@/lib/quote-form";
import type { DayAvailability } from "@/lib/scheduling/slot-engine";
import {
  buildCustomerArrivalOptions,
  findCustomerArrivalOption,
  formatCustomerArrivalLabel,
  type CustomerArrivalOption,
} from "@/lib/scheduling/customer-arrival-options";
import type { TerminPortalSummary } from "@/lib/termin-portal";
import type { TerminWartungContext } from "@/lib/termin-wartung";
import { siteConfig } from "@/lib/config";

interface TerminLeadSummary {
  id: string;
  anfrageNr?: string;
  name: string;
  status?: string;
  proposedDate?: string;
  confirmedDate?: string;
  timeSlotLabel?: string;
  proposedDateLabel?: string;
  confirmedDateLabel?: string;
  plannedStartLabel?: string;
  windowCount?: number;
  city?: string;
  postalCode?: string;
}

interface TerminContextResponse {
  lead: TerminLeadSummary;
  availability: { days: DayAvailability[] };
  portal?: TerminPortalSummary | null;
  wartung?: TerminWartungContext | null;
  canConfirmProposed: boolean;
  canPickSlot: boolean;
  canReschedule?: boolean;
  alreadyBooked: boolean;
  pdfUrl?: string;
  error?: string;
}

interface TerminBookingClientProps {
  token: string;
}

const ARRIVAL_GROUPS = ["Vormittag", "Nachmittag", "Flexibel"] as const;

export function TerminBookingClient({ token }: TerminBookingClientProps) {
  const [context, setContext] = useState<TerminContextResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedArrivalId, setSelectedArrivalId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [showReschedule, setShowReschedule] = useState(false);

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

  const arrivalOptions = useMemo(
    () => (selectedDay ? buildCustomerArrivalOptions(selectedDay) : []),
    [selectedDay]
  );

  const selectedArrival = useMemo(
    () =>
      selectedDay && selectedArrivalId
        ? findCustomerArrivalOption(selectedDay, selectedArrivalId)
        : null,
    [selectedDay, selectedArrivalId]
  );

  useEffect(() => {
    if (!selectedDay) {
      setSelectedArrivalId(null);
      return;
    }
    const options = buildCustomerArrivalOptions(selectedDay);
    setSelectedArrivalId((current) =>
      current && options.some((o) => o.id === current) ? current : (options[0]?.id ?? null)
    );
  }, [selectedDay]);

  async function book(action: "confirm_proposed" | "pick_slot") {
    setSubmitting(true);
    setError(null);
    try {
      const arrival =
        action === "pick_slot" && selectedDay && selectedArrivalId
          ? findCustomerArrivalOption(selectedDay, selectedArrivalId)
          : null;

      const res = await fetch("/api/termin/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          action,
          date: action === "pick_slot" ? selectedDate : undefined,
          timeSlot: arrival?.timeSlot,
          preferredStartTime: arrival?.startTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Buchung fehlgeschlagen");
      setSuccess(
        data.confirmedDate
          ? `Ihr Termin am ${formatGermanDate(data.confirmedDate)} ist bestätigt.`
          : "Termin bestätigt."
      );
      setShowReschedule(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Buchung fehlgeschlagen");
    } finally {
      setSubmitting(false);
    }
  }

  function renderArrivalGroup(group: (typeof ARRIVAL_GROUPS)[number], options: CustomerArrivalOption[]) {
    const items = options.filter((o) => o.groupDe === group);
    if (items.length === 0) return null;

    return (
      <div key={group} className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{group}</p>
        <div className={`grid gap-2 ${group === "Flexibel" ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"}`}>
          {items.map((option) => (
            <button
              key={option.id}
              type="button"
              data-testid={`termin-arrival-${option.id}`}
              onClick={() => setSelectedArrivalId(option.id)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-medium text-left transition ${
                selectedArrivalId === option.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {option.labelDe}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="flex items-center justify-center gap-3 py-20 text-muted"
        data-testid="termin-loading"
      >
        <span className="inline-block w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        Termine werden geladen…
      </div>
    );
  }

  if (error && !context) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4" data-testid="termin-invalid">
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

  const { lead, canConfirmProposed, canPickSlot, canReschedule, alreadyBooked, portal, wartung, pdfUrl } =
    context;
  const showPickSlot = canPickSlot && (!alreadyBooked || showReschedule);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10" data-testid="termin-portal">
      <div className="mb-8">
        <p className="text-sm font-semibold text-primary uppercase tracking-wide">Meine Anfrage</p>
        <h1 className="text-3xl font-bold text-foreground mt-1">
          {alreadyBooked && !showReschedule ? "Ihr Termin" : "Termin bestätigen"}
        </h1>
        <p className="text-muted mt-2" data-testid="termin-lead-summary">
          {lead.anfrageNr && <span className="font-medium">{lead.anfrageNr}</span>}
          {lead.anfrageNr && " · "}
          {lead.name}
        </p>
      </div>

      {portal && (
        <section
          className="rounded-2xl border border-border bg-white p-6 mb-6 shadow-sm"
          data-testid="termin-portal-overview"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-sm font-semibold text-muted uppercase">Status</p>
              <p className="text-lg font-bold text-foreground" data-testid="termin-status-label">
                {portal.statusLabelDe}
              </p>
            </div>
            {pdfUrl && (
              <a
                href={pdfUrl}
                data-testid="termin-pdf-download"
                className="inline-flex items-center px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-slate-50"
              >
                Angebot als PDF
              </a>
            )}
          </div>
          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted">Leistung</dt>
              <dd className="font-semibold text-foreground">{portal.servicesLabel}</dd>
            </div>
            {portal.windowCount ? (
              <div>
                <dt className="text-muted">Flügel</dt>
                <dd className="font-semibold text-foreground">{portal.windowCount}</dd>
              </div>
            ) : null}
            {portal.locationLabel ? (
              <div>
                <dt className="text-muted">Ort</dt>
                <dd className="font-semibold text-foreground">{portal.locationLabel}</dd>
              </div>
            ) : null}
            {portal.priceLabel ? (
              <div>
                <dt className="text-muted">Preis</dt>
                <dd className="font-semibold text-foreground">{portal.priceLabel}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      )}

      {wartung && (
        <section
          className="rounded-2xl border border-blue-200 bg-blue-50/60 p-6 mb-6 shadow-sm"
          data-testid="termin-wartung-plan"
        >
          <p className="text-sm font-semibold text-blue-900 uppercase">Ihr Wartungsvertrag</p>
          <p className="text-lg font-bold text-foreground mt-2">{wartung.planSummaryDe}</p>
          <p className="text-sm text-muted mt-2">
            Der erste Termin legt den Rhythmus für alle weiteren Wartungsbesuche fest. Bitte wählen
            Sie einen <strong>{wartung.weekdayLabel}</strong>.
          </p>
          {wartung.previewDateLabels.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
                Geplante Folgetermine (Auszug)
              </p>
              <ul className="flex flex-wrap gap-2">
                {wartung.previewDateLabels.map((label) => (
                  <li
                    key={label}
                    className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-xs font-semibold text-foreground"
                  >
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {success && (
        <div
          className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900"
          data-testid="termin-success"
        >
          {success}
        </div>
      )}

      {error && (
        <div
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800"
          data-testid="termin-error"
        >
          {error}
        </div>
      )}

      {alreadyBooked && lead.confirmedDateLabel && (
        <div
          className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 mb-8"
          data-testid="termin-confirmed-card"
        >
          <p className="text-sm font-semibold text-emerald-800 uppercase">Bestätigter Termin</p>
          <p className="text-2xl font-bold text-foreground mt-2">{lead.confirmedDateLabel}</p>
          {lead.plannedStartLabel && (
            <p className="text-lg font-semibold text-foreground mt-2">{lead.plannedStartLabel}</p>
          )}
          {lead.timeSlotLabel && <p className="text-muted mt-1">{lead.timeSlotLabel}</p>}
          {canReschedule && !showReschedule && (
            <button
              type="button"
              data-testid="termin-reschedule-toggle"
              onClick={() => setShowReschedule(true)}
              className="mt-4 px-4 py-2 rounded-xl border border-emerald-300 bg-white text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
            >
              Termin ändern
            </button>
          )}
          {!canReschedule && (
            <p className="text-sm text-muted mt-4">
              Bei Änderungswünschen erreichen Sie uns unter{" "}
              <a href={`tel:${siteConfig.contact.phone}`} className="text-primary font-semibold">
                {siteConfig.contact.phoneDisplay}
              </a>
              .
            </p>
          )}
        </div>
      )}

      {!alreadyBooked && canConfirmProposed && lead.proposedDateLabel && (
        <section
          className="rounded-2xl border border-border bg-white p-6 mb-8 shadow-sm"
          data-testid="termin-proposed-section"
        >
          <h2 className="text-lg font-bold text-foreground">Vorgeschlagener Termin</h2>
          <p className="text-muted mt-1 text-sm">Wir haben folgenden Termin für Sie reserviert:</p>
          <p className="text-2xl font-bold text-primary mt-4" data-testid="termin-proposed-date">
            {lead.proposedDateLabel}
          </p>
          {lead.timeSlotLabel && <p className="text-sm text-muted mt-1">{lead.timeSlotLabel}</p>}
          <button
            type="button"
            disabled={submitting}
            data-testid="termin-confirm-proposed"
            onClick={() => void book("confirm_proposed")}
            className="mt-6 w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? "Wird bestätigt…" : "Termin bestätigen"}
          </button>
        </section>
      )}

      {showPickSlot && (
        <section
          className="rounded-2xl border border-border bg-white p-6 shadow-sm"
          data-testid="termin-pick-slot-section"
        >
          <h2 className="text-lg font-bold text-foreground">
            {showReschedule
              ? "Neuen Termin wählen"
              : canConfirmProposed
                ? "Alternativen Termin wählen"
                : "Termin wählen"}
          </h2>
          <p className="text-sm text-muted mt-1">
            Wählen Sie Datum und gewünschte Ankunftszeit. Die genaue Uhrzeit bestätigen wir nach der
            Einsatzplanung.
          </p>

          <p className="mt-6 text-sm font-semibold text-muted">1. Datum</p>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {availableDays.map((day) => (
              <button
                key={day.date}
                type="button"
                data-testid={`termin-date-${day.date}`}
                onClick={() => setSelectedDate(day.date)}
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

          {selectedDay && arrivalOptions.length > 0 && (
            <div className="mt-6 space-y-4">
              <p className="text-sm font-semibold text-muted">2. Ankunftszeit</p>
              {ARRIVAL_GROUPS.map((group) => renderArrivalGroup(group, arrivalOptions))}
            </div>
          )}

          {selectedArrival && (
            <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
              <span className="font-semibold">Ihre Auswahl:</span>{" "}
              {formatGermanDate(selectedDate!)} · {formatCustomerArrivalLabel(selectedArrival)}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={submitting || !selectedDate || !selectedArrivalId}
              data-testid="termin-book-slot"
              onClick={() => void book("pick_slot")}
              className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? "Wird gebucht…" : showReschedule ? "Termin ändern" : "Termin verbindlich buchen"}
            </button>
            {showReschedule && (
              <button
                type="button"
                data-testid="termin-reschedule-cancel"
                onClick={() => setShowReschedule(false)}
                className="px-6 py-3 rounded-xl border border-border font-semibold hover:bg-slate-50"
              >
                Abbrechen
              </button>
            )}
          </div>
        </section>
      )}

      {!alreadyBooked && availableDays.length === 0 && !canConfirmProposed && (
        <p className="text-muted text-center py-8" data-testid="termin-no-slots">
          Aktuell sind keine freien Termine online buchbar. Bitte rufen Sie uns an:{" "}
          <a href={`tel:${siteConfig.contact.phone}`} className="text-primary font-semibold">
            {siteConfig.contact.phoneDisplay}
          </a>
        </p>
      )}
    </div>
  );
}
