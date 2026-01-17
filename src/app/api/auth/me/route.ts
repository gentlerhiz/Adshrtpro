import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { getUserFromHeaders } from "@/lib/server/jwt";

export async function GET(req: Request) {
  try {
    const headersObj: Record<string, string | undefined> = {};
    // build plain headers map compatible with getUserFromHeaders
    req.headers.forEach((value, key) => (headersObj[key] = value));

    const jwtUser = getUserFromHeaders(headersObj as any);
    if (!jwtUser) return NextResponse.json(null);

    const user = await storage.getUser(jwtUser.userId);
    if (!user) return NextResponse.json(null);

    const balance = await storage.getUserBalance(user.id);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified ?? false,
      isAdmin: user.isAdmin ?? false,
      analyticsUnlockExpiry: user.analyticsUnlockExpiry,
      referralCode: user.referralCode ?? null,
      balanceUsd: balance?.balanceUsd || "0",
      socialVerified: user.socialVerified ?? false,
      telegramUsername: user.telegramUsername || undefined,
    });
  } catch (error) {
    console.error("/api/auth/me error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
