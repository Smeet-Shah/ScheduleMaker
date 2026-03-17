import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "schedule_admin";

export async function GET() {
  const cookie = (await cookies()).get(COOKIE_NAME);
  if (!cookie) {
    return NextResponse.json({ admin: false }, { status: 401 });
  }
  return NextResponse.json({ admin: true });
}

