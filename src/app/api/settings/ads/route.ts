import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";

export async function GET() {
  try {
    const settings = await storage.getAllSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("/api/settings/ads error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
