import { pgTable, text, varchar, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  analyticsUnlockExpiry: timestamp("analytics_unlock_expiry"),
  isAdmin: boolean("is_admin").default(false),
  isBanned: boolean("is_banned").default(false),
  referralCode: varchar("referral_code", { length: 10 }).unique(),
  referredBy: varchar("referred_by", { length: 36 }),
  socialVerified: boolean("social_verified").default(false),
  socialVerifiedAt: timestamp("social_verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
}).extend({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Links table
export const links = pgTable("links", {
  id: varchar("id", { length: 36 }).primaryKey(),
  originalUrl: text("original_url").notNull(),
  shortCode: varchar("short_code", { length: 20 }).notNull().unique(),
  userId: varchar("user_id", { length: 36 }),
  creatorIp: text("creator_ip"),
  isDisabled: boolean("is_disabled").default(false),
  isBanned: boolean("is_banned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLinkSchema = createInsertSchema(links).pick({
  originalUrl: true,
  shortCode: true,
}).extend({
  originalUrl: z.string().url("Invalid URL"),
  shortCode: z.string().min(3, "Short code must be at least 3 characters").max(20).optional(),
});

export type InsertLink = z.infer<typeof insertLinkSchema>;
export type Link = typeof links.$inferSelect;

// Clicks/Analytics table
export const clicks = pgTable("clicks", {
  id: varchar("id", { length: 36 }).primaryKey(),
  linkId: varchar("link_id", { length: 36 }).notNull(),
  country: text("country"),
  device: text("device"),
  browser: text("browser"),
  referrer: text("referrer"),
  clickedAt: timestamp("clicked_at").defaultNow(),
});

export const insertClickSchema = createInsertSchema(clicks).pick({
  linkId: true,
  country: true,
  device: true,
  browser: true,
  referrer: true,
});

export type InsertClick = z.infer<typeof insertClickSchema>;
export type Click = typeof clicks.$inferSelect;

// Blog posts table
export const blogPosts = pgTable("blog_posts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  featuredImage: text("featured_image"),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).pick({
  title: true,
  slug: true,
  content: true,
  excerpt: true,
  featuredImage: true,
  isPublished: true,
}).extend({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  content: z.string().min(1, "Content is required"),
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

// Rate limits table
export const rateLimits = pgTable("rate_limits", {
  id: varchar("id", { length: 36 }).primaryKey(),
  ip: text("ip").notNull(),
  month: text("month").notNull(),
  count: integer("count").default(0),
});

export type RateLimit = typeof rateLimits.$inferSelect;

// Banned IPs table
export const bannedIps = pgTable("banned_ips", {
  id: varchar("id", { length: 36 }).primaryKey(),
  ip: text("ip").notNull().unique(),
  reason: text("reason"),
  bannedAt: timestamp("banned_at").defaultNow(),
});

export type BannedIp = typeof bannedIps.$inferSelect;

// Site settings table
export const siteSettings = pgTable("site_settings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
});

export type SiteSetting = typeof siteSettings.$inferSelect;

// Analytics response types
export interface LinkAnalytics {
  totalClicks: number;
  clicksByCountry: { country: string; count: number }[];
  clicksByDevice: { device: string; count: number }[];
  clicksByBrowser: { browser: string; count: number }[];
  clicksByReferrer: { referrer: string; count: number }[];
  recentClicks: Click[];
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  isAdmin: boolean;
  analyticsUnlockExpiry: Date | null;
  referralCode: string | null;
  balanceUsd?: string;
}

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Platform stats for admin
export interface PlatformStats {
  totalUsers: number;
  totalLinks: number;
  totalClicks: number;
  linksToday: number;
  clicksToday: number;
}

// Sponsored posts table
export const sponsoredPosts = pgTable("sponsored_posts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content"),
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),
  websiteUrl: text("website_url"),
  socialLinks: text("social_links"),
  isActive: boolean("is_active").default(false),
  isApproved: boolean("is_approved").default(false),
  priority: integer("priority").default(0),
  viewCount: integer("view_count").default(0),
  clickCount: integer("click_count").default(0),
  likes: integer("likes").default(0),
  dislikes: integer("dislikes").default(0),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSponsoredPostSchema = createInsertSchema(sponsoredPosts).pick({
  title: true,
  description: true,
  content: true,
  logoUrl: true,
  bannerUrl: true,
  websiteUrl: true,
  socialLinks: true,
  isActive: true,
  isApproved: true,
  priority: true,
  startDate: true,
  endDate: true,
}).extend({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
});

export type InsertSponsoredPost = z.infer<typeof insertSponsoredPostSchema>;
export type SponsoredPost = typeof sponsoredPosts.$inferSelect;

// Sponsored post reactions table
export const sponsoredPostReactions = pgTable("sponsored_post_reactions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  postId: varchar("post_id", { length: 36 }).notNull(),
  visitorId: text("visitor_id").notNull(),
  reaction: text("reaction").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type SponsoredPostReaction = typeof sponsoredPostReactions.$inferSelect;

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").default("info"),
  isRead: boolean("is_read").default(false),
  isGlobal: boolean("is_global").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  title: true,
  message: true,
  type: true,
  isGlobal: true,
}).extend({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Custom Ads table
export const customAds = pgTable("custom_ads", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  adCode: text("ad_code").notNull(),
  placement: text("placement").notNull(), // header, footer, sidebar, in-content
  deviceType: text("device_type").notNull(), // desktop, mobile, both
  adSize: text("ad_size").notNull(), // 728x90, 970x90, 300x250, 336x280, 320x50, 320x100
  isEnabled: boolean("is_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCustomAdSchema = createInsertSchema(customAds).pick({
  name: true,
  adCode: true,
  placement: true,
  deviceType: true,
  adSize: true,
  isEnabled: true,
}).extend({
  name: z.string().min(1, "Name is required"),
  adCode: z.string().min(1, "Ad code is required"),
  placement: z.enum(["header", "footer", "sidebar", "in-content"]),
  deviceType: z.enum(["desktop", "mobile", "both"]),
  adSize: z.enum(["728x90", "970x90", "300x250", "336x280", "320x50", "320x100"]),
});

export type InsertCustomAd = z.infer<typeof insertCustomAdSchema>;
export type CustomAd = typeof customAds.$inferSelect;

// Ad size recommendations
export const adSizeRecommendations = {
  "728x90": { name: "Leaderboard", description: "Best for desktop header", width: 728, height: 90 },
  "970x90": { name: "Large Leaderboard", description: "Wide desktop header", width: 970, height: 90 },
  "300x250": { name: "Medium Rectangle", description: "Content/sidebar", width: 300, height: 250 },
  "336x280": { name: "Large Rectangle", description: "Content/sidebar", width: 336, height: 280 },
  "320x50": { name: "Mobile Banner", description: "Mobile header/footer", width: 320, height: 50 },
  "320x100": { name: "Large Mobile Banner", description: "Mobile header/footer", width: 320, height: 100 },
};

// ============ EARNING SYSTEM TABLES ============

// User balances table
export const userBalances = pgTable("user_balances", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().unique(),
  balanceUsd: text("balance_usd").default("0"), // Stored as string for precision
  totalEarned: text("total_earned").default("0"),
  totalWithdrawn: text("total_withdrawn").default("0"),
  faucetpayEmail: text("faucetpay_email"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UserBalance = typeof userBalances.$inferSelect;

// Transactions table for audit trail
export const transactions = pgTable("transactions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  type: text("type").notNull(), // offerwall, task, referral, withdrawal
  amount: text("amount").notNull(), // USD amount as string
  description: text("description"),
  network: text("network"), // CPAGrip, AdBlueMedia, etc.
  offerId: text("offer_id"),
  ip: text("ip"),
  status: text("status").default("completed"), // pending, completed, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

export type Transaction = typeof transactions.$inferSelect;

// Offerwall completions table (for duplicate prevention)
export const offerwallCompletions = pgTable("offerwall_completions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  network: text("network").notNull(), // CPAGrip, AdBlueMedia
  offerId: text("offer_id").notNull(),
  transactionId: text("transaction_id"), // Network's transaction ID
  payout: text("payout").notNull(),
  ip: text("ip"),
  completedAt: timestamp("completed_at").defaultNow(),
});

export type OfferwallCompletion = typeof offerwallCompletions.$inferSelect;

// Tasks table
export const tasks = pgTable("tasks", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  instructions: text("instructions"),
  requirements: text("requirements"),
  proofInstructions: text("proof_instructions"),
  rewardUsd: text("reward_usd").notNull(), // USD amount as string
  proofType: text("proof_type").notNull(), // screenshot, link, username
  isActive: boolean("is_active").default(true),
  maxCompletions: integer("max_completions"), // null means unlimited
  completedCount: integer("completed_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  title: true,
  description: true,
  instructions: true,
  requirements: true,
  proofInstructions: true,
  rewardUsd: true,
  proofType: true,
  isActive: true,
  maxCompletions: true,
}).extend({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  rewardUsd: z.string().min(1, "Reward is required"),
  proofType: z.enum(["screenshot", "link", "username"]).optional(),
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Task submissions table
export const taskSubmissions = pgTable("task_submissions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  taskId: varchar("task_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  proofData: text("proof_data").notNull(), // Legacy field for backward compatibility
  proofUrl: text("proof_url"), // Link proof (profile URL, post URL, etc.)
  proofText: text("proof_text"), // Text proof (username, description, etc.)
  screenshotLinks: text("screenshot_links"), // Comma-separated screenshot URLs from imgbb.com or postimages.org
  status: text("status").default("pending"), // pending, approved, rejected
  adminNotes: text("admin_notes"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export type TaskSubmission = typeof taskSubmissions.$inferSelect;

// Referrals table
export const referrals = pgTable("referrals", {
  id: varchar("id", { length: 36 }).primaryKey(),
  referrerId: varchar("referrer_id", { length: 36 }).notNull(),
  referredId: varchar("referred_id", { length: 36 }).notNull(),
  referralCode: text("referral_code").notNull(),
  status: text("status").default("pending"), // pending, valid, credited, rejected
  linksCreated: integer("links_created").default(0),
  socialProof: text("social_proof"), // Screenshot or profile link
  ip: text("ip"),
  createdAt: timestamp("created_at").defaultNow(),
  validatedAt: timestamp("validated_at"),
});

export type Referral = typeof referrals.$inferSelect;

// Withdrawal requests table
export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  amountUsd: text("amount_usd").notNull(),
  coinType: text("coin_type").notNull(), // BTC, ETH, DOGE, etc.
  faucetpayEmail: text("faucetpay_email").notNull(),
  status: text("status").default("pending"), // pending, approved, rejected, paid
  adminNotes: text("admin_notes"),
  txHash: text("tx_hash"), // Transaction hash after payment
  requestedAt: timestamp("requested_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;

// Offerwall settings
export const offerwallSettings = pgTable("offerwall_settings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  network: text("network").notNull().unique(), // CPAGrip, AdBlueMedia, FaucetPay
  isEnabled: boolean("is_enabled").default(true),
  apiKey: text("api_key"),
  secretKey: text("secret_key"),
  userId: text("user_id"),
  postbackUrl: text("postback_url"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type OfferwallSetting = typeof offerwallSettings.$inferSelect;

// Earning settings table
export const earningSettings = pgTable("earning_settings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
});

export type EarningSetting = typeof earningSettings.$inferSelect;
