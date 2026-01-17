import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";

// Get all announcements (admin)
export async function GET(req: Request) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const announcements = await storage.getAllAnnouncements();
  return NextResponse.json(announcements);
}

// Create announcement (admin)
export async function POST(req: Request) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const announcement = await storage.createAnnouncement(body);
    return NextResponse.json(announcement, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Invalid announcement data" }, { status: 400 });
  }
}
