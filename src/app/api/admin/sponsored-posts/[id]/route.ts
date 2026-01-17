import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";

// Admin: Update sponsored post
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const body = await req.json();
  
  const post = await storage.updateSponsoredPost(id, body);
  if (!post) {
    return NextResponse.json({ message: "Post not found" }, { status: 404 });
  }
  return NextResponse.json(post);
}

// Admin: Delete sponsored post
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const deleted = await storage.deleteSponsoredPost(id);
  if (!deleted) {
    return NextResponse.json({ message: "Post not found" }, { status: 404 });
  }
  return NextResponse.json({ message: "Post deleted" });
}
