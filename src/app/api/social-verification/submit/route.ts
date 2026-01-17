import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAuth } from "@/lib/server/auth";

// Submit social verification
export async function POST(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const { screenshotLinks } = await req.json();
  
  // Check if already submitted
  const existing = await storage.getSocialVerification(user.id);
  if (existing) {
    return NextResponse.json({ message: "You have already submitted social verification" }, { status: 400 });
  }
  
  // Validate screenshot links
  const trimmedLinks = screenshotLinks?.trim();
  if (!trimmedLinks) {
    return NextResponse.json({ message: "Screenshot proof links are required" }, { status: 400 });
  }
  
  const verification = await storage.createSocialVerification(user.id, trimmedLinks);
  return NextResponse.json({ message: "Social verification submitted for review", verification });
}
