import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const placement = url.searchParams.get("placement");

    let ads;
    if (placement) {
      ads = await storage.getCustomAdsByPlacement(placement);
    } else {
      ads = await storage.getEnabledCustomAds();
    }

    return NextResponse.json(ads);
  } catch (error) {
    console.error("/api/custom-ads error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
