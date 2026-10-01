"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminAlert,
  AdminPanel,
  AdminShell,
  StatCard,
} from "@/components/admin/AdminShell";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import type { CleaningAdminOverview } from "@/lib/cleaning/admin-overview";
import type { TaskRateSeed } from "@/lib/cleaning/seed-config";

type Section =
  | "overview"
  | "tasks"
  | "labor"
  | "pricing"
  | "quotes"
  | "zeitstudien";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "tasks", label: "Task Rates" },
  { id: "labor", label: "Labor / Margin" },
  { id: "pricing", label: "Minimums / Tax / Team" },
  { id: "quotes", label: "Quotes" },
  { id: "zeitstudien", label: "Zeitstudien" },
];

interface QuoteListItem {
  id: string;
  quoteReference: string;
  createdAt: string;
  company: string;
  contactPerson: string;
  postalCode: string;
  city: string;
  totalAreaM2: number;
  frequency: string;
  netLabel: string;
  grossLabel: string;
  quoteStatus: string;
  leadId: string | null;
}

interface QuoteDetail {
  quoteReference: string;
  configVersionId: string;
  customer: {
    netCents: number;
    vatCents: number;
    grossCents: number;
    recommendedWorkers: number;
    estimatedOnsiteHours: number;
    quoteStatus: string;
    totalAreaM2: number;
    frequency: string;
  };
  admin: {
    workload: {
      requiredPersonHours: number;
      lines: Array<{
        taskId: string;
        nameDE: string;
        quantity: number;
        minutes: number;
        rateVersion: string;
      }>;
    };
    cost: {
      requiredPersonHours: number;
      billablePersonHours: number;
    };
    price: {
      realizedMargin: number;
      targetMargin: number;
    };
  };
  money: {
    net: string;
    vat: string;
    gross: string;
    labor: string;
    overhead: string;
    totalCost: string;
    marginPercent: number;
  };
  contact: { company: string; contactPerson: string; email: string; phone: string };
  terminUrl: string | null;
}

export function AdminCleaningPage() {
  const { logout, markUnauthenticated } = useAdminAuth();
  const [section, setSection] = useState<Section>("overview");
  const [overview, setOverview] = useState<CleaningAdminOverview | null>(null);
  const [tasks, setTasks] = useState<TaskRateSeed[]>([]);
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [quotes, setQuotes] = useState<QuoteListItem[]>([]);
  const [detail, setDetail] = useState<QuoteDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cfgRes, qRes] = await Promise.all([
        fetch("/api/admin/cleaning/config"),
        fetch("/api/admin/cleaning/quotes"),
      ]);
      if (cfgRes.status === 401 || qRes.status === 401) {
        markUnauthenticated();
        return;
      }
      const cfgData = await cfgRes.json();
      const qData = await qRes.json();
      if (!cfgRes.ok) throw new Error(cfgData.error ?? "Config yüklenemedi");
      if (!qRes.ok) throw new Error(qData.error ?? "Quotes yüklenemedi");
      setOverview(cfgData.overview);
      setTasks(cfgData.tasks ?? []);
      setConfig(cfgData.config ?? null);
      setQuotes(qData.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setLoading(false);
    }
  }, [markUnauthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openQuote(id: string) {
    setDetail(null);
    const res = await fetch(`/api/admin/cleaning/quotes/${encodeURIComponent(id)}`);
    if (res.status === 401) {
      markUnauthenticated();
      return;
    }
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Detay yüklenemedi");
      return;
    }
    setDetail(data as QuoteDetail);
    setSection("quotes");
  }

  return (
    <AdminShell
      title="Büroreinigung"
      subtitle="Kalkülasyon, task rates, teklifler — iç kullanım"
      onRefresh={() => void load()}
      onLogout={logout}
    >
      {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}

      <div className="flex flex-wrap gap-2 mb-6">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            data-testid={`admin-cleaning-tab-${s.id}`}
            onClick={() => setSection(s.id)}
            className={`min-h-11 px-4 rounded-xl text-sm font-semibold border ${
              section === s.id
                ? "bg-primary text-white border-primary"
                : "bg-white text-foreground border-border"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted">Yükleniyor…</p>
      ) : (
        <>
          {section === "overview" && overview ? (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard label="LG1 ücret (€/h)" value={overview.lg1WageEuros.toFixed(2)} />
                <StatCard
                  label="Produktive Kosten (€/h)"
                  value={overview.productiveLaborCostPerHourEuros.toFixed(2)}
                  hint="CALIBRATION_REQUIRED"
                />
                <StatCard label="Zielmarge %" value={overview.targetMarginPercent} />
                <StatCard label="Min. Marge %" value={overview.minimumMarginPercent} />
                <StatCard label="Min. Pers.-Std." value={overview.minimumBillablePersonHours} />
                <StatCard label="MwSt. %" value={overview.vatPercent} />
                <StatCard label="Teklif sayısı" value={overview.quoteCount} />
                <StatCard
                  label="Manual review %"
                  value={overview.manualReviewPercent}
                  hint={`${overview.manualReviewCount} / ${overview.quoteCount}`}
                />
              </div>
              <AdminPanel title="Aktif config">
                <p className="text-sm text-foreground/80">
                  Version: <strong>{overview.configVersionId}</strong>
                </p>
                <p className="text-sm text-foreground/80 mt-1">
                  Task rates: {overview.activeTaskCount} aktif ·{" "}
                  <span className="text-amber-700 font-medium">
                    {overview.calibrationRequiredTaskCount} CALIBRATION_REQUIRED
                  </span>
                </p>
                <p className="text-xs text-muted mt-3">
                  Müşteri API’lerine cost/margin gönderilmez. Bu panel yalnızca admin.
                </p>
              </AdminPanel>
            </div>
          ) : null}

          {section === "tasks" ? (
            <AdminPanel title="Task Rates">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm" data-testid="admin-cleaning-tasks">
                  <thead>
                    <tr className="text-left text-muted border-b border-border">
                      <th className="py-2 pr-3">Task</th>
                      <th className="py-2 pr-3">Kat.</th>
                      <th className="py-2 pr-3">Rate</th>
                      <th className="py-2 pr-3">Tip</th>
                      <th className="py-2 pr-3">Kaynak</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.id} className="border-b border-border/60">
                        <td className="py-2.5 pr-3 font-medium">{task.nameDE}</td>
                        <td className="py-2.5 pr-3">{task.category}</td>
                        <td className="py-2.5 pr-3">
                          {task.baseRate} / {task.unit}
                        </td>
                        <td className="py-2.5 pr-3">{task.rateType}</td>
                        <td className="py-2.5 pr-3">{task.sourceType}</td>
                        <td className="py-2.5">
                          <span className="inline-flex px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 text-xs font-semibold">
                            {task.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AdminPanel>
          ) : null}

          {section === "labor" && config ? (
            <div className="grid lg:grid-cols-2 gap-4">
              <AdminPanel title="Labor cost">
                <ul className="text-sm space-y-2 text-foreground/85">
                  <li>LG1 gross: {String(config.lg1GrossHourlyEuros)} €/h</li>
                  <li>Productive hour cost (seed): {overview?.productiveLaborCostPerHourEuros} €/h</li>
                  <li>Utilization ratio: {String(config.productivePaidTimeRatio)}</li>
                </ul>
                <p className="text-xs text-amber-800 mt-4 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  Seed değerler CALIBRATION_REQUIRED. Payroll modeli kaydedilmeden production claim yok.
                </p>
              </AdminPanel>
              <AdminPanel title="Margin">
                <ul className="text-sm space-y-2 text-foreground/85">
                  <li>Target: {overview?.targetMarginPercent}%</li>
                  <li>Minimum: {overview?.minimumMarginPercent}%</li>
                  <li>Formula: sell = cost / (1 − margin)</li>
                </ul>
              </AdminPanel>
            </div>
          ) : null}

          {section === "pricing" && config ? (
            <div className="grid lg:grid-cols-2 gap-4">
              <AdminPanel title="Minimums">
                <ul className="text-sm space-y-2">
                  <li>Min. billable hours: {String(config.minimumBillablePersonHours)}</li>
                  <li>Min. job net: {overview?.minimumJobNetEuros} €</li>
                </ul>
              </AdminPanel>
              <AdminPanel title="Tax / Team / Rounding">
                <ul className="text-sm space-y-2">
                  <li>VAT: {overview?.vatPercent}%</li>
                  <li>Rounding: {String(config.rounding)}</li>
                  <li>Max team: {String(config.maxTeamSize)}</li>
                  <li>Target onsite: {String(config.targetOnsiteHours)} h</li>
                </ul>
              </AdminPanel>
            </div>
          ) : null}

          {section === "quotes" ? (
            <div className="grid lg:grid-cols-[1fr_1.1fr] gap-4">
              <AdminPanel title="Teklif listesi">
                {quotes.length === 0 ? (
                  <p className="text-sm text-muted">Henüz Büro teklifi yok.</p>
                ) : (
                  <ul className="divide-y divide-border" data-testid="admin-cleaning-quotes">
                    {quotes.map((q) => (
                      <li key={q.id}>
                        <button
                          type="button"
                          className="w-full text-left py-3 hover:bg-slate-50 px-1 rounded-lg"
                          onClick={() => void openQuote(q.leadId ?? q.quoteReference)}
                        >
                          <p className="font-semibold text-foreground text-sm">
                            {q.quoteReference} · {q.company}
                          </p>
                          <p className="text-xs text-muted mt-0.5">
                            {q.totalAreaM2} m² · {q.postalCode} {q.city} · {q.netLabel} netto ·{" "}
                            {q.quoteStatus}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </AdminPanel>

              <AdminPanel title="İç kalkülasyon">
                {!detail ? (
                  <p className="text-sm text-muted">Soldan bir teklif seçin.</p>
                ) : (
                  <div className="space-y-4 text-sm" data-testid="admin-cleaning-quote-detail">
                    <div>
                      <p className="font-bold text-foreground">{detail.quoteReference}</p>
                      <p className="text-muted">
                        {detail.contact.company} · {detail.contact.contactPerson}
                      </p>
                      <p className="text-xs text-muted mt-1">Config: {detail.configVersionId}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-border p-3">
                        <p className="text-xs text-muted">Müşteri net</p>
                        <p className="font-bold">{detail.money.net}</p>
                      </div>
                      <div className="rounded-xl border border-border p-3">
                        <p className="text-xs text-muted">Brutto</p>
                        <p className="font-bold">{detail.money.gross}</p>
                      </div>
                      <div className="rounded-xl border border-border p-3">
                        <p className="text-xs text-muted">Toplam maliyet</p>
                        <p className="font-bold">{detail.money.totalCost}</p>
                      </div>
                      <div className="rounded-xl border border-border p-3">
                        <p className="text-xs text-muted">Marj %</p>
                        <p className="font-bold">{detail.money.marginPercent}</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">
                        İş yükü · {detail.admin.workload.requiredPersonHours.toFixed(2)} Pers.-Std.
                        (billable {detail.admin.cost.billablePersonHours.toFixed(2)})
                      </p>
                      <div className="overflow-x-auto max-h-64 overflow-y-auto border border-border rounded-xl">
                        <table className="min-w-full text-xs">
                          <thead className="bg-slate-50 sticky top-0">
                            <tr className="text-left">
                              <th className="p-2">Task</th>
                              <th className="p-2">Qty</th>
                              <th className="p-2">Min</th>
                              <th className="p-2">Ver</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detail.admin.workload.lines
                              .filter((l) => l.minutes > 0)
                              .map((l) => (
                                <tr key={`${l.taskId}-${l.quantity}`} className="border-t border-border/50">
                                  <td className="p-2">{l.nameDE}</td>
                                  <td className="p-2">{l.quantity}</td>
                                  <td className="p-2">{l.minutes.toFixed(1)}</td>
                                  <td className="p-2">{l.rateVersion}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {detail.terminUrl ? (
                      <a
                        href={detail.terminUrl}
                        className="text-primary font-medium text-sm underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Termin linki
                      </a>
                    ) : null}
                  </div>
                )}
              </AdminPanel>
            </div>
          ) : null}

          {section === "zeitstudien" ? (
            <AdminPanel title="Zeitstudien">
              <p className="text-sm text-foreground/80 leading-relaxed">
                Gerçek işlerden gözlemlenen production rate’ler burada toplanacak. Mevcut seed
                rate’ler otomatik üzerine yazılmaz; admin onayından sonra yeni version oluşur.
              </p>
              <p className="text-xs text-muted mt-3">
                P4 iskelet: UI + policy. Veri girişi / onay API’si sonraki iterasyonda.
              </p>
            </AdminPanel>
          ) : null}
        </>
      )}
    </AdminShell>
  );
}
