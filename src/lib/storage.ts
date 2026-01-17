import { db, schema } from "./db";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import type {
  User,
  InsertUser,
  Link,
  InsertLink,
  Click,
  InsertClick,
  BlogPost,
  InsertBlogPost,
  RateLimit,
  BannedIp,
  LinkAnalytics,
  PlatformStats,
  SponsoredPost,
  InsertSponsoredPost,
  SponsoredPostReaction,
  Notification,
  InsertNotification,
  CustomAd,
  InsertCustomAd,
  UserBalance,
  Transaction,
  OfferwallCompletion,
  Task,
  InsertTask,
  TaskSubmission,
  Referral,
  WithdrawalRequest,
  OfferwallSetting,
  SocialVerification,
  Announcement,
  InsertAnnouncement,
} from "@shared/schema";

const {
  users,
  links,
  clicks,
  blogPosts,
  rateLimits,
  bannedIps,
  siteSettings,
  sponsoredPosts,
  sponsoredPostReactions,
  notifications,
  announcements,
  customAds,
  userBalances,
  transactions,
  offerwallCompletions,
  tasks,
  taskSubmissions,
  referrals,
  withdrawalRequests,
  offerwallSettings,
  earningSettings,
  socialVerifications,
} = schema;

// Helper: recursively serialize Date objects to ISO strings
function serializeDates<T>(input: T): T {
  if (input == null) return input;

  // Detect Date objects reliably across realms and only call toISOString
  // when we are confident the value is a real Date.
  const isDate = Object.prototype.toString.call(input) === '[object Date]';
  if (isDate) {
    // Keep Date objects as Date instances so DB drivers (drizzle) can
    // call `.toISOString()` themselves when mapping to driver values.
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((v) => serializeDates(v)) as unknown as T;
  }

  if (typeof input === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(input as any)) {
      out[k] = serializeDates(v as any);
    }
    return out as T;
  }

  return input;
}

// ============ USERS ============

export async function getUser(id: string): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function getUserByVerificationToken(token: string): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.verificationToken, token)).limit(1);
  return result[0];
}

export async function getUserByPasswordResetToken(token: string): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.passwordResetToken, token)).limit(1);
  return result[0];
}

export async function createUser(userData: InsertUser): Promise<User> {
  const id = randomUUID();
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const verificationToken = randomUUID();
  const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

  const payload = {
    id,
    email: userData.email,
    password: hashedPassword,
    verificationToken,
    referralCode,
    telegramUsername: userData.telegramUsername || null,
    emailVerified: false,
    isAdmin: false,
    isBanned: false,
    socialVerified: false,
    createdAt: new Date(),
  };

  try {
    const result = await db.insert(users).values(serializeDates(payload)).returning();

    // Create user balance
    try {
      await db.insert(userBalances).values(serializeDates({
        id: randomUUID(),
        userId: id,
        balanceUsd: "0",
        totalEarned: "0",
        totalWithdrawn: "0",
      }));
    } catch (innerErr) {
      console.error("Error inserting user balance for user %s: %O", id, innerErr);
      throw innerErr;
    }

    return result[0];
  } catch (err) {
    console.error("createUser payload before DB insert:", payload);
    console.error("createUser serializeDates(payload):", serializeDates(payload));
    console.error("createUser DB insert error:", err, (err as any)?.stack);
    throw err;
  }
}

export async function updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
  const result = await db.update(users).set(serializeDates(data)).where(eq(users.id, id)).returning();
  return result[0];
}

// Set analytics unlock expiry for a user (keeps API compatibility)
export async function setLinkUnlock(userId: string, _linkId: string, expiry: Date): Promise<User | undefined> {
  // Currently analytics unlock is stored on the user record as `analyticsUnlockExpiry`.
  // We update the user's analyticsUnlockExpiry to the provided expiry.
  return await updateUser(userId, { analyticsUnlockExpiry: expiry } as Partial<User>);
}

// Get link unlock expiry for a user
export async function getLinkUnlock(userId: string, _linkId: string): Promise<Date | undefined> {
  const user = await getUser(userId);
  if (user?.analyticsUnlockExpiry && new Date(user.analyticsUnlockExpiry) > new Date()) {
    // Normalize to a Date object for callers that expect `.toISOString()`.
    return new Date(user.analyticsUnlockExpiry);
  }
  return undefined;
}

// Check if analytics is unlocked for a user
export async function isLinkUnlocked(userId: string, linkId: string): Promise<boolean> {
  const expiry = await getLinkUnlock(userId, linkId);
  return expiry !== undefined;
}

export async function getAllUsers(): Promise<User[]> {
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getUserByReferralCode(code: string): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.referralCode, code)).limit(1);
  return result[0];
}

// ============ LINKS ============

export async function getLink(id: string): Promise<Link | undefined> {
  const result = await db.select().from(links).where(eq(links.id, id)).limit(1);
  return result[0];
}

export async function getLinkByShortCode(shortCode: string): Promise<Link | undefined> {
  const result = await db.select().from(links).where(eq(links.shortCode, shortCode)).limit(1);
  return result[0];
}

export async function getLinksByUserId(userId: string): Promise<Link[]> {
  return await db.select().from(links).where(eq(links.userId, userId)).orderBy(desc(links.createdAt));
}

export async function getAllLinks(): Promise<Link[]> {
  return await db.select().from(links).orderBy(desc(links.createdAt));
}

export async function createLink(linkData: InsertLink, userId?: string, ip?: string): Promise<Link> {
  const id = randomUUID();
  const shortCode = linkData.shortCode || Math.random().toString(36).substring(2, 8);

  const result = await db.insert(links).values(serializeDates({
    id,
    originalUrl: linkData.originalUrl,
    shortCode,
    userId: userId || null,
    creatorIp: ip || null,
    expiresAt: linkData.expiresAt ? new Date(linkData.expiresAt) : null,
    isDisabled: false,
    isBanned: false,
    createdAt: new Date(),
  })).returning();

  return result[0];
}

export async function updateLink(id: string, data: Partial<Link>): Promise<Link | undefined> {
  const result = await db.update(links).set(serializeDates(data)).where(eq(links.id, id)).returning();
  return result[0];
}

export async function deleteLink(id: string): Promise<boolean> {
  await db.delete(clicks).where(eq(clicks.linkId, id));
  const result = await db.delete(links).where(eq(links.id, id)).returning();
  return result.length > 0;
}

// ============ CLICKS ============

export async function recordClick(clickData: InsertClick): Promise<Click> {
  const id = randomUUID();
  
  const result = await db.insert(clicks).values(serializeDates({
    id,
    linkId: clickData.linkId,
    country: clickData.country || null,
    device: clickData.device || null,
    browser: clickData.browser || null,
    referrer: clickData.referrer || null,
    clickedAt: new Date(),
  })).returning();

  return result[0];
}

export async function getClicksByLinkId(linkId: string): Promise<Click[]> {
  return await db.select().from(clicks).where(eq(clicks.linkId, linkId)).orderBy(desc(clicks.clickedAt));
}

export async function getAnalyticsByLinkId(linkId: string): Promise<LinkAnalytics> {
  const allClicks = await getClicksByLinkId(linkId);
  
  const countryMap = new Map<string, number>();
  const deviceMap = new Map<string, number>();
  const browserMap = new Map<string, number>();
  const referrerMap = new Map<string, number>();
  const dateMap = new Map<string, number>();

  allClicks.forEach(click => {
    const country = click.country || "Unknown";
    const device = click.device || "Unknown";
    const browser = click.browser || "Unknown";
    const referrer = click.referrer || "Direct";
    const date = click.clickedAt ? new Date(click.clickedAt).toISOString().split('T')[0] : "Unknown";

    countryMap.set(country, (countryMap.get(country) || 0) + 1);
    deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
    referrerMap.set(referrer, (referrerMap.get(referrer) || 0) + 1);
    dateMap.set(date, (dateMap.get(date) || 0) + 1);
  });

  return {
    totalClicks: allClicks.length,
    clicksByCountry: Array.from(countryMap.entries()).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count),
    clicksByDevice: Array.from(deviceMap.entries()).map(([device, count]) => ({ device, count })).sort((a, b) => b.count - a.count),
    clicksByBrowser: Array.from(browserMap.entries()).map(([browser, count]) => ({ browser, count })).sort((a, b) => b.count - a.count),
    clicksByReferrer: Array.from(referrerMap.entries()).map(([referrer, count]) => ({ referrer, count })).sort((a, b) => b.count - a.count),
    clicksByDate: Array.from(dateMap.entries()).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
    recentClicks: allClicks.slice(0, 20),
  };
}

// ============ BLOG POSTS ============

export async function getBlogPost(id: string): Promise<BlogPost | undefined> {
  const result = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  return result[0];
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const result = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  return result[0];
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  return await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
}

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  return await db.select().from(blogPosts).where(eq(blogPosts.isPublished, true)).orderBy(desc(blogPosts.createdAt));
}

export async function createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
  const id = randomUUID();
  
  const result = await db.insert(blogPosts).values(serializeDates({
    id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt || null,
    featuredImage: post.featuredImage || null,
    isPublished: post.isPublished ?? false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })).returning();

  return result[0];
}

export async function updateBlogPost(id: string, data: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
  const result = await db.update(blogPosts)
    .set(serializeDates({ ...data, updatedAt: new Date() }))
    .where(eq(blogPosts.id, id))
    .returning();
  return result[0];
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  const result = await db.delete(blogPosts).where(eq(blogPosts.id, id)).returning();
  return result.length > 0;
}

// ============ RATE LIMITS ============

export async function getRateLimit(ip: string, month: string): Promise<RateLimit | undefined> {
  const result = await db.select()
    .from(rateLimits)
    .where(and(eq(rateLimits.ip, ip), eq(rateLimits.month, month)))
    .limit(1);
  return result[0];
}

export async function incrementRateLimit(ip: string, month: string): Promise<RateLimit> {
  const existing = await getRateLimit(ip, month);

  if (existing) {
    const result = await db.update(rateLimits)
      .set({ count: existing.count! + 1 })
      .where(eq(rateLimits.id, existing.id))
      .returning();
    return result[0];
  } else {
    const id = randomUUID();
    const result = await db.insert(rateLimits).values(serializeDates({
      id,
      ip,
      month,
      count: 1,
    })).returning();
    return result[0];
  }
}

// ============ BANNED IPS ============

export async function getBannedIp(ip: string): Promise<BannedIp | undefined> {
  const result = await db.select().from(bannedIps).where(eq(bannedIps.ip, ip)).limit(1);
  return result[0];
}

export async function getAllBannedIps(): Promise<BannedIp[]> {
  return await db.select().from(bannedIps);
}

export async function banIp(ip: string, reason?: string): Promise<BannedIp> {
  const id = randomUUID();
  
  const result = await db.insert(bannedIps).values(serializeDates({
    id,
    ip,
    reason: reason || null,
    bannedAt: new Date(),
  })).returning();

  return result[0];
}

export async function unbanIp(ip: string): Promise<boolean> {
  const result = await db.delete(bannedIps).where(eq(bannedIps.ip, ip)).returning();
  return result.length > 0;
}

// ============ SETTINGS ============

export async function getSetting(key: string): Promise<string | undefined> {
  const result = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
  return result[0]?.value || undefined;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);

  if (existing.length > 0) {
    await db.update(siteSettings).set(serializeDates({ value })).where(eq(siteSettings.key, key));
  } else {
    const id = randomUUID();
    await db.insert(siteSettings).values(serializeDates({ id, key, value }));
  }
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const allSettings = await db.select().from(siteSettings);
  const settingsObj: Record<string, string> = {};
  
  allSettings.forEach(setting => {
    if (setting.value) {
      settingsObj[setting.key] = setting.value;
    }
  });

  return settingsObj;
}

// ============ PLATFORM STATS ============

export async function getPlatformStats(): Promise<PlatformStats> {
  const [userCount, linkCount, clickCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(links),
    db.select({ count: sql<number>`count(*)` }).from(clicks),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [linksToday, clicksToday] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(links).where(gte(links.createdAt, today)),
    db.select({ count: sql<number>`count(*)` }).from(clicks).where(gte(clicks.clickedAt, today)),
  ]);

  return {
    totalUsers: Number(userCount[0]?.count) || 0,
    totalLinks: Number(linkCount[0]?.count) || 0,
    totalClicks: Number(clickCount[0]?.count) || 0,
    linksToday: Number(linksToday[0]?.count) || 0,
    clicksToday: Number(clicksToday[0]?.count) || 0,
  };
}

// ============ SPONSORED POSTS ============

export async function getSponsoredPost(id: string): Promise<SponsoredPost | undefined> {
  const result = await db.select().from(sponsoredPosts).where(eq(sponsoredPosts.id, id)).limit(1);
  return result[0];
}

export async function getActiveSponsoredPosts(): Promise<SponsoredPost[]> {
  const now = new Date();
  return await db.select()
    .from(sponsoredPosts)
    .where(and(eq(sponsoredPosts.isActive, true), eq(sponsoredPosts.isApproved, true)))
    .orderBy(desc(sponsoredPosts.priority));
}

export async function getAllSponsoredPosts(): Promise<SponsoredPost[]> {
  return await db.select().from(sponsoredPosts).orderBy(desc(sponsoredPosts.createdAt));
}

export async function createSponsoredPost(post: InsertSponsoredPost): Promise<SponsoredPost> {
  const id = randomUUID();
  const result = await db.insert(sponsoredPosts).values(serializeDates({
    id,
    title: post.title,
    description: post.description,
    content: post.content ?? null,
    logoUrl: post.logoUrl ?? null,
    bannerUrl: post.bannerUrl ?? null,
    websiteUrl: post.websiteUrl ?? null,
    socialLinks: post.socialLinks ?? null,
    isActive: post.isActive ?? false,
    isApproved: post.isApproved ?? false,
    priority: post.priority ?? 0,
    viewCount: 0,
    clickCount: 0,
    likes: 0,
    dislikes: 0,
    startDate: post.startDate ?? null,
    endDate: post.endDate ?? null,
    createdAt: new Date(),
  })).returning();
  return result[0];
}

export async function updateSponsoredPost(id: string, data: Partial<InsertSponsoredPost>): Promise<SponsoredPost | undefined> {
  const result = await db.update(sponsoredPosts).set(serializeDates(data)).where(eq(sponsoredPosts.id, id)).returning();
  return result[0];
}

export async function deleteSponsoredPost(id: string): Promise<boolean> {
  const result = await db.delete(sponsoredPosts).where(eq(sponsoredPosts.id, id)).returning();
  return result.length > 0;
}

export async function incrementSponsoredPostView(id: string): Promise<void> {
  await db.update(sponsoredPosts)
    .set({ viewCount: sql`${sponsoredPosts.viewCount} + 1` })
    .where(eq(sponsoredPosts.id, id));
}

export async function incrementSponsoredPostClick(id: string): Promise<void> {
  await db.update(sponsoredPosts)
    .set({ clickCount: sql`${sponsoredPosts.clickCount} + 1` })
    .where(eq(sponsoredPosts.id, id));
}

// ============ SPONSORED POST REACTIONS ============

export async function getReaction(postId: string, visitorId: string): Promise<SponsoredPostReaction | undefined> {
  const result = await db.select()
    .from(sponsoredPostReactions)
    .where(and(eq(sponsoredPostReactions.postId, postId), eq(sponsoredPostReactions.visitorId, visitorId)))
    .limit(1);
  return result[0];
}

export async function setReaction(postId: string, visitorId: string, reaction: string): Promise<void> {
  const existing = await getReaction(postId, visitorId);

  if (existing) {
    // Update counts based on old reaction
    if (existing.reaction === "like") {
      await db.update(sponsoredPosts)
        .set({ likes: sql`${sponsoredPosts.likes} - 1` })
        .where(eq(sponsoredPosts.id, postId));
    } else if (existing.reaction === "dislike") {
      await db.update(sponsoredPosts)
        .set({ dislikes: sql`${sponsoredPosts.dislikes} - 1` })
        .where(eq(sponsoredPosts.id, postId));
    }
    await db.update(sponsoredPostReactions)
      .set({ reaction })
      .where(eq(sponsoredPostReactions.id, existing.id));
  } else {
    await db.insert(sponsoredPostReactions).values(serializeDates({
      id: randomUUID(),
      postId,
      visitorId,
      reaction,
      createdAt: new Date(),
    }));
  }

  // Update counts based on new reaction
  if (reaction === "like") {
    await db.update(sponsoredPosts)
      .set({ likes: sql`${sponsoredPosts.likes} + 1` })
      .where(eq(sponsoredPosts.id, postId));
  } else if (reaction === "dislike") {
    await db.update(sponsoredPosts)
      .set({ dislikes: sql`${sponsoredPosts.dislikes} + 1` })
      .where(eq(sponsoredPosts.id, postId));
  }
}

// ============ NOTIFICATIONS ============

export async function getNotification(id: string): Promise<Notification | undefined> {
  const result = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
  return result[0];
}

export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
  return await db.select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function getUnreadCount(userId: string): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return Number(result[0]?.count) || 0;
}

export async function createNotification(notification: InsertNotification): Promise<Notification> {
  const id = randomUUID();
  const result = await db.insert(notifications).values(serializeDates({
    id,
    userId: notification.userId || null,
    title: notification.title,
    message: notification.message,
    type: notification.type || "info",
    isGlobal: notification.isGlobal ?? false,
    createdAt: new Date(),
  })).returning();
  return result[0];
}

export async function markAsRead(id: string): Promise<void> {
  await db.update(notifications).set(serializeDates({ isRead: true })).where(eq(notifications.id, id));
}

export async function markAllAsRead(userId: string): Promise<void> {
  await db.update(notifications).set(serializeDates({ isRead: true })).where(eq(notifications.userId, userId));
}

// Backwards-compatible alias expected by some API routes
export async function markAllNotificationsRead(userId: string): Promise<void> {
  return await markAllAsRead(userId);
}

export async function deleteNotification(id: string): Promise<boolean> {
  const result = await db.delete(notifications).where(eq(notifications.id, id)).returning();
  return result.length > 0;
}

export async function getAllNotifications(): Promise<Notification[]> {
  return await db.select().from(notifications).orderBy(desc(notifications.createdAt));
}

// ============ ANNOUNCEMENTS ============

export async function getActiveAnnouncements(): Promise<Announcement[]> {
  return await db.select()
    .from(announcements)
    .where(eq(announcements.isActive, true))
    .orderBy(desc(announcements.priority));
}

export async function getAllAnnouncements(): Promise<Announcement[]> {
  return await db.select().from(announcements).orderBy(desc(announcements.createdAt));
}

export async function createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
  const id = randomUUID();
  const result = await db.insert(announcements).values(serializeDates({
    id,
    message: announcement.message,
    type: announcement.type,
    isActive: announcement.isActive ?? true,
    priority: announcement.priority ?? 0,
    createdAt: new Date(),
  })).returning();
  return result[0];
}

export async function updateAnnouncement(id: string, data: Partial<InsertAnnouncement>): Promise<Announcement | undefined> {
  const result = await db.update(announcements).set(serializeDates(data)).where(eq(announcements.id, id)).returning();
  return result[0];
}

export async function deleteAnnouncement(id: string): Promise<boolean> {
  const result = await db.delete(announcements).where(eq(announcements.id, id)).returning();
  return result.length > 0;
}

// ============ CUSTOM ADS ============

export async function getCustomAd(id: string): Promise<CustomAd | undefined> {
  const result = await db.select().from(customAds).where(eq(customAds.id, id)).limit(1);
  return result[0];
}

export async function getAllCustomAds(): Promise<CustomAd[]> {
  return await db.select().from(customAds).orderBy(desc(customAds.createdAt));
}

export async function getEnabledCustomAds(): Promise<CustomAd[]> {
  return await db.select().from(customAds).where(eq(customAds.isEnabled, true));
}

export async function getCustomAdsByPlacement(placement: string): Promise<CustomAd[]> {
  return await db.select()
    .from(customAds)
    .where(and(eq(customAds.placement, placement), eq(customAds.isEnabled, true)));
}

export async function createCustomAd(ad: InsertCustomAd): Promise<CustomAd> {
  const id = randomUUID();
  const result = await db.insert(customAds).values(serializeDates({
    id,
    ...ad,
    createdAt: new Date(),
  })).returning();
  return result[0];
}

export async function updateCustomAd(id: string, data: Partial<InsertCustomAd>): Promise<CustomAd | undefined> {
  const result = await db.update(customAds).set(serializeDates(data)).where(eq(customAds.id, id)).returning();
  return result[0];
}

export async function deleteCustomAd(id: string): Promise<boolean> {
  const result = await db.delete(customAds).where(eq(customAds.id, id)).returning();
  return result.length > 0;
}

// ============ USER BALANCES ============

export async function getUserBalance(userId: string): Promise<UserBalance | undefined> {
  const result = await db.select().from(userBalances).where(eq(userBalances.userId, userId)).limit(1);
  return result[0];
}

export async function createUserBalance(userId: string): Promise<UserBalance> {
  const id = randomUUID();
  const result = await db.insert(userBalances).values(serializeDates({
    id,
    userId,
    balanceUsd: "0",
    totalEarned: "0",
    totalWithdrawn: "0",
  })).returning();
  return result[0];
}

export async function updateUserBalance(userId: string, data: Partial<UserBalance>): Promise<UserBalance | undefined> {
  const result = await db.update(userBalances)
    .set(serializeDates({ ...data, updatedAt: new Date() }))
    .where(eq(userBalances.userId, userId))
    .returning();
  return result[0];
}

export async function creditBalance(userId: string, amount: string, type: string, description: string, network?: string, offerId?: string, ip?: string): Promise<Transaction> {
  const balance = await getUserBalance(userId);
  if (!balance) throw new Error("User balance not found");

  const newBalance = (parseFloat(balance.balanceUsd || "0") + parseFloat(amount)).toFixed(2);
  const newTotalEarned = (parseFloat(balance.totalEarned || "0") + parseFloat(amount)).toFixed(2);

  await updateUserBalance(userId, {
    balanceUsd: newBalance,
    totalEarned: newTotalEarned,
  });

  const transactionId = randomUUID();
  const result = await db.insert(transactions).values(serializeDates({
    id: transactionId,
    userId,
    type,
    amount,
    description,
    network: network || null,
    offerId: offerId || null,
    ip: ip || null,
    status: "completed",
    createdAt: new Date(),
  })).returning();

  return result[0];
}

export async function debitBalance(userId: string, amount: string, type: string, description: string): Promise<Transaction | null> {
  const balance = await getUserBalance(userId);
  if (!balance) return null;

  const currentBalance = parseFloat(balance.balanceUsd || "0");
  const debitAmount = parseFloat(amount);

  if (currentBalance < debitAmount) return null;

  const newBalance = (currentBalance - debitAmount).toFixed(2);
  const newTotalWithdrawn = (parseFloat(balance.totalWithdrawn || "0") + debitAmount).toFixed(2);

  await updateUserBalance(userId, {
    balanceUsd: newBalance,
    totalWithdrawn: newTotalWithdrawn,
  });

  const transactionId = randomUUID();
  const result = await db.insert(transactions).values(serializeDates({
    id: transactionId,
    userId,
    type,
    amount: `-${amount}`,
    description,
    status: "completed",
    createdAt: new Date(),
  })).returning();

  return result[0];
}

// ============ TRANSACTIONS ============

export async function getTransaction(id: string): Promise<Transaction | undefined> {
  const result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
  return result[0];
}

export async function getTransactionsByUserId(userId: string): Promise<Transaction[]> {
  return await db.select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt));
}

export async function getAllTransactions(): Promise<Transaction[]> {
  return await db.select().from(transactions).orderBy(desc(transactions.createdAt));
}

// ============ OFFERWALL COMPLETIONS ============

export async function checkOfferwallCompletion(userId: string, network: string, offerId: string): Promise<boolean> {
  const result = await db.select()
    .from(offerwallCompletions)
    .where(and(
      eq(offerwallCompletions.userId, userId),
      eq(offerwallCompletions.network, network),
      eq(offerwallCompletions.offerId, offerId)
    ))
    .limit(1);
  return result.length > 0;
}

export async function recordOfferwallCompletion(userId: string, network: string, offerId: string, transactionId: string, payout: string, ip: string): Promise<OfferwallCompletion> {
  const id = randomUUID();
  const result = await db.insert(offerwallCompletions).values(serializeDates({
    id,
    userId,
    network,
    offerId,
    transactionId,
    payout,
    ip,
    completedAt: new Date(),
  })).returning();
  return result[0];
}

// ============ TASKS ============

export async function getTask(id: string): Promise<Task | undefined> {
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result[0];
}

export async function getAllTasks(): Promise<Task[]> {
  return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
}

export async function getActiveTasks(): Promise<Task[]> {
  return await db.select().from(tasks).where(eq(tasks.isActive, true)).orderBy(desc(tasks.createdAt));
}

export async function createTask(task: InsertTask): Promise<Task> {
  const id = randomUUID();
  const proofType: "screenshot" | "link" | "username" = task.proofType ?? "link";
  const values = {
    id,
    title: task.title,
    description: task.description,
    instructions: task.instructions || null,
    requirements: task.requirements || null,
    proofInstructions: task.proofInstructions || null,
    rewardUsd: task.rewardUsd,
    proofType: proofType as string,
    isActive: task.isActive ?? true,
    createdAt: new Date(),
  };
  const result = await db.insert(tasks).values(values).returning();
  return result[0];
}

export async function updateTask(id: string, data: Partial<Task>): Promise<Task | undefined> {
  const result = await db.update(tasks).set(serializeDates(data)).where(eq(tasks.id, id)).returning();
  return result[0];
}

export async function deleteTask(id: string): Promise<boolean> {
  const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
  return result.length > 0;
}

// ============ TASK SUBMISSIONS ============

export async function getTaskSubmission(id: string): Promise<TaskSubmission | undefined> {
  const result = await db.select().from(taskSubmissions).where(eq(taskSubmissions.id, id)).limit(1);
  return result[0];
}

export async function getTaskSubmissionsByUser(userId: string): Promise<TaskSubmission[]> {
  return await db.select()
    .from(taskSubmissions)
    .where(eq(taskSubmissions.userId, userId))
    .orderBy(desc(taskSubmissions.submittedAt));
}

export async function getTaskSubmissionsByTask(taskId: string): Promise<TaskSubmission[]> {
  return await db.select()
    .from(taskSubmissions)
    .where(eq(taskSubmissions.taskId, taskId))
    .orderBy(desc(taskSubmissions.submittedAt));
}

export async function getAllTaskSubmissions(): Promise<TaskSubmission[]> {
  return await db.select().from(taskSubmissions).orderBy(desc(taskSubmissions.submittedAt));
}

export async function getPendingTaskSubmissions(): Promise<TaskSubmission[]> {
  return await db.select()
    .from(taskSubmissions)
    .where(eq(taskSubmissions.status, "pending"))
    .orderBy(desc(taskSubmissions.submittedAt));
}

export async function createTaskSubmission(taskId: string, userId: string, proofData: string, proofUrl?: string, proofText?: string, screenshotLinks?: string): Promise<TaskSubmission> {
  const id = randomUUID();
  const result = await db.insert(taskSubmissions).values(serializeDates({
    id,
    taskId,
    userId,
    proofData,
    proofUrl: proofUrl || null,
    proofText: proofText || null,
    screenshotLinks: screenshotLinks || null,
    status: "pending",
    submittedAt: new Date(),
  })).returning();
  return result[0];
}

export async function updateTaskSubmission(id: string, data: Partial<TaskSubmission>): Promise<TaskSubmission | undefined> {
  const result = await db.update(taskSubmissions).set(serializeDates(data)).where(eq(taskSubmissions.id, id)).returning();
  return result[0];
}

// Update task submission only if it's still pending (atomic check-and-update)
export async function updateTaskSubmissionIfPending(id: string, data: Partial<TaskSubmission>): Promise<{ updated: boolean; submission: TaskSubmission | undefined }> {
  const result = await db.update(taskSubmissions)
    .set(serializeDates(data))
    .where(and(eq(taskSubmissions.id, id), eq(taskSubmissions.status, "pending")))
    .returning();
  
  if (result.length > 0) {
    return { updated: true, submission: result[0] };
  }
  
  // Check if submission exists but wasn't updated (already processed)
  const submission = await getTaskSubmission(id);
  return { updated: false, submission };
}

// Approve task submission with atomic locking
export async function approveTaskSubmissionWithLock(
  submissionId: string,
  taskId: string,
  userId: string,
  data: Partial<TaskSubmission>,
  maxCompletions: number | null,
  rewardUsd: number,
  taskTitle: string
): Promise<{ success: boolean; error?: string; submission?: TaskSubmission }> {
  // Get the submission
  const submission = await getTaskSubmission(submissionId);
  if (!submission) return { success: false, error: "Submission not found" };

  // Check if already processed
  if (submission.status !== "pending") {
    return { success: false, error: "Already processed", submission };
  }

  // Check maxCompletions
  if (maxCompletions !== null) {
    const task = await getTask(taskId);
    const currentCount = task?.completedCount || 0;
    if (currentCount >= maxCompletions) {
      return { success: false, error: "Task has reached maximum completions" };
    }
  }

  // Update submission atomically (only if still pending)
  const { updated, submission: updatedSubmission } = await updateTaskSubmissionIfPending(submissionId, data);

  if (!updated) {
    return { success: false, error: "Already processed", submission: updatedSubmission };
  }

  // Increment task completion count
  const task = await getTask(taskId);
  if (task) {
    await updateTask(taskId, { completedCount: (task.completedCount || 0) + 1 });
  }

  // Credit user balance
  try {
    await creditBalance(userId, String(rewardUsd), "task", `Task completed: ${taskTitle}`);
  } catch (creditError) {
    // Rollback the submission status
    await updateTaskSubmission(submissionId, { status: "pending", reviewedAt: null });
    if (task) {
      await updateTask(taskId, { completedCount: task.completedCount || 0 });
    }
    return { success: false, error: "Failed to credit balance" };
  }

  return { success: true, submission: updatedSubmission };
}

export async function hasUserSubmittedTask(userId: string, taskId: string): Promise<boolean> {
  const result = await db.select()
    .from(taskSubmissions)
    .where(and(eq(taskSubmissions.userId, userId), eq(taskSubmissions.taskId, taskId)))
    .limit(1);
  return result.length > 0;
}

// ============ REFERRALS ============

export async function getReferral(id: string): Promise<Referral | undefined> {
  const result = await db.select().from(referrals).where(eq(referrals.id, id)).limit(1);
  return result[0];
}

export async function getReferralByReferredId(referredId: string): Promise<Referral | undefined> {
  const result = await db.select().from(referrals).where(eq(referrals.referredId, referredId)).limit(1);
  return result[0];
}

export async function getReferralsByReferrer(referrerId: string): Promise<Referral[]> {
  return await db.select()
    .from(referrals)
    .where(eq(referrals.referrerId, referrerId))
    .orderBy(desc(referrals.createdAt));
}

export async function getAllReferrals(): Promise<Referral[]> {
  return await db.select().from(referrals).orderBy(desc(referrals.createdAt));
}

export async function createReferral(referrerId: string, referredId: string, referralCode: string, ip: string): Promise<Referral> {
  const id = randomUUID();
  const result = await db.insert(referrals).values(serializeDates({
    id,
    referrerId,
    referredId,
    referralCode,
    bonusPaid: false,
    linksCreated: 0,
    ip,
    createdAt: new Date(),
  })).returning();
  return result[0];
}

export async function updateReferral(id: string, data: Partial<Referral>): Promise<Referral | undefined> {
  const result = await db.update(referrals).set(serializeDates(data)).where(eq(referrals.id, id)).returning();
  return result[0];
}

// ============ SOCIAL VERIFICATIONS ============

export async function getSocialVerification(userId: string): Promise<SocialVerification | undefined> {
  const result = await db.select().from(socialVerifications).where(eq(socialVerifications.userId, userId)).limit(1);
  return result[0];
}

export async function getAllSocialVerifications(): Promise<SocialVerification[]> {
  return await db.select().from(socialVerifications).orderBy(desc(socialVerifications.submittedAt));
}

export async function createSocialVerification(userId: string, screenshotLinks: string): Promise<SocialVerification> {
  const id = randomUUID();
  const result = await db.insert(socialVerifications).values(serializeDates({
    id,
    userId,
    screenshotLinks,
    status: "pending",
    submittedAt: new Date(),
  })).returning();
  return result[0];
}

export async function updateSocialVerification(id: string, data: Partial<SocialVerification>): Promise<SocialVerification | undefined> {
  const result = await db.update(socialVerifications).set(serializeDates(data)).where(eq(socialVerifications.id, id)).returning();
  return result[0];
}

// ============ WITHDRAWAL REQUESTS ============

export async function getWithdrawalRequest(id: string): Promise<WithdrawalRequest | undefined> {
  const result = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, id)).limit(1);
  return result[0];
}

export async function getWithdrawalRequestsByUser(userId: string): Promise<WithdrawalRequest[]> {
  return await db.select()
    .from(withdrawalRequests)
    .where(eq(withdrawalRequests.userId, userId))
    .orderBy(desc(withdrawalRequests.requestedAt));
}

export async function getAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
  return await db.select().from(withdrawalRequests).orderBy(desc(withdrawalRequests.requestedAt));
}

export async function getPendingWithdrawalRequests(): Promise<WithdrawalRequest[]> {
  return await db.select()
    .from(withdrawalRequests)
    .where(eq(withdrawalRequests.status, "pending"))
    .orderBy(desc(withdrawalRequests.requestedAt));
}

export async function createWithdrawalRequest(userId: string, amountUsd: string, coinType: string, faucetpayEmail: string): Promise<WithdrawalRequest> {
  const id = randomUUID();
  const result = await db.insert(withdrawalRequests).values(serializeDates({
    id,
    userId,
    amountUsd,
    coinType,
    faucetpayEmail,
    status: "pending",
    requestedAt: new Date(),
  })).returning();
  return result[0];
}

export async function updateWithdrawalRequest(id: string, data: Partial<WithdrawalRequest>): Promise<WithdrawalRequest | undefined> {
  const result = await db.update(withdrawalRequests).set(serializeDates(data)).where(eq(withdrawalRequests.id, id)).returning();
  return result[0];
}

// ============ OFFERWALL SETTINGS ============

export async function getOfferwallSetting(network: string): Promise<OfferwallSetting | undefined> {
  const result = await db.select().from(offerwallSettings).where(eq(offerwallSettings.network, network)).limit(1);
  return result[0];
}

export async function getAllOfferwallSettings(): Promise<OfferwallSetting[]> {
  return await db.select().from(offerwallSettings);
}

export async function setOfferwallSetting(network: string, data: Partial<OfferwallSetting>): Promise<OfferwallSetting> {
  const existing = await getOfferwallSetting(network);

  if (existing) {
    const result = await db.update(offerwallSettings)
      .set(serializeDates({ ...data, updatedAt: new Date() }))
      .where(eq(offerwallSettings.network, network))
      .returning();
    return result[0];
  } else {
    const id = randomUUID();
    const result = await db.insert(offerwallSettings).values(serializeDates({
      id,
      network,
      ...data,
      updatedAt: new Date(),
    })).returning();
    return result[0];
  }
}

// ============ EARNING SETTINGS ============

export async function getEarningSetting(key: string): Promise<string | undefined> {
  const result = await db.select().from(earningSettings).where(eq(earningSettings.key, key)).limit(1);
  return result[0]?.value || undefined;
}

export async function getAllEarningSettings(): Promise<Record<string, string>> {
  const allSettings = await db.select().from(earningSettings);
  const settingsObj: Record<string, string> = {};
  
  allSettings.forEach(setting => {
    if (setting.value) {
      settingsObj[setting.key] = setting.value;
    }
  });

  return settingsObj;
}

export async function setEarningSetting(key: string, value: string): Promise<void> {
  const existing = await db.select().from(earningSettings).where(eq(earningSettings.key, key)).limit(1);

  if (existing.length > 0) {
    await db.update(earningSettings).set(serializeDates({ value })).where(eq(earningSettings.key, key));
  } else {
    const id = randomUUID();
    await db.insert(earningSettings).values(serializeDates({ id, key, value }));
  }
}

// Export as a combined storage object for compatibility
export const storage = {
  getUser,
  getUserByEmail,
  getUserByVerificationToken,
  getUserByPasswordResetToken,
  createUser,
  updateUser,
  getAllUsers,
  getUserByReferralCode,
  getLink,
  getLinkByShortCode,
  getLinksByUserId,
  getAllLinks,
  createLink,
  updateLink,
  deleteLink,
  recordClick,
  getClicksByLinkId,
  getAnalyticsByLinkId,
  getBlogPost,
  getBlogPostBySlug,
  getAllBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getRateLimit,
  incrementRateLimit,
  getBannedIp,
  getAllBannedIps,
  banIp,
  unbanIp,
  getSetting,
  setSetting,
  getAllSettings,
  getPlatformStats,
  getSponsoredPost,
  getActiveSponsoredPosts,
  getAllSponsoredPosts,
  createSponsoredPost,
  updateSponsoredPost,
  deleteSponsoredPost,
  incrementSponsoredPostView,
  incrementSponsoredPostClick,
  getReaction,
  setReaction,
  getNotification,
  getNotificationsForUser,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getAllNotifications,
  getActiveAnnouncements,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getCustomAd,
  getAllCustomAds,
  getEnabledCustomAds,
  getCustomAdsByPlacement,
  createCustomAd,
  updateCustomAd,
  deleteCustomAd,
  getUserBalance,
  createUserBalance,
  updateUserBalance,
  creditBalance,
  debitBalance,
  getTransaction,
  getTransactionsByUserId,
  getAllTransactions,
  checkOfferwallCompletion,
  recordOfferwallCompletion,
  getTask,
  getAllTasks,
  getActiveTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskSubmission,
  getTaskSubmissionsByUser,
  getTaskSubmissionsByTask,
  getAllTaskSubmissions,
  getPendingTaskSubmissions,
  createTaskSubmission,
  updateTaskSubmission,
  updateTaskSubmissionIfPending,
  approveTaskSubmissionWithLock,
  hasUserSubmittedTask,
  getLinkUnlock,
  isLinkUnlocked,
  getReferral,
  getReferralByReferredId,
  getReferralsByReferrer,
  getAllReferrals,
  createReferral,
  updateReferral,
  getSocialVerification,
  getAllSocialVerifications,
  createSocialVerification,
  updateSocialVerification,
  getWithdrawalRequest,
  getWithdrawalRequestsByUser,
  getAllWithdrawalRequests,
  getPendingWithdrawalRequests,
  createWithdrawalRequest,
  updateWithdrawalRequest,
  getOfferwallSetting,
  getAllOfferwallSettings,
  setOfferwallSetting,
  getEarningSetting,
  getAllEarningSettings,
  setEarningSetting,
};
