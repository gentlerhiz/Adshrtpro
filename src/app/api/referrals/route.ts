import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAuth, getClientIp } from "@/lib/server/auth";

// Get user's referral info
export async function GET(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const referrals = await storage.getReferralsByReferrer(user.id);
  const settings = await storage.getAllEarningSettings();
  
  return NextResponse.json({
    referralCode: user.referralCode,
    referrals,
    reward: settings.referralReward || "0.10",
    linksRequired: parseInt(settings.referralLinksRequired || "3"),
  });
}

// Apply referral code (called during registration with ref query param)
export async function POST(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const { code } = await req.json();
  const clientIp = getClientIp(req);

  if (!code) {
    return NextResponse.json({ message: "Referral code required" }, { status: 400 });
  }

  // Check if user was already referred
  const existingReferral = await storage.getReferralByReferredId(user.id);
  if (existingReferral) {
    return NextResponse.json({ message: "You already used a referral code" }, { status: 400 });
  }

  // Find referrer by code
  const referrer = await storage.getUserByReferralCode(code);
  if (!referrer) {
    return NextResponse.json({ message: "Invalid referral code" }, { status: 400 });
  }

  // Can't refer yourself
  if (referrer.id === user.id) {
    return NextResponse.json({ message: "Cannot use your own referral code" }, { status: 400 });
  }

  // Create referral
  const referral = await storage.createReferral(referrer.id, user.id, code, clientIp);
  await storage.updateUser(user.id, { referredBy: referrer.id });

  return NextResponse.json({ message: "Referral code applied", referral });
}
