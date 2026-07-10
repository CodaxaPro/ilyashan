"use client";

import { useCallback, useEffect, useState } from "react";
import type { StoredLead } from "@/lib/leads-store";
import type { UnknownQueueItem } from "@/lib/concierge/unknown-queue";

type AdminTab = "leads" | "unknown";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [tab, setTab] = useState<AdminTab>("leads");
  const [leads, setLeads] = useState<StoredLead[]>([]);
  const [unknownItems, setUnknownItems] = useState<UnknownQueueItem[]>([]);
  const [storageConfigured, setStorageConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const loadLeads = useCallback(async () => {
    const res = await fetch("/api/admin/leads");
    if (res.status === 401) return false;
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Leads laden fehlgeschlagen");
    setLeads(data.leads ?? []);
    setStorageConfigured(Boolean(data.storageConfigured));
    return true;
  }, []);

  const loadUnknown = useCallback(async () => {
    const res = await fetch("/api/admin/unknown?status=open");
    if (res.status === 401) return false;
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Unbekannte Fragen laden fehlgeschlagen");
    setUnknownItems(data.items ?? []);
    setStorageConfigured(Boolean(data.storageConfigured));
    return true;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ok = tab === "leads" ? await loadLeads() : await loadUnknown();
      if (ok === false) {
        setAuthenticated(false);
        return;
      }
      setAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }, [tab, loadLeads, loadUnknown]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login fehlgeschlagen");
      setPassword("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login fehlgeschlagen");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setLeads([]);
    setUnknownItems([]);
  }

  async function updateUnknownStatus(fingerprint: string, status: "resolved" | "dismissed") {
    const res = await fetch("/api/admin/unknown", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint, status }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Aktion fehlgeschlagen");
      return;
    }
    setUnknownItems((items) => items.filter((item) => item.fingerprint !== fingerprint));
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md bg-white rounded-2xl border border-border shadow-lg p-8 space-y-4"
          data-testid="admin-login-form"
        >
          <h1 className="text-2xl font-bold text-foreground">Ilyashan Admin</h1>
          <p className="text-sm text-muted">
            Leads, Fotos und unbeantwortete Assistent-Fragen verwalten
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin-Passwort"
            className="w-full px-4 py-3 rounded-xl border border-border"
            data-testid="admin-password"
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-50"
            data-testid="admin-login-submit"
          >
            {loginLoading ? "Wird geprüft…" : "Anmelden"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ilyashan Admin</h1>
            <p className="text-sm text-muted">
              {tab === "leads"
                ? `${leads.length} Leads`
                : `${unknownItems.length} offene Assistent-Fragen`}
              {!storageConfigured && " · KV-Speicher nicht konfiguriert"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void loadData()}
              className="px-4 py-2 rounded-xl border border-border bg-white text-sm font-medium"
            >
              Aktualisieren
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-medium"
            >
              Abmelden
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setTab("leads")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              tab === "leads" ? "bg-primary text-white" : "bg-white border border-border"
            }`}
            data-testid="admin-tab-leads"
          >
            Leads
          </button>
          <button
            type="button"
            onClick={() => setTab("unknown")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              tab === "unknown" ? "bg-primary text-white" : "bg-white border border-border"
            }`}
            data-testid="admin-tab-unknown"
          >
            Unbekannte Fragen
          </button>
        </div>

        {!storageConfigured && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Für persistente Speicherung bitte <strong>Upstash Redis</strong> in Vercel verbinden (
            <strong>KV_REST_API_URL</strong>, <strong>KV_REST_API_TOKEN</strong>). E-Mails und
            Assistent funktionieren weiterhin.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-muted">Lädt…</p>
        ) : tab === "leads" ? (
          leads.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-8 text-center text-muted">
              Noch keine gespeicherten Leads.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="admin-leads-table">
                  <thead className="bg-slate-50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Datum</th>
                      <th className="px-4 py-3 font-semibold">Quelle</th>
                      <th className="px-4 py-3 font-semibold">Kontakt</th>
                      <th className="px-4 py-3 font-semibold">Details</th>
                      <th className="px-4 py-3 font-semibold">Fotos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id} className="border-t border-border align-top">
                        <td className="px-4 py-3 whitespace-nowrap text-muted">
                          {new Date(lead.createdAt).toLocaleString("de-DE")}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                              lead.hot
                                ? "bg-red-100 text-red-700"
                                : lead.source === "quote"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {lead.hot ? "🔥 " : ""}
                            {lead.source}
                          </span>
                          {lead.anfrageNr && (
                            <p className="text-xs text-muted mt-1">{lead.anfrageNr}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{lead.name}</p>
                          {lead.phone && <p className="text-muted">{lead.phone}</p>}
                          {lead.email && <p className="text-muted">{lead.email}</p>}
                        </td>
                        <td className="px-4 py-3 max-w-md text-muted whitespace-pre-wrap">
                          {lead.summary}
                        </td>
                        <td className="px-4 py-3">{lead.photoCount > 0 ? lead.photoCount : "–"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : unknownItems.length === 0 ? (
          <div
            className="bg-white rounded-2xl border border-border p-8 text-center text-muted"
            data-testid="admin-unknown-empty"
          >
            Keine offenen unbekannten Fragen. Der Assistent beantwortet aktuelle Anfragen gut.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="admin-unknown-table">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Frage</th>
                    <th className="px-4 py-3 font-semibold">Häufigkeit</th>
                    <th className="px-4 py-3 font-semibold">Zuletzt</th>
                    <th className="px-4 py-3 font-semibold">FAQ-Vorschlag</th>
                    <th className="px-4 py-3 font-semibold">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {unknownItems.map((item) => (
                    <tr key={item.id} className="border-t border-border align-top">
                      <td className="px-4 py-3 max-w-sm">
                        <p className="font-medium text-foreground">{item.message}</p>
                        <p className="text-xs text-muted mt-1">Intent: {item.intent}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{item.count}×</td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted">
                        {new Date(item.lastSeenAt).toLocaleString("de-DE")}
                      </td>
                      <td className="px-4 py-3 text-muted max-w-xs">
                        {item.suggestedFaqQuestion ? (
                          <>
                            <span className="text-xs uppercase text-primary font-semibold">
                              {item.suggestedFaqId}
                            </span>
                            <p className="mt-1">{item.suggestedFaqQuestion}</p>
                          </>
                        ) : (
                          "–"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => void updateUnknownStatus(item.fingerprint, "resolved")}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                          >
                            Erledigt
                          </button>
                          <button
                            type="button"
                            onClick={() => void updateUnknownStatus(item.fingerprint, "dismissed")}
                            className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium"
                          >
                            Ignorieren
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border px-4 py-3 text-xs text-muted bg-slate-50">
              Tipp: Häufige Fragen als Alias in <code>lib/config.ts</code> →{" "}
              <code>siteConfig.faq</code> ergänzen, dann deployen.
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
