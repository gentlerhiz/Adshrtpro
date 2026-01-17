import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { generateToken } from "@/lib/server/jwt";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { getClientIp } from "@/lib/server/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = insertUserSchema.parse(body);
    const { referralCode } = body;

    // Check if email already exists
    const existing = await storage.getUserByEmail(data.email);
    if (existing) {
      return NextResponse.json({ message: "Email already registered" }, { status: 400 });
    }

    const user = await storage.createUser(data);

    // Handle referral code if provided
    if (referralCode) {
      const referrer = await storage.getUserByReferralCode(referralCode);
      if (referrer && referrer.id !== user.id) {
        const clientIp = getClientIp(req);
        await storage.createReferral(referrer.id, user.id, referralCode, clientIp);
        await storage.updateUser(user.id, { referredBy: referrer.id });
      }
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin ?? false,
    });

    // In production, send verification email here
    console.log(`Verification token for ${user.email}: ${user.verificationToken}`);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified ?? false,
        isAdmin: user.isAdmin ?? false,
        analyticsUnlockExpiry: user.analyticsUnlockExpiry,
        referralCode: user.referralCode ?? null,
        socialVerified: user.socialVerified ?? false,
        telegramUsername: user.telegramUsername || undefined,
      },
      token,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
    }
    console.error("Register error:", error, (error as any)?.stack);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: "Server error", detail: message }, { status: 500 });
  }
}
