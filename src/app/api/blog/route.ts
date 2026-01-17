import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";

// Get all published blog posts
export async function GET() {
  const posts = await storage.getAllBlogPosts();
  return NextResponse.json(posts);
}
