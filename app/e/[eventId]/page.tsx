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

type Slot = { start: string; end: string };

type EventResponse = {
  event: { id: string; title: string; description: string | null };
  config: {
    dayOnly: boolean;
    startDate: string;
    endDate: string;
  };
  slots: Slot[];
};

const timezones = Intl.supportedValuesOf("timeZone");

export default function EventPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const [data, setData] = useState<EventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // For day-only events, build a calendar view data structure
  const calendarMonths = useMemo(() => {
    if (!data || !data.config.dayOnly) return [];
    const start = new Date(data.config.startDate);
    const end = new Date(data.config.endDate);

    const months: {
      monthLabel: string;
      weeks: { date: Date; inRange: boolean; hasSlot: boolean }[][];
    }[] = [];

    let monthCursor = startOfMonth(start);
    while (monthCursor <= end) {
      const monthStart = startOfMonth(monthCursor);
      const monthEnd = endOfMonth(monthCursor);
      const firstDay = startOfWeek(monthStart, { weekStartsOn: 0 });

      const weeks: { date: Date; inRange: boolean; hasSlot: boolean }[][] = [];
      let current = firstDay;
      // build 6 weeks max for the month grid
      for (let w = 0; w < 6; w++) {
        const week: { date: Date; inRange: boolean; hasSlot: boolean }[] = [];
        for (let d = 0; d < 7; d++) {
          const inRange =
            current >= start &&
            current <= end &&
            current.getMonth() === monthStart.getMonth() &&
            current.getFullYear() === monthStart.getFullYear();
          const hasSlot = data.slots.some((slot) =>
            isSameDay(new Date(slot.start), current),
          );
          week.push({ date: current, inRange, hasSlot });
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
  }, [data]);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (!res.ok) {
          throw new Error("Failed to load event");
        }
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
        setMessage("Failed to load event.");
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [eventId]);

  async function loadExisting() {
    if (!name.trim()) {
      setMessage("Enter your name first, then load your saved availability.");
      return;
    }
    if (!data) return;
    try {
      setMessage(null);
      const res = await fetch(
        `/api/events/${eventId}/availability?name=${encodeURIComponent(name)}`,
      );
      if (!res.ok) {
        if (res.status === 404) {
          setMessage("No saved availability found for that name yet.");
          return;
        }
        throw new Error("Failed to load");
      }
      const json = await res.json();
      const next = new Set<string>();
      (json.slots as Slot[]).forEach((slot) => {
        next.add(`${slot.start}-${slot.end}`);
      });
      setSelected(next);
      setDirty(false);
      setMessage("Loaded your previous availability. You can adjust and save.");
    } catch (e) {
      console.error(e);
      setMessage("Could not load your existing availability.");
    }
  }

  const groupedSlots = useMemo(() => {
    if (!data) return {};
    const groups: Record<string, Slot[]> = {};
    for (const slot of data.slots) {
      const d = new Date(slot.start);
      const key = d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: timezone,
      });
      if (!groups[key]) groups[key] = [];
      groups[key].push(slot);
    }
    return groups;
  }, [data, timezone]);

  function toggleSlot(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      setDirty(true);
      return next;
    });
  }

  async function onSave() {
    if (!name.trim()) {
      setMessage("Please enter your name.");
      return;
    }
    if (!data) return;
    if (!dirty) {
      setMessage("No changes to save yet.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const slots = data.slots.filter((slot) =>
        selected.has(`${slot.start}-${slot.end}`),
      );
      const res = await fetch(`/api/events/${eventId}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, timezone, slots }),
      });
      if (!res.ok) {
        throw new Error("Failed to save");
      }
      setDirty(false);
      setMessage("Your availability has been saved.");
    } catch (e) {
      console.error(e);
      setMessage("Failed to save your availability.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-600">Loading event...</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Event not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 flex justify-center px-4 py-10">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-zinc-100 p-6 md:p-10 space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold text-zinc-900">
            {data.event.title}
          </h1>
          {data.event.description && (
            <p className="text-zinc-600">{data.event.description}</p>
          )}
          <p className="text-sm text-zinc-500">
            {data.config.dayOnly
              ? "Step 1: Enter your name and time zone. Step 2: Click every day you are free."
              : "Step 1: Enter your name and time zone. Step 2: Click all of the times you’re available."}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-[2fr,1fr] items-start">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <label className="flex flex-col text-sm font-medium text-zinc-800 gap-1">
                Your name
                <input
                  className="h-9 rounded-md border border-zinc-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/80"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex"
                />
              </label>
              <button
                type="button"
                onClick={loadExisting}
                className="mt-1 md:mt-6 inline-flex items-center justify-center px-3 h-9 rounded-md border border-zinc-300 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
              >
                Load my saved availability
              </button>
              <label className="flex flex-col text-sm font-medium text-zinc-800 gap-1">
                Your time zone
                <select
                  className="h-9 rounded-md border border-zinc-300 px-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/80"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {data.config.dayOnly ? (
              <div className="space-y-6">
                {calendarMonths.map((month) => (
                  <div key={month.monthLabel} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-zinc-800">
                        {month.monthLabel}
                      </h2>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                        <span className="inline-flex h-3 w-3 rounded-sm border border-zinc-300 bg-white" />{" "}
                        Not selected
                        <span className="inline-flex h-3 w-3 rounded-sm border border-emerald-500 bg-emerald-500 ml-3" />{" "}
                        Selected
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
                        const key = data.slots.find((slot) =>
                          isSameDay(new Date(slot.start), cell.date),
                        );
                        const selectionKey = key
                          ? `${key.start}-${key.end}`
                          : null;
                        const isSelected =
                          selectionKey && selected.has(selectionKey);

                        if (!cell.inRange || !cell.hasSlot) {
                          return (
                            <div
                              key={dateKey}
                              className="h-12 rounded-md border border-dashed border-zinc-100 bg-zinc-50/40"
                            />
                          );
                        }

                        return (
                          <button
                            key={dateKey}
                            type="button"
                            onClick={() =>
                              selectionKey && toggleSlot(selectionKey)
                            }
                            className={`h-12 rounded-md border text-xs flex flex-col items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-emerald-500 text-white border-emerald-500"
                                : "bg-white text-zinc-800 border-zinc-200 hover:bg-zinc-50"
                            }`}
                            title={cell.date.toDateString()}
                          >
                            <span className="text-sm font-medium">
                              {format(cell.date, "d")}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-200">
                <div className="min-w-[640px] divide-y divide-zinc-100">
                  {Object.entries(groupedSlots).map(([dateLabel, slots]) => (
                    <div key={dateLabel} className="px-4 py-3 space-y-2">
                      <div className="text-sm font-medium text-zinc-800">
                        {dateLabel}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {slots.map((slot) => {
                          const key = `${slot.start}-${slot.end}`;
                          const d = new Date(slot.start);
                          const isSelected = selected.has(key);
                          const label = d.toLocaleTimeString(undefined, {
                            hour: "numeric",
                            minute: "2-digit",
                            timeZone: timezone,
                          });
                          const title = new Date(
                            slot.start,
                          ).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                            timeZone: timezone,
                          });
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => toggleSlot(key)}
                              className={`px-3 py-2 rounded-full text-xs font-medium border transition-colors ${
                                isSelected
                                  ? "bg-emerald-500 text-white border-emerald-500"
                                  : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                              }`}
                              title={title}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <button
              type="button"
              onClick={onSave}
              disabled={saving || !dirty}
              className="w-full h-10 rounded-md bg-zinc-900 text-zinc-50 text-sm font-medium hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving
                ? "Saving..."
                : dirty
                  ? "Save my availability"
                  : "Saved"}
            </button>
            {message && (
              <p className="text-sm text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2">
                {message}
              </p>
            )}
            <p className="text-xs text-zinc-500">
              Your name and selected times are stored so the host can see which
              slots work best for everyone. You can come back and resave with
              the same name to update.
            </p>
            <p className="text-xs text-zinc-500">
              Want to see the whole group&apos;s availability?{" "}
              <a
                href={`/e/${eventId}/summary`}
                className="underline"
                target="_blank"
              >
                Open the summary view
              </a>
              .
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}

