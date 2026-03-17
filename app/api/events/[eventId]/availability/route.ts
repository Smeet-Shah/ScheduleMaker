import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

type Body = {
  name: string;
  timezone: string;
  slots: { start: string; end: string }[];
};

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await context.params;
  const body = (await req.json()) as Body;

  if (!body.name || !body.timezone || !Array.isArray(body.slots)) {
    return NextResponse.json(
      { error: "Missing name, timezone, or slots" },
      { status: 400 },
    );
  }

  try {
    const participantResult =
      await sql`INSERT INTO participants (event_id, name, timezone)
                VALUES (${eventId}::uuid, ${body.name}, ${body.timezone})
                ON CONFLICT (event_id, name)
                DO UPDATE SET timezone = EXCLUDED.timezone
                RETURNING id;`;

    const participantId = participantResult.rows[0].id;

    await sql`DELETE FROM availabilities WHERE event_id = ${eventId}::uuid AND participant_id = ${participantId}::uuid;`;

    for (const slot of body.slots) {
      await sql`INSERT INTO availabilities (event_id, participant_id, slot_start, slot_end)
                VALUES (${eventId}::uuid, ${participantId}::uuid, ${slot.start}, ${slot.end});`;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to save availability" },
      { status: 500 },
    );
  }
}

