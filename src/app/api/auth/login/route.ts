import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { generateToken } from "@/lib/server/jwt";
import { loginSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = loginSchema.parse(body);

    const user = await storage.getUserByEmail(data.email);
    if (!user) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    if (user.isBanned) {
      return NextResponse.json({ message: "Account has been suspended" }, { status: 403 });
    }

    const validPassword = await bcrypt.compare(data.password, user.password);
    if (!validPassword) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin ?? false,
    });

    const balance = await storage.getUserBalance(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified ?? false,
        isAdmin: user.isAdmin ?? false,
        analyticsUnlockExpiry: user.analyticsUnlockExpiry,
        referralCode: user.referralCode ?? null,
        balanceUsd: balance?.balanceUsd || "0",
        socialVerified: user.socialVerified ?? false,
        telegramUsername: user.telegramUsername || undefined,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
    }
    console.error("Login error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
