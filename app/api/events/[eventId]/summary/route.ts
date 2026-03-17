import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: { eventId: string } },
) {
  const { eventId } = params;

  const { rows } =
    await sql`SELECT slot_start, COUNT(DISTINCT participant_id) AS count
              FROM availabilities
              WHERE event_id = ${eventId}::uuid
              GROUP BY slot_start
              ORDER BY slot_start;`;

  const summary = rows.map((row) => ({
    slotStart: row.slot_start,
    count: Number(row.count),
  }));

  return NextResponse.json({ summary });
}

