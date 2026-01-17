import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { forgotPasswordSchema } from "@shared/schema";
import { z } from "zod";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = forgotPasswordSchema.parse(body);
    const user = await storage.getUserByEmail(data.email);
    
    if (!user) {
      // Don't reveal if email exists for security
      return NextResponse.json({ message: "If the email exists, a reset link has been sent." });
    }

    // Generate reset token and hash it for storage (security best practice)
    const resetToken = randomUUID();
    const hashedToken = await bcrypt.hash(resetToken, 10);
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await storage.updateUser(user.id, {
      passwordResetToken: hashedToken,
      passwordResetExpiry: resetExpiry,
    });

    // In production, this would send an email
    console.log(`[DEV] Password reset requested for: ${user.email}`);
    console.log(`[DEV] Reset link: ${process.env.APP_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}&uid=${user.id}`);

    return NextResponse.json({ message: "If the email exists, a reset link has been sent." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
    }
    console.error("Forgot password error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
