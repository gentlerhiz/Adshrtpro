import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";
import { insertBlogPostSchema } from "@shared/schema";
import { z } from "zod";

// Get all blog posts (admin can see unpublished)
export async function GET(req: Request) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const posts = await storage.getAllBlogPosts();
  return NextResponse.json(posts);
}

// Create blog post
export async function POST(req: Request) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const data = insertBlogPostSchema.parse(body);

    // Check for duplicate slug
    const existing = await storage.getBlogPostBySlug(data.slug);
    if (existing) {
      return NextResponse.json({ message: "Slug already exists" }, { status: 400 });
    }

    const post = await storage.createBlogPost(data);
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
    }
    console.error("Create blog post error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
