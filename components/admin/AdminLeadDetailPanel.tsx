"use client";

import { useMemo, useState } from "react";
import type { StoredLead, LeadStatus } from "@/lib/leads-store";
import type { QuoteFormData } from "@/lib/quote-form";
import { initialQuoteFormData } from "@/lib/quote-form";
import {
  buildQuoteTableRows,
  getTerminLabel,
  getPriceLabel,
} from "@/lib/quote-summary";
import { AdminAlert, AdminPanel } from "@/components/admin/AdminShell";

const STATUS_LABELS: Record<LeadStatus, string> = {
  neu: "Yeni",
  kontaktiert: "İletişim kuruldu",
  termin_vorgeschlagen: "Termin önerildi",
  termin_bestaetigt: "Termin onaylandı",
  abgeschlossen: "Tamamlandı",
  abgelehnt: "Reddedildi",
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  neu: "bg-slate-100 text-slate-700",
  kontaktiert: "bg-blue-100 text-blue-700",
  termin_vorgeschlagen: "bg-amber-100 text-amber-800",
  termin_bestaetigt: "bg-emerald-100 text-emerald-700",
  abgeschlossen: "bg-emerald-100 text-emerald-800",
  abgelehnt: "bg-red-100 text-red-700",
};

interface AdminLeadDetailPanelProps {
  lead: StoredLead;
  onClose: () => void;
  onUpdated: (lead: StoredLead) => void;
}

function mergeQuote(raw: Partial<QuoteFormData> | undefined): QuoteFormData | null {
  if (!raw?.windowCount) return null;
  return { ...initialQuoteFormData, ...raw };
}

export function AdminLeadDetailPanel({ lead, onClose, onUpdated }: AdminLeadDetailPanelProps) {
  const quote = useMemo(() => mergeQuote(lead.quote), [lead.quote]);
  const preferredDates = quote?.preferredDates ?? [];

  const [status, setStatus] = useState<LeadStatus>(lead.status ?? "neu");
  const [adminNotes, setAdminNotes] = useState(lead.adminNotes ?? "");
  const [proposedDate, setProposedDate] = useState(lead.appointment?.proposedDate ?? "");
  const [confirmedDate, setConfirmedDate] = useState(lead.appointment?.confirmedDate ?? "");
  const [appointmentNote, setAppointmentNote] = useState(lead.appointment?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function saveLead(options?: { sendConfirmationEmail?: boolean }) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminNotes,
          proposedDate: proposedDate || undefined,
          confirmedDate: confirmedDate || undefined,
          appointmentNote: appointmentNote || undefined,
          sendConfirmationEmail: options?.sendConfirmationEmail ?? false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Kaydedilemedi");

      onUpdated(data.lead);
      if (data.emailSent) {
        setSuccess("Termin onaylandı ve müşteriye e-posta gönderildi.");
      } else if (data.emailError) {
        setSuccess("Kaydedildi, ancak e-posta gönderilemedi: " + data.emailError);
      } else {
        setSuccess("Kaydedildi.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  }

  const detailRows = quote && lead.anfrageNr ? buildQuoteTableRows(quote, lead.anfrageNr) : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Kapat"
        onClick={onClose}
      />
      <aside className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b border-border px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-muted uppercase">Lead detayı</p>
            <h2 className="text-xl font-bold text-foreground">{lead.name}</h2>
            {lead.anfrageNr && <p className="text-sm text-muted">{lead.anfrageNr}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg border border-border hover:bg-slate-50 text-lg"
            aria-label="Kapat"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && <AdminAlert variant="error">{error}</AdminAlert>}
          {success && <AdminAlert variant="info">{success}</AdminAlert>}

          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                STATUS_COLORS[status]
              }`}
            >
              {STATUS_LABELS[status]}
            </span>
            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
              {lead.source}
            </span>
          </div>

          <AdminPanel className="p-4 space-y-2 text-sm">
            {lead.phone && <p><strong>Telefon:</strong> {lead.phone}</p>}
            {lead.email && <p><strong>E-posta:</strong> {lead.email}</p>}
            <p><strong>Tarih:</strong> {new Date(lead.createdAt).toLocaleString("tr-TR")}</p>
            {lead.photoCount > 0 && <p><strong>Foto:</strong> {lead.photoCount}</p>}
          </AdminPanel>

          {quote && (
            <section className="space-y-3">
              <h3 className="font-bold text-foreground">Anfrage özeti</h3>
              <AdminPanel className="p-4">
                <dl className="space-y-2 text-sm">
                  {detailRows.slice(0, 10).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-[1fr,1.2fr] gap-2">
                      <dt className="text-muted">{key}</dt>
                      <dd className="font-medium text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-sm">
                  <strong>Wunschtermin:</strong> {getTerminLabel(quote)}
                </p>
                <p className="text-sm text-primary font-semibold">
                  {getPriceLabel(quote)}
                </p>
              </AdminPanel>
            </section>
          )}

          <section className="space-y-3">
            <h3 className="font-bold text-foreground">Durum</h3>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as LeadStatus)}
              className="w-full rounded-xl border border-border px-3 py-2 text-sm"
            >
              {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Admin notları (iç kullanım)"
              rows={3}
              className="w-full rounded-xl border border-border px-3 py-2 text-sm"
            />
          </section>

          {lead.source === "quote" && (
            <section className="space-y-3">
              <h3 className="font-bold text-foreground">Termin yönetimi</h3>

              {preferredDates.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted w-full">Müşteri Wunschtermine:</span>
                  {preferredDates.map((iso) => (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => {
                        setProposedDate(iso);
                        setConfirmedDate(iso);
                      }}
                      className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20"
                    >
                      {iso}
                    </button>
                  ))}
                </div>
              )}

              <label className="block text-sm">
                <span className="text-muted">Önerilen termin</span>
                <input
                  type="date"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2"
                />
              </label>

              <label className="block text-sm">
                <span className="text-muted">Onaylanan termin</span>
                <input
                  type="date"
                  value={confirmedDate}
                  onChange={(e) => setConfirmedDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2"
                />
              </label>

              <textarea
                value={appointmentNote}
                onChange={(e) => setAppointmentNote(e.target.value)}
                placeholder="Termin notu (müşteriye e-postada gider)"
                rows={2}
                className="w-full rounded-xl border border-border px-3 py-2 text-sm"
              />

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveLead()}
                  className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-slate-50 disabled:opacity-40"
                >
                  Kaydet
                </button>
                <button
                  type="button"
                  disabled={saving || !confirmedDate || !lead.email}
                  onClick={() => void saveLead({ sendConfirmationEmail: true })}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40"
                >
                  Termin onayla + e-posta gönder
                </button>
                {!lead.email && (
                  <p className="text-xs text-muted">E-posta yok — onay maili gönderilemez.</p>
                )}
              </div>
            </section>
          )}

          {!quote && (
            <AdminPanel className="p-4">
              <p className="text-sm text-muted whitespace-pre-wrap">{lead.summary}</p>
            </AdminPanel>
          )}
        </div>
      </aside>
    </div>
  );
}

export function LeadStatusBadge({ status }: { status?: LeadStatus }) {
  const s = status ?? "neu";
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[s]}`}>
      {STATUS_LABELS[s]}
    </span>
  );
}
