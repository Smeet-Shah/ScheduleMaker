"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  addDays,
  endOfMonth,
  format,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

type SummaryItem = { slotStart: string; count: number; names: string[] };
type Slot = { start: string; end: string };

type EventData = {
  event: { id: string; title: string; description: string | null };
  config: {
    dayOnly: boolean;
    startDate: string;
    endDate: string;
  };
  slots: Slot[];
};

export default function SummaryPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const [eventData, setEventData] = useState<EventData | null>(null);
  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const calendarMonths = useMemo(() => {
    if (!eventData) return [];
    const start = new Date(
      eventData.config.dayOnly
        ? eventData.config.startDate
        : eventData.slots[0]?.start ?? new Date(),
    );
    const end = new Date(
      eventData.config.dayOnly
        ? eventData.config.endDate
        : eventData.slots[eventData.slots.length - 1]?.start ?? new Date(),
    );

    const months: {
      monthLabel: string;
      weeks: { date: Date; inRange: boolean }[][];
    }[] = [];

    let monthCursor = startOfMonth(start);
    while (monthCursor <= end) {
      const monthStart = startOfMonth(monthCursor);
      const monthEnd = endOfMonth(monthCursor);
      const firstDay = startOfWeek(monthStart, { weekStartsOn: 0 });

      const weeks: { date: Date; inRange: boolean }[][] = [];
      let current = firstDay;
      for (let w = 0; w < 6; w++) {
        const week: { date: Date; inRange: boolean }[] = [];
        for (let d = 0; d < 7; d++) {
          const inRange = current >= start && current <= end;
          week.push({ date: current, inRange });
          current = addDays(current, 1);
        }
        weeks.push(week);
        if (current > monthEnd && current > end) break;
      }

      months.push({
        monthLabel: format(monthStart, "MMMM yyyy"),
        weeks,
      });
      monthCursor = addDays(monthEnd, 1);
    }

    return months;
  }, [eventData]);

  useEffect(() => {
    async function load() {
      try {
        const [eventRes, summaryRes] = await Promise.all([
          fetch(`/api/events/${eventId}`),
          fetch(`/api/events/${eventId}/summary`),
        ]);
        const eventJson = await eventRes.json();
        const summaryJson = await summaryRes.json();
        setEventData(eventJson);
        setSummary(summaryJson.summary);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventId]);

  const countsBySlotStart = useMemo(() => {
    const map = new Map<string, { count: number; names: string[] }>();
    for (const item of summary) {
      map.set(new Date(item.slotStart).toISOString(), {
        count: item.count,
        names: item.names,
      });
    }
    return map;
  }, [summary]);

  const grouped = useMemo(() => {
    if (!eventData) return {};
    const groups: Record<string, Slot[]> = {};
    for (const slot of eventData.slots) {
      const d = new Date(slot.start);
      const key = d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      if (!groups[key]) groups[key] = [];
      groups[key].push(slot);
    }
    return groups;
  }, [eventData]);

  const maxCount = summary.reduce(
    (max, item) => Math.max(max, item.count),
    0,
  );

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-600">Loading summary...</p>
      </main>
    );
  }

  if (!eventData) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Event not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 flex justify-center px-4 py-10">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-zinc-100 p-6 md:p-10 space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold text-zinc-900">
            Best availability for {eventData.event.title}
          </h1>
          <p className="text-sm text-zinc-600">
            Each chip shows how many people are available. Darker green means
            more people.
          </p>
        </header>

        <div className="space-y-6">
          {calendarMonths.map((month) => (
            <div key={month.monthLabel} className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-800">
                  {month.monthLabel}
                </h2>
                <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                  <span className="inline-flex h-3 w-3 rounded-sm border border-zinc-300 bg-zinc-50" />{" "}
                  No one available
                  <span className="inline-flex h-3 w-3 rounded-sm border border-emerald-400 bg-emerald-200 ml-3" />{" "}
                  Some available
                  <span className="inline-flex h-3 w-3 rounded-sm border border-emerald-700 bg-emerald-600 ml-3" />{" "}
                  Everyone / most available
                </div>
              </div>
              <div className="grid grid-cols-7 text-[11px] text-zinc-500 mb-1">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div key={day} className="text-center">
                      {day}
                    </div>
                  ),
                )}
              </div>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {month.weeks.flat().map((cell) => {
                  const dateKey = format(cell.date, "yyyy-MM-dd");
                  const slotsForDay =
                    grouped[
                      cell.date.toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    ] ?? [];

                  let totalCount = 0;
                  for (const slot of slotsForDay) {
                    const isoStart = new Date(slot.start).toISOString();
                    const info = countsBySlotStart.get(isoStart);
                    if (info) totalCount = Math.max(totalCount, info.count);
                  }

                  const everyoneAvailable =
                    maxCount > 0 && totalCount === maxCount && totalCount > 0;

                  const intensity =
                    maxCount > 0 ? totalCount / maxCount : 0;
                  const baseColor =
                    intensity === 0
                      ? "bg-zinc-50 text-zinc-400 border-zinc-200"
                      : intensity > 0.66
                        ? "bg-emerald-600 text-white border-emerald-700"
                        : "bg-emerald-200 text-emerald-900 border-emerald-300";

                  if (!cell.inRange) {
                    return (
                      <div
                        key={dateKey}
                        className="h-12 rounded-md border border-dashed border-zinc-100 bg-zinc-50/40"
                      />
                    );
                  }

                  return (
                    <div
                      key={dateKey}
                      className={`h-12 rounded-md border text-xs flex flex-col items-center justify-center ${baseColor} ${
                        everyoneAvailable ? "ring-2 ring-sky-500" : ""
                      }`}
                      title={
                        totalCount === 0
                          ? "No one available"
                          : `${totalCount} available`
                      }
                    >
                      <span className="text-sm font-medium">
                        {format(cell.date, "d")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

