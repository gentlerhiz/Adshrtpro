import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertLinkSchema,
  insertBlogPostSchema,
  insertCustomAdSchema,
  loginSchema,
  type AuthUser,
} from "@shared/schema";
import { z } from "zod";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

// Middleware to check if user is authenticated
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// Middleware to check if user is admin
async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user?.isAdmin) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

// Get client IP with proper header priority for proxied environments
function getClientIp(req: Request): string {
  // Priority: CF-Connecting-IP > X-Forwarded-For (first IP) > X-Real-IP > remote address
  const cfIp = req.headers["cf-connecting-ip"] as string;
  if (cfIp) return cfIp.trim();
  
  const xForwardedFor = req.headers["x-forwarded-for"] as string;
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0]?.trim();
    if (firstIp && isValidIp(firstIp)) return firstIp;
  }
  
  const xRealIp = req.headers["x-real-ip"] as string;
  if (xRealIp) return xRealIp.trim();
  
  return req.socket.remoteAddress || "unknown";
}

// Validate IP address format
function isValidIp(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip.includes(":");
}

// Parse user agent for device/browser info
function parseUserAgent(ua: string): { device: string; browser: string } {
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

// Get current month as YYYY-MM
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// 24-hour IP-to-country cache
const geoCache: Map<string, { country: string; expires: number }> = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Lookup country from IP using IPinfo Lite API with caching
async function lookupCountry(ip: string): Promise<string> {
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
    console.log(`GeoIP: Result for ${ip}:`, JSON.stringify(data));
    const country = data.country_code || "Unknown";
    
    // Cache the result
    geoCache.set(ip, { country, expires: Date.now() + CACHE_TTL });
    
    return country;
  } catch (error) {
    console.error("GeoIP lookup failed:", error);
    return "Unknown";
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "adshrtpro-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    })
  );

  // ============ AUTH ROUTES ============

  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.json(null);
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.json(null);
    }
    const balance = await storage.getUserBalance(user.id);
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified ?? false,
      isAdmin: user.isAdmin ?? false,
      analyticsUnlockExpiry: user.analyticsUnlockExpiry,
      referralCode: user.referralCode ?? null,
      balanceUsd: balance?.balanceUsd,
    };
    res.json(authUser);
  });

  // Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const { referralCode } = req.body;

      // Check if email already exists
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const user = await storage.createUser(data);
      req.session.userId = user.id;

      // Handle referral code if provided
      if (referralCode) {
        const referrer = await storage.getUserByReferralCode(referralCode);
        if (referrer && referrer.id !== user.id) {
          const clientIp = getClientIp(req);
          await storage.createReferral(referrer.id, user.id, referralCode, clientIp);
          await storage.updateUser(user.id, { referredBy: referrer.id });
        }
      }

      // In production, send verification email here
      console.log(`Verification token for ${user.email}: ${user.verificationToken}`);

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified ?? false,
        isAdmin: user.isAdmin ?? false,
        analyticsUnlockExpiry: user.analyticsUnlockExpiry,
        referralCode: user.referralCode ?? null,
      };
      
      // Explicitly save session before responding
      req.session.save((err) => {
        if (err) {
          return res.status(500).json({ message: "Session error" });
        }
        res.status(201).json(authUser);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (user.isBanned) {
        return res.status(403).json({ message: "Account has been suspended" });
      }

      const validPassword = await bcrypt.compare(data.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.userId = user.id;

      const balance = await storage.getUserBalance(user.id);
      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified ?? false,
        isAdmin: user.isAdmin ?? false,
        analyticsUnlockExpiry: user.analyticsUnlockExpiry,
        referralCode: user.referralCode ?? null,
        balanceUsd: balance?.balanceUsd,
      };
      
      // Explicitly save session before responding
      req.session.save((err) => {
        if (err) {
          return res.status(500).json({ message: "Session error" });
        }
        res.json(authUser);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out" });
    });
  });

  // Verify email
  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ message: "Token required" });
      }

      const user = await storage.getUserByVerificationToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      await storage.updateUser(user.id, {
        emailVerified: true,
        verificationToken: null,
      });

      res.json({ message: "Email verified" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Resend verification email
  app.post("/api/auth/resend-verification", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }

      // Generate new token
      const newToken = require("crypto").randomUUID();
      await storage.updateUser(user.id, { verificationToken: newToken });

      // In production, send email here
      console.log(`New verification token for ${user.email}: ${newToken}`);

      res.json({ message: "Verification email sent" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============ LINK ROUTES ============

  // Get user's links
  app.get("/api/links", requireAuth, async (req, res) => {
    const links = await storage.getLinksByUserId(req.session.userId!);
    res.json(links);
  });

  // Create link
  app.post("/api/links", async (req, res) => {
    try {
      const ip = getClientIp(req);

      // Check if IP is banned
      const bannedIp = await storage.getBannedIp(ip);
      if (bannedIp) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Rate limiting
      const month = getCurrentMonth();
      const rateLimit = await storage.getRateLimit(ip, month);
      if (rateLimit && (rateLimit.count ?? 0) >= 250) {
        return res.status(429).json({ message: "Rate limit exceeded. Max 250 links per month." });
      }

      const data = insertLinkSchema.parse(req.body);

      // Check for duplicate short code
      if (data.shortCode) {
        const existing = await storage.getLinkByShortCode(data.shortCode);
        if (existing) {
          return res.status(400).json({ message: "This alias is already taken" });
        }
      }

      const link = await storage.createLink(
        data,
        req.session.userId,
        ip
      );

      // Increment rate limit
      await storage.incrementRateLimit(ip, month);

      const shortUrl = `${req.protocol}://${req.get("host")}/${link.shortCode}`;
      
      // Sanitize response - don't expose internal fields to clients
      const sanitizedLink = {
        id: link.id,
        originalUrl: link.originalUrl,
        shortCode: link.shortCode,
        createdAt: link.createdAt,
      };
      
      res.status(201).json({ link: sanitizedLink, shortUrl });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  // Bulk create links
  app.post("/api/links/bulk", requireAuth, async (req, res) => {
    try {
      const ip = getClientIp(req);

      // Check if IP is banned
      const bannedIp = await storage.getBannedIp(ip);
      if (bannedIp) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { urls } = req.body;
      if (!Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ message: "Please provide an array of URLs" });
      }

      if (urls.length > 50) {
        return res.status(400).json({ message: "Maximum 50 URLs allowed per bulk request" });
      }

      // Check rate limit for all URLs
      const month = getCurrentMonth();
      const rateLimit = await storage.getRateLimit(ip, month);
      const currentCount = rateLimit?.count ?? 0;
      const remainingQuota = 250 - currentCount;

      if (urls.length > remainingQuota) {
        return res.status(429).json({ 
          message: `Rate limit: You can only create ${remainingQuota} more links this month.` 
        });
      }

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
          // Validate URL using the same schema as single link creation
          const urlString = typeof url === 'string' ? url.trim() : '';
          if (!urlString) {
            results.push({ originalUrl: urlString, error: "Empty URL", success: false });
            continue;
          }

          // Use insertLinkSchema for consistent validation
          const validatedData = insertLinkSchema.parse({ originalUrl: urlString });

          const link = await storage.createLink(
            validatedData,
            req.session.userId,
            ip
          );

          successCount++;
          const shortUrl = `${req.protocol}://${req.get("host")}/${link.shortCode}`;
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

      // Increment rate limit only once for all successful creations
      if (successCount > 0) {
        for (let i = 0; i < successCount; i++) {
          await storage.incrementRateLimit(ip, month);
        }
      }

      const failCount = results.filter(r => !r.success).length;

      res.status(201).json({
        message: `Created ${successCount} links${failCount > 0 ? `, ${failCount} failed` : ''}`,
        results,
        successCount,
        failCount,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Delete link
  app.delete("/api/links/:id", requireAuth, async (req, res) => {
    const link = await storage.getLink(req.params.id);
    if (!link) {
      return res.status(404).json({ message: "Link not found" });
    }

    if (link.userId !== req.session.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await storage.deleteLink(req.params.id);
    res.json({ message: "Link deleted" });
  });

  // ============ REDIRECT ROUTE ============

  // This should be registered last to avoid conflicts
  app.get("/:shortCode", async (req, res, next) => {
    // Skip API routes and static files
    if (req.params.shortCode.startsWith("api") || 
        req.params.shortCode.includes(".")) {
      return next();
    }

    const link = await storage.getLinkByShortCode(req.params.shortCode);
    if (!link) {
      return next();
    }

    if (link.isDisabled || link.isBanned) {
      return res.status(410).send("This link has been disabled");
    }

    // Record click analytics
    const ua = req.headers["user-agent"] || "";
    const { device, browser } = parseUserAgent(ua);
    const referrer = req.headers["referer"] || null;
    const clientIp = getClientIp(req);
    const country = await lookupCountry(clientIp);

    await storage.recordClick({
      linkId: link.id,
      country,
      device,
      browser,
      referrer,
    });

    res.redirect(301, link.originalUrl);
  });

  // ============ ANALYTICS ROUTES ============

  // Get analytics for a link - requires per-link unlock
  app.get("/api/analytics/:linkId", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const link = await storage.getLink(req.params.linkId);
    if (!link) {
      return res.status(404).json({ message: "Link not found" });
    }

    if (link.userId !== user.id && !user.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Check if this specific link is unlocked for this user
    const isUnlocked = await storage.isLinkUnlocked(user.id, req.params.linkId);
    if (!isUnlocked && !user.isAdmin) {
      return res.status(403).json({ message: "Analytics locked for this link" });
    }

    const analytics = await storage.getAnalyticsByLinkId(req.params.linkId);
    res.json(analytics);
  });

  // Unlock analytics for a specific link (simulates rewarded ad)
  app.post("/api/analytics/unlock", requireAuth, async (req, res) => {
    const { linkId } = req.body;
    
    if (!linkId) {
      return res.status(400).json({ message: "Link ID is required" });
    }

    // Verify the link belongs to the user
    const link = await storage.getLink(linkId);
    if (!link) {
      return res.status(404).json({ message: "Link not found" });
    }
    
    const user = await storage.getUser(req.session.userId!);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (link.userId !== user.id && !user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to unlock analytics for this link" });
    }

    // Calculate expiry: 1 hour (60 minutes) from now
    const expiry = new Date(Date.now() + 60 * 60 * 1000);
    
    // Store the unlock on the server
    await storage.setLinkUnlock(user.id, linkId, expiry);

    res.json({ message: "Analytics unlocked", linkId, expiry: expiry.toISOString() });
  });

  // Check unlock status for a link
  app.get("/api/analytics/:linkId/unlock-status", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const expiry = await storage.getLinkUnlock(user.id, req.params.linkId);
    if (expiry) {
      res.json({ unlocked: true, expiry: expiry.toISOString() });
    } else {
      res.json({ unlocked: false, expiry: null });
    }
  });

  // ============ BLOG ROUTES ============

  // Get all published blog posts
  app.get("/api/blog", async (req, res) => {
    const posts = await storage.getAllBlogPosts();
    res.json(posts);
  });

  // Get blog post by slug
  app.get("/api/blog/:slug", async (req, res) => {
    const post = await storage.getBlogPostBySlug(req.params.slug);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (!post.isPublished) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  });

  // ============ PUBLIC SETTINGS ============

  // Get public ad settings (for unlock flow and general ads)
  app.get("/api/settings/ads", async (req, res) => {
    const adsEnabled = await storage.getSetting("adsEnabled");
    const rewardedAdCode = await storage.getSetting("rewardedAdCode");
    const adsenseCode = await storage.getSetting("adsenseCode");
    res.json({
      adsEnabled: adsEnabled === "true",
      rewardedAdCode: rewardedAdCode || "",
      adsenseCode: adsenseCode || "",
    });
  });

  // ============ ADMIN ROUTES ============

  // Get platform stats
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    const stats = await storage.getPlatformStats();
    res.json(stats);
  });

  // Get all users
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users.map((u) => ({ ...u, password: undefined })));
  });

  // Update user
  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    const { isBanned } = req.body;
    const user = await storage.updateUser(req.params.id, { isBanned });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ ...user, password: undefined });
  });

  // Get all links
  app.get("/api/admin/links", requireAdmin, async (req, res) => {
    const links = await storage.getAllLinks();
    res.json(links);
  });

  // Update link
  app.patch("/api/admin/links/:id", requireAdmin, async (req, res) => {
    const { isDisabled } = req.body;
    const link = await storage.updateLink(req.params.id, { isDisabled });
    if (!link) {
      return res.status(404).json({ message: "Link not found" });
    }
    res.json(link);
  });

  // Get blog post by id (admin)
  app.get("/api/admin/blog/:id", requireAdmin, async (req, res) => {
    const post = await storage.getBlogPost(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  });

  // Create blog post
  app.post("/api/admin/blog", requireAdmin, async (req, res) => {
    try {
      const data = insertBlogPostSchema.parse(req.body);

      // Check for duplicate slug
      const existing = await storage.getBlogPostBySlug(data.slug);
      if (existing) {
        return res.status(400).json({ message: "Slug already exists" });
      }

      const post = await storage.createBlogPost(data);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  // Update blog post
  app.patch("/api/admin/blog/:id", requireAdmin, async (req, res) => {
    try {
      const data = insertBlogPostSchema.partial().parse(req.body);
      const post = await storage.updateBlogPost(req.params.id, data);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  // Delete blog post
  app.delete("/api/admin/blog/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteBlogPost(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json({ message: "Post deleted" });
  });

  // Get all settings
  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    const settings = await storage.getAllSettings();
    res.json(settings);
  });

  // Update settings
  app.patch("/api/admin/settings", requireAdmin, async (req, res) => {
    const updates = req.body as Record<string, string>;
    for (const [key, value] of Object.entries(updates)) {
      await storage.setSetting(key, value);
    }
    res.json({ message: "Settings updated" });
  });

  // Get banned IPs
  app.get("/api/admin/banned-ips", requireAdmin, async (req, res) => {
    const bannedIps = await storage.getAllBannedIps();
    res.json(bannedIps);
  });

  // Ban IP
  app.post("/api/admin/banned-ips", requireAdmin, async (req, res) => {
    const { ip, reason } = req.body;
    if (!ip) {
      return res.status(400).json({ message: "IP required" });
    }
    const bannedIp = await storage.banIp(ip, reason);
    res.status(201).json(bannedIp);
  });

  // Unban IP
  app.delete("/api/admin/banned-ips/:ip", requireAdmin, async (req, res) => {
    const deleted = await storage.unbanIp(req.params.ip);
    if (!deleted) {
      return res.status(404).json({ message: "IP not found" });
    }
    res.json({ message: "IP unbanned" });
  });

  // ==================== CUSTOM ADS ====================

  // Get public custom ads by placement (for fallback when AdSense disabled)
  app.get("/api/custom-ads", async (req, res) => {
    const placement = req.query.placement as string | undefined;
    if (placement) {
      const ads = await storage.getCustomAdsByPlacement(placement);
      res.json(ads);
    } else {
      const ads = await storage.getEnabledCustomAds();
      res.json(ads);
    }
  });

  // Admin: Get all custom ads
  app.get("/api/admin/custom-ads", requireAdmin, async (req, res) => {
    const ads = await storage.getAllCustomAds();
    res.json(ads);
  });

  // Admin: Create custom ad
  app.post("/api/admin/custom-ads", requireAdmin, async (req, res) => {
    try {
      const data = insertCustomAdSchema.parse(req.body);
      const ad = await storage.createCustomAd(data);
      res.status(201).json(ad);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  // Admin: Update custom ad
  app.patch("/api/admin/custom-ads/:id", requireAdmin, async (req, res) => {
    try {
      const data = insertCustomAdSchema.partial().parse(req.body);
      const ad = await storage.updateCustomAd(req.params.id, data);
      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
      }
      res.json(ad);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  // Admin: Delete custom ad
  app.delete("/api/admin/custom-ads/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteCustomAd(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Ad not found" });
    }
    res.json({ message: "Ad deleted" });
  });

  // ==================== SPONSORED POSTS ====================

  // Get active sponsored posts (public)
  app.get("/api/sponsored-posts", async (req, res) => {
    const posts = await storage.getActiveSponsoredPosts();
    res.json(posts);
  });

  // Get single sponsored post (public)
  app.get("/api/sponsored-posts/:id", async (req, res) => {
    const post = await storage.getSponsoredPost(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    await storage.incrementSponsoredPostView(req.params.id);
    res.json(post);
  });

  // Track sponsored post click (public)
  app.post("/api/sponsored-posts/:id/click", async (req, res) => {
    await storage.incrementSponsoredPostClick(req.params.id);
    res.json({ message: "Click tracked" });
  });

  // React to sponsored post (public)
  app.post("/api/sponsored-posts/:id/react", async (req, res) => {
    const { reaction, visitorId } = req.body;
    if (!reaction || !visitorId) {
      return res.status(400).json({ message: "Reaction and visitorId required" });
    }
    if (!["like", "dislike"].includes(reaction)) {
      return res.status(400).json({ message: "Invalid reaction" });
    }
    await storage.setReaction(req.params.id, visitorId, reaction);
    const post = await storage.getSponsoredPost(req.params.id);
    res.json({ likes: post?.likes ?? 0, dislikes: post?.dislikes ?? 0 });
  });

  // Get user's reaction to a post
  app.get("/api/sponsored-posts/:id/reaction", async (req, res) => {
    const visitorId = req.query.visitorId as string;
    if (!visitorId) {
      return res.json({ reaction: null });
    }
    const reaction = await storage.getReaction(req.params.id, visitorId);
    res.json({ reaction: reaction?.reaction ?? null });
  });

  // Admin: Get all sponsored posts
  app.get("/api/admin/sponsored-posts", requireAdmin, async (req, res) => {
    const posts = await storage.getAllSponsoredPosts();
    res.json(posts);
  });

  // Admin: Create sponsored post
  app.post("/api/admin/sponsored-posts", requireAdmin, async (req, res) => {
    try {
      const post = await storage.createSponsoredPost(req.body);
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Admin: Update sponsored post
  app.patch("/api/admin/sponsored-posts/:id", requireAdmin, async (req, res) => {
    const post = await storage.updateSponsoredPost(req.params.id, req.body);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  });

  // Admin: Delete sponsored post
  app.delete("/api/admin/sponsored-posts/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteSponsoredPost(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json({ message: "Post deleted" });
  });

  // ==================== NOTIFICATIONS ====================

  // Get notifications for current user
  app.get("/api/notifications", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const notifications = await storage.getNotificationsForUser(userId);
    res.json(notifications);
  });

  // Get unread count
  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const count = await storage.getUnreadCount(userId);
    res.json({ count });
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    await storage.markAsRead(req.params.id);
    res.json({ message: "Marked as read" });
  });

  // Mark all as read
  app.post("/api/notifications/mark-all-read", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    await storage.markAllAsRead(userId);
    res.json({ message: "All marked as read" });
  });

  // Admin: Get all notifications
  app.get("/api/admin/notifications", requireAdmin, async (req, res) => {
    const notifications = await storage.getAllNotifications();
    res.json(notifications);
  });

  // Admin: Create notification
  app.post("/api/admin/notifications", requireAdmin, async (req, res) => {
    try {
      const notification = await storage.createNotification(req.body);
      res.status(201).json(notification);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Admin: Delete notification
  app.delete("/api/admin/notifications/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteNotification(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({ message: "Notification deleted" });
  });

  // ==================== EARNING SYSTEM ====================

  // Get user balance and earning info
  app.get("/api/earning/balance", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    let balance = await storage.getUserBalance(userId);
    if (!balance) {
      balance = await storage.createUserBalance(userId);
    }
    res.json(balance);
  });

  // Update FaucetPay email
  app.patch("/api/earning/faucetpay-email", requireAuth, async (req, res) => {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ message: "Valid email required" });
    }
    const userId = req.session.userId!;
    await storage.updateUserBalance(userId, { faucetpayEmail: email });
    res.json({ message: "FaucetPay email updated" });
  });

  // Get user transactions
  app.get("/api/earning/transactions", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const transactions = await storage.getTransactionsByUserId(userId);
    res.json(transactions);
  });

  // Get earning settings (public)
  app.get("/api/earning/settings", async (req, res) => {
    const settings = await storage.getAllEarningSettings();
    res.json(settings);
  });

  // ==================== OFFERWALLS ====================

  // Get offerwall settings (public - for display)
  app.get("/api/offerwalls", requireAuth, async (req, res) => {
    const settings = await storage.getAllOfferwallSettings();
    const enabled = settings.filter(s => s.isEnabled);
    res.json(enabled.map(s => ({ network: s.network, isEnabled: s.isEnabled })));
  });

  // Get AdBlueMedia offers (proxy to avoid CORS) - with geo-location targeting
  app.get("/api/offerwalls/adbluemedia/offers", requireAuth, async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ message: "userId required" });
      }

      const setting = await storage.getOfferwallSetting("adbluemedia");
      if (!setting?.isEnabled) {
        return res.json([]);
      }

      // Get user's IP for geo-targeting
      const userIp = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || req.socket.remoteAddress || "";
      const clientIp = Array.isArray(userIp) ? userIp[0] : userIp.split(",")[0].trim();

      // AdBlueMedia API with IP parameter for geo-targeting
      const feedUrl = `https://d2xohqmdyl2cj3.cloudfront.net/public/offers/feed.php?user_id=518705&api_key=f24063d0d801e4daa846e9da4454c467&s1=${userId}&s2=&ip=${encodeURIComponent(clientIp)}`;
      
      const response = await fetch(feedUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch offers");
      }
      
      const offers = await response.json();
      
      // Apply 50% revenue split - show users their actual earnings
      const adjustedOffers = (Array.isArray(offers) ? offers : []).map((offer: any) => ({
        ...offer,
        payout: (parseFloat(offer.payout || "0") * 0.5).toFixed(2), // User sees 50% of payout
        original_payout: offer.payout, // Keep original for reference
      }));
      
      res.json(adjustedOffers);
    } catch (error) {
      console.error("AdBlueMedia offers fetch error:", error);
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });

  // CPAGrip postback handler
  app.get("/api/postback/cpagrip", async (req, res) => {
    const { user_id, offer_id, payout, transaction_id, ip, secret } = req.query;
    
    console.log("CPAGrip postback:", { user_id, offer_id, payout, transaction_id, ip });

    // Check if offerwall is enabled and validate secret
    const setting = await storage.getOfferwallSetting("cpagrip");
    if (!setting?.isEnabled) {
      return res.status(400).send("0");
    }

    // Security: Validate secret key matches configured API key
    if (setting.apiKey && secret !== setting.apiKey) {
      console.log("CPAGrip postback: Invalid secret key");
      return res.status(403).send("0");
    }

    if (!user_id || !offer_id || !payout) {
      return res.status(400).send("0");
    }

    const userId = user_id as string;
    const offerId = offer_id as string;
    const payoutAmount = payout as string;
    const txId = (transaction_id as string) || "";
    const clientIp = (ip as string) || "";

    // Check for duplicate
    const isDuplicate = await storage.checkOfferwallCompletion(userId, "cpagrip", offerId);
    if (isDuplicate) {
      console.log("Duplicate CPAGrip completion:", { userId, offerId });
      return res.status(200).send("1"); // Still return success to avoid retries
    }

    // Verify user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(400).send("0");
    }

    // Apply 50:50 revenue split
    const netPayout = parseFloat(payoutAmount);
    const userReward = (netPayout * 0.5).toFixed(6); // 50% to user
    const platformShare = (netPayout * 0.5).toFixed(6); // 50% to platform

    // Record completion with original payout and credit user with 50%
    await storage.recordOfferwallCompletion(userId, "cpagrip", offerId, txId, payoutAmount, clientIp);
    await storage.creditBalance(userId, userReward, "offerwall", `CPAGrip offer: ${offerId}`, "cpagrip", offerId, clientIp);

    console.log("CPAGrip credited (50:50 split):", { userId, offerId, netPayout: payoutAmount, userReward, platformShare });
    res.status(200).send("1");
  });

  // AdBlueMedia postback handler
  app.get("/api/postback/adbluemedia", async (req, res) => {
    const { user_id, offer_id, payout, transaction_id, ip, secret } = req.query;
    
    console.log("AdBlueMedia postback:", { user_id, offer_id, payout, transaction_id, ip });

    // Check if offerwall is enabled and validate secret
    const setting = await storage.getOfferwallSetting("adbluemedia");
    if (!setting?.isEnabled) {
      return res.status(400).send("0");
    }

    // Security: Validate secret key matches configured API key
    if (setting.apiKey && secret !== setting.apiKey) {
      console.log("AdBlueMedia postback: Invalid secret key");
      return res.status(403).send("0");
    }

    if (!user_id || !offer_id || !payout) {
      return res.status(400).send("0");
    }

    const userId = user_id as string;
    const offerId = offer_id as string;
    const payoutAmount = payout as string;
    const txId = (transaction_id as string) || "";
    const clientIp = (ip as string) || "";

    // Check for duplicate
    const isDuplicate = await storage.checkOfferwallCompletion(userId, "adbluemedia", offerId);
    if (isDuplicate) {
      console.log("Duplicate AdBlueMedia completion:", { userId, offerId });
      return res.status(200).send("1");
    }

    // Verify user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(400).send("0");
    }

    // Apply 50:50 revenue split
    const netPayout = parseFloat(payoutAmount);
    const userReward = (netPayout * 0.5).toFixed(6); // 50% to user
    const platformShare = (netPayout * 0.5).toFixed(6); // 50% to platform

    // Record completion with original payout and credit user with 50%
    await storage.recordOfferwallCompletion(userId, "adbluemedia", offerId, txId, payoutAmount, clientIp);
    await storage.creditBalance(userId, userReward, "offerwall", `AdBlueMedia offer: ${offerId}`, "adbluemedia", offerId, clientIp);

    console.log("AdBlueMedia credited (50:50 split):", { userId, offerId, netPayout: payoutAmount, userReward, platformShare });
    res.status(200).send("1");
  });

  // ==================== TASKS ====================

  // Get active tasks for users
  app.get("/api/tasks", requireAuth, async (req, res) => {
    const tasks = await storage.getActiveTasks();
    const userId = req.session.userId!;
    
    // Get user's submissions to check if they've already submitted
    const submissions = await storage.getTaskSubmissionsByUser(userId);
    const submittedTaskIds = new Set(submissions.map(s => s.taskId));
    
    const tasksWithStatus = tasks.map(task => ({
      ...task,
      hasSubmitted: submittedTaskIds.has(task.id),
      submission: submissions.find(s => s.taskId === task.id),
    }));
    
    res.json(tasksWithStatus);
  });

  // Submit task proof
  app.post("/api/tasks/:id/submit", requireAuth, async (req, res) => {
    const taskId = req.params.id;
    const userId = req.session.userId!;
    const { proofData } = req.body;

    if (!proofData) {
      return res.status(400).json({ message: "Proof is required" });
    }

    // Check if task exists and is active
    const task = await storage.getTask(taskId);
    if (!task || !task.isActive) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if already submitted
    const hasSubmitted = await storage.hasUserSubmittedTask(userId, taskId);
    if (hasSubmitted) {
      return res.status(400).json({ message: "You have already submitted this task" });
    }

    const submission = await storage.createTaskSubmission(taskId, userId, proofData);
    res.status(201).json(submission);
  });

  // Get user's task submissions
  app.get("/api/tasks/submissions", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const submissions = await storage.getTaskSubmissionsByUser(userId);
    res.json(submissions);
  });

  // ==================== REFERRALS ====================

  // Get user's referral info
  app.get("/api/referrals", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    const referrals = await storage.getReferralsByReferrer(userId);
    const settings = await storage.getAllEarningSettings();
    
    res.json({
      referralCode: user?.referralCode,
      referrals,
      reward: settings.referralReward || "0.10",
      linksRequired: parseInt(settings.referralLinksRequired || "3"),
    });
  });

  // Apply referral code (called during registration with ref query param)
  app.post("/api/referrals/apply", requireAuth, async (req, res) => {
    const { code } = req.body;
    const userId = req.session.userId!;
    const clientIp = getClientIp(req);

    if (!code) {
      return res.status(400).json({ message: "Referral code required" });
    }

    // Check if user was already referred
    const existingReferral = await storage.getReferralByReferredId(userId);
    if (existingReferral) {
      return res.status(400).json({ message: "You already used a referral code" });
    }

    // Find referrer by code
    const referrer = await storage.getUserByReferralCode(code);
    if (!referrer) {
      return res.status(400).json({ message: "Invalid referral code" });
    }

    // Can't refer yourself
    if (referrer.id === userId) {
      return res.status(400).json({ message: "Cannot use your own referral code" });
    }

    // Create referral
    const referral = await storage.createReferral(referrer.id, userId, code, clientIp);
    await storage.updateUser(userId, { referredBy: referrer.id });

    res.json({ message: "Referral code applied", referral });
  });

  // ==================== WITHDRAWALS ====================

  // Get user's withdrawal requests
  app.get("/api/withdrawals", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const requests = await storage.getWithdrawalRequestsByUser(userId);
    res.json(requests);
  });

  // Create withdrawal request
  app.post("/api/withdrawals", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const { amountUsd, coinType } = req.body;

    if (!amountUsd || !coinType) {
      return res.status(400).json({ message: "Amount and coin type required" });
    }

    // Get user balance
    const balance = await storage.getUserBalance(userId);
    if (!balance) {
      return res.status(400).json({ message: "No balance found" });
    }

    // Check FaucetPay email
    if (!balance.faucetpayEmail) {
      return res.status(400).json({ message: "Please set your FaucetPay email first" });
    }

    // Check minimum withdrawal
    const settings = await storage.getAllEarningSettings();
    const minWithdrawal = parseFloat(settings.minWithdrawal || "1.00");
    const amount = parseFloat(amountUsd);

    if (amount < minWithdrawal) {
      return res.status(400).json({ message: `Minimum withdrawal is $${minWithdrawal}` });
    }

    // Check balance
    const currentBalance = parseFloat(balance.balanceUsd || "0");
    if (currentBalance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Check supported coins
    const supportedCoins = (settings.supportedCoins || "BTC,ETH,DOGE,LTC,USDT,TRX").split(",");
    if (!supportedCoins.includes(coinType)) {
      return res.status(400).json({ message: "Unsupported coin type" });
    }

    // Check for pending withdrawal
    const pending = await storage.getPendingWithdrawalRequests();
    const hasPending = pending.some(w => w.userId === userId);
    if (hasPending) {
      return res.status(400).json({ message: "You already have a pending withdrawal" });
    }

    // Debit balance
    const debitResult = await storage.debitBalance(userId, amountUsd, "withdrawal", `Withdrawal request: ${coinType}`);
    if (!debitResult) {
      return res.status(400).json({ message: "Failed to process withdrawal" });
    }

    // Create withdrawal request
    const request = await storage.createWithdrawalRequest(userId, amountUsd, coinType, balance.faucetpayEmail);
    res.status(201).json(request);
  });

  // ==================== ADMIN EARNING MANAGEMENT ====================

  // Get all earning stats
  app.get("/api/admin/earning/stats", requireAdmin, async (req, res) => {
    const transactions = await storage.getAllTransactions();
    const withdrawals = await storage.getAllWithdrawalRequests();
    const taskSubmissions = await storage.getAllTaskSubmissions();
    const referrals = await storage.getAllReferrals();

    const totalEarnings = transactions
      .filter(t => parseFloat(t.amount) > 0)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalWithdrawn = withdrawals
      .filter(w => w.status === "paid")
      .reduce((sum, w) => sum + parseFloat(w.amountUsd), 0);

    res.json({
      totalEarnings: totalEarnings.toFixed(2),
      totalWithdrawn: totalWithdrawn.toFixed(2),
      pendingWithdrawals: withdrawals.filter(w => w.status === "pending").length,
      pendingTasks: taskSubmissions.filter(t => t.status === "pending").length,
      totalReferrals: referrals.length,
      validReferrals: referrals.filter(r => r.status === "credited").length,
    });
  });

  // Get all transactions
  app.get("/api/admin/earning/transactions", requireAdmin, async (req, res) => {
    const transactions = await storage.getAllTransactions();
    res.json(transactions);
  });

  // Admin: Get all tasks
  app.get("/api/admin/tasks", requireAdmin, async (req, res) => {
    const tasks = await storage.getAllTasks();
    res.json(tasks);
  });

  // Admin: Create task
  app.post("/api/admin/tasks", requireAdmin, async (req, res) => {
    try {
      const task = await storage.createTask(req.body);
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Admin: Update task
  app.patch("/api/admin/tasks/:id", requireAdmin, async (req, res) => {
    const task = await storage.updateTask(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(task);
  });

  // Admin: Delete task
  app.delete("/api/admin/tasks/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteTask(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json({ message: "Task deleted" });
  });

  // Admin: Get all task submissions
  app.get("/api/admin/task-submissions", requireAdmin, async (req, res) => {
    const submissions = await storage.getAllTaskSubmissions();
    // Enrich with task and user info
    const enriched = await Promise.all(submissions.map(async (s) => {
      const task = await storage.getTask(s.taskId);
      const user = await storage.getUser(s.userId);
      return {
        ...s,
        taskTitle: task?.title,
        taskReward: task?.rewardUsd,
        userEmail: user?.email,
      };
    }));
    res.json(enriched);
  });

  // Admin: Approve/reject task submission
  app.patch("/api/admin/task-submissions/:id", requireAdmin, async (req, res) => {
    const { status, adminNotes } = req.body;
    
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const submission = await storage.getTaskSubmission(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    if (submission.status !== "pending") {
      return res.status(400).json({ message: "Submission already processed" });
    }

    // Update submission
    await storage.updateTaskSubmission(req.params.id, {
      status,
      adminNotes,
      reviewedAt: new Date(),
    });

    // If approved, credit the user
    if (status === "approved") {
      const task = await storage.getTask(submission.taskId);
      if (task) {
        await storage.creditBalance(
          submission.userId,
          task.rewardUsd,
          "task",
          `Task completed: ${task.title}`
        );
      }
    }

    res.json({ message: `Submission ${status}` });
  });

  // Admin: Get all referrals
  app.get("/api/admin/referrals", requireAdmin, async (req, res) => {
    const referrals = await storage.getAllReferrals();
    // Enrich with user info
    const enriched = await Promise.all(referrals.map(async (r) => {
      const referrer = await storage.getUser(r.referrerId);
      const referred = await storage.getUser(r.referredId);
      return {
        ...r,
        referrerEmail: referrer?.email,
        referredEmail: referred?.email,
      };
    }));
    res.json(enriched);
  });

  // Admin: Approve referral
  app.patch("/api/admin/referrals/:id", requireAdmin, async (req, res) => {
    const { status, adminNotes } = req.body;
    
    const referral = await storage.getReferral(req.params.id);
    if (!referral) {
      return res.status(404).json({ message: "Referral not found" });
    }

    if (referral.status === "credited") {
      return res.status(400).json({ message: "Referral already credited" });
    }

    await storage.updateReferral(req.params.id, {
      status,
      validatedAt: status === "valid" || status === "credited" ? new Date() : undefined,
    });

    // If credited, pay the referrer
    if (status === "credited") {
      const settings = await storage.getAllEarningSettings();
      const reward = settings.referralReward || "0.10";
      await storage.creditBalance(
        referral.referrerId,
        reward,
        "referral",
        `Referral bonus for user ID: ${referral.referredId}`
      );
    }

    res.json({ message: `Referral ${status}` });
  });

  // Admin: Get all withdrawals
  app.get("/api/admin/withdrawals", requireAdmin, async (req, res) => {
    const withdrawals = await storage.getAllWithdrawalRequests();
    // Enrich with user info
    const enriched = await Promise.all(withdrawals.map(async (w) => {
      const user = await storage.getUser(w.userId);
      return {
        ...w,
        userEmail: user?.email,
      };
    }));
    res.json(enriched);
  });

  // Admin: Process withdrawal
  app.patch("/api/admin/withdrawals/:id", requireAdmin, async (req, res) => {
    const { status, txHash, adminNotes } = req.body;
    
    if (!["approved", "rejected", "paid"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const withdrawal = await storage.getWithdrawalRequest(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    if (withdrawal.status === "paid") {
      return res.status(400).json({ message: "Withdrawal already paid" });
    }

    // If rejecting, refund the balance
    if (status === "rejected" && withdrawal.status === "pending") {
      await storage.creditBalance(
        withdrawal.userId,
        withdrawal.amountUsd,
        "refund",
        "Withdrawal rejected - refund"
      );
    }

    await storage.updateWithdrawalRequest(req.params.id, {
      status,
      txHash,
      adminNotes,
      processedAt: new Date(),
    });

    res.json({ message: `Withdrawal ${status}` });
  });

  // Admin: Get/update offerwall settings
  app.get("/api/admin/offerwall-settings", requireAdmin, async (req, res) => {
    const settings = await storage.getAllOfferwallSettings();
    res.json(settings);
  });

  app.patch("/api/admin/offerwall-settings/:network", requireAdmin, async (req, res) => {
    const setting = await storage.setOfferwallSetting(req.params.network, req.body);
    res.json(setting);
  });

  // Admin: Get/update earning settings
  app.get("/api/admin/earning-settings", requireAdmin, async (req, res) => {
    const settings = await storage.getAllEarningSettings();
    res.json(settings);
  });

  app.patch("/api/admin/earning-settings", requireAdmin, async (req, res) => {
    const updates = req.body as Record<string, string>;
    for (const [key, value] of Object.entries(updates)) {
      await storage.setEarningSetting(key, value);
    }
    res.json({ message: "Settings updated" });
  });

  // Admin: Get all tasks
  app.get("/api/admin/tasks", requireAdmin, async (req, res) => {
    const tasks = await storage.getAllTasks();
    res.json(tasks);
  });

  // Admin: Create task
  app.post("/api/admin/tasks", requireAdmin, async (req, res) => {
    try {
      const task = await storage.createTask(req.body);
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  // Admin: Update task
  app.patch("/api/admin/tasks/:id", requireAdmin, async (req, res) => {
    const task = await storage.updateTask(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(task);
  });

  // Admin: Delete task
  app.delete("/api/admin/tasks/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteTask(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json({ message: "Task deleted" });
  });

  // Admin: Get all task submissions
  app.get("/api/admin/task-submissions", requireAdmin, async (req, res) => {
    const submissions = await storage.getAllTaskSubmissions();
    // Enrich with task and user info
    const enriched = await Promise.all(submissions.map(async (s) => {
      const task = await storage.getTask(s.taskId);
      const user = await storage.getUser(s.userId);
      return {
        ...s,
        taskTitle: task?.title,
        userEmail: user?.email,
      };
    }));
    res.json(enriched);
  });

  // Admin: Review task submission
  app.patch("/api/admin/task-submissions/:id", requireAdmin, async (req, res) => {
    const { status, adminNotes } = req.body;
    
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const submission = await storage.getTaskSubmission(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    if (submission.status !== "pending") {
      return res.status(400).json({ message: "Submission already reviewed" });
    }

    const task = await storage.getTask(submission.taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // For approvals, use the atomic method with task-level locking
    // All operations (status update, completion count, balance credit) happen inside the lock
    if (status === "approved") {
      const result = await storage.approveTaskSubmissionWithLock(
        req.params.id,
        task.id,
        submission.userId,
        { status, adminNotes, reviewedAt: new Date() },
        task.maxCompletions,
        task.rewardUsd,
        task.title
      );

      if (!result.success) {
        if (result.error === "Already processed") {
          return res.json({ message: "Submission was already processed" });
        }
        return res.status(409).json({ message: result.error || "Failed to process submission" });
      }

      return res.json({ message: "Submission approved" });
    }

    // For rejections, use the simpler update
    const { updated, submission: updatedSubmission } = await storage.updateTaskSubmissionIfPending(req.params.id, {
      status,
      adminNotes,
      reviewedAt: new Date(),
    });

    if (!updatedSubmission) {
      return res.status(409).json({ message: "Submission is being processed by another request" });
    }

    if (!updated) {
      return res.json({ message: "Submission was already processed" });
    }

    res.json({ message: `Submission ${status}` });
  });

  // Admin: Get all referrals
  app.get("/api/admin/referrals", requireAdmin, async (req, res) => {
    const referrals = await storage.getAllReferrals();
    // Enrich with user info
    const enriched = await Promise.all(referrals.map(async (r) => {
      const referrer = await storage.getUser(r.referrerId);
      const referred = await storage.getUser(r.referredId);
      return {
        ...r,
        referrerEmail: referrer?.email,
        referredEmail: referred?.email,
      };
    }));
    res.json(enriched);
  });

  // Admin: Validate referral
  app.patch("/api/admin/referrals/:id", requireAdmin, async (req, res) => {
    const { isValid } = req.body;
    
    const referral = await storage.getReferral(req.params.id);
    if (!referral) {
      return res.status(404).json({ message: "Referral not found" });
    }

    if (referral.status === "rewarded") {
      return res.status(400).json({ message: "Referral already rewarded" });
    }

    if (isValid) {
      // Check if referred user has created enough links (query actual link count from storage)
      const linksRequired = parseInt(await storage.getEarningSetting("referralLinksRequired") || "3");
      const referredUserLinks = await storage.getLinksByUserId(referral.referredId);
      const actualLinkCount = referredUserLinks.length;
      
      if (actualLinkCount < linksRequired) {
        return res.status(400).json({ 
          message: `Referred user has only created ${actualLinkCount} of ${linksRequired} required links` 
        });
      }
      
      // Update the linksCreated field with actual count and mark as validated
      await storage.updateReferral(req.params.id, { 
        status: "validated",
        linksCreated: actualLinkCount 
      });
      
      const rewardAmount = await storage.getEarningSetting("referralReward") || "0.10";
      await storage.creditBalance(
        referral.referrerId,
        rewardAmount,
        "referral",
        `Referral reward for user ${referral.referredId}`
      );
      
      await storage.updateReferral(req.params.id, { status: "rewarded" });
    } else {
      await storage.updateReferral(req.params.id, { status: "invalid" });
    }

    res.json({ message: isValid ? "Referral validated and rewarded" : "Referral marked as invalid" });
  });

  return httpServer;
}
