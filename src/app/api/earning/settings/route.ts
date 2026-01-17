import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";

// Get earning settings (public)
export async function GET() {
  const settings = await storage.getAllEarningSettings();
  return NextResponse.json(settings);
}
