import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const {
    title,
    description,
    hostEmail,
    startDate,
    endDate,
    dayStartTime,
    dayEndTime,
    slotDurationMinutes,
  } = body;

  if (
    !title ||
    !startDate ||
    !endDate ||
    !dayStartTime ||
    !dayEndTime ||
    !slotDurationMinutes
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const { rows } =
    await sql`INSERT INTO events (title, description, host_email, start_date, end_date, day_start_time, day_end_time, slot_duration_minutes)
              VALUES (${title}, ${description || null}, ${hostEmail || null}, ${startDate}, ${endDate}, ${dayStartTime}, ${dayEndTime}, ${slotDurationMinutes})
              RETURNING id;`;

  const event = rows[0];

  return NextResponse.json(
    {
      id: event.id,
      shareUrl: `/e/${event.id}`,
    },
    { status: 201 },
  );
}

