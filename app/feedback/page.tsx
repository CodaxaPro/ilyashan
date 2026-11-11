"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { siteConfig } from "@/lib/config";

function FeedbackForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [name, setName] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "done" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [existingScore, setExistingScore] = useState<number | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Ungültiger Link.");
      return;
    }
    void (async () => {
      try {
        const res = await fetch(`/api/feedback?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Fehler");
        setName(data.name ?? "");
        if (data.alreadySubmitted) {
          setExistingScore(data.score);
          setStatus("done");
        } else {
          setStatus("ready");
        }
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Fehler");
      }
    })();
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!score) {
      setError("Bitte Sterne wählen.");
      return;
    }
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, score, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler");
      setExistingScore(data.score);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-teal-50/40 px-4 py-16">
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
          {siteConfig.name}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Ihre Meinung zählt</h1>

        {status === "loading" && <p className="mt-4 text-sm text-muted">Laden…</p>}

        {status === "error" && (
          <p className="mt-4 text-sm text-red-600">{error ?? "Link ungültig."}</p>
        )}

        {status === "done" && (
          <p className="mt-4 text-sm text-foreground">
            Vielen Dank{name ? `, ${name}` : ""}
            {existingScore ? ` — ${existingScore} von 5 Sternen` : ""}. Wir freuen uns über Ihr Feedback.
          </p>
        )}

        {status === "ready" && (
          <form onSubmit={(e) => void submit(e)} className="mt-6 space-y-4">
            <p className="text-sm text-muted">
              Guten Tag{name ? ` ${name}` : ""} — wie zufrieden waren Sie mit dem Einsatz?
            </p>
            <div className="flex gap-2" role="group" aria-label="Sterne">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setScore(n)}
                  className={`h-11 w-11 rounded-xl border text-sm font-semibold ${
                    score === n
                      ? "border-teal-700 bg-teal-700 text-white"
                      : "border-border bg-white text-foreground hover:border-teal-600"
                  }`}
                  data-testid={`csat-star-${n}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Optional: kurzer Kommentar"
              rows={3}
              className="w-full rounded-xl border border-border px-3 py-2 text-sm"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-xl bg-teal-800 py-2.5 text-sm font-semibold text-white"
              data-testid="csat-submit"
            >
              Absenden
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<main className="p-8 text-sm text-muted">Laden…</main>}>
      <FeedbackForm />
    </Suspense>
  );
}
