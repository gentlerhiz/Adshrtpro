import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";

// Get blog post by slug
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const post = await storage.getBlogPostBySlug(slug);
  if (!post) {
    return NextResponse.json({ message: "Post not found" }, { status: 404 });
  }
  if (!post.isPublished) {
    return NextResponse.json({ message: "Post not found" }, { status: 404 });
  }
  return NextResponse.json(post);
}
