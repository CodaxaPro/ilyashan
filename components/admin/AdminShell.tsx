"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin/analytics", label: "Analitik" },
  { href: "/admin", label: "Leadler" },
];

export function AdminShell({
  title,
  subtitle,
  children,
  onRefresh,
  onLogout,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onRefresh?: () => void;
  onLogout?: () => void;
}) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-primary font-semibold">Ilyashan Yönetim</p>
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="px-4 py-2 rounded-xl border border-border bg-white text-sm font-medium"
              >
                Yenile
              </button>
            )}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-medium"
              >
                Çıkış
              </button>
            )}
          </div>
        </div>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-2 pb-3 overflow-x-auto">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${
                pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
                  ? "bg-primary text-white"
                  : "bg-slate-50 border border-border text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="max-w-7xl mx-auto p-4 sm:p-6">{children}</div>
    </main>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
      {hint && <p className="text-xs text-muted mt-2">{hint}</p>}
    </div>
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
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-white rounded-2xl border border-border shadow-lg p-8 space-y-4"
      >
        <h1 className="text-2xl font-bold text-foreground">Ilyashan Admin</h1>
        <p className="text-sm text-muted">{subtitle}</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin şifresi"
          className="w-full px-4 py-3 rounded-xl border border-border"
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-50"
        >
          {loading ? "Kontrol ediliyor…" : "Giriş yap"}
        </button>
      </form>
    </main>
  );
}
