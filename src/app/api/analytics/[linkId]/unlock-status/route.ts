import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAuth } from "@/lib/server/auth";

// Check unlock status for a link
export async function GET(
  req: Request,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const { linkId } = await params;

  const expiry = await storage.getLinkUnlock(user.id, linkId);
  if (expiry) {
    return NextResponse.json({ unlocked: true, expiry: expiry.toISOString() });
  } else {
    return NextResponse.json({ unlocked: false, expiry: null });
  }
}
