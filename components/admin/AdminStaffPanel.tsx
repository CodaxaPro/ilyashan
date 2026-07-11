"use client";

import { useEffect, useState } from "react";
import type { StaffConfig, StaffMember } from "@/lib/staff/types";
import { DEFAULT_STAFF_CONFIG } from "@/lib/staff/config";
import { AdminAlert, AdminPanel } from "@/components/admin/AdminShell";

interface AdminStaffPanelProps {
  storageConfigured: boolean;
}

const WEEKDAY_OPTIONS = [
  { value: 1, label: "Pzt" },
  { value: 2, label: "Sal" },
  { value: 3, label: "Çar" },
  { value: 4, label: "Per" },
  { value: 5, label: "Cum" },
  { value: 6, label: "Cmt" },
];

export function AdminStaffPanel({ storageConfigured }: AdminStaffPanelProps) {
  const [config, setConfig] = useState<StaffConfig>(DEFAULT_STAFF_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/staff")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { config: StaffConfig }) => setConfig(data.config))
      .catch(() => setError("Ekip ayarları yüklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  function updateMember(index: number, patch: Partial<StaffMember>) {
    setConfig((prev) => ({
      ...prev,
      members: prev.members.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    }));
    setSuccess(null);
  }

  function toggleWorkDay(index: number, day: number) {
    setConfig((prev) => ({
      ...prev,
      members: prev.members.map((m, i) => {
        if (i !== index) return m;
        const has = m.workDays.includes(day);
        return {
          ...m,
          workDays: has ? m.workDays.filter((d) => d !== day) : [...m.workDays, day].sort(),
        };
      }),
    }));
    setSuccess(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Kaydedilemedi");
      setConfig(data.config);
      setSuccess("Ekip kapasitesi kaydedildi — takvim ve müşteri booking anında güncellenir.");
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
        Ekip ayarları yükleniyor…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!storageConfigured && (
        <AdminAlert variant="warning">
          Kalıcı kayıt için Vercel&apos;de <strong>Upstash Redis</strong> bağlayın.
        </AdminAlert>
      )}

      {error && <AdminAlert variant="error">{error}</AdminAlert>}
      {success && <AdminAlert variant="success">{success}</AdminAlert>}

      <AdminPanel className="p-5 space-y-4">
        <h3 className="font-bold text-foreground">Takım geneli (atanmamış işler)</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="text-muted">Günlük max iş</span>
            <input
              type="number"
              min={1}
              max={20}
              value={config.teamMaxJobsPerDay}
              onChange={(e) =>
                setConfig((p) => ({ ...p, teamMaxJobsPerDay: Number(e.target.value) }))
              }
              className="mt-1 w-full rounded-xl border border-border px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="text-muted">Slot başına max iş</span>
            <input
              type="number"
              min={1}
              max={10}
              value={config.teamMaxJobsPerSlot}
              onChange={(e) =>
                setConfig((p) => ({ ...p, teamMaxJobsPerSlot: Number(e.target.value) }))
              }
              className="mt-1 w-full rounded-xl border border-border px-3 py-2"
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.autoAssign}
            onChange={(e) => setConfig((p) => ({ ...p, autoAssign: e.target.checked }))}
          />
          Otomatik ekip ataması (müşteri ekip seçmez)
        </label>
      </AdminPanel>

      {config.members.map((member, index) => (
        <AdminPanel key={member.id} className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: member.color }}
              />
              Ekip üyesi {index + 1}
            </h3>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={member.active}
                onChange={(e) => updateMember(index, { active: e.target.checked })}
              />
              Aktif
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-sm">
              <span className="text-muted">Ad</span>
              <input
                value={member.name}
                onChange={(e) => updateMember(index, { name: e.target.value })}
                className="mt-1 w-full rounded-xl border border-border px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="text-muted">Renk</span>
              <input
                type="color"
                value={member.color}
                onChange={(e) => updateMember(index, { color: e.target.value })}
                className="mt-1 w-full h-10 rounded-xl border border-border"
              />
            </label>
            <label className="text-sm">
              <span className="text-muted">Günlük max iş</span>
              <input
                type="number"
                min={1}
                max={12}
                value={member.maxJobsPerDay}
                onChange={(e) => updateMember(index, { maxJobsPerDay: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-border px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="text-muted">Slot başına max</span>
              <input
                type="number"
                min={1}
                max={6}
                value={member.maxJobsPerSlot}
                onChange={(e) => updateMember(index, { maxJobsPerSlot: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-border px-3 py-2"
              />
            </label>
          </div>

          <div>
            <p className="text-sm text-muted mb-2">Çalışma günleri</p>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleWorkDay(index, d.value)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    member.workDays.includes(d.value)
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-border text-muted"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </AdminPanel>
      ))}

      <button
        type="button"
        disabled={saving}
        onClick={() => void handleSave()}
        className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold disabled:opacity-50"
      >
        {saving ? "Kaydediliyor…" : "Ekip ayarlarını kaydet"}
      </button>
    </div>
  );
}
