import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

const COOKIE_NAME = "schedule_admin";

export async function POST(
  _req: Request,
  { params }: { params: { eventId: string } },
) {
  const cookie = (await cookies()).get(COOKIE_NAME);
  if (!cookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = params;

  await sql`DELETE FROM availabilities WHERE event_id = ${eventId}::uuid;`;
  await sql`DELETE FROM participants WHERE event_id = ${eventId}::uuid;`;

  return NextResponse.json({ ok: true });
}

