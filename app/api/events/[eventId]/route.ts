import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { generateSlotsForEvent } from "@/lib/slots";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await context.params;

  const { rows } =
    await sql`SELECT id, title, description, host_email, start_date, end_date, day_start_time, day_end_time, slot_duration_minutes
              FROM events WHERE id = ${eventId}::uuid;`;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const event = rows[0];

  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const dayStartParts = String(event.day_start_time).split(":").map(Number);
  const dayEndParts = String(event.day_end_time).split(":").map(Number);

  const slots = generateSlotsForEvent({
    startDate,
    endDate,
    dayStartHour: dayStartParts[0],
    dayStartMinute: dayStartParts[1],
    dayEndHour: dayEndParts[0],
    dayEndMinute: dayEndParts[1],
    slotDurationMinutes: event.slot_duration_minutes,
  }).map((slot) => ({
    start: slot.start.toISOString(),
    end: slot.end.toISOString(),
  }));

  return NextResponse.json({
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
    },
    config: {
      startDate: event.start_date,
      endDate: event.end_date,
      dayStartTime: event.day_start_time,
      dayEndTime: event.day_end_time,
      slotDurationMinutes: event.slot_duration_minutes,
    },
    slots,
  });
}

