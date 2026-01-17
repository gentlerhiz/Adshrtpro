import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ message: "Token required" }, { status: 400 });
    }

    const user = await storage.getUserByVerificationToken(token);
    if (!user) {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 400 });
    }

    await storage.updateUser(user.id, {
      emailVerified: true,
      verificationToken: null,
    });

    return NextResponse.json({ message: "Email verified" });
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
