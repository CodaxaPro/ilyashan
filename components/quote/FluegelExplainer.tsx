"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Info-Icon neben dem Flügel-Hinweis → Modal mit klarer Zähl-Hilfe */
export function FluegelInfoButton() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const modal =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6"
            role="presentation"
          >
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/50"
              aria-label="Schließen"
              onClick={() => setOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              data-testid="fluegel-info-modal"
              className="relative z-10 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-border bg-white shadow-2xl"
            >
              <div className="sticky top-0 flex items-start justify-between gap-3 px-5 pt-5 pb-3 bg-white border-b border-border">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
                    Zählhilfe
                  </p>
                  <h2 id={titleId} className="text-lg font-bold text-foreground leading-snug">
                    Was ist ein Fensterflügel?
                  </h2>
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  data-testid="fluegel-info-close"
                  onClick={() => setOpen(false)}
                  className="w-10 h-10 rounded-xl border border-border text-muted hover:text-foreground hover:border-primary/30 transition-colors"
                  aria-label="Schließen"
                >
                  ×
                </button>
              </div>

              <div className="px-5 py-5 space-y-5">
                <p className="text-sm text-foreground leading-relaxed">
                  Bitte zählen Sie <strong>nicht</strong> die Fensteröffnung als Ganzes — sondern
                  jeden <strong>einzeln öffenbaren Teil</strong> (Flügel).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FluegelCard
                    wings={1}
                    title="1 Flügel"
                    body="Ein Teil, der sich öffnet → in der Zahl: 1"
                  />
                  <FluegelCard
                    wings={2}
                    title="2 Flügel"
                    body="Zwei Teile in einer Öffnung → in der Zahl: 2"
                  />
                </div>

                <div className="rounded-xl bg-primary-light/30 border border-primary/15 px-4 py-3">
                  <p className="text-sm text-foreground leading-relaxed">
                    <strong className="text-primary">Praxis-Tipp:</strong> Vor dem Fenster stehen und
                    zählen, wie viele Teile sich einzeln öffnen lassen. Jedes Teil ={" "}
                    <strong>1 Flügel</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full min-h-11 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
                >
                  Verstanden
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        data-testid="fluegel-info-open"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-primary/40 text-primary bg-primary-light/40 hover:bg-primary hover:text-white transition-colors shrink-0"
        aria-label="Was ist ein Fensterflügel? Erklärung öffnen"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
      </button>
      {modal}
    </>
  );
}

function FluegelCard({
  wings,
  title,
  body,
}: {
  wings: 1 | 2;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <FluegelDiagram wings={wings} />
      <p className="mt-2 text-sm font-bold text-foreground">{title}</p>
      <p className="text-xs text-muted leading-relaxed mt-0.5">{body}</p>
    </div>
  );
}

function FluegelDiagram({ wings }: { wings: 1 | 2 }) {
  const w = 220;
  const h = 130;
  const pad = 16;
  const frame = 7;
  const gap = wings === 2 ? 5 : 0;
  const innerW = w - pad * 2 - frame * 2;
  const innerH = h - pad * 2 - frame * 2;
  const wingW = wings === 2 ? (innerW - gap) / 2 : innerW;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" aria-hidden>
      <rect width={w} height={h} rx="10" fill="#f1f5f9" />
      <rect
        x={pad}
        y={pad}
        width={w - pad * 2}
        height={h - pad * 2}
        rx="4"
        fill="#0f172a"
      />
      {Array.from({ length: wings }).map((_, i) => {
        const x = pad + frame + i * (wingW + gap);
        const y = pad + frame;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={wingW}
              height={innerH}
              rx="2"
              fill="#e0f2fe"
              stroke="#0369a1"
              strokeWidth="1.75"
            />
            <rect
              x={wings === 2 ? (i === 0 ? x + wingW - 11 : x + 7) : x + wingW - 11}
              y={y + innerH * 0.4}
              width="4.5"
              height="16"
              rx="1.5"
              fill="#0369a1"
            />
            <circle cx={x + wingW / 2} cy={y + innerH / 2} r="13" fill="#0369a1" />
            <text
              x={x + wingW / 2}
              y={y + innerH / 2 + 5}
              textAnchor="middle"
              fontSize="13"
              fontWeight="700"
              fill="#fff"
            >
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
