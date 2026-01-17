import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAuth, getClientIp, getCurrentMonth } from "@/lib/server/auth";
import { insertLinkSchema } from "@shared/schema";
import { z } from "zod";

// Bulk create links
export async function POST(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const ip = getClientIp(req);

    // Check if IP is banned
    const bannedIp = await storage.getBannedIp(ip);
    if (bannedIp) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const { urls } = await req.json();
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ message: "Please provide an array of URLs" }, { status: 400 });
    }

    if (urls.length > 50) {
      return NextResponse.json({ message: "Maximum 50 URLs allowed per bulk request" }, { status: 400 });
    }

    // Check rate limit for all URLs
    const month = getCurrentMonth();
    const rateLimit = await storage.getRateLimit(ip, month);
    const currentCount = rateLimit?.count ?? 0;
    const remainingQuota = 250 - currentCount;

    if (urls.length > remainingQuota) {
      return NextResponse.json({ 
        message: `Rate limit: You can only create ${remainingQuota} more links this month.` 
      }, { status: 429 });
    }

    const host = req.headers.get("host") || "localhost:5000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";

    const results: Array<{
      originalUrl: string;
      shortUrl?: string;
      shortCode?: string;
      error?: string;
      success: boolean;
    }> = [];
    
    let successCount = 0;

    for (const url of urls) {
      try {
        const urlString = typeof url === 'string' ? url.trim() : '';
        if (!urlString) {
          results.push({ originalUrl: urlString, error: "Empty URL", success: false });
          continue;
        }

        const validatedData = insertLinkSchema.parse({ originalUrl: urlString });

        const link = await storage.createLink(
          validatedData,
          user.id,
          ip
        );

        successCount++;
        const shortUrl = `${protocol}://${host}/${link.shortCode}`;
        results.push({
          originalUrl: urlString,
          shortUrl,
          shortCode: link.shortCode,
          success: true,
        });
      } catch (error) {
        const errorMessage = error instanceof z.ZodError 
          ? error.errors[0]?.message || "Invalid URL" 
          : "Failed to create link";
        results.push({
          originalUrl: typeof url === 'string' ? url : String(url),
          error: errorMessage,
          success: false,
        });
      }
    }

    // Increment rate limit for all successful creations
    if (successCount > 0) {
      for (let i = 0; i < successCount; i++) {
        await storage.incrementRateLimit(ip, month);
      }
    }

    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      message: `Created ${successCount} links${failCount > 0 ? `, ${failCount} failed` : ''}`,
      results,
      successCount,
      failCount,
    }, { status: 201 });
  } catch (error) {
    console.error("Bulk create error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
