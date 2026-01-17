import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAuth } from "@/lib/server/auth";

// Get analytics for a link - requires per-link unlock
export async function GET(
  req: Request,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const { linkId } = await params;

  const link = await storage.getLink(linkId);
  if (!link) {
    return NextResponse.json({ message: "Link not found" }, { status: 404 });
  }

  if (link.userId !== user.id && !user.isAdmin) {
    return NextResponse.json({ message: "Not authorized" }, { status: 403 });
  }

  // Check if this specific link is unlocked for this user
  const isUnlocked = await storage.isLinkUnlocked(user.id, linkId);
  if (!isUnlocked && !user.isAdmin) {
    return NextResponse.json({ message: "Analytics locked for this link" }, { status: 403 });
  }

  const analytics = await storage.getAnalyticsByLinkId(linkId);
  return NextResponse.json(analytics);
}
