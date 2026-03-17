import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "schedule_admin";

export async function POST(req: Request) {
  const body = await req.json();
  const passcode = body?.passcode;
  const expected = process.env.ADMIN_PASSCODE;

  if (!expected || passcode !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  (await cookies()).set(COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}

