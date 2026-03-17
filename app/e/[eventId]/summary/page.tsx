"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type SummaryItem = { slotStart: string; count: number; names: string[] };
type Slot = { start: string; end: string };

type EventData = {
  event: { id: string; title: string; description: string | null };
  config: {
    dayOnly: boolean;
  };
  slots: Slot[];
};

export default function SummaryPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const [eventData, setEventData] = useState<EventData | null>(null);
  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [loading, setLoading] = useState(true);

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

        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <div className="min-w-[640px] divide-y divide-zinc-100">
            {Object.entries(grouped).map(([dateLabel, slots]) => (
              <div key={dateLabel} className="px-4 py-3 space-y-2">
                <div className="text-sm font-medium text-zinc-800">
                  {dateLabel}
                </div>
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => {
                    const isoStart = new Date(slot.start).toISOString();
                    const info = countsBySlotStart.get(isoStart) ?? {
                      count: 0,
                      names: [],
                    };
                    const count = info.count;
                    const intensity =
                      maxCount > 0 ? count / maxCount : 0;
                    const bg =
                      intensity === 0
                        ? "bg-zinc-100 text-zinc-500"
                        : intensity > 0.66
                          ? "bg-emerald-600 text-white"
                          : intensity > 0.33
                            ? "bg-emerald-400 text-white"
                            : "bg-emerald-200 text-emerald-900";

                    const label = eventData.config.dayOnly
                      ? new Date(slot.start).toLocaleDateString(undefined, {
                          weekday: "short",
                        })
                      : new Date(slot.start).toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        });

                    const title = info.names.length
                      ? `${count} available: ${info.names.join(", ")}`
                      : `${count} available`;

                    return (
                      <div
                        key={isoStart}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border border-transparent ${bg}`}
                        title={title}
                      >
                        {label}
                        <span className="ml-2 text-[10px] opacity-80">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

