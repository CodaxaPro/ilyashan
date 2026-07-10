"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ConciergeAction, ConciergeSession } from "@/lib/concierge/types";
import { createSession, CONCIERGE_QUICK_REPLIES } from "@/lib/concierge/types";
import { isHotLead } from "@/lib/concierge/lead";
import { getProactiveNudge, PROACTIVE_DELAY_MS } from "@/lib/concierge/proactive";
import { trackRequestQuoteConversion } from "@/lib/google-ads";
import { siteConfig } from "@/lib/config";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: ConciergeAction[];
}

const SESSION_KEY = "ilyashan-concierge-session";
const MESSAGES_KEY = "ilyashan-concierge-messages";
const NUDGE_KEY = "ilyashan-concierge-nudge-seen";

function loadSession(): ConciergeSession {
  if (typeof window === "undefined") return createSession();
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as ConciergeSession;
  } catch {
    /* ignore */
  }
  return createSession(crypto.randomUUID());
}

function saveSession(session: ConciergeSession) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

function loadMessages(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(MESSAGES_KEY);
    if (raw) return JSON.parse(raw) as ChatMessage[];
  } catch {
    /* ignore */
  }
  return [];
}

function saveMessages(messages: ChatMessage[]) {
  try {
    sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(messages.slice(-40)));
  } catch {
    /* ignore */
  }
}

function renderMarkdownLite(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const lines = part.split("\n");
    return lines.map((line, j) => (
      <span key={`${i}-${j}`}>
        {line.startsWith("_") && line.endsWith("_") ? (
          <em className="text-muted">{line.slice(1, -1)}</em>
        ) : (
          line
        )}
        {j < lines.length - 1 ? <br /> : null}
      </span>
    ));
  });
}

export function ConciergeWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<ConciergeSession>(() => createSession());
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [nudge, setNudge] = useState<string | null>(null);
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState<string | null>(null);
  const [leadError, setLeadError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const greeted = useRef(false);

  const showLeadForm = isHotLead(session) && !leadSuccess;

  useEffect(() => {
    setSession(loadSession());
    const stored = loadMessages();
    if (stored.length > 0) {
      setMessages(stored);
      greeted.current = true;
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || open) return;
    if (sessionStorage.getItem(NUDGE_KEY)) return;

    const timer = window.setTimeout(() => {
      setNudge(getProactiveNudge(pathname));
    }, PROACTIVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [ready, open, pathname]);

  useEffect(() => {
    if (!open || !ready || greeted.current) return;
    greeted.current = true;
    if (messages.length > 0) return;

    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Guten Tag! Ich bin der **Ilyashan Assistent** für Fensterreinigung in ${siteConfig.contact.region}. Fragen Sie mich zu Preisen, Leistungen oder starten Sie eine Live-Preisschätzung.`,
      },
    ]);
    setQuickReplies([...CONCIERGE_QUICK_REPLIES]);
  }, [open, ready, messages.length]);

  useEffect(() => {
    if (messages.length > 0) saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, showLeadForm, leadSuccess]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const openChat = useCallback(() => {
    setOpen(true);
    setNudge(null);
    sessionStorage.setItem(NUDGE_KEY, "1");
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content: trimmed },
      ]);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/concierge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, session }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setSession(data.session);
        saveSession(data.session);
        setQuickReplies(data.quickReplies ?? []);

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.reply,
            actions: data.actions,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Entschuldigung, es gab ein technisches Problem. Bitte rufen Sie uns an: **${siteConfig.contact.phoneDisplay}** oder nutzen Sie den Preisrechner.`,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, session]
  );

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    setLeadLoading(true);
    setLeadError(null);

    try {
      const res = await fetch("/api/concierge/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: leadName, phone: leadPhone, session }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      trackRequestQuoteConversion(`concierge-${session.id}`);
      setLeadSuccess(data.message);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.message,
        },
      ]);
    } catch (err) {
      setLeadError(err instanceof Error ? err.message : "Senden fehlgeschlagen.");
    } finally {
      setLeadLoading(false);
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[55] bg-black/40 lg:bg-black/20"
          aria-hidden
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`fixed z-[56] flex flex-col bg-white shadow-2xl border border-border transition-all duration-300 overflow-hidden
          bottom-0 left-0 right-0 h-[min(85dvh,640px)] rounded-t-3xl
          sm:left-auto sm:right-[max(1rem,env(safe-area-inset-right))] sm:bottom-[max(5.5rem,env(safe-area-inset-bottom))] sm:w-[400px] sm:h-[min(70dvh,600px)] sm:rounded-2xl
          ${open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"}`}
        data-testid="concierge-panel"
        role="dialog"
        aria-label="Ilyashan Assistent"
        aria-hidden={!open}
      >
        <div className="flex items-center gap-3 px-4 py-3 bg-primary text-white shrink-0">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
            I
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight">Ilyashan Assistent</p>
            <p className="text-xs text-white/80 truncate">
              {showLeadForm ? "Preisschätzung bereit · Rückruf möglich" : siteConfig.messaging.livePricingBadge}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-2 rounded-lg hover:bg-white/10"
            aria-label="Chat schließen"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-linear-to-b from-primary-light/20 to-white">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-br-md"
                    : "bg-white border border-border text-foreground shadow-sm rounded-bl-md"
                }`}
              >
                {msg.role === "assistant" ? renderMarkdownLite(msg.content) : msg.content}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/60">
                    {msg.actions.map((action) =>
                      action.type === "link" ? (
                        <Link
                          key={action.href}
                          href={action.href}
                          className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary text-white text-xs font-semibold hover:bg-primary/90"
                          onClick={() => setOpen(false)}
                        >
                          {action.label}
                        </Link>
                      ) : (
                        <a
                          key={action.href}
                          href={action.href}
                          target={action.type === "whatsapp" ? "_blank" : undefined}
                          rel={action.type === "whatsapp" ? "noopener noreferrer" : undefined}
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                            action.type === "whatsapp"
                              ? "bg-[#25D366] text-white"
                              : "bg-primary-light text-primary border border-primary/20"
                          }`}
                          onClick={() => {
                            if (action.type === "whatsapp") trackRequestQuoteConversion(`wa-${session.id}`);
                          }}
                        >
                          {action.label}
                        </a>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-border rounded-2xl px-4 py-3 text-sm text-muted">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce">·</span>
                  <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>·</span>
                  <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>·</span>
                </span>
              </div>
            </div>
          )}

          {showLeadForm && (
            <form
              onSubmit={submitLead}
              className="rounded-2xl border-2 border-accent/30 bg-accent-light/30 p-4 space-y-3"
              data-testid="concierge-lead-form"
            >
              <p className="text-sm font-semibold text-foreground">Persönlicher Rückruf gewünscht?</p>
              <p className="text-xs text-muted">
                Wir rufen Sie mit Ihrer Live-Preisschätzung innerhalb von {siteConfig.business.responseTime} zurück.
              </p>
              <input
                type="text"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="Ihr Name *"
                required
                className="w-full px-3 py-2 rounded-xl border border-border text-sm"
                data-testid="concierge-lead-name"
              />
              <input
                type="tel"
                value={leadPhone}
                onChange={(e) => setLeadPhone(e.target.value)}
                placeholder="Telefon *"
                required
                className="w-full px-3 py-2 rounded-xl border border-border text-sm"
                data-testid="concierge-lead-phone"
              />
              {leadError && <p className="text-xs text-red-600">{leadError}</p>}
              <button
                type="submit"
                disabled={leadLoading}
                className="w-full py-2.5 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-50"
                data-testid="concierge-lead-submit"
              >
                {leadLoading ? "Wird gesendet…" : "Rückruf anfordern"}
              </button>
            </form>
          )}
        </div>

        {quickReplies.length > 0 && !showLeadForm && (
          <div className="px-3 py-2 flex gap-2 overflow-x-auto shrink-0 border-t border-border bg-white/80">
            {quickReplies.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => sendMessage(q)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary bg-primary-light/50 hover:bg-primary-light font-medium"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <form
          className="p-3 border-t border-border bg-white shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage(input);
          }}
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ihre Frage…"
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={loading}
              data-testid="concierge-input"
              maxLength={2000}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50"
              data-testid="concierge-send"
            >
              Senden
            </button>
          </div>
          <p className="text-[10px] text-muted mt-2 text-center">
            Assistent · Nur Fensterreinigung · Preise unverbindlich bis Festpreis-Angebot
          </p>
        </form>
      </div>

      {nudge && !open && (
        <div
          className="fixed z-[56] max-w-[260px] rounded-2xl bg-white border border-border shadow-xl p-4 text-sm leading-relaxed
            bottom-[max(9.5rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))]"
          data-testid="concierge-nudge"
        >
          <p className="text-foreground mb-3">{nudge}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={openChat}
              className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-semibold"
            >
              Chat öffnen
            </button>
            <button
              type="button"
              onClick={() => {
                setNudge(null);
                sessionStorage.setItem(NUDGE_KEY, "1");
              }}
              className="px-3 py-2 rounded-xl border border-border text-xs text-muted"
              aria-label="Schließen"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openChat())}
        className={`fixed z-[56] flex items-center gap-2 rounded-full shadow-lg transition-all duration-200
          bg-primary text-white hover:bg-primary/90
          bottom-[max(5.5rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))]
          ${open ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100"}
          ${nudge ? "ring-2 ring-accent ring-offset-2 animate-pulse" : ""}
          pl-4 pr-5 py-3`}
        aria-label="Ilyashan Assistent öffnen"
        data-testid="concierge-toggle"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
        <span className="text-sm font-semibold hidden sm:inline">Assistent</span>
      </button>
    </>
  );
}
