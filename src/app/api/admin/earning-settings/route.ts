import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";

// Admin: Get earning settings
export async function GET(req: Request) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const settings = await storage.getAllEarningSettings();
  return NextResponse.json(settings);
}

// Admin: Update earning settings
export async function PATCH(req: Request) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const updates = await req.json() as Record<string, string>;
  for (const [key, value] of Object.entries(updates)) {
    await storage.setEarningSetting(key, value);
  }
  return NextResponse.json({ message: "Settings updated" });
}
