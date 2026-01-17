import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAuth, getClientIp, getCurrentMonth } from "@/lib/server/auth";
import { insertLinkSchema } from "@shared/schema";
import { z } from "zod";

// Get user's links
export async function GET(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const links = await storage.getLinksByUserId(user.id);
  return NextResponse.json(links);
}

// Create link
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);

    // Check if IP is banned
    const bannedIp = await storage.getBannedIp(ip);
    if (bannedIp) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    // Rate limiting
    const month = getCurrentMonth();
    const rateLimit = await storage.getRateLimit(ip, month);
    if (rateLimit && (rateLimit.count ?? 0) >= 250) {
      return NextResponse.json({ message: "Rate limit exceeded. Max 250 links per month." }, { status: 429 });
    }

    const body = await req.json();
    const data = insertLinkSchema.parse(body);

    // Check for duplicate short code
    if (data.shortCode) {
      const existing = await storage.getLinkByShortCode(data.shortCode);
      if (existing) {
        return NextResponse.json({ message: "This alias is already taken" }, { status: 400 });
      }
    }

    // Try to get user ID if authenticated
    let userId: string | undefined;
    const headersObj: Record<string, string | undefined> = {};
    req.headers.forEach((value, key) => (headersObj[key] = value));
    const { getUserFromHeaders } = await import("@/lib/server/jwt");
    const jwtUser = getUserFromHeaders(headersObj as any);
    if (jwtUser) {
      userId = jwtUser.userId;
    }

    const link = await storage.createLink(data, userId, ip);

    // Increment rate limit
    await storage.incrementRateLimit(ip, month);

    const host = req.headers.get("host") || "localhost:5000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const shortUrl = `${protocol}://${host}/${link.shortCode}`;
    
    // Sanitize response - don't expose internal fields to clients
    const sanitizedLink = {
      id: link.id,
      originalUrl: link.originalUrl,
      shortCode: link.shortCode,
      createdAt: link.createdAt,
    };
    
    return NextResponse.json({ link: sanitizedLink, shortUrl }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
    }
    console.error("Create link error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
