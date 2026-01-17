import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";

// Admin: Get all social verification submissions
export async function GET(req: Request) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const verifications = await storage.getAllSocialVerifications();
  
  // Enrich with user info
  const enriched = await Promise.all(verifications.map(async (v) => {
    const user = await storage.getUser(v.userId);
    return {
      ...v,
      userEmail: user?.email,
    };
  }));
  
  return NextResponse.json(enriched);
}
