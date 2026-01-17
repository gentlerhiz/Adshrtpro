import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAuth } from "@/lib/server/auth";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    if (user.emailVerified) {
      return NextResponse.json({ message: "Email already verified" }, { status: 400 });
    }

    // Generate new token
    const newToken = randomUUID();
    await storage.updateUser(user.id, { verificationToken: newToken });

    // In production, send email here
    console.log(`New verification token for ${user.email}: ${newToken}`);

    return NextResponse.json({ message: "Verification email sent" });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
