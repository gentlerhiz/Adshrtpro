import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";

// Get single sponsored post (public)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const post = await storage.getSponsoredPost(id);
  if (!post) {
    return NextResponse.json({ message: "Post not found" }, { status: 404 });
  }
  await storage.incrementSponsoredPostView(id);
  return NextResponse.json(post);
}
