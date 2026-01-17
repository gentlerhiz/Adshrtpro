import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";

export async function GET() {
  try {
    const announcements = await storage.getActiveAnnouncements();
    return NextResponse.json(announcements);
  } catch (error) {
    console.error("/api/announcements error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
