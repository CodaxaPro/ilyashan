"use client";

import type { CalendarViewMode } from "@/lib/calendar/filters";
import { formatMonthLabel } from "@/lib/calendar/month-range";
import { formatWeekLabel } from "@/lib/calendar/week-range";

interface CalendarToolbarProps {
  view: CalendarViewMode;
  weekStart: string;
  weekEnd: string;
  monthYear: number;
  month: number;
  onViewChange: (view: CalendarViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onMonthYearChange: (year: number, month: number) => void;
  onWeekJump: (iso: string) => void;
}

export function CalendarToolbar({
  view,
  weekStart,
  weekEnd,
  monthYear,
  month,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  onMonthYearChange,
  onWeekJump,
}: CalendarToolbarProps) {
  const periodLabel =
    view === "month"
      ? formatMonthLabel(monthYear, month)
      : view === "week"
        ? formatWeekLabel(weekStart, weekEnd)
        : "Yaklaşan 30 gün";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-xl border border-border overflow-hidden shadow-sm bg-white">
          {(["week", "month", "agenda"] as CalendarViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              data-testid={`calendar-view-${mode}`}
              onClick={() => onViewChange(mode)}
              className={`px-4 py-2 text-sm font-semibold transition ${
                view === mode
                  ? "bg-primary text-white shadow-inner"
                  : "bg-white text-foreground hover:bg-slate-50"
              }`}
            >
              {mode === "week" ? "Hafta" : mode === "month" ? "Ay" : "Liste"}
            </button>
          ))}
        </div>

        <button
          type="button"
          data-testid="calendar-prev"
          onClick={onPrev}
          className="px-3 py-2 rounded-lg border border-border hover:bg-slate-50 text-sm font-semibold"
        >
          ←
        </button>
        <button
          type="button"
          data-testid="calendar-today"
          onClick={onToday}
          className="px-3 py-2 rounded-lg border border-border hover:bg-slate-50 text-sm font-semibold"
        >
          Bugün
        </button>
        <button
          type="button"
          data-testid="calendar-next"
          onClick={onNext}
          className="px-3 py-2 rounded-lg border border-border hover:bg-slate-50 text-sm font-semibold"
        >
          →
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm font-semibold text-foreground" data-testid="calendar-period-label">
          {periodLabel}
        </p>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted font-medium">Ay/Yıl</span>
          <select
            data-testid="calendar-month-picker"
            value={`${monthYear}-${String(month).padStart(2, "0")}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split("-").map(Number);
              onMonthYearChange(y, m);
              if (view === "week") onWeekJump(`${e.target.value}-01`);
            }}
            className="px-3 py-2 rounded-xl border border-border bg-white text-sm font-semibold"
          >
            {buildMonthOptions(monthYear).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        {view === "week" && (
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted font-medium">Hafta</span>
            <input
              type="date"
              data-testid="calendar-date-picker"
              value={weekStart}
              onChange={(e) => onWeekJump(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-white text-sm"
            />
          </label>
        )}
      </div>
    </div>
  );
}

function buildMonthOptions(centerYear: number) {
  const options: { value: string; label: string }[] = [];
  for (let y = centerYear - 1; y <= centerYear + 1; y++) {
    for (let m = 1; m <= 12; m++) {
      options.push({
        value: `${y}-${String(m).padStart(2, "0")}`,
        label: formatMonthLabel(y, m),
      });
    }
  }
  return options;
}
