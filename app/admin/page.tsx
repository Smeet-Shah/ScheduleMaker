"use client";

import { useEffect, useState } from "react";

type EventRow = {
  id: string;
  title: string;
};

type SlotMode = "time" | "day";

export default function AdminPage() {
  const [passcode, setPasscode] = useState("");
  const [authed, setAuthed] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dayStartTime, setDayStartTime] = useState("09:00");
  const [dayEndTime, setDayEndTime] = useState("21:00");
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(60);
  const [slotMode, setSlotMode] = useState<SlotMode>("time");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);

  useEffect(() => {
    async function checkAdmin() {
      const res = await fetch("/api/admin/me");
      if (res.ok) {
        setAuthed(true);
        loadEvents();
      }
    }
    checkAdmin();
  }, []);

  async function loadEvents() {
    const res = await fetch("/api/admin/events");
    if (res.ok) {
      const json = await res.json();
      setEvents(json.events);
    }
  }

  async function onLogin() {
    setMessage(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    if (res.ok) {
      setAuthed(true);
      loadEvents();
    } else {
      setMessage("Wrong passcode.");
    }
  }

  async function onCreateEvent() {
    setCreating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          startDate,
          endDate,
          dayStartTime,
          dayEndTime,
          slotDurationMinutes,
          dayOnly: slotMode === "day",
        }),
      });
      if (!res.ok) throw new Error("Failed to create event");
      const json = await res.json();
      setMessage(`Event created. Share link: ${json.shareUrl}`);
      setTitle("");
      setDescription("");
      loadEvents();
    } catch (e) {
      console.error(e);
      setMessage("Failed to create event.");
    } finally {
      setCreating(false);
    }
  }

  async function onReset(eventId: string) {
    const res = await fetch(`/api/events/${eventId}/reset`, {
      method: "POST",
    });
    if (res.ok) {
      setMessage("All responses reset for this event.");
    } else {
      setMessage("Failed to reset responses.");
    }
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-zinc-100 p-6 space-y-4">
          <h1 className="text-xl font-semibold text-zinc-900">
            Admin sign in
          </h1>
          <p className="text-sm text-zinc-600">
            Enter your admin passcode to manage events.
          </p>
          <input
            type="password"
            className="w-full h-9 rounded-md border border-zinc-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/80"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
          />
          <button
            type="button"
            onClick={onLogin}
            className="w-full h-9 rounded-md bg-zinc-900 text-zinc-50 text-sm font-medium hover:bg-zinc-800"
          >
            Continue
          </button>
          {message && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {message}
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 flex justify-center px-4 py-10">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-zinc-100 p-6 md:p-8 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Admin dashboard
          </h1>
          <p className="text-sm text-zinc-600">
            Create one event per poll, share the link, and reset responses when
            you want to start over.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-zinc-800">
            1. Create a new event
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col text-xs font-medium text-zinc-700 gap-1">
              Title
              <input
                className="h-8 rounded-md border border-zinc-300 px-2 text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="flex flex-col text-xs font-medium text-zinc-700 gap-1">
              Description (optional)
              <input
                className="h-8 rounded-md border border-zinc-300 px-2 text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <label className="flex flex-col text-xs font-medium text-zinc-700 gap-1 col-span-2">
              What should people choose?
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSlotMode("day")}
                  className={`flex-1 h-8 rounded-md border text-xs font-medium ${
                    slotMode === "day"
                      ? "bg-zinc-900 text-zinc-50 border-zinc-900"
                      : "bg-white text-zinc-800 border-zinc-300"
                  }`}
                >
                  Days only (no specific times)
                </button>
                <button
                  type="button"
                  onClick={() => setSlotMode("time")}
                  className={`flex-1 h-8 rounded-md border text-xs font-medium ${
                    slotMode === "time"
                      ? "bg-zinc-900 text-zinc-50 border-zinc-900"
                      : "bg-white text-zinc-800 border-zinc-300"
                  }`}
                >
                  Times during each day
                </button>
              </div>
            </label>
            <label className="flex flex-col text-xs font-medium text-zinc-700 gap-1">
              Start date
              <input
                type="date"
                className="h-8 rounded-md border border-zinc-300 px-2 text-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label className="flex flex-col text-xs font-medium text-zinc-700 gap-1">
              End date
              <input
                type="date"
                className="h-8 rounded-md border border-zinc-300 px-2 text-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
            {slotMode === "time" && (
              <>
                <label className="flex flex-col text-xs font-medium text-zinc-700 gap-1">
                  Day start time
                  <input
                    type="time"
                    className="h-8 rounded-md border border-zinc-300 px-2 text-sm"
                    value={dayStartTime}
                    onChange={(e) => setDayStartTime(e.target.value)}
                  />
                </label>
                <label className="flex flex-col text-xs font-medium text-zinc-700 gap-1">
                  Day end time
                  <input
                    type="time"
                    className="h-8 rounded-md border border-zinc-300 px-2 text-sm"
                    value={dayEndTime}
                    onChange={(e) => setDayEndTime(e.target.value)}
                  />
                </label>
                <label className="flex flex-col text-xs font-medium text-zinc-700 gap-1">
                  Slot length (minutes)
                  <input
                    type="number"
                    min={15}
                    step={15}
                    className="h-8 rounded-md border border-zinc-300 px-2 text-sm"
                    value={slotDurationMinutes}
                    onChange={(e) =>
                      setSlotDurationMinutes(Number(e.target.value))
                    }
                  />
                </label>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onCreateEvent}
            disabled={creating}
            className="mt-2 inline-flex items-center justify-center px-4 h-9 rounded-md bg-zinc-900 text-zinc-50 text-sm font-medium hover:bg-zinc-800 disabled:opacity-60"
          >
            {creating ? "Creating..." : "Create event"}
          </button>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-zinc-800">
            2. Share and manage events
          </h2>
          {events.length === 0 ? (
            <p className="text-sm text-zinc-500">No events yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-zinc-200 rounded-md px-3 py-2"
                >
                  <div>
                    <div className="font-medium text-zinc-900">
                      {event.title}
                    </div>
                    <div className="text-xs text-zinc-500 space-y-1">
                      <div>
                        Share link:{" "}
                        <a
                          href={`/e/${event.id}`}
                          target="_blank"
                          className="underline"
                        >
                          {typeof window !== "undefined"
                            ? `${window.location.origin}/e/${event.id}`
                            : `/e/${event.id}`}
                        </a>
                      </div>
                      <div>
                        Summary:{" "}
                        <a
                          href={`/e/${event.id}/summary`}
                          target="_blank"
                          className="underline"
                        >
                          {typeof window !== "undefined"
                            ? `${window.location.origin}/e/${event.id}/summary`
                            : `/e/${event.id}/summary`}
                        </a>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onReset(event.id)}
                    className="self-start inline-flex items-center justify-center h-8 px-3 rounded-md border border-red-200 text-xs font-medium text-red-700 hover:bg-red-50"
                  >
                    Reset responses
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {message && (
          <p className="text-xs text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}

