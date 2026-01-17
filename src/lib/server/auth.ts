import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { getUserFromHeaders, type JWTPayload } from "./jwt";

// Helper to get current user from request
export async function getCurrentUser(req: Request): Promise<{ user: any; jwtUser: JWTPayload } | null> {
  const headersObj: Record<string, string | undefined> = {};
  req.headers.forEach((value, key) => (headersObj[key] = value));

  const jwtUser = getUserFromHeaders(headersObj as any);
  if (!jwtUser) return null;

  const user = await storage.getUser(jwtUser.userId);
  if (!user) return null;

  return { user, jwtUser };
}

// Middleware to require authentication
export async function requireAuth(req: Request): Promise<{ user: any; jwtUser: JWTPayload } | NextResponse> {
  const result = await getCurrentUser(req);
  if (!result) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return result;
}

// Middleware to require admin
export async function requireAdmin(req: Request): Promise<{ user: any; jwtUser: JWTPayload } | NextResponse> {
  const result = await getCurrentUser(req);
  if (!result) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!result.user.isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  return result;
}

// Get client IP with proper header priority for proxied environments
export function getClientIp(req: Request): string {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  
  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0]?.trim();
    if (firstIp && isValidIp(firstIp)) return firstIp;
  }
  
  const xRealIp = req.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();
  
  return "unknown";
}

// Validate IP address format
function isValidIp(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip.includes(":");
}

// Get current month as YYYY-MM
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Parse user agent for device/browser info
export function parseUserAgent(ua: string): { device: string; browser: string } {
  let device = "Desktop";
  let browser = "Unknown";

  if (/mobile/i.test(ua)) device = "Mobile";
  else if (/tablet/i.test(ua)) device = "Tablet";

  if (/chrome/i.test(ua) && !/edg/i.test(ua)) browser = "Chrome";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/edg/i.test(ua)) browser = "Edge";
  else if (/msie|trident/i.test(ua)) browser = "IE";

  return { device, browser };
}

// 24-hour IP-to-country cache
const geoCache: Map<string, { country: string; expires: number }> = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Lookup country from IP using IPinfo Lite API with caching
export async function lookupCountry(ip: string): Promise<string> {
  // Skip private/local IPs
  if (ip === "unknown" || ip === "::1" || ip === "127.0.0.1" || 
      ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("172.")) {
    return "Unknown";
  }
  
  // Check cache first
  const cached = geoCache.get(ip);
  if (cached && cached.expires > Date.now()) {
    return cached.country;
  }
  
  const token = process.env.IPINFO_TOKEN;
  if (!token) {
    console.error("GeoIP: IPINFO_TOKEN not set");
    return "Unknown";
  }
  
  try {
    const trimmedToken = token.trim();
    const url = `https://api.ipinfo.io/lite/${ip}?token=${trimmedToken}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      const body = await response.text();
      console.error(`GeoIP: API returned ${response.status} for IP ${ip}, body: ${body}`);
      return "Unknown";
    }
    
    const data = await response.json();
    const country = data.country_code || "Unknown";
    
    // Cache the result
    geoCache.set(ip, { country, expires: Date.now() + CACHE_TTL });
    
    return country;
  } catch (error) {
    console.error("GeoIP lookup failed:", error);
    return "Unknown";
  }
}
