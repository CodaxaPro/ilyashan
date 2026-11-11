"use client";

import { useMemo, useState } from "react";
import { siteConfig } from "@/lib/config";
import { buildCustomerWhatsAppUrl } from "@/lib/phone-de";
import { Button, WhatsAppIcon } from "@/components/ui/Button";

type Channel = "email" | "whatsapp";

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

export function WintergartenInquiryForm() {
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<Channel>("email");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [plz, setPlz] = useState("");
  const [note, setNote] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [anfrageNr, setAnfrageNr] = useState<string | null>(null);

  const message = useMemo(() => {
    const base =
      "Anfrage Wintergarten-Reinigung – individuelles Angebot gewünscht (kein Live-Preis).";
    return note.trim() ? `${base}\n\n${note.trim()}` : base;
  }, [note]);

  const canSubmit = Boolean(name.trim() && phone.trim() && plz.trim() && privacy);

  const whatsappHref = buildCustomerWhatsAppUrl(
    siteConfig.contact.whatsapp,
    [
      `Guten Tag,`,
      ``,
      `ich möchte eine Wintergarten-Reinigung anfragen.`,
      `Name: ${name.trim()}`,
      `Telefon: ${phone.trim()}`,
      plz.trim() ? `PLZ: ${plz.trim()}` : null,
      email.trim() ? `E-Mail: ${email.trim()}` : null,
      note.trim() ? `Hinweis: ${note.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n")
  );

  async function submitEmail() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          plz: plz.trim(),
          service: "Wintergarten-Reinigung",
          message,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Senden fehlgeschlagen");
      setAnfrageNr(result.anfrageNr ?? null);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div
        className="rounded-xl border border-primary/20 bg-primary-light/20 p-5 text-center"
        data-testid="wintergarten-inquiry-success"
      >
        <p className="font-bold text-foreground">Anfrage gesendet</p>
        {anfrageNr && (
          <p className="text-sm text-primary font-semibold mt-1">Anfrage-Nr.: {anfrageNr}</p>
        )}
        <p className="text-sm text-muted mt-2 leading-relaxed">
          Wir melden uns innerhalb von {siteConfig.business.responseTime} mit einem individuellen
          Wintergarten-Angebot.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden" data-testid="wintergarten-inquiry">
      <button
        type="button"
        data-testid="wintergarten-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`w-full text-left px-4 py-4 transition-colors ${
          open ? "bg-primary-light/30" : "hover:bg-primary-light/15"
        }`}
      >
        <span className="flex items-start justify-between gap-3">
          <span>
            <span className="block font-semibold text-foreground">Wintergarten-Reinigung</span>
            <span className="block text-xs text-muted mt-1 leading-relaxed">
              Individuelle Anfrage — Fläche, Zugang und Verschmutzung prüfen wir vor Ort / per Foto.
            </span>
          </span>
          <span
            className={`mt-0.5 text-primary text-sm font-semibold shrink-0 ${open ? "rotate-45" : ""}`}
            aria-hidden
          >
            +
          </span>
        </span>
      </button>

      {open && (
        <div className="border-t border-border px-4 pb-4 pt-4 space-y-4">
          <div
            className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-card border border-border"
            role="tablist"
            aria-label="Kontaktweg"
          >
            {(
              [
                { id: "email", label: "E-Mail" },
                { id: "whatsapp", label: "WhatsApp" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={channel === opt.id}
                data-testid={`wintergarten-channel-${opt.id}`}
                onClick={() => setChannel(opt.id)}
                className={`min-h-10 rounded-lg text-sm font-semibold transition-colors ${
                  channel === opt.id
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block sm:col-span-2">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">
                Name<span className="text-red-500 ml-0.5">*</span>
              </span>
              <input
                className={`${inputClass} mt-1.5`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                data-testid="wintergarten-name"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">
                Telefon<span className="text-red-500 ml-0.5">*</span>
              </span>
              <input
                className={`${inputClass} mt-1.5`}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                inputMode="tel"
                data-testid="wintergarten-phone"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">
                PLZ<span className="text-red-500 ml-0.5">*</span>
              </span>
              <input
                className={`${inputClass} mt-1.5`}
                value={plz}
                onChange={(e) => setPlz(e.target.value)}
                autoComplete="postal-code"
                inputMode="numeric"
                data-testid="wintergarten-plz"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">
                E-Mail{channel === "email" ? " (empfohlen)" : " (optional)"}
              </span>
              <input
                type="email"
                className={`${inputClass} mt-1.5`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                data-testid="wintergarten-email-field"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">
                Kurzbeschreibung (optional)
              </span>
              <textarea
                className={`${inputClass} mt-1.5 resize-none`}
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="z. B. ca. m², Etage, Zugang, starke Verschmutzung …"
                data-testid="wintergarten-note"
              />
            </label>
          </div>

          <label className="flex items-start gap-3 text-sm text-muted">
            <input
              type="checkbox"
              checked={privacy}
              onChange={(e) => setPrivacy(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
              data-testid="wintergarten-privacy"
            />
            <span>
              Ich stimme der Verarbeitung meiner Daten gemäß{" "}
              <a href="/datenschutz" className="text-primary underline underline-offset-2">
                Datenschutz
              </a>{" "}
              zu.<span className="text-red-500 ml-0.5">*</span>
            </span>
          </label>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {channel === "email" ? (
            <Button
              type="button"
              variant="primary"
              className="w-full rounded-xl"
              disabled={!canSubmit || loading}
              onClick={submitEmail}
              data-testid="wintergarten-submit-email"
            >
              {loading ? "Wird gesendet…" : "Anfrage per E-Mail senden"}
            </Button>
          ) : canSubmit && whatsappHref ? (
            <Button
              variant="primary"
              className="w-full rounded-xl"
              href={whatsappHref}
              data-testid="wintergarten-submit-whatsapp"
            >
              <WhatsAppIcon className="w-4 h-4" />
              Anfrage per WhatsApp öffnen
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              className="w-full rounded-xl"
              disabled
              data-testid="wintergarten-submit-whatsapp"
            >
              <WhatsAppIcon className="w-4 h-4" />
              Anfrage per WhatsApp öffnen
            </Button>
          )}

          <p className="text-xs text-muted leading-relaxed">
            Antwort in der Regel innerhalb von {siteConfig.business.responseTime}. Kein Live-Preis —
            Festangebot nach kurzer Prüfung.
          </p>
        </div>
      )}
    </div>
  );
}
