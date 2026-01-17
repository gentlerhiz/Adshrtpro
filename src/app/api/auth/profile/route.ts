import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAuth } from "@/lib/server/auth";

export async function PATCH(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const { telegramUsername } = await req.json();

    // Validate telegram username format (optional, alphanumeric and underscores, 5-32 chars)
    if (telegramUsername && typeof telegramUsername === 'string') {
      const cleanUsername = telegramUsername.replace(/^@/, ''); // Remove @ prefix if present
      if (cleanUsername.length > 0 && (cleanUsername.length < 5 || cleanUsername.length > 32)) {
        return NextResponse.json({ message: "Telegram username must be 5-32 characters" }, { status: 400 });
      }
      if (cleanUsername.length > 0 && !/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
        return NextResponse.json({ message: "Telegram username can only contain letters, numbers, and underscores" }, { status: 400 });
      }
      await storage.updateUser(user.id, { telegramUsername: cleanUsername || null });
    } else {
      await storage.updateUser(user.id, { telegramUsername: null });
    }

    const updatedUser = await storage.getUser(user.id);
    const balance = await storage.getUserBalance(user.id);
    
    return NextResponse.json({
      id: updatedUser!.id,
      email: updatedUser!.email,
      emailVerified: updatedUser!.emailVerified ?? false,
      isAdmin: updatedUser!.isAdmin ?? false,
      analyticsUnlockExpiry: updatedUser!.analyticsUnlockExpiry,
      referralCode: updatedUser!.referralCode ?? null,
      balanceUsd: balance?.balanceUsd || "0",
      socialVerified: updatedUser!.socialVerified ?? false,
      telegramUsername: updatedUser!.telegramUsername || undefined,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
