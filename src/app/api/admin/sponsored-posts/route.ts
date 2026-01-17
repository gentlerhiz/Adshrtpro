import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";

// Admin: Get all sponsored posts
export async function GET(req: Request) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const posts = await storage.getAllSponsoredPosts();
  return NextResponse.json(posts);
}

// Admin: Create sponsored post
export async function POST(req: Request) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const post = await storage.createSponsoredPost(body);
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Create sponsored post error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
