"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

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
      return next;
    });
  }

  async function onSave() {
    if (!name.trim()) {
      setMessage("Please enter your name.");
      return;
    }
    if (!data) return;
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
                        const label = data.config.dayOnly
                          ? d.toLocaleDateString(undefined, {
                              weekday: "short",
                            })
                          : d.toLocaleTimeString(undefined, {
                              hour: "numeric",
                              minute: "2-digit",
                              timeZone: timezone,
                            });
                        const title = data.config.dayOnly
                          ? d.toLocaleDateString(undefined, {
                              weekday: "long",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : new Date(slot.start).toLocaleString(undefined, {
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
          </div>

          <aside className="space-y-4">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="w-full h-10 rounded-md bg-zinc-900 text-zinc-50 text-sm font-medium hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save my availability"}
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

