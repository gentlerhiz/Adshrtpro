import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";

// Admin: Get all referrals
export async function GET(req: Request) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const referrals = await storage.getAllReferrals();
  // Enrich with user info including social verification status
  const enriched = await Promise.all(referrals.map(async (r) => {
    const referrer = await storage.getUser(r.referrerId);
    const referred = await storage.getUser(r.referredId);
    const referredLinks = await storage.getLinksByUserId(r.referredId);
    return {
      ...r,
      referrerEmail: referrer?.email,
      referredEmail: referred?.email,
      referrerSocialVerified: referrer?.socialVerified ?? false,
      referredSocialVerified: referred?.socialVerified ?? false,
      referredLinksCount: referredLinks.length,
    };
  }));
  return NextResponse.json(enriched);
}
