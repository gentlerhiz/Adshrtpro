import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAuth } from "@/lib/server/auth";

// Unlock analytics for a specific link (simulates rewarded ad)
export async function POST(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const { linkId } = await req.json();
  
  if (!linkId) {
    return NextResponse.json({ message: "Link ID is required" }, { status: 400 });
  }

  // Verify the link belongs to the user
  const link = await storage.getLink(linkId);
  if (!link) {
    return NextResponse.json({ message: "Link not found" }, { status: 404 });
  }
  
  if (link.userId !== user.id && !user.isAdmin) {
    return NextResponse.json({ message: "Not authorized to unlock analytics for this link" }, { status: 403 });
  }

  // Calculate expiry: 1 hour (60 minutes) from now
  const expiry = new Date(Date.now() + 60 * 60 * 1000);
  
  // Store the unlock on the server
  await storage.setLinkUnlock(user.id, linkId, expiry);

  return NextResponse.json({ message: "Analytics unlocked", linkId, expiry: expiry.toISOString() });
}
