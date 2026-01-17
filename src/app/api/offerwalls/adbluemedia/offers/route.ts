import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAuth, getClientIp } from "@/lib/server/auth";

// Get AdBlueMedia offers (proxy to avoid CORS) - with geo-location targeting
export async function GET(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ message: "userId required" }, { status: 400 });
    }

    const setting = await storage.getOfferwallSetting("adbluemedia");
    if (!setting?.isEnabled) {
      return NextResponse.json([]);
    }

    // Get user's IP for geo-targeting
    const clientIp = getClientIp(req);

    // AdBlueMedia API with IP parameter for geo-targeting
    const feedUrl = `https://d2xohqmdyl2cj3.cloudfront.net/public/offers/feed.php?user_id=518705&api_key=f24063d0d801e4daa846e9da4454c467&s1=${userId}&s2=&ip=${encodeURIComponent(clientIp)}`;
    
    const response = await fetch(feedUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch offers");
    }
    
    const offers = await response.json();
    
    // Apply 50% revenue split - show users their actual earnings
    const adjustedOffers = (Array.isArray(offers) ? offers : []).map((offer: any) => ({
      ...offer,
      payout: (parseFloat(offer.payout || "0") * 0.5).toFixed(2), // User sees 50% of payout
      original_payout: offer.payout, // Keep original for reference
    }));
    
    return NextResponse.json(adjustedOffers);
  } catch (error) {
    console.error("AdBlueMedia offers fetch error:", error);
    return NextResponse.json({ message: "Failed to fetch offers" }, { status: 500 });
  }
}
