import {
  type User,
  type InsertUser,
  type Link,
  type InsertLink,
  type Click,
  type InsertClick,
  type BlogPost,
  type InsertBlogPost,
  type RateLimit,
  type BannedIp,
  type SiteSetting,
  type LinkAnalytics,
  type PlatformStats,
  type SponsoredPost,
  type InsertSponsoredPost,
  type SponsoredPostReaction,
  type Notification,
  type InsertNotification,
  type CustomAd,
  type InsertCustomAd,
  type UserBalance,
  type Transaction,
  type OfferwallCompletion,
  type Task,
  type InsertTask,
  type TaskSubmission,
  type Referral,
  type WithdrawalRequest,
  type OfferwallSetting,
  type EarningSetting,
  type SocialVerification,
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getUserByPasswordResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Links
  getLink(id: string): Promise<Link | undefined>;
  getLinkByShortCode(shortCode: string): Promise<Link | undefined>;
  getLinksByUserId(userId: string): Promise<Link[]>;
  getAllLinks(): Promise<Link[]>;
  createLink(link: InsertLink, userId?: string, ip?: string): Promise<Link>;
  updateLink(id: string, data: Partial<Link>): Promise<Link | undefined>;
  deleteLink(id: string): Promise<boolean>;

  // Clicks
  recordClick(click: InsertClick): Promise<Click>;
  getClicksByLinkId(linkId: string): Promise<Click[]>;
  getAnalyticsByLinkId(linkId: string): Promise<LinkAnalytics>;
  getTotalClicks(): Promise<number>;
  getClicksToday(): Promise<number>;

  // Blog Posts
  getBlogPost(id: string): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getAllBlogPosts(): Promise<BlogPost[]>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, data: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: string): Promise<boolean>;

  // Rate Limits
  getRateLimit(ip: string, month: string): Promise<RateLimit | undefined>;
  incrementRateLimit(ip: string, month: string): Promise<RateLimit>;
  
  // Banned IPs
  getBannedIp(ip: string): Promise<BannedIp | undefined>;
  getAllBannedIps(): Promise<BannedIp[]>;
  banIp(ip: string, reason?: string): Promise<BannedIp>;
  unbanIp(ip: string): Promise<boolean>;

  // Settings
  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string): Promise<void>;
  getAllSettings(): Promise<Record<string, string>>;

  // Stats
  getPlatformStats(): Promise<PlatformStats>;

  // Sponsored Posts
  getSponsoredPost(id: string): Promise<SponsoredPost | undefined>;
  getActiveSponsoredPosts(): Promise<SponsoredPost[]>;
  getAllSponsoredPosts(): Promise<SponsoredPost[]>;
  createSponsoredPost(post: InsertSponsoredPost): Promise<SponsoredPost>;
  updateSponsoredPost(id: string, data: Partial<InsertSponsoredPost>): Promise<SponsoredPost | undefined>;
  deleteSponsoredPost(id: string): Promise<boolean>;
  incrementSponsoredPostView(id: string): Promise<void>;
  incrementSponsoredPostClick(id: string): Promise<void>;

  // Sponsored Post Reactions
  getReaction(postId: string, visitorId: string): Promise<SponsoredPostReaction | undefined>;
  setReaction(postId: string, visitorId: string, reaction: string): Promise<void>;
  
  // Notifications
  getNotification(id: string): Promise<Notification | undefined>;
  getNotificationsForUser(userId: string): Promise<Notification[]>;
  getUnreadCount(userId: string): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<boolean>;
  getAllNotifications(): Promise<Notification[]>;

  // Per-Link Analytics Unlock
  setLinkUnlock(userId: string, linkId: string, expiry: Date): Promise<void>;
  getLinkUnlock(userId: string, linkId: string): Promise<Date | undefined>;
  isLinkUnlocked(userId: string, linkId: string): Promise<boolean>;

  // Custom Ads
  getCustomAd(id: string): Promise<CustomAd | undefined>;
  getAllCustomAds(): Promise<CustomAd[]>;
  getEnabledCustomAds(): Promise<CustomAd[]>;
  getCustomAdsByPlacement(placement: string): Promise<CustomAd[]>;
  createCustomAd(ad: InsertCustomAd): Promise<CustomAd>;
  updateCustomAd(id: string, data: Partial<InsertCustomAd>): Promise<CustomAd | undefined>;
  deleteCustomAd(id: string): Promise<boolean>;

  // ============ EARNING SYSTEM ============
  
  // User Balances
  getUserBalance(userId: string): Promise<UserBalance | undefined>;
  createUserBalance(userId: string): Promise<UserBalance>;
  updateUserBalance(userId: string, data: Partial<UserBalance>): Promise<UserBalance | undefined>;
  creditBalance(userId: string, amount: string, type: string, description: string, network?: string, offerId?: string, ip?: string): Promise<Transaction>;
  debitBalance(userId: string, amount: string, type: string, description: string): Promise<Transaction | null>;

  // Transactions
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionsByUserId(userId: string): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;

  // Offerwall Completions
  checkOfferwallCompletion(userId: string, network: string, offerId: string): Promise<boolean>;
  recordOfferwallCompletion(userId: string, network: string, offerId: string, transactionId: string, payout: string, ip: string): Promise<OfferwallCompletion>;

  // Tasks
  getTask(id: string): Promise<Task | undefined>;
  getAllTasks(): Promise<Task[]>;
  getActiveTasks(): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, data: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // Task Submissions
  getTaskSubmission(id: string): Promise<TaskSubmission | undefined>;
  getTaskSubmissionsByUser(userId: string): Promise<TaskSubmission[]>;
  getTaskSubmissionsByTask(taskId: string): Promise<TaskSubmission[]>;
  getAllTaskSubmissions(): Promise<TaskSubmission[]>;
  getPendingTaskSubmissions(): Promise<TaskSubmission[]>;
  createTaskSubmission(taskId: string, userId: string, proofData: string, proofUrl?: string, proofText?: string, screenshotLinks?: string): Promise<TaskSubmission>;
  updateTaskSubmission(id: string, data: Partial<TaskSubmission>): Promise<TaskSubmission | undefined>;
  updateTaskSubmissionIfPending(id: string, data: Partial<TaskSubmission>): Promise<{ updated: boolean; submission: TaskSubmission | undefined }>;
  approveTaskSubmissionWithLock(submissionId: string, taskId: string, userId: string, data: Partial<TaskSubmission>, maxCompletions: number | null, rewardUsd: number, taskTitle: string): Promise<{ success: boolean; error?: string; submission?: TaskSubmission }>;
  hasUserSubmittedTask(userId: string, taskId: string): Promise<boolean>;

  // Referrals
  getReferral(id: string): Promise<Referral | undefined>;
  getReferralByReferredId(referredId: string): Promise<Referral | undefined>;
  getReferralsByReferrer(referrerId: string): Promise<Referral[]>;
  getAllReferrals(): Promise<Referral[]>;
  createReferral(referrerId: string, referredId: string, referralCode: string, ip: string): Promise<Referral>;
  updateReferral(id: string, data: Partial<Referral>): Promise<Referral | undefined>;
  getUserByReferralCode(code: string): Promise<User | undefined>;

  // Social Verification
  getSocialVerification(userId: string): Promise<SocialVerification | undefined>;
  getAllSocialVerifications(): Promise<SocialVerification[]>;
  createSocialVerification(userId: string, screenshotLinks: string): Promise<SocialVerification>;
  updateSocialVerification(id: string, data: Partial<SocialVerification>): Promise<SocialVerification | undefined>;

  // Withdrawal Requests
  getWithdrawalRequest(id: string): Promise<WithdrawalRequest | undefined>;
  getWithdrawalRequestsByUser(userId: string): Promise<WithdrawalRequest[]>;
  getAllWithdrawalRequests(): Promise<WithdrawalRequest[]>;
  getPendingWithdrawalRequests(): Promise<WithdrawalRequest[]>;
  createWithdrawalRequest(userId: string, amountUsd: string, coinType: string, faucetpayEmail: string): Promise<WithdrawalRequest>;
  updateWithdrawalRequest(id: string, data: Partial<WithdrawalRequest>): Promise<WithdrawalRequest | undefined>;

  // Offerwall Settings
  getOfferwallSetting(network: string): Promise<OfferwallSetting | undefined>;
  getAllOfferwallSettings(): Promise<OfferwallSetting[]>;
  setOfferwallSetting(network: string, data: Partial<OfferwallSetting>): Promise<OfferwallSetting>;

  // Earning Settings
  getEarningSetting(key: string): Promise<string | undefined>;
  setEarningSetting(key: string, value: string): Promise<void>;
  getAllEarningSettings(): Promise<Record<string, string>>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private links: Map<string, Link>;
  private clicks: Map<string, Click>;
  private blogPosts: Map<string, BlogPost>;
  private rateLimits: Map<string, RateLimit>;
  private bannedIps: Map<string, BannedIp>;
  private settings: Map<string, string>;
  private sponsoredPosts: Map<string, SponsoredPost>;
  private sponsoredPostReactions: Map<string, SponsoredPostReaction>;
  private notifications: Map<string, Notification>;
  private linkUnlocks: Map<string, Date>;
  private customAds: Map<string, CustomAd>;
  // Earning system maps
  private userBalances: Map<string, UserBalance>;
  private transactions: Map<string, Transaction>;
  private offerwallCompletions: Map<string, OfferwallCompletion>;
  private tasks: Map<string, Task>;
  private taskSubmissions: Map<string, TaskSubmission>;
  private referrals: Map<string, Referral>;
  private socialVerifications: Map<string, SocialVerification>;
  private withdrawalRequests: Map<string, WithdrawalRequest>;
  private offerwallSettings: Map<string, OfferwallSetting>;
  private earningSettings: Map<string, string>;

  constructor() {
    this.users = new Map();
    this.links = new Map();
    this.clicks = new Map();
    this.blogPosts = new Map();
    this.rateLimits = new Map();
    this.bannedIps = new Map();
    this.settings = new Map();
    this.sponsoredPosts = new Map();
    this.sponsoredPostReactions = new Map();
    this.notifications = new Map();
    this.linkUnlocks = new Map();
    this.customAds = new Map();
    // Earning system
    this.userBalances = new Map();
    this.transactions = new Map();
    this.offerwallCompletions = new Map();
    this.tasks = new Map();
    this.taskSubmissions = new Map();
    this.referrals = new Map();
    this.socialVerifications = new Map();
    this.withdrawalRequests = new Map();
    this.offerwallSettings = new Map();
    this.earningSettings = new Map();

    // Initialize default settings
    this.settings.set("unlockDuration", "60");
    this.settings.set("adsEnabled", "true");
    this.settings.set("rewardedAdCode", "");
    this.settings.set("adsenseCode", "");

    // Initialize earning settings
    this.earningSettings.set("minWithdrawal", "1.00");
    this.earningSettings.set("referralReward", "0.10");
    this.earningSettings.set("referralLinksRequired", "3");
    this.earningSettings.set("faucetpayEnabled", "true");
    this.earningSettings.set("supportedCoins", "BTC,ETH,DOGE,LTC,USDT,TRX");

    // Initialize offerwall settings
    this.initOfferwallSettings();

    // Create sample blog posts
    this.createSampleBlogPosts();
  }

  private initOfferwallSettings() {
    this.offerwallSettings.set("cpagrip", {
      id: randomUUID(),
      network: "cpagrip",
      isEnabled: true,
      apiKey: "35b59eb1af2454f46fe63ad7d34f923b",
      secretKey: null,
      userId: "621093",
      postbackUrl: null,
      updatedAt: new Date(),
    });
    this.offerwallSettings.set("adbluemedia", {
      id: randomUUID(),
      network: "adbluemedia",
      isEnabled: true,
      apiKey: "f24063d0d801e4daa846e9da4454c467",
      secretKey: null,
      userId: "518705",
      postbackUrl: null,
      updatedAt: new Date(),
    });
  }

  private async createSampleBlogPosts() {
    const samplePosts: InsertBlogPost[] = [
      {
        title: "Getting Started with URL Shortening",
        slug: "getting-started-with-url-shortening",
        content: `<p>URL shortening is a powerful tool for marketers, businesses, and anyone looking to share links more effectively. In this guide, we'll explore the basics of URL shortening and how you can leverage it for your needs.</p>
<h2>What is URL Shortening?</h2>
<p>URL shortening is the process of converting a long URL into a shorter, more manageable link. This makes links easier to share, especially on platforms with character limits like Twitter.</p>
<h2>Benefits of URL Shortening</h2>
<ul>
<li><strong>Cleaner appearance:</strong> Short links look more professional and are easier to remember.</li>
<li><strong>Better tracking:</strong> Most URL shorteners provide analytics to track clicks and engagement.</li>
<li><strong>Custom branding:</strong> Create memorable, branded short links.</li>
</ul>`,
        excerpt: "Learn the fundamentals of URL shortening and how it can benefit your marketing strategy.",
        isPublished: true,
      },
      {
        title: "How to Track Link Performance with Analytics",
        slug: "track-link-performance-analytics",
        content: `<p>Understanding how your links perform is crucial for optimizing your marketing efforts. Analytics provide valuable insights into who's clicking your links and where they're coming from.</p>
<h2>Key Metrics to Track</h2>
<ul>
<li><strong>Total clicks:</strong> The overall number of times your link was clicked.</li>
<li><strong>Geographic data:</strong> See which countries your clicks are coming from.</li>
<li><strong>Device types:</strong> Understand whether users are on mobile or desktop.</li>
<li><strong>Referrers:</strong> Know which platforms are driving traffic to your links.</li>
</ul>
<h2>Using Analytics to Improve</h2>
<p>By analyzing this data, you can make informed decisions about where to focus your marketing efforts and how to optimize your content for better engagement.</p>`,
        excerpt: "Discover how to use link analytics to optimize your marketing campaigns and understand your audience.",
        isPublished: true,
      },
      {
        title: "QR Codes: The Modern Marketing Tool",
        slug: "qr-codes-modern-marketing-tool",
        content: `<p>QR codes have seen a massive resurgence in recent years, becoming an essential tool for modern marketing and customer engagement.</p>
<h2>Why QR Codes?</h2>
<p>QR codes bridge the gap between physical and digital marketing. They can be printed on any material and scanned with any smartphone camera.</p>
<h2>Best Practices for QR Codes</h2>
<ul>
<li><strong>Use high contrast:</strong> Ensure your QR code is easily scannable with dark colors on light backgrounds.</li>
<li><strong>Test before printing:</strong> Always verify your QR code works on multiple devices.</li>
<li><strong>Provide context:</strong> Tell users what they'll get when they scan the code.</li>
<li><strong>Track performance:</strong> Use shortened URLs in your QR codes to track scans.</li>
</ul>`,
        excerpt: "Learn how to effectively use QR codes in your marketing strategy to engage customers.",
        isPublished: true,
      },
    ];

    for (const post of samplePosts) {
      await this.createBlogPost(post);
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.verificationToken === token
    );
  }

  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.passwordResetToken === token
    );
  }

  private generateReferralCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdmin = Boolean(adminEmail && insertUser.email.toLowerCase() === adminEmail.toLowerCase());

    // Generate unique referral code
    let referralCode = this.generateReferralCode();
    while (await this.getUserByReferralCode(referralCode)) {
      referralCode = this.generateReferralCode();
    }

    const user: User = {
      id,
      email: insertUser.email,
      password: hashedPassword,
      emailVerified: true, // Auto-verify for MVP (no email service configured)
      verificationToken: null,
      analyticsUnlockExpiry: null,
      isAdmin: isAdmin ?? false,
      isBanned: false,
      referralCode,
      referredBy: null,
      socialVerified: false,
      socialVerifiedAt: null,
      telegramUsername: insertUser.telegramUsername || null,
      passwordResetToken: null,
      passwordResetExpiry: null,
      createdAt: new Date(),
    };
    this.users.set(id, user);

    // Create user balance
    await this.createUserBalance(id);

    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Links
  async getLink(id: string): Promise<Link | undefined> {
    return this.links.get(id);
  }

  async getLinkByShortCode(shortCode: string): Promise<Link | undefined> {
    return Array.from(this.links.values()).find(
      (link) => link.shortCode === shortCode
    );
  }

  async getLinksByUserId(userId: string): Promise<Link[]> {
    return Array.from(this.links.values())
      .filter((link) => link.userId === userId)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getAllLinks(): Promise<Link[]> {
    return Array.from(this.links.values()).sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async createLink(insertLink: InsertLink, userId?: string, ip?: string): Promise<Link> {
    const id = randomUUID();
    const shortCode = insertLink.shortCode || this.generateShortCode();

    const link: Link = {
      id,
      originalUrl: insertLink.originalUrl,
      shortCode,
      userId: userId ?? null,
      creatorIp: ip ?? null,
      isDisabled: false,
      isBanned: false,
      expiresAt: insertLink.expiresAt ? new Date(insertLink.expiresAt) : null,
      createdAt: new Date(),
    };
    this.links.set(id, link);
    return link;
  }

  private generateShortCode(): string {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async updateLink(id: string, data: Partial<Link>): Promise<Link | undefined> {
    const link = this.links.get(id);
    if (!link) return undefined;
    const updatedLink = { ...link, ...data };
    this.links.set(id, updatedLink);
    return updatedLink;
  }

  async deleteLink(id: string): Promise<boolean> {
    return this.links.delete(id);
  }

  // Clicks
  async recordClick(insertClick: InsertClick): Promise<Click> {
    const id = randomUUID();
    const click: Click = {
      id,
      linkId: insertClick.linkId,
      country: insertClick.country ?? null,
      device: insertClick.device ?? null,
      browser: insertClick.browser ?? null,
      referrer: insertClick.referrer ?? null,
      clickedAt: new Date(),
    };
    this.clicks.set(id, click);
    return click;
  }

  async getClicksByLinkId(linkId: string): Promise<Click[]> {
    return Array.from(this.clicks.values())
      .filter((click) => click.linkId === linkId)
      .sort((a, b) => {
        const dateA = a.clickedAt ? new Date(a.clickedAt).getTime() : 0;
        const dateB = b.clickedAt ? new Date(b.clickedAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getAnalyticsByLinkId(linkId: string): Promise<LinkAnalytics> {
    const clicks = await this.getClicksByLinkId(linkId);

    const countBy = <T extends string | null>(items: T[]): { [key: string]: number } => {
      return items.reduce((acc, item) => {
        const key = item || "Unknown";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });
    };

    const countryCounts = countBy(clicks.map((c) => c.country));
    const deviceCounts = countBy(clicks.map((c) => c.device));
    const browserCounts = countBy(clicks.map((c) => c.browser));
    const referrerCounts = countBy(clicks.map((c) => c.referrer));

    const dateCounts: { [key: string]: number } = {};
    clicks.forEach((click) => {
      if (click.clickedAt) {
        const date = new Date(click.clickedAt).toISOString().split('T')[0];
        dateCounts[date] = (dateCounts[date] || 0) + 1;
      }
    });

    return {
      totalClicks: clicks.length,
      clicksByCountry: Object.entries(countryCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count),
      clicksByDevice: Object.entries(deviceCounts)
        .map(([device, count]) => ({ device, count }))
        .sort((a, b) => b.count - a.count),
      clicksByBrowser: Object.entries(browserCounts)
        .map(([browser, count]) => ({ browser, count }))
        .sort((a, b) => b.count - a.count),
      clicksByReferrer: Object.entries(referrerCounts)
        .map(([referrer, count]) => ({ referrer, count }))
        .sort((a, b) => b.count - a.count),
      clicksByDate: Object.entries(dateCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      recentClicks: clicks.slice(0, 20),
    };
  }

  async getTotalClicks(): Promise<number> {
    return this.clicks.size;
  }

  async getClicksToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from(this.clicks.values()).filter((click) => {
      if (!click.clickedAt) return false;
      return new Date(click.clickedAt) >= today;
    }).length;
  }

  // Blog Posts
  async getBlogPost(id: string): Promise<BlogPost | undefined> {
    return this.blogPosts.get(id);
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    return Array.from(this.blogPosts.values()).find(
      (post) => post.slug === slug
    );
  }

  async getAllBlogPosts(): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values()).sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const id = randomUUID();
    const post: BlogPost = {
      id,
      title: insertPost.title,
      slug: insertPost.slug,
      content: insertPost.content,
      excerpt: insertPost.excerpt ?? null,
      featuredImage: insertPost.featuredImage ?? null,
      isPublished: insertPost.isPublished ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.blogPosts.set(id, post);
    return post;
  }

  async updateBlogPost(id: string, data: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const post = this.blogPosts.get(id);
    if (!post) return undefined;
    const updatedPost = { ...post, ...data, updatedAt: new Date() };
    this.blogPosts.set(id, updatedPost);
    return updatedPost;
  }

  async deleteBlogPost(id: string): Promise<boolean> {
    return this.blogPosts.delete(id);
  }

  // Rate Limits
  async getRateLimit(ip: string, month: string): Promise<RateLimit | undefined> {
    const key = `${ip}-${month}`;
    return this.rateLimits.get(key);
  }

  async incrementRateLimit(ip: string, month: string): Promise<RateLimit> {
    const key = `${ip}-${month}`;
    const existing = this.rateLimits.get(key);
    if (existing) {
      existing.count = (existing.count ?? 0) + 1;
      this.rateLimits.set(key, existing);
      return existing;
    }
    const newLimit: RateLimit = {
      id: randomUUID(),
      ip,
      month,
      count: 1,
    };
    this.rateLimits.set(key, newLimit);
    return newLimit;
  }

  // Banned IPs
  async getBannedIp(ip: string): Promise<BannedIp | undefined> {
    return this.bannedIps.get(ip);
  }

  async getAllBannedIps(): Promise<BannedIp[]> {
    return Array.from(this.bannedIps.values());
  }

  async banIp(ip: string, reason?: string): Promise<BannedIp> {
    const bannedIp: BannedIp = {
      id: randomUUID(),
      ip,
      reason: reason ?? null,
      bannedAt: new Date(),
    };
    this.bannedIps.set(ip, bannedIp);
    return bannedIp;
  }

  async unbanIp(ip: string): Promise<boolean> {
    return this.bannedIps.delete(ip);
  }

  // Settings
  async getSetting(key: string): Promise<string | undefined> {
    return this.settings.get(key);
  }

  async setSetting(key: string, value: string): Promise<void> {
    this.settings.set(key, value);
  }

  async getAllSettings(): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    this.settings.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  // Stats
  async getPlatformStats(): Promise<PlatformStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const linksToday = Array.from(this.links.values()).filter((link) => {
      if (!link.createdAt) return false;
      return new Date(link.createdAt) >= today;
    }).length;

    return {
      totalUsers: this.users.size,
      totalLinks: this.links.size,
      totalClicks: this.clicks.size,
      linksToday,
      clicksToday: await this.getClicksToday(),
    };
  }

  // Sponsored Posts
  async getSponsoredPost(id: string): Promise<SponsoredPost | undefined> {
    return this.sponsoredPosts.get(id);
  }

  async getActiveSponsoredPosts(): Promise<SponsoredPost[]> {
    const now = new Date();
    return Array.from(this.sponsoredPosts.values())
      .filter((post) => {
        if (!post.isActive || !post.isApproved) return false;
        if (post.startDate && new Date(post.startDate) > now) return false;
        if (post.endDate && new Date(post.endDate) < now) return false;
        return true;
      })
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  async getAllSponsoredPosts(): Promise<SponsoredPost[]> {
    return Array.from(this.sponsoredPosts.values())
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async createSponsoredPost(post: InsertSponsoredPost): Promise<SponsoredPost> {
    const id = randomUUID();
    const sponsoredPost: SponsoredPost = {
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
    };
    this.sponsoredPosts.set(id, sponsoredPost);
    return sponsoredPost;
  }

  async updateSponsoredPost(id: string, data: Partial<InsertSponsoredPost>): Promise<SponsoredPost | undefined> {
    const post = this.sponsoredPosts.get(id);
    if (!post) return undefined;
    const updatedPost = { ...post, ...data };
    this.sponsoredPosts.set(id, updatedPost);
    return updatedPost;
  }

  async deleteSponsoredPost(id: string): Promise<boolean> {
    return this.sponsoredPosts.delete(id);
  }

  async incrementSponsoredPostView(id: string): Promise<void> {
    const post = this.sponsoredPosts.get(id);
    if (post) {
      post.viewCount = (post.viewCount ?? 0) + 1;
      this.sponsoredPosts.set(id, post);
    }
  }

  async incrementSponsoredPostClick(id: string): Promise<void> {
    const post = this.sponsoredPosts.get(id);
    if (post) {
      post.clickCount = (post.clickCount ?? 0) + 1;
      this.sponsoredPosts.set(id, post);
    }
  }

  // Sponsored Post Reactions
  async getReaction(postId: string, visitorId: string): Promise<SponsoredPostReaction | undefined> {
    const key = `${postId}-${visitorId}`;
    return this.sponsoredPostReactions.get(key);
  }

  async setReaction(postId: string, visitorId: string, reaction: string): Promise<void> {
    const key = `${postId}-${visitorId}`;
    const post = this.sponsoredPosts.get(postId);
    if (!post) return;

    const existingReaction = this.sponsoredPostReactions.get(key);
    
    if (existingReaction) {
      if (existingReaction.reaction === "like") {
        post.likes = Math.max(0, (post.likes ?? 0) - 1);
      } else if (existingReaction.reaction === "dislike") {
        post.dislikes = Math.max(0, (post.dislikes ?? 0) - 1);
      }
    }

    if (reaction === "like") {
      post.likes = (post.likes ?? 0) + 1;
    } else if (reaction === "dislike") {
      post.dislikes = (post.dislikes ?? 0) + 1;
    }

    this.sponsoredPosts.set(postId, post);

    const newReaction: SponsoredPostReaction = {
      id: randomUUID(),
      postId,
      visitorId,
      reaction,
      createdAt: new Date(),
    };
    this.sponsoredPostReactions.set(key, newReaction);
  }

  // Notifications
  async getNotification(id: string): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter((n) => n.userId === userId || n.isGlobal)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return Array.from(this.notifications.values())
      .filter((n) => (n.userId === userId || n.isGlobal) && !n.isRead)
      .length;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const newNotification: Notification = {
      id,
      userId: notification.userId ?? null,
      title: notification.title,
      message: notification.message,
      type: notification.type ?? "info",
      isRead: false,
      isGlobal: notification.isGlobal ?? false,
      createdAt: new Date(),
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async markAsRead(id: string): Promise<void> {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.isRead = true;
      this.notifications.set(id, notification);
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    this.notifications.forEach((notification, id) => {
      if (notification.userId === userId || notification.isGlobal) {
        notification.isRead = true;
        this.notifications.set(id, notification);
      }
    });
  }

  async deleteNotification(id: string): Promise<boolean> {
    return this.notifications.delete(id);
  }

  async getAllNotifications(): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  // Per-Link Analytics Unlock
  async setLinkUnlock(userId: string, linkId: string, expiry: Date): Promise<void> {
    const key = `${userId}:${linkId}`;
    this.linkUnlocks.set(key, expiry);
  }

  async getLinkUnlock(userId: string, linkId: string): Promise<Date | undefined> {
    const key = `${userId}:${linkId}`;
    const expiry = this.linkUnlocks.get(key);
    if (expiry && new Date(expiry) > new Date()) {
      return expiry;
    }
    return undefined;
  }

  async isLinkUnlocked(userId: string, linkId: string): Promise<boolean> {
    const expiry = await this.getLinkUnlock(userId, linkId);
    return expiry !== undefined;
  }

  // Custom Ads
  async getCustomAd(id: string): Promise<CustomAd | undefined> {
    return this.customAds.get(id);
  }

  async getAllCustomAds(): Promise<CustomAd[]> {
    return Array.from(this.customAds.values()).sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async getEnabledCustomAds(): Promise<CustomAd[]> {
    return Array.from(this.customAds.values())
      .filter((ad) => ad.isEnabled)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getCustomAdsByPlacement(placement: string): Promise<CustomAd[]> {
    return Array.from(this.customAds.values())
      .filter((ad) => ad.isEnabled && ad.placement === placement)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async createCustomAd(ad: InsertCustomAd): Promise<CustomAd> {
    const id = randomUUID();
    const customAd: CustomAd = {
      id,
      name: ad.name,
      adCode: ad.adCode,
      placement: ad.placement,
      deviceType: ad.deviceType,
      adSize: ad.adSize,
      isEnabled: ad.isEnabled ?? true,
      createdAt: new Date(),
    };
    this.customAds.set(id, customAd);
    return customAd;
  }

  async updateCustomAd(id: string, data: Partial<InsertCustomAd>): Promise<CustomAd | undefined> {
    const ad = this.customAds.get(id);
    if (!ad) return undefined;
    const updatedAd = { ...ad, ...data };
    this.customAds.set(id, updatedAd);
    return updatedAd;
  }

  async deleteCustomAd(id: string): Promise<boolean> {
    return this.customAds.delete(id);
  }

  // ============ EARNING SYSTEM IMPLEMENTATIONS ============

  // User Balances
  async getUserBalance(userId: string): Promise<UserBalance | undefined> {
    return this.userBalances.get(userId);
  }

  async createUserBalance(userId: string): Promise<UserBalance> {
    const balance: UserBalance = {
      id: randomUUID(),
      userId,
      balanceUsd: "0",
      totalEarned: "0",
      totalWithdrawn: "0",
      faucetpayEmail: null,
      updatedAt: new Date(),
    };
    this.userBalances.set(userId, balance);
    return balance;
  }

  private userBalanceLocks: Map<string, { promise: Promise<void>; resolve: () => void }> = new Map();

  private async acquireBalanceLock(userId: string): Promise<void> {
    while (this.userBalanceLocks.has(userId)) {
      await this.userBalanceLocks.get(userId)!.promise;
    }
    let resolve!: () => void;
    const promise = new Promise<void>(r => { resolve = r; });
    this.userBalanceLocks.set(userId, { promise, resolve });
  }

  private releaseBalanceLock(userId: string): void {
    const lock = this.userBalanceLocks.get(userId);
    if (lock) {
      this.userBalanceLocks.delete(userId);
      lock.resolve();
    }
  }

  private updateUserBalanceInternal(userId: string, data: Partial<UserBalance>): UserBalance | undefined {
    const balance = this.userBalances.get(userId);
    if (!balance) return undefined;
    const updated = { ...balance, ...data, updatedAt: new Date() };
    this.userBalances.set(userId, updated);
    return updated;
  }

  async updateUserBalance(userId: string, data: Partial<UserBalance>): Promise<UserBalance | undefined> {
    await this.acquireBalanceLock(userId);
    try {
      return this.updateUserBalanceInternal(userId, data);
    } finally {
      this.releaseBalanceLock(userId);
    }
  }

  async creditBalance(userId: string, amount: string, type: string, description: string, network?: string, offerId?: string, ip?: string): Promise<Transaction> {
    await this.acquireBalanceLock(userId);

    try {
      let balance = await this.getUserBalance(userId);
      if (!balance) {
        balance = await this.createUserBalance(userId);
      }

      const currentBalance = parseFloat(balance.balanceUsd || "0");
      const creditAmount = parseFloat(amount);
      const newBalance = (currentBalance + creditAmount).toFixed(6);
      const newTotalEarned = (parseFloat(balance.totalEarned || "0") + creditAmount).toFixed(6);

      this.updateUserBalanceInternal(userId, {
        balanceUsd: newBalance,
        totalEarned: newTotalEarned,
      });

      const transaction: Transaction = {
        id: randomUUID(),
        userId,
        type,
        amount,
        description,
        network: network || null,
        offerId: offerId || null,
        ip: ip || null,
        status: "completed",
        createdAt: new Date(),
      };
      this.transactions.set(transaction.id, transaction);
      return transaction;
    } finally {
      this.releaseBalanceLock(userId);
    }
  }

  async debitBalance(userId: string, amount: string, type: string, description: string): Promise<Transaction | null> {
    await this.acquireBalanceLock(userId);

    try {
      const balance = await this.getUserBalance(userId);
      if (!balance) return null;

      const currentBalance = parseFloat(balance.balanceUsd || "0");
      const debitAmount = parseFloat(amount);
      
      if (currentBalance < debitAmount) return null;

      const newBalance = (currentBalance - debitAmount).toFixed(6);
      const newTotalWithdrawn = (parseFloat(balance.totalWithdrawn || "0") + debitAmount).toFixed(6);

      this.updateUserBalanceInternal(userId, {
        balanceUsd: newBalance,
        totalWithdrawn: newTotalWithdrawn,
      });

      const transaction: Transaction = {
        id: randomUUID(),
        userId,
        type,
        amount: `-${amount}`,
        description,
        network: null,
        offerId: null,
        ip: null,
        status: "completed",
        createdAt: new Date(),
      };
      this.transactions.set(transaction.id, transaction);
      return transaction;
    } finally {
      this.releaseBalanceLock(userId);
    }
  }

  // Transactions
  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((t) => t.userId === userId)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  // Offerwall Completions
  async checkOfferwallCompletion(userId: string, network: string, offerId: string): Promise<boolean> {
    const key = `${userId}:${network}:${offerId}`;
    return this.offerwallCompletions.has(key);
  }

  async recordOfferwallCompletion(userId: string, network: string, offerId: string, transactionId: string, payout: string, ip: string): Promise<OfferwallCompletion> {
    const key = `${userId}:${network}:${offerId}`;
    const completion: OfferwallCompletion = {
      id: randomUUID(),
      userId,
      network,
      offerId,
      transactionId,
      payout,
      ip,
      completedAt: new Date(),
    };
    this.offerwallCompletions.set(key, completion);
    return completion;
  }

  // Tasks
  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getActiveTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter((t) => t.isActive)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async createTask(task: InsertTask): Promise<Task> {
    const id = randomUUID();
    const newTask: Task = {
      id,
      title: task.title,
      description: task.description,
      instructions: task.instructions || null,
      requirements: task.requirements || null,
      proofInstructions: task.proofInstructions || null,
      rewardUsd: task.rewardUsd,
      proofType: task.proofType || "screenshot",
      isActive: task.isActive ?? true,
      maxCompletions: task.maxCompletions ?? null,
      completedCount: 0,
      createdAt: new Date(),
    };
    this.tasks.set(id, newTask);
    return newTask;
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    const updated = { ...task, ...data };
    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Task Submissions
  async getTaskSubmission(id: string): Promise<TaskSubmission | undefined> {
    return this.taskSubmissions.get(id);
  }

  async getTaskSubmissionsByUser(userId: string): Promise<TaskSubmission[]> {
    return Array.from(this.taskSubmissions.values())
      .filter((s) => s.userId === userId)
      .sort((a, b) => {
        const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getTaskSubmissionsByTask(taskId: string): Promise<TaskSubmission[]> {
    return Array.from(this.taskSubmissions.values())
      .filter((s) => s.taskId === taskId)
      .sort((a, b) => {
        const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getAllTaskSubmissions(): Promise<TaskSubmission[]> {
    return Array.from(this.taskSubmissions.values())
      .sort((a, b) => {
        const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getPendingTaskSubmissions(): Promise<TaskSubmission[]> {
    return Array.from(this.taskSubmissions.values())
      .filter((s) => s.status === "pending")
      .sort((a, b) => {
        const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async createTaskSubmission(taskId: string, userId: string, proofData: string, proofUrl?: string, proofText?: string, screenshotLinks?: string): Promise<TaskSubmission> {
    const id = randomUUID();
    const submission: TaskSubmission = {
      id,
      taskId,
      userId,
      proofData,
      proofUrl: proofUrl || null,
      proofText: proofText || null,
      screenshotLinks: screenshotLinks || null,
      status: "pending",
      adminNotes: null,
      submittedAt: new Date(),
      reviewedAt: null,
    };
    this.taskSubmissions.set(id, submission);
    return submission;
  }

  private submissionLocks: Set<string> = new Set();
  private taskCompletionLocks: Set<string> = new Set();

  async approveTaskSubmissionWithLock(
    submissionId: string, 
    taskId: string,
    userId: string,
    data: Partial<TaskSubmission>,
    maxCompletions: number | null,
    rewardUsd: number,
    taskTitle: string
  ): Promise<{ success: boolean; error?: string; submission?: TaskSubmission }> {
    // Acquire task-level lock to prevent concurrent completions exceeding max
    if (this.taskCompletionLocks.has(taskId)) {
      return { success: false, error: "Task is being processed by another request" };
    }
    this.taskCompletionLocks.add(taskId);

    try {
      // Also acquire submission-level lock
      if (this.submissionLocks.has(submissionId)) {
        return { success: false, error: "Submission is being processed by another request" };
      }
      this.submissionLocks.add(submissionId);

      try {
        const submission = this.taskSubmissions.get(submissionId);
        if (!submission) return { success: false, error: "Submission not found" };

        // Check if already processed
        if (submission.status !== "pending") {
          return { success: false, error: "Already processed", submission };
        }

        // Re-check maxCompletions under lock
        const task = this.tasks.get(taskId);
        if (maxCompletions !== null) {
          const currentCount = task?.completedCount || 0;
          if (currentCount >= maxCompletions) {
            return { success: false, error: "Task has reached maximum completions" };
          }
        }

        // Store original states for rollback
        const originalSubmission = { ...submission };
        const originalTaskCount = task?.completedCount || 0;

        // Update submission - INSIDE the lock
        const updated = { ...submission, ...data };
        this.taskSubmissions.set(submissionId, updated);

        // Increment task completion count - INSIDE the lock
        if (task) {
          const newCount = originalTaskCount + 1;
          this.tasks.set(taskId, { ...task, completedCount: newCount });
        }

        // Credit user balance - INSIDE the lock (with rollback on failure)
        try {
          await this.creditBalance(userId, String(rewardUsd), "task_completion", `Task: ${taskTitle}`);
        } catch (creditError) {
          // Rollback: restore original submission and task count
          this.taskSubmissions.set(submissionId, originalSubmission);
          if (task) {
            this.tasks.set(taskId, { ...task, completedCount: originalTaskCount });
          }
          return { success: false, error: "Failed to credit balance" };
        }

        return { success: true, submission: updated };
      } finally {
        this.submissionLocks.delete(submissionId);
      }
    } finally {
      this.taskCompletionLocks.delete(taskId);
    }
  }

  async updateTaskSubmissionIfPending(id: string, data: Partial<TaskSubmission>): Promise<{ updated: boolean; submission: TaskSubmission | undefined }> {
    // Simple lock to prevent concurrent updates
    if (this.submissionLocks.has(id)) {
      return { updated: false, submission: undefined }; // Another update is in progress
    }
    this.submissionLocks.add(id);
    
    try {
      const submission = this.taskSubmissions.get(id);
      if (!submission) return { updated: false, submission: undefined };
      
      // Re-check status for idempotency - only update if pending
      if (submission.status !== "pending") {
        return { updated: false, submission }; // Already processed
      }
      
      const updated = { ...submission, ...data };
      this.taskSubmissions.set(id, updated);
      return { updated: true, submission: updated };
    } finally {
      this.submissionLocks.delete(id);
    }
  }

  async updateTaskSubmission(id: string, data: Partial<TaskSubmission>): Promise<TaskSubmission | undefined> {
    const submission = this.taskSubmissions.get(id);
    if (!submission) return undefined;
    const updated = { ...submission, ...data };
    this.taskSubmissions.set(id, updated);
    return updated;
  }

  async hasUserSubmittedTask(userId: string, taskId: string): Promise<boolean> {
    return Array.from(this.taskSubmissions.values())
      .some((s) => s.userId === userId && s.taskId === taskId);
  }

  // Referrals
  async getReferral(id: string): Promise<Referral | undefined> {
    return this.referrals.get(id);
  }

  async getReferralByReferredId(referredId: string): Promise<Referral | undefined> {
    return Array.from(this.referrals.values())
      .find((r) => r.referredId === referredId);
  }

  async getReferralsByReferrer(referrerId: string): Promise<Referral[]> {
    return Array.from(this.referrals.values())
      .filter((r) => r.referrerId === referrerId)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getAllReferrals(): Promise<Referral[]> {
    return Array.from(this.referrals.values())
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async createReferral(referrerId: string, referredId: string, referralCode: string, ip: string): Promise<Referral> {
    const id = randomUUID();
    const referral: Referral = {
      id,
      referrerId,
      referredId,
      referralCode,
      status: "pending",
      linksCreated: 0,
      socialProof: null,
      ip,
      createdAt: new Date(),
      validatedAt: null,
    };
    this.referrals.set(id, referral);
    return referral;
  }

  async updateReferral(id: string, data: Partial<Referral>): Promise<Referral | undefined> {
    const referral = this.referrals.get(id);
    if (!referral) return undefined;
    const updated = { ...referral, ...data };
    this.referrals.set(id, updated);
    return updated;
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    return Array.from(this.users.values())
      .find((u) => u.referralCode === code);
  }

  // Social Verification
  async getSocialVerification(userId: string): Promise<SocialVerification | undefined> {
    return Array.from(this.socialVerifications.values())
      .find((sv) => sv.userId === userId);
  }

  async getAllSocialVerifications(): Promise<SocialVerification[]> {
    return Array.from(this.socialVerifications.values())
      .sort((a, b) => {
        const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async createSocialVerification(userId: string, screenshotLinks: string): Promise<SocialVerification> {
    const id = randomUUID();
    const sv: SocialVerification = {
      id,
      userId,
      screenshotLinks,
      status: "pending",
      adminNotes: null,
      submittedAt: new Date(),
      reviewedAt: null,
    };
    this.socialVerifications.set(id, sv);
    return sv;
  }

  async updateSocialVerification(id: string, data: Partial<SocialVerification>): Promise<SocialVerification | undefined> {
    const sv = this.socialVerifications.get(id);
    if (!sv) return undefined;
    const updated = { ...sv, ...data };
    this.socialVerifications.set(id, updated);
    return updated;
  }

  // Withdrawal Requests
  async getWithdrawalRequest(id: string): Promise<WithdrawalRequest | undefined> {
    return this.withdrawalRequests.get(id);
  }

  async getWithdrawalRequestsByUser(userId: string): Promise<WithdrawalRequest[]> {
    return Array.from(this.withdrawalRequests.values())
      .filter((w) => w.userId === userId)
      .sort((a, b) => {
        const dateA = a.requestedAt ? new Date(a.requestedAt).getTime() : 0;
        const dateB = b.requestedAt ? new Date(b.requestedAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    return Array.from(this.withdrawalRequests.values())
      .sort((a, b) => {
        const dateA = a.requestedAt ? new Date(a.requestedAt).getTime() : 0;
        const dateB = b.requestedAt ? new Date(b.requestedAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getPendingWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    return Array.from(this.withdrawalRequests.values())
      .filter((w) => w.status === "pending")
      .sort((a, b) => {
        const dateA = a.requestedAt ? new Date(a.requestedAt).getTime() : 0;
        const dateB = b.requestedAt ? new Date(b.requestedAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async createWithdrawalRequest(userId: string, amountUsd: string, coinType: string, faucetpayEmail: string): Promise<WithdrawalRequest> {
    const id = randomUUID();
    const request: WithdrawalRequest = {
      id,
      userId,
      amountUsd,
      coinType,
      faucetpayEmail,
      status: "pending",
      adminNotes: null,
      txHash: null,
      requestedAt: new Date(),
      processedAt: null,
    };
    this.withdrawalRequests.set(id, request);
    return request;
  }

  async updateWithdrawalRequest(id: string, data: Partial<WithdrawalRequest>): Promise<WithdrawalRequest | undefined> {
    const request = this.withdrawalRequests.get(id);
    if (!request) return undefined;
    const updated = { ...request, ...data };
    this.withdrawalRequests.set(id, updated);
    return updated;
  }

  // Offerwall Settings
  async getOfferwallSetting(network: string): Promise<OfferwallSetting | undefined> {
    return this.offerwallSettings.get(network);
  }

  async getAllOfferwallSettings(): Promise<OfferwallSetting[]> {
    return Array.from(this.offerwallSettings.values());
  }

  async setOfferwallSetting(network: string, data: Partial<OfferwallSetting>): Promise<OfferwallSetting> {
    const existing = this.offerwallSettings.get(network);
    if (existing) {
      const updated = { ...existing, ...data, updatedAt: new Date() };
      this.offerwallSettings.set(network, updated);
      return updated;
    }
    const setting: OfferwallSetting = {
      id: randomUUID(),
      network,
      isEnabled: data.isEnabled ?? true,
      apiKey: data.apiKey || null,
      secretKey: data.secretKey || null,
      userId: data.userId || null,
      postbackUrl: data.postbackUrl || null,
      updatedAt: new Date(),
    };
    this.offerwallSettings.set(network, setting);
    return setting;
  }

  // Earning Settings
  async getEarningSetting(key: string): Promise<string | undefined> {
    return this.earningSettings.get(key);
  }

  async setEarningSetting(key: string, value: string): Promise<void> {
    this.earningSettings.set(key, value);
  }

  async getAllEarningSettings(): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    this.earningSettings.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
}

export const storage = new MemStorage();
