import { NextResponse } from "next/server";

export async function POST() {
  // JWT-based auth - just confirm logout (client removes token)
  return NextResponse.json({ message: "Logged out" });
}
