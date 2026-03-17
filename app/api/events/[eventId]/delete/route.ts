import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const COOKIE_NAME = "schedule_admin";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ eventId: string }> },
) {
  const cookie = (await cookies()).get(COOKIE_NAME);
  if (!cookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await context.params;

  await sql`DELETE FROM events WHERE id = ${eventId}::uuid;`;

  return NextResponse.json({ ok: true });
}

