import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";

// Get user's reaction to a post
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const visitorId = searchParams.get("visitorId");

  if (!visitorId) {
    return NextResponse.json({ reaction: null });
  }

  const reaction = await storage.getReaction(id, visitorId);
  return NextResponse.json({ reaction: reaction?.reaction ?? null });
}
