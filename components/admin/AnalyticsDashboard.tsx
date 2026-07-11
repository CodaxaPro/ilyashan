"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminLoginForm, AdminShell, StatCard } from "@/components/admin/AdminShell";
import { CHANNEL_LABELS_TR } from "@/lib/analytics/attribution";
import type { AnalyticsEventRow, AnalyticsSessionRow } from "@/lib/analytics/types";

type Tab =
  | "overview"
  | "live"
  | "channels"
  | "pages"
  | "funnel"
  | "clicks"
  | "concierge"
  | "sessions";

interface OverviewData {
  totalSessions: number;
  totalPageviews: number;
  totalEvents: number;
  uniqueVisitors: number;
  avgDurationSec: number;
  bounceRate: number;
  conversions: number;
  conciergeOpens: number;
  daily: Array<{ date: string; sessions: number; pageviews: number; events: number }>;
}

const TAB_LABELS: Record<Tab, string> = {
  overview: "Genel Bakış",
  live: "Canlı",
  channels: "Kanallar",
  pages: "Sayfalar",
  funnel: "Huni",
  clicks: "Tıklamalar",
  concierge: "Asistan",
  sessions: "Oturumlar",
};

const EVENT_LABELS_TR: Record<string, string> = {
  session_start: "Oturum başladı",
  session_end: "Oturum bitti",
  pageview: "Sayfa görüntüleme",
  page_leave: "Sayfadan ayrılma",
  click: "Tıklama",
  scroll: "Kaydırma",
  heartbeat: "Aktif kalma",
  cookie_consent: "Çerez tercihi",
  wizard_step: "Wizard adımı",
  wizard_submit: "Teklif gönderildi",
  wizard_abandon: "Wizard terk",
  form_submit: "Form gönderildi",
  phone_click: "Telefon tıklaması",
  whatsapp_click: "WhatsApp tıklaması",
  concierge_open: "Asistan açıldı",
  concierge_message: "Asistan mesajı",
  concierge_lead_submit: "Asistan lead",
};

function formatDuration(sec: number) {
  if (sec < 60) return `${sec} sn`;
  return `${Math.floor(sec / 60)} dk ${sec % 60} sn`;
}

export function AnalyticsDashboard() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [live, setLive] = useState<AnalyticsSessionRow[]>([]);
  const [channels, setChannels] = useState<
    Array<{ channel: string; sessions: number; pageviews: number; avgDurationSec: number; bounceRate: number }>
  >([]);
  const [referrers, setReferrers] = useState<Array<{ label: string; channel: string; count: number }>>([]);
  const [pages, setPages] = useState<
    Array<{ path: string; views: number; clicks: number; avgTimeSec: number }>
  >([]);
  const [clicks, setClicks] = useState<
    Array<{ label: string; page: string; href: string; count: number }>
  >([]);
  const [funnel, setFunnel] = useState<{
    steps: Array<{ step: number; sessions: number }>;
    submits: number;
    abandons: number;
  } | null>(null);
  const [concierge, setConcierge] = useState<{
    counts: Record<string, number>;
    intents: Record<string, number>;
  } | null>(null);
  const [sessions, setSessions] = useState<AnalyticsSessionRow[]>([]);
  const [sessionsTotal, setSessionsTotal] = useState(0);
  const [selectedSession, setSelectedSession] = useState<{
    session: AnalyticsSessionRow;
    events: AnalyticsEventRow[];
  } | null>(null);

  const loadSection = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?section=${tab}&days=${days}`);
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Veri yüklenemedi");
      setAuthenticated(true);
      setConfigured(data.configured !== false);

      if (tab === "overview") setOverview(data.overview ?? null);
      if (tab === "live") setLive(data.live ?? []);
      if (tab === "channels") {
        setChannels(data.channels ?? []);
        setReferrers(data.referrers ?? []);
      }
      if (tab === "pages") setPages(data.pages ?? []);
      if (tab === "clicks") setClicks(data.clicks ?? []);
      if (tab === "funnel") setFunnel(data.funnel ?? null);
      if (tab === "concierge") setConcierge(data.concierge ?? null);
      if (tab === "sessions") {
        setSessions(data.sessions ?? []);
        setSessionsTotal(data.total ?? 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [tab, days]);

  useEffect(() => {
    void loadSection();
  }, [loadSection]);

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
      if (!res.ok) throw new Error(data.error ?? "Giriş başarısız");
      setPassword("");
      await loadSection();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş başarısız");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
  }

  async function openSession(id: string) {
    const res = await fetch(`/api/admin/analytics/sessions/${id}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Oturum detayı alınamadı");
      return;
    }
    setSelectedSession(data);
  }

  if (!authenticated) {
    return (
      <AdminLoginForm
        password={password}
        setPassword={setPassword}
        error={error}
        loading={loginLoading}
        onSubmit={handleLogin}
        subtitle="Ziyaretçi analitiği, kanallar, huniler ve oturum detayları"
      />
    );
  }

  return (
    <AdminShell
      title="Analitik Paneli"
      subtitle="First-party · Eksiksiz ziyaretçi takibi"
      onRefresh={() => void loadSection()}
      onLogout={() => void handleLogout()}
    >
      {!configured && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Supabase bağlantısı yok. Vercel&apos;e <strong>SUPABASE_URL</strong> ve{" "}
          <strong>SUPABASE_SERVICE_ROLE_KEY</strong> ekleyin, ardından{" "}
          <code>supabase/migrations/001_analytics.sql</code> dosyasını Supabase SQL Editor&apos;de çalıştırın.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TAB_LABELS) as Tab[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-3 py-2 rounded-xl text-sm font-semibold ${
                tab === key ? "bg-primary text-white" : "bg-white border border-border"
              }`}
            >
              {TAB_LABELS[key]}
            </button>
          ))}
        </div>
        {tab !== "live" && (
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="ml-auto px-3 py-2 rounded-xl border border-border bg-white text-sm"
          >
            <option value={1}>Son 1 gün</option>
            <option value={7}>Son 7 gün</option>
            <option value={30}>Son 30 gün</option>
            <option value={90}>Son 90 gün</option>
          </select>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-muted">Yükleniyor…</p>
      ) : tab === "overview" && overview ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Oturum" value={overview.totalSessions} />
            <StatCard label="Tekil ziyaretçi" value={overview.uniqueVisitors} />
            <StatCard label="Sayfa görüntüleme" value={overview.totalPageviews} />
            <StatCard label="Toplam event" value={overview.totalEvents} />
            <StatCard label="Ort. süre" value={formatDuration(overview.avgDurationSec)} />
            <StatCard label="Hemen çıkma" value={`%${overview.bounceRate}`} />
            <StatCard label="Dönüşüm" value={overview.conversions} hint="Teklif / form gönderimi" />
            <StatCard label="Asistan açılışı" value={overview.conciergeOpens} />
          </div>
          <div className="bg-white rounded-2xl border border-border p-5">
            <h2 className="font-bold mb-4">Günlük trend</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted border-b">
                    <th className="py-2 pr-4">Tarih</th>
                    <th className="py-2 pr-4">Oturum</th>
                    <th className="py-2 pr-4">Sayfa</th>
                    <th className="py-2">Event</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.daily.map((row) => (
                    <tr key={row.date} className="border-b border-border/60">
                      <td className="py-2 pr-4">{row.date}</td>
                      <td className="py-2 pr-4">{row.sessions}</td>
                      <td className="py-2 pr-4">{row.pageviews}</td>
                      <td className="py-2">{row.events}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : tab === "live" ? (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-bold">Son 5 dakikadaki oturumlar</h2>
          </div>
          {live.length === 0 ? (
            <p className="p-8 text-muted text-center">Şu an aktif oturum yok.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-4 py-3">Başlangıç</th>
                  <th className="px-4 py-3">Sayfa</th>
                  <th className="px-4 py-3">Kanal</th>
                  <th className="px-4 py-3">Cihaz</th>
                </tr>
              </thead>
              <tbody>
                {live.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-4 py-3">{new Date(s.started_at).toLocaleTimeString("tr-TR")}</td>
                    <td className="px-4 py-3">{s.landing_path}</td>
                    <td className="px-4 py-3">
                      {CHANNEL_LABELS_TR[s.channel as keyof typeof CHANNEL_LABELS_TR] ?? s.channel}
                    </td>
                    <td className="px-4 py-3">{s.device_type ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : tab === "channels" ? (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <h2 className="font-bold px-5 py-4 border-b">Kanal dağılımı</h2>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-4 py-3">Kanal</th>
                  <th className="px-4 py-3">Oturum</th>
                  <th className="px-4 py-3">Ort. süre</th>
                  <th className="px-4 py-3">Çıkma</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((c) => (
                  <tr key={c.channel} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">
                      {CHANNEL_LABELS_TR[c.channel as keyof typeof CHANNEL_LABELS_TR] ?? c.channel}
                    </td>
                    <td className="px-4 py-3">{c.sessions}</td>
                    <td className="px-4 py-3">{formatDuration(c.avgDurationSec)}</td>
                    <td className="px-4 py-3">%{c.bounceRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <h2 className="font-bold px-5 py-4 border-b">Kaynak / arama terimleri</h2>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-4 py-3">Kaynak</th>
                  <th className="px-4 py-3">Kanal</th>
                  <th className="px-4 py-3">Adet</th>
                </tr>
              </thead>
              <tbody>
                {referrers.map((r) => (
                  <tr key={`${r.channel}-${r.label}`} className="border-t border-border">
                    <td className="px-4 py-3">{r.label}</td>
                    <td className="px-4 py-3">
                      {CHANNEL_LABELS_TR[r.channel as keyof typeof CHANNEL_LABELS_TR] ?? r.channel}
                    </td>
                    <td className="px-4 py-3">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === "pages" ? (
        <div className="bg-white rounded-2xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3">Sayfa</th>
                <th className="px-4 py-3">Görüntüleme</th>
                <th className="px-4 py-3">Tıklama</th>
                <th className="px-4 py-3">Ort. süre</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.path} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{p.path}</td>
                  <td className="px-4 py-3">{p.views}</td>
                  <td className="px-4 py-3">{p.clicks}</td>
                  <td className="px-4 py-3">{formatDuration(p.avgTimeSec)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === "funnel" && funnel ? (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <StatCard label="Gönderilen teklif" value={funnel.submits} />
            <StatCard label="Terk edilen wizard" value={funnel.abandons} />
            <StatCard
              label="Dönüşüm oranı"
              value={
                funnel.steps[0]?.sessions
                  ? `%${Math.round((funnel.submits / funnel.steps[0].sessions) * 100)}`
                  : "—"
              }
            />
          </div>
          <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
            {funnel.steps.map((step) => (
              <div key={step.step}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold">Adım {step.step}</span>
                  <span>{step.sessions} oturum</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${
                        funnel.steps[0]?.sessions
                          ? Math.max(8, (step.sessions / funnel.steps[0].sessions) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : tab === "clicks" ? (
        <div className="bg-white rounded-2xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3">Element</th>
                <th className="px-4 py-3">Sayfa</th>
                <th className="px-4 py-3">Adet</th>
              </tr>
            </thead>
            <tbody>
              {clicks.map((c) => (
                <tr key={`${c.page}-${c.label}`} className="border-t border-border">
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.label}</p>
                    {c.href && <p className="text-xs text-muted truncate max-w-xs">{c.href}</p>}
                  </td>
                  <td className="px-4 py-3">{c.page}</td>
                  <td className="px-4 py-3">{c.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === "concierge" && concierge ? (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-border p-5">
            <h2 className="font-bold mb-4">Asistan event&apos;leri</h2>
            <ul className="space-y-2 text-sm">
              {Object.entries(concierge.counts).map(([key, count]) => (
                <li key={key} className="flex justify-between border-b border-border/60 pb-2">
                  <span>{EVENT_LABELS_TR[key] ?? key}</span>
                  <strong>{count}</strong>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-border p-5">
            <h2 className="font-bold mb-4">Intent dağılımı</h2>
            <ul className="space-y-2 text-sm">
              {Object.entries(concierge.intents).map(([intent, count]) => (
                <li key={intent} className="flex justify-between border-b border-border/60 pb-2">
                  <span>{intent}</span>
                  <strong>{count}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : tab === "sessions" ? (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b text-sm text-muted">{sessionsTotal} oturum</div>
            <div className="max-h-[600px] overflow-y-auto">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => void openSession(s.id)}
                  className="w-full text-left px-4 py-3 border-b border-border hover:bg-slate-50 text-sm"
                >
                  <p className="font-medium">{new Date(s.started_at).toLocaleString("tr-TR")}</p>
                  <p className="text-muted">{s.landing_path}</p>
                  <p className="text-xs text-primary mt-1">
                    {CHANNEL_LABELS_TR[s.channel as keyof typeof CHANNEL_LABELS_TR] ?? s.channel} ·{" "}
                    {formatDuration(Math.round((s.duration_ms ?? 0) / 1000))}
                  </p>
                </button>
              ))}
            </div>
          </div>
          <div className="lg:col-span-3 bg-white rounded-2xl border border-border p-5">
            {!selectedSession ? (
              <p className="text-muted">Detay için soldan bir oturum seçin.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="font-bold">Oturum detayı</h2>
                  <p className="text-sm text-muted mt-1">
                    {selectedSession.session.landing_path} → {selectedSession.session.exit_path ?? "—"}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <span>Ülke: {selectedSession.session.country ?? "—"}</span>
                    <span>Şehir: {selectedSession.session.city ?? "—"}</span>
                    <span>Tarayıcı: {selectedSession.session.browser ?? "—"}</span>
                    <span>OS: {selectedSession.session.os ?? "—"}</span>
                    <span>UTM: {selectedSession.session.utm_source ?? "—"}</span>
                    <span>Referrer: {selectedSession.session.referrer_domain ?? "—"}</span>
                    <span>UTM Term: {selectedSession.session.utm_term ?? "—"}</span>
                    <span>GCLID: {selectedSession.session.gclid ? "Evet" : "—"}</span>
                  </div>
                </div>
                <ol className="space-y-2 max-h-[480px] overflow-y-auto">
                  {selectedSession.events.map((event) => (
                    <li key={event.id} className="text-sm border-l-2 border-primary/30 pl-3 py-1">
                      <p className="font-medium">
                        {EVENT_LABELS_TR[event.event_type] ?? event.event_type}
                        <span className="text-muted font-normal ml-2">
                          {new Date(event.created_at).toLocaleTimeString("tr-TR")}
                        </span>
                      </p>
                      <p className="text-muted">{event.page_path}</p>
                      {event.element_text && <p className="text-xs">{event.element_text}</p>}
                      {event.scroll_depth != null && (
                        <p className="text-xs">Kaydırma: %{event.scroll_depth}</p>
                      )}
                      {event.duration_ms != null && (
                        <p className="text-xs">Süre: {formatDuration(Math.round(event.duration_ms / 1000))}</p>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-muted">Henüz veri yok.</p>
      )}
    </AdminShell>
  );
}
