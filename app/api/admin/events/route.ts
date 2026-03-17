import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

const COOKIE_NAME = "schedule_admin";

export async function GET() {
  const cookie = (await cookies()).get(COOKIE_NAME);
  if (!cookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows } =
    await sql`SELECT id, title FROM events ORDER BY created_at DESC;`;

  return NextResponse.json({ events: rows });
}

