"use client";

import { Suspense } from "react";
import { AdminSidebar } from "./AdminSidebar";

export function AdminShell({
  title,
  subtitle,
  children,
  onRefresh,
  onLogout,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onRefresh?: () => void;
  onLogout?: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 flex">
      <Suspense fallback={<aside className="w-[260px] shrink-0 bg-slate-900 hidden lg:block" />}>
        <AdminSidebar onLogout={onLogout} />
      </Suspense>

      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-border">
          <div className="px-4 sm:px-6 lg:px-8 py-4 lg:pl-8 pl-16 flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-primary font-semibold">
                Ilyashan Yönetim
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{title}</h1>
              {subtitle && <p className="text-sm text-muted mt-0.5 truncate">{subtitle}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {actions}
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-white text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  Yenile
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:pl-8 pl-4">{children}</main>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: string | number;
  hint?: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted">{label}</p>
        {trend === "up" && <span className="text-xs font-semibold text-emerald-600">↑</span>}
        {trend === "down" && <span className="text-xs font-semibold text-red-500">↓</span>}
      </div>
      <p className="text-3xl font-bold text-foreground mt-1 tracking-tight">{value}</p>
      {hint && <p className="text-xs text-muted mt-2">{hint}</p>}
    </div>
  );
}

export function AdminPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-border shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function AdminAlert({
  variant,
  children,
}: {
  variant: "warning" | "error" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    error: "border-red-200 bg-red-50 text-red-700",
    info: "border-blue-200 bg-blue-50 text-blue-900",
  };
  return (
    <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${styles[variant]}`}>{children}</div>
  );
}

export function AdminLoginForm({
  password,
  setPassword,
  error,
  loading,
  onSubmit,
  subtitle,
}: {
  password: string;
  setPassword: (v: string) => void;
  error: string | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  subtitle: string;
}) {
  return (
    <main className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-primary flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center font-bold text-2xl text-white mx-auto mb-4">
            I
          </div>
          <h1 className="text-2xl font-bold text-white">Ilyashan Yönetim</h1>
          <p className="text-slate-400 text-sm mt-2">{subtitle}</p>
        </div>
        <form
          onSubmit={onSubmit}
          className="bg-white rounded-2xl border border-border shadow-2xl p-8 space-y-4"
          data-testid="admin-login-form"
        >
          <label className="block text-sm font-medium text-foreground">Admin şifresi</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
            data-testid="admin-password"
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors"
            data-testid="admin-login-submit"
          >
            {loading ? "Kontrol ediliyor…" : "Giriş yap"}
          </button>
        </form>
      </div>
    </main>
  );
}
