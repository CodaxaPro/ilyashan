"use client";

import { useMemo, useState } from "react";
import type { QuoteFormData, ScheduleOption } from "@/lib/quote-form";
import { formatGermanDate, scheduleOptionLabels } from "@/lib/quote-form";
import { preventChoiceButtonScroll } from "@/components/quote/quote-wizard-scroll";
import { usePricingConfig } from "@/components/quote/PricingConfigProvider";

interface Step4ScheduleProps {
  data: QuoteFormData;
  onChange: (updates: Partial<QuoteFormData>) => void;
}

const scheduleOptions: {
  value: ScheduleOption;
  title: string;
  subtitle: string;
}[] = [
  {
    value: "1-2_wochen",
    title: "In den nächsten 1–2 Wochen",
    subtitle: "Wir melden uns schnellstmöglich",
  },
  {
    value: "wunschtermine",
    title: "Wunschtermine wählen",
    subtitle: "Bis zu 3 bevorzugte Termine",
  },
  {
    value: "unsicher",
    title: "Noch nicht sicher",
    subtitle: "Wir beraten Sie gerne",
  },
];

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

function toIsoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function DateCalendar({
  selected,
  onToggle,
  minLeadDays,
  weekdaysOnly,
}: {
  selected: string[];
  onToggle: (iso: string) => void;
  minLeadDays: number;
  weekdaysOnly: boolean;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const earliest = new Date(today);
  earliest.setDate(earliest.getDate() + minLeadDays);

  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(viewYear, viewMonth, d));
    }
    return cells;
  }, [viewMonth, viewYear]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  return (
    <div className="rounded-2xl border border-border bg-white p-5 mt-6">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          disabled={!canGoPrev}
          className="w-9 h-9 rounded-lg border border-border hover:border-primary/30 disabled:opacity-30 transition-colors"
          aria-label="Vorheriger Monat"
        >
          ‹
        </button>
        <p className="font-bold text-foreground">
          {MONTHS[viewMonth]} {viewYear}
        </p>
        <button
          type="button"
          onClick={nextMonth}
          className="w-9 h-9 rounded-lg border border-border hover:border-primary/30 transition-colors"
          aria-label="Nächster Monat"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-muted py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;

          const iso = toIsoDate(date);
          const day = date.getDay();
          const isWeekend = day === 0 || day === 6;
          const isTooSoon = date < earliest;
          const isBlocked = isTooSoon || (weekdaysOnly && isWeekend);
          const isPast = date < today;
          const isSelected = selected.includes(iso);
          const isToday = iso === toIsoDate(today);

          return (
            <button
              key={iso}
              type="button"
              disabled={isBlocked || isPast || (!isSelected && selected.length >= 3)}
              onClick={() => onToggle(iso)}
              className={`aspect-square rounded-xl text-sm font-semibold transition-all ${
                isSelected
                  ? "bg-primary text-white shadow-md"
                  : isBlocked || isPast
                    ? "text-muted/40 cursor-not-allowed"
                    : isToday
                      ? "border-2 border-primary text-primary hover:bg-primary-light/50"
                      : "hover:bg-primary-light/50 text-foreground"
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-muted text-center">
        {selected.length === 0
          ? "Kein Termin gewählt · 0/3"
          : `${selected.length} Termin${selected.length > 1 ? "e" : ""} gewählt · ${selected.length}/3`}
      </p>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mt-3">
          {selected.map((iso) => (
            <span
              key={iso}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
            >
              {formatGermanDate(iso)}
              <button
                type="button"
                onClick={() => onToggle(iso)}
                className="hover:text-primary-dark"
                aria-label={`${formatGermanDate(iso)} entfernen`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function Step4Schedule({ data, onChange }: Step4ScheduleProps) {
  const { schedule } = usePricingConfig();

  function selectOption(option: ScheduleOption) {
    onChange({
      scheduleOption: option,
      preferredDates: option === "wunschtermine" ? data.preferredDates : [],
    });
  }

  function toggleDate(iso: string) {
    const current = data.preferredDates;
    if (current.includes(iso)) {
      onChange({ preferredDates: current.filter((d) => d !== iso) });
    } else if (current.length < 3) {
      onChange({ preferredDates: [...current, iso].sort() });
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Wunschtermin</h2>
      <p className="text-muted mb-8">
        Wann soll die Fensterreinigung stattfinden? Wählen Sie die passende Option.
      </p>

      <div className="space-y-3 max-w-xl">
        {scheduleOptions.map((opt) => {
          const selected = data.scheduleOption === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onMouseDown={preventChoiceButtonScroll}
              onClick={() => selectOption(opt.value)}
              className={`w-full text-left rounded-2xl border-2 p-5 transition-all ${
                selected
                  ? "border-primary bg-primary-light/40 shadow-md"
                  : "border-border bg-white hover:border-primary/30 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selected ? "border-primary bg-primary" : "border-border"
                  }`}
                >
                  {selected && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="font-bold text-foreground">{opt.title}</p>
                  <p className="text-sm text-muted mt-0.5">{opt.subtitle}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {data.scheduleOption === "wunschtermine" && (
        <DateCalendar
          selected={data.preferredDates}
          onToggle={toggleDate}
          minLeadDays={schedule.scheduleMinLeadDays}
          weekdaysOnly={schedule.scheduleWeekdaysOnly}
        />
      )}

      {data.scheduleOption && data.scheduleOption !== "wunschtermine" && (
        <div className="mt-6 p-4 rounded-xl bg-primary-light/30 border border-primary/10 max-w-xl">
          <p className="text-sm text-primary-dark">
            <strong>{scheduleOptionLabels[data.scheduleOption]}:</strong>{" "}
            {data.scheduleOption === "1-2_wochen"
              ? "Wir melden uns innerhalb von 24 Stunden mit Terminvorschlägen."
              : "Kein Problem – wir besprechen den Termin persönlich mit Ihnen."}
          </p>
        </div>
      )}
    </div>
  );
}
