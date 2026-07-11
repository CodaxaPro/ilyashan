"use client";

import { useCallback, useEffect, useState } from "react";
import type { UpcomingSummary } from "@/lib/calendar/upcoming";
import type { UpcomingGroup } from "@/lib/calendar/upcoming";

export interface CalendarUpcomingData {
  summary: UpcomingSummary;
  groups: UpcomingGroup[];
  loading: boolean;
}

export function useCalendarUpcoming(enabled = true): CalendarUpcomingData {
  const [summary, setSummary] = useState<UpcomingSummary>({
    overdue: 0,
    today: 0,
    tomorrow: 0,
    week: 0,
    totalActionable: 0,
    badgeCount: 0,
  });
  const [groups, setGroups] = useState<UpcomingGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch("/api/admin/appointments/upcoming");
      if (!res.ok) return;
      const data = await res.json();
      setSummary(data.summary ?? {
        overdue: 0,
        today: 0,
        tomorrow: 0,
        week: 0,
        totalActionable: 0,
        badgeCount: 0,
      });
      setGroups(data.groups ?? []);
    } catch {
      /* ignore badge failures */
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [load]);

  return { summary, groups, loading };
}
