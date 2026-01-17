import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";
import { insertCustomAdSchema } from "@shared/schema";
import { z } from "zod";

// Admin: Get all custom ads
export async function GET(req: Request) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const ads = await storage.getAllCustomAds();
  return NextResponse.json(ads);
}

// Admin: Create custom ad
export async function POST(req: Request) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const data = insertCustomAdSchema.parse(body);
    const ad = await storage.createCustomAd(data);
    return NextResponse.json(ad, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
    }
    console.error("Create custom ad error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
