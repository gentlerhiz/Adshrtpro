import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";

// React to sponsored post (public)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { reaction, visitorId } = await req.json();

  if (!reaction || !visitorId) {
    return NextResponse.json({ message: "Reaction and visitorId required" }, { status: 400 });
  }
  if (!["like", "dislike"].includes(reaction)) {
    return NextResponse.json({ message: "Invalid reaction" }, { status: 400 });
  }

  await storage.setReaction(id, visitorId, reaction);
  const post = await storage.getSponsoredPost(id);
  return NextResponse.json({ likes: post?.likes ?? 0, dislikes: post?.dislikes ?? 0 });
}
