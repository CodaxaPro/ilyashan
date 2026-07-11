"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AdminAlert,
  AdminPanel,
  AdminShell,
} from "@/components/admin/AdminShell";
import { AdminLeadDetailPanel, LeadStatusBadge } from "@/components/admin/AdminLeadDetailPanel";
import { AdminPricingPanel } from "@/components/admin/AdminPricingPanel";
import { AdminUpcomingWidget } from "@/components/admin/AdminUpcomingWidget";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import type { StoredLead } from "@/lib/leads-store";
import type { UnknownQueueItem } from "@/lib/concierge/unknown-queue";

type AdminTab = "leads" | "unknown" | "pricing" | "settings";

interface ConciergeAdminSettings {
  enabled: boolean;
  source: "env" | "kv" | "default";
  storageConfigured: boolean;
  updatedAt?: string;
}

const TAB_TITLES: Record<AdminTab, { title: string; subtitle: string }> = {
  leads: {
    title: "Leadler",
    subtitle: "Teklif ve iletişim talepleri",
  },
  unknown: {
    title: "Bilinmeyen Sorular",
    subtitle: "Asistanın yanıtlayamadığı sorular",
  },
  pricing: {
    title: "Fenster Preise",
    subtitle: "Canlı fiyat ve Wartung ayarları",
  },
  settings: {
    title: "Asistan Ayarları",
    subtitle: "Website asistanı ve sistem",
  },
};

function parseTab(param: string | null): AdminTab {
  if (param === "unknown" || param === "settings" || param === "pricing") return param;
  return "leads";
}

function AdminPageContent() {
  const searchParams = useSearchParams();
  const tab = useMemo(() => parseTab(searchParams.get("tab")), [searchParams]);
  const { logout, markUnauthenticated } = useAdminAuth();

  const [leads, setLeads] = useState<StoredLead[]>([]);
  const [unknownItems, setUnknownItems] = useState<UnknownQueueItem[]>([]);
  const [conciergeSettings, setConciergeSettings] = useState<ConciergeAdminSettings | null>(null);
  const [conciergeSaving, setConciergeSaving] = useState(false);
  const [storageConfigured, setStorageConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<StoredLead | null>(null);

  const loadLeads = useCallback(async () => {
    const res = await fetch("/api/admin/leads");
    if (res.status === 401) return false;
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Leadler yüklenemedi");
    setLeads(data.leads ?? []);
    setStorageConfigured(Boolean(data.storageConfigured));
    return true;
  }, []);

  const loadUnknown = useCallback(async () => {
    const res = await fetch("/api/admin/unknown?status=open");
    if (res.status === 401) return false;
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Sorular yüklenemedi");
    setUnknownItems(data.items ?? []);
    setStorageConfigured(Boolean(data.storageConfigured));
    return true;
  }, []);

  const loadPricing = useCallback(async () => {
    const res = await fetch("/api/admin/pricing");
    if (res.status === 401) return false;
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Fiyatlar yüklenemedi");
    setStorageConfigured(Boolean(data.storageConfigured));
    return true;
  }, []);

  const loadSettings = useCallback(async () => {
    const res = await fetch("/api/admin/settings");
    if (res.status === 401) return false;
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Ayarlar yüklenemedi");
    setConciergeSettings(data.concierge ?? null);
    setStorageConfigured(Boolean(data.storageConfigured));
    return true;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ok =
        tab === "leads"
          ? await loadLeads()
          : tab === "unknown"
            ? await loadUnknown()
            : tab === "pricing"
              ? await loadPricing()
              : await loadSettings();
      if (ok === false) {
        markUnauthenticated();
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yükleme hatası");
    } finally {
      setLoading(false);
    }
  }, [tab, loadLeads, loadUnknown, loadPricing, loadSettings, markUnauthenticated]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleLogout() {
    await logout();
    setLeads([]);
    setUnknownItems([]);
  }

  async function updateConciergeEnabled(enabled: boolean) {
    setConciergeSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conciergeEnabled: enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Kaydedilemedi");
      setConciergeSettings(data.concierge ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi");
    } finally {
      setConciergeSaving(false);
    }
  }

  async function updateUnknownStatus(fingerprint: string, status: "resolved" | "dismissed") {
    const res = await fetch("/api/admin/unknown", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint, status }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "İşlem başarısız");
      return;
    }
    setUnknownItems((items) => items.filter((item) => item.fingerprint !== fingerprint));
  }

  const headerMeta = TAB_TITLES[tab];
  const dynamicSubtitle =
    tab === "leads"
      ? `${leads.length} kayıtlı lead`
      : tab === "unknown"
        ? `${unknownItems.length} açık soru`
        : tab === "pricing"
          ? "Fensterreinigung fiyatlandırması"
          : headerMeta.subtitle;

  return (
    <AdminShell
      title={headerMeta.title}
      subtitle={
        !storageConfigured && tab !== "settings"
          ? `${dynamicSubtitle} · KV depolama yapılandırılmadı`
          : dynamicSubtitle
      }
      onRefresh={() => void loadData()}
      onLogout={() => void handleLogout()}
    >
      {!storageConfigured && tab !== "settings" && tab !== "pricing" && (
        <AdminAlert variant="warning">
          Kalıcı depolama için Vercel&apos;de <strong>Upstash Redis</strong> bağlayın (
          <strong>KV_REST_API_URL</strong>, <strong>KV_REST_API_TOKEN</strong>). E-posta ve asistan
          çalışmaya devam eder.
        </AdminAlert>
      )}

      {error && <AdminAlert variant="error">{error}</AdminAlert>}

      {!loading && tab === "leads" && <AdminUpcomingWidget />}

      {loading ? (
        <div className="flex items-center gap-3 text-muted">
          <span className="inline-block w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Yükleniyor…
        </div>
      ) : tab === "pricing" ? (
        <AdminPricingPanel storageConfigured={storageConfigured} />
      ) : tab === "settings" ? (
        <AdminPanel className="p-6 space-y-6" data-testid="admin-settings-panel">
          <div>
            <h2 className="text-lg font-bold text-foreground">Website Asistanı</h2>
            <p className="text-sm text-muted mt-1">
              Varsayılan: <strong>kapalı</strong>. Testlerden sonra açın — ziyaretçiler chat
              butonunu yalnızca asistan açıkken görür.
            </p>
          </div>

          {!storageConfigured && (
            <AdminAlert variant="warning">
              Production&apos;da anahtarı kullanmak için Vercel&apos;de <strong>Upstash Redis</strong>{" "}
              bağlayın. Lokal test: <code>CONCIERGE_ENABLED=true</code> in{" "}
              <code>.env.local</code>.
            </AdminAlert>
          )}

          {conciergeSettings?.source === "env" && (
            <AdminAlert variant="info">
              <strong>CONCIERGE_ENABLED</strong> ortam değişkeni bu anahtarı geçersiz kılıyor (
              {conciergeSettings.enabled ? "açık" : "kapalı"}).
            </AdminAlert>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-slate-50 px-5 py-4">
            <div>
              <p className="font-semibold text-foreground">Sitede asistan</p>
              <p className="text-sm text-muted mt-0.5">
                Durum:{" "}
                <span
                  className={
                    conciergeSettings?.enabled ? "text-emerald-700 font-semibold" : "text-slate-600"
                  }
                  data-testid="concierge-status-label"
                >
                  {conciergeSettings?.enabled ? "Açık" : "Kapalı"}
                </span>
                {conciergeSettings?.updatedAt && (
                  <span className="text-muted">
                    {" "}
                    · son değişiklik{" "}
                    {new Date(conciergeSettings.updatedAt).toLocaleString("tr-TR")}
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={
                  conciergeSaving ||
                  conciergeSettings?.source === "env" ||
                  !storageConfigured ||
                  conciergeSettings?.enabled === true
                }
                onClick={() => void updateConciergeEnabled(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-emerald-700 transition-colors"
                data-testid="concierge-enable-btn"
              >
                Aç
              </button>
              <button
                type="button"
                disabled={
                  conciergeSaving ||
                  conciergeSettings?.source === "env" ||
                  !storageConfigured ||
                  conciergeSettings?.enabled === false
                }
                onClick={() => void updateConciergeEnabled(false)}
                className="px-4 py-2 rounded-xl border border-border bg-white text-sm font-semibold disabled:opacity-40 hover:bg-slate-50 transition-colors"
                data-testid="concierge-disable-btn"
              >
                Kapat
              </button>
            </div>
          </div>

          <p className="text-xs text-muted">
            API: <code>/api/concierge/status</code> · Asistan kapalıyken API&apos;ler 503 döner.
          </p>
        </AdminPanel>
      ) : tab === "leads" ? (
        leads.length === 0 ? (
          <AdminPanel className="p-10 text-center text-muted">Henüz kayıtlı lead yok.</AdminPanel>
        ) : (
          <AdminPanel>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="admin-leads-table">
                <thead className="bg-slate-50 text-left border-b border-border">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold text-muted">Tarih</th>
                    <th className="px-5 py-3.5 font-semibold text-muted">Durum</th>
                    <th className="px-5 py-3.5 font-semibold text-muted">Kaynak</th>
                    <th className="px-5 py-3.5 font-semibold text-muted">İletişim</th>
                    <th className="px-5 py-3.5 font-semibold text-muted">Detay</th>
                    <th className="px-5 py-3.5 font-semibold text-muted">Foto</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-t border-border align-top hover:bg-slate-50/50 cursor-pointer"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="px-5 py-4 whitespace-nowrap text-muted">
                        {new Date(lead.createdAt).toLocaleString("tr-TR")}
                      </td>
                      <td className="px-5 py-4">
                        <LeadStatusBadge status={lead.status} />
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
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
                      <td className="px-5 py-4">
                        <p className="font-medium">{lead.name}</p>
                        {lead.phone && <p className="text-muted">{lead.phone}</p>}
                        {lead.email && <p className="text-muted">{lead.email}</p>}
                      </td>
                      <td className="px-5 py-4 max-w-md text-muted whitespace-pre-wrap">
                        {lead.summary}
                      </td>
                      <td className="px-5 py-4">{lead.photoCount > 0 ? lead.photoCount : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminPanel>
        )
      ) : unknownItems.length === 0 ? (
        <AdminPanel className="p-10 text-center text-muted" data-testid="admin-unknown-empty">
          Açık bilinmeyen soru yok. Asistan mevcut soruları iyi yanıtlıyor.
        </AdminPanel>
      ) : (
        <AdminPanel>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="admin-unknown-table">
              <thead className="bg-slate-50 text-left border-b border-border">
                <tr>
                  <th className="px-5 py-3.5 font-semibold text-muted">Soru</th>
                  <th className="px-5 py-3.5 font-semibold text-muted">Sıklık</th>
                  <th className="px-5 py-3.5 font-semibold text-muted">Son görülme</th>
                  <th className="px-5 py-3.5 font-semibold text-muted">SSS önerisi</th>
                  <th className="px-5 py-3.5 font-semibold text-muted">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {unknownItems.map((item) => (
                  <tr key={item.id} className="border-t border-border align-top hover:bg-slate-50/50">
                    <td className="px-5 py-4 max-w-sm">
                      <p className="font-medium text-foreground">{item.message}</p>
                      <p className="text-xs text-muted mt-1">Intent: {item.intent}</p>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">{item.count}×</td>
                    <td className="px-5 py-4 whitespace-nowrap text-muted">
                      {new Date(item.lastSeenAt).toLocaleString("tr-TR")}
                    </td>
                    <td className="px-5 py-4 text-muted max-w-xs">
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
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => void updateUnknownStatus(item.fingerprint, "resolved")}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
                        >
                          Çözüldü
                        </button>
                        <button
                          type="button"
                          onClick={() => void updateUnknownStatus(item.fingerprint, "dismissed")}
                          className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-slate-50 transition-colors"
                        >
                          Yoksay
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-5 py-3 text-xs text-muted bg-slate-50">
            İpucu: Sık sorulanları <code>lib/config.ts</code> → <code>siteConfig.faq</code> içine alias
            olarak ekleyin, ardından deploy edin.
          </div>
        </AdminPanel>
      )}

      {selectedLead && (
        <AdminLeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdated={(updated) => {
            setLeads((items) => items.map((item) => (item.id === updated.id ? updated : item)));
            setSelectedLead(updated);
          }}
        />
      )}
    </AdminShell>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 flex items-center justify-center text-muted">
          Yükleniyor…
        </main>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}
