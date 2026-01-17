import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { resetPasswordSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = resetPasswordSchema.parse(body);
    const { uid } = body;

    if (!uid) {
      return NextResponse.json({ message: "Invalid reset link" }, { status: 400 });
    }

    const user = await storage.getUser(uid);

    if (!user || !user.passwordResetToken) {
      return NextResponse.json({ message: "Invalid or expired reset token" }, { status: 400 });
    }

    // Check if token is expired first
    if (!user.passwordResetExpiry || new Date() > user.passwordResetExpiry) {
      // Clear expired token
      await storage.updateUser(user.id, {
        passwordResetToken: null,
        passwordResetExpiry: null,
      });
      return NextResponse.json({ message: "Reset token has expired. Please request a new one." }, { status: 400 });
    }

    // Verify the token hash
    const tokenValid = await bcrypt.compare(data.token, user.passwordResetToken);
    if (!tokenValid) {
      return NextResponse.json({ message: "Invalid or expired reset token" }, { status: 400 });
    }

    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(data.password, 10);
    await storage.updateUser(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiry: null,
    });

    return NextResponse.json({ message: "Password has been reset successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
    }
    console.error("Reset password error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
