import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await context.params;

  const { rows } =
    await sql`SELECT a.slot_start,
                     COUNT(DISTINCT a.participant_id) AS count,
                     ARRAY_AGG(DISTINCT p.name) AS names
              FROM availabilities a
              JOIN participants p ON p.id = a.participant_id
              WHERE a.event_id = ${eventId}::uuid
              GROUP BY a.slot_start
              ORDER BY a.slot_start;`;

  const summary = rows.map((row) => ({
    slotStart: row.slot_start,
    count: Number(row.count),
    names: row.names ?? [],
  }));

  return NextResponse.json({ summary });
}

