import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

type Body = {
  name: string;
  timezone: string;
  slots: { start: string; end: string }[];
};

export async function POST(
  req: Request,
  { params }: { params: { eventId: string } },
) {
  const { eventId } = params;
  const body = (await req.json()) as Body;

  if (!body.name || !body.timezone || !Array.isArray(body.slots)) {
    return NextResponse.json(
      { error: "Missing name, timezone, or slots" },
      { status: 400 },
    );
  }

  const client = await sql.begin();

  try {
    const participantResult =
      await client`INSERT INTO participants (event_id, name, timezone)
                   VALUES (${eventId}::uuid, ${body.name}, ${body.timezone})
                   ON CONFLICT (event_id, name)
                   DO UPDATE SET timezone = EXCLUDED.timezone
                   RETURNING id;`;

    const participantId = participantResult.rows[0].id;

    await client`DELETE FROM availabilities WHERE event_id = ${eventId}::uuid AND participant_id = ${participantId}::uuid;`;

    for (const slot of body.slots) {
      await client`INSERT INTO availabilities (event_id, participant_id, slot_start, slot_end)
                   VALUES (${eventId}::uuid, ${participantId}::uuid, ${slot.start}, ${slot.end});`;
    }

    await client.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    await client.rollback();
    console.error(error);
    return NextResponse.json(
      { error: "Failed to save availability" },
      { status: 500 },
    );
  }
}

