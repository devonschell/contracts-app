// src/app/api/whoami/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  const key = process.env.OPENAI_API_KEY || "";
  return NextResponse.json({
    userId: userId ?? null,
    hasKey: Boolean(key),
    keyStart: key ? key.slice(0, 7) : null,
  });
}
