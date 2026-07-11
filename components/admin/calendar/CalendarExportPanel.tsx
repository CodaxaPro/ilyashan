"use client";

interface CalendarExportPanelProps {
  exportUrl: string;
  feedConfigured: boolean;
  subscribeUrl: string | null;
}

export function CalendarExportPanel({
  exportUrl,
  feedConfigured,
  subscribeUrl,
}: CalendarExportPanelProps) {
  return (
    <div
      className="rounded-xl border border-border bg-slate-50 p-4 space-y-3"
      data-testid="calendar-export-panel"
    >
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={exportUrl}
          data-testid="calendar-export-ics"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-border text-sm font-semibold hover:bg-slate-100"
        >
          ICS indir (görünüm aralığı)
        </a>
      </div>

      {feedConfigured && subscribeUrl ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">Google Calendar abonelik URL</p>
          <p className="text-[11px] text-muted">
            Google Calendar → Diğer takvimler → URL ile ekle — bu linki yapıştırın.
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              readOnly
              value={subscribeUrl}
              data-testid="calendar-feed-url"
              className="flex-1 min-w-[240px] px-3 py-2 rounded-lg border border-border bg-white text-xs font-mono"
            />
            <button
              type="button"
              data-testid="calendar-feed-copy"
              onClick={() => void navigator.clipboard.writeText(subscribeUrl)}
              className="px-3 py-2 rounded-lg border border-border bg-white text-xs font-semibold hover:bg-slate-100"
            >
              Kopyala
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-muted">
          Canlı Google Calendar senkronu için Vercel&apos;de <code>CALENDAR_ICS_TOKEN</code> tanımlayın.
        </p>
      )}
    </div>
  );
}
