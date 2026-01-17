import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";

// Get active sponsored posts (public)
export async function GET() {
  const posts = await storage.getActiveSponsoredPosts();
  return NextResponse.json(posts);
}
