import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";
import { insertBlogPostSchema } from "@shared/schema";
import { z } from "zod";

// Get blog post by id (admin)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const post = await storage.getBlogPost(id);
  if (!post) {
    return NextResponse.json({ message: "Post not found" }, { status: 404 });
  }
  return NextResponse.json(post);
}

// Update blog post
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;

  try {
    const body = await req.json();
    const data = insertBlogPostSchema.partial().parse(body);
    
    const post = await storage.updateBlogPost(id, data);
    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }
    return NextResponse.json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
    }
    console.error("Update blog post error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// Delete blog post
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const deleted = await storage.deleteBlogPost(id);
  if (!deleted) {
    return NextResponse.json({ message: "Post not found" }, { status: 404 });
  }
  return NextResponse.json({ message: "Post deleted" });
}
