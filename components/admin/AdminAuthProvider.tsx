"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AdminLoginForm } from "./AdminShell";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AdminAuthContextValue {
  status: AuthStatus;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  markUnauthenticated: () => void;
  error: string | null;
  clearError: () => void;
  loginLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

async function fetchSession(): Promise<{ configured: boolean; authenticated: boolean }> {
  const res = await fetch("/api/admin/session");
  if (!res.ok) return { configured: true, authenticated: false };
  return res.json();
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const checkSession = useCallback(async () => {
    const data = await fetchSession();
    if (!data.configured) {
      setError("Admin erişimi yapılandırılmamış (ADMIN_PASSWORD eksik).");
      setStatus("unauthenticated");
      return;
    }
    setStatus(data.authenticated ? "authenticated" : "unauthenticated");
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  const login = useCallback(async (plainPassword: string) => {
    setLoginLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: plainPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Giriş başarısız");
      setPassword("");
      setStatus("authenticated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş başarısız");
      throw err;
    } finally {
      setLoginLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setStatus("unauthenticated");
    setPassword("");
  }, []);

  const markUnauthenticated = useCallback(() => {
    setStatus("unauthenticated");
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      status,
      login,
      logout,
      markUnauthenticated,
      error,
      clearError,
      loginLoading,
    }),
    [status, login, logout, markUnauthenticated, error, clearError, loginLoading]
  );

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login(password);
    } catch {
      /* error state set in login() */
    }
  }

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted">
          <span className="inline-block w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Oturum kontrol ediliyor…
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <AdminLoginForm
        password={password}
        setPassword={setPassword}
        error={error}
        loading={loginLoading}
        onSubmit={handleLogin}
        subtitle="Leadler, analitik ve asistan ayarlarını yönetin"
      />
    );
  }

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider when authenticated");
  }
  return ctx;
}
