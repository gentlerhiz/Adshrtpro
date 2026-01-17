import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";

// Get all settings
export async function GET(req: Request) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const settings = await storage.getAllSettings();
  return NextResponse.json(settings);
}

// Update settings
export async function PATCH(req: Request) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const updates = await req.json() as Record<string, string>;
  for (const [key, value] of Object.entries(updates)) {
    await storage.setSetting(key, value);
  }
  return NextResponse.json({ message: "Settings updated" });
}
