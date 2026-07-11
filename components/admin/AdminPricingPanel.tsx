"use client";

import { useEffect, useState } from "react";
import type { FensterPricingConfig } from "@/lib/pricing-config";
import { DEFAULT_FENSTER_PRICING } from "@/lib/pricing-config";
import { AdminAlert, AdminPanel } from "@/components/admin/AdminShell";

interface AdminPricingPanelProps {
  storageConfigured: boolean;
}

export function AdminPricingPanel({ storageConfigured }: AdminPricingPanelProps) {
  const [config, setConfig] = useState<FensterPricingConfig>(DEFAULT_FENSTER_PRICING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/pricing")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { config: FensterPricingConfig }) => setConfig(data.config))
      .catch(() => setError("Fiyatlar yüklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  function updateField<K extends keyof FensterPricingConfig>(key: K, value: FensterPricingConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSuccess(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Kaydedilemedi");
      setConfig(data.config);
      setSuccess("Fiyatlar kaydedildi — wizard anında güncellenir.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-muted">
        <span className="inline-block w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        Fiyatlar yükleniyor…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!storageConfigured && (
        <AdminAlert variant="warning">
          Kalıcı kayıt için Vercel&apos;de <strong>Upstash Redis</strong> bağlayın. KV yoksa varsayılan
          fiyatlar kullanılır.
        </AdminAlert>
      )}

      {error && <AdminAlert variant="error">{error}</AdminAlert>}
      {success && <AdminAlert variant="info">{success}</AdminAlert>}

      <AdminPanel className="p-6 space-y-8">
        <section>
          <h2 className="text-lg font-bold text-foreground">Temel Fensterreinigung</h2>
          <p className="text-sm text-muted mt-1">Flügel bazlı canlı fiyat hesaplaması</p>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="block">
              <span className="text-xs font-semibold text-muted uppercase">€ / Flügel</span>
              <input
                type="number"
                step="0.5"
                min={2}
                max={25}
                value={config.basePerFluegel}
                onChange={(e) => updateField("basePerFluegel", Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted uppercase">Min. Wohnung €</span>
              <input
                type="number"
                min={20}
                max={200}
                value={config.minimumWohnung}
                onChange={(e) => updateField("minimumWohnung", Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted uppercase">Min. Haus €</span>
              <input
                type="number"
                min={30}
                max={300}
                value={config.minimumHaus}
                onChange={(e) => updateField("minimumHaus", Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted uppercase">Min. Gewerbe €</span>
              <input
                type="number"
                min={50}
                max={500}
                value={config.minimumGewerbe}
                onChange={(e) => updateField("minimumGewerbe", Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              />
            </label>
          </div>
        </section>

        <section className="border-t border-border pt-8">
          <h2 className="text-lg font-bold text-foreground">Wartungsvertrag</h2>
          <p className="text-sm text-muted mt-1">Aylık abonelik fiyatı hesaplaması</p>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="block">
              <span className="text-xs font-semibold text-muted uppercase">İndirim %</span>
              <input
                type="number"
                min={0}
                max={50}
                value={Math.round(config.wartungDiscount * 100)}
                onChange={(e) => updateField("wartungDiscount", Number(e.target.value) / 100)}
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted uppercase">Ziyaret / yıl</span>
              <input
                type="number"
                min={1}
                max={52}
                value={config.wartungVisitsPerYear}
                onChange={(e) => updateField("wartungVisitsPerYear", Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted uppercase">Min. € / ay</span>
              <input
                type="number"
                min={20}
                max={300}
                value={config.wartungMinMonthly}
                onChange={(e) => updateField("wartungMinMonthly", Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              />
            </label>
          </div>
          <p className="text-xs text-muted mt-3">
            Formül: max(min €/ay, round(Einsatz × ziyaret × (1−indirim) / 12))
          </p>
        </section>

        <section className="border-t border-border pt-8">
          <h2 className="text-lg font-bold text-foreground">Termin kuralları</h2>
          <p className="text-sm text-muted mt-1">Wizard Step 4 — Wunschtermine</p>
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-semibold text-muted uppercase">Min. önceden gün</span>
              <input
                type="number"
                min={0}
                max={14}
                value={config.scheduleMinLeadDays}
                onChange={(e) => updateField("scheduleMinLeadDays", Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="flex items-center gap-3 mt-6">
              <input
                type="checkbox"
                checked={config.scheduleWeekdaysOnly}
                onChange={(e) => updateField("scheduleWeekdaysOnly", e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm font-medium">Sadece hafta içi (Mo–Fr)</span>
            </label>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            disabled={saving || !storageConfigured}
            onClick={() => void handleSave()}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 hover:bg-primary-dark transition-colors"
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
          {config.updatedAt && (
            <span className="text-xs text-muted">
              Son güncelleme: {new Date(config.updatedAt).toLocaleString("tr-TR")}
            </span>
          )}
        </div>
      </AdminPanel>
    </div>
  );
}
