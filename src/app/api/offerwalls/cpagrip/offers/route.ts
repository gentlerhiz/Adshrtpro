import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAuth, getClientIp } from "@/lib/server/auth";

// Get CPAGrip offers (proxy to avoid CORS) - with geo-location targeting
export async function GET(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ message: "userId required" }, { status: 400 });
    }

    const setting = await storage.getOfferwallSetting("cpagrip");
    if (!setting?.isEnabled) {
      return NextResponse.json([]);
    }

    // Get user's IP for geo-targeting
    const clientIp = getClientIp(req);

    // CPAGrip JSON feed with IP parameter for geo-targeting
    const feedUrl = `https://www.cpagrip.com/common/offer_feed_json.php?user_id=621093&key=35b59eb1af2454f46fe63ad7d34f923b&tracking_id=${userId}&domain=singingfiles.com&ip=${encodeURIComponent(clientIp)}`;
    
    const response = await fetch(feedUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch offers");
    }
    
    const data = await response.json();
    const offers = data.offers || data || [];
    
    // Apply 50% revenue split - show users their actual earnings
    const adjustedOffers = (Array.isArray(offers) ? offers : []).map((offer: any) => ({
      ...offer,
      payout: (parseFloat(offer.payout || offer.amount || "0") * 0.5).toFixed(2),
      original_payout: offer.payout || offer.amount,
    }));
    
    return NextResponse.json(adjustedOffers);
  } catch (error) {
    console.error("CPAGrip offers fetch error:", error);
    return NextResponse.json({ message: "Failed to fetch offers" }, { status: 500 });
  }
}
