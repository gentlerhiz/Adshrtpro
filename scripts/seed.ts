/**
 * Database Seed Script
 * Run with: npx tsx scripts/seed.ts
 * 
 * Creates initial admin user and sample data
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import * as schema from "../shared/schema";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/Adshrtpro";

async function seed() {
  console.log("🌱 Starting database seed...");
  
  const client = postgres(DATABASE_URL);
  const db = drizzle(client, { schema });

  try {
    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 10);
    const adminId = randomUUID();
    
    console.log("Creating admin user...");
    await db.insert(schema.users).values({
      id: adminId,
      email: "admin@adshrtpro.com",
      password: adminPassword,
      isAdmin: true,
      emailVerified: true,
      referralCode: "ADMIN001",
      createdAt: new Date(),
    }).onConflictDoNothing();

    // Create user balance
    await db.insert(schema.userBalances).values({
      id: randomUUID(),
      userId: adminId,
      balanceUsd: "0.00",
      totalEarned: "0.00",
      totalWithdrawn: "0.00",
    }).onConflictDoNothing();

    // Create default site settings (using siteSettings table)
    console.log("Creating default settings...");
    const settingId = randomUUID();
    await db.insert(schema.siteSettings).values({
      id: settingId,
      key: "site_name",
      value: "AdShrtPro",
    }).onConflictDoNothing();

    // Create default earning settings
    const earningSettingsData = [
      { key: "minWithdrawal", value: "1.00" },
      { key: "referralBonus", value: "0.10" },
      { key: "socialVerificationBonus", value: "0.05" },
      { key: "taskCompletionBonus", value: "0.01" },
    ];
    
    for (const setting of earningSettingsData) {
      await db.insert(schema.earningSettings).values({
        id: randomUUID(),
        key: setting.key,
        value: setting.value,
      }).onConflictDoNothing();
    }

    // Create sample blog post
    console.log("Creating sample blog post...");
    await db.insert(schema.blogPosts).values({
      id: randomUUID(),
      title: "Welcome to AdShrtPro",
      slug: "welcome-to-adshrtpro",
      content: "Welcome to AdShrtPro, the ultimate URL shortening platform with earning features!",
      excerpt: "Get started with AdShrtPro today.",
      isPublished: true,
      createdAt: new Date(),
    }).onConflictDoNothing();

    // Create an extra blog post
    await db.insert(schema.blogPosts).values({
      id: randomUUID(),
      title: "How to earn with AdShrtPro",
      slug: "how-to-earn-with-adshrtpro",
      content: "Learn different ways to earn by shortening links, completing tasks, and referring friends.",
      excerpt: "Earning tips for AdShrtPro users.",
      isPublished: true,
      createdAt: new Date(),
    }).onConflictDoNothing();

    // Create sample announcement
    console.log("Creating sample announcement...");
    await db.insert(schema.announcements).values({
      id: randomUUID(),
      message: "Welcome to AdShrtPro! Start shortening URLs and earning today.",
      type: "info",
      isActive: true,
      createdAt: new Date(),
    }).onConflictDoNothing();

    // Create sample task
    console.log("Creating sample task...");
    await db.insert(schema.tasks).values({
      id: randomUUID(),
      title: "Follow us on Twitter",
      description: "Follow @AdShrtPro on Twitter for updates",
      instructions: "1. Follow our Twitter account\n2. Take a screenshot\n3. Submit the proof",
      rewardUsd: "0.05",
      proofType: "screenshot",
      isActive: true,
      createdAt: new Date(),
    }).onConflictDoNothing();

    // Create a sample user for idrisaloma120@gmail.com with some links and a referral code
    console.log("Creating sample user idrisaloma120@gmail.com and some links...");
    const idrisPassword = await bcrypt.hash("idris1234", 10);
    const idrisId = randomUUID();

    await db.insert(schema.users).values({
      id: idrisId,
      email: "idrisaloma120@gmail.com",
      password: idrisPassword,
      isAdmin: false,
      emailVerified: true,
      referralCode: "IDRIS001",
      createdAt: new Date(),
    }).onConflictDoNothing();

    await db.insert(schema.userBalances).values({
      id: randomUUID(),
      userId: idrisId,
      balanceUsd: "0.00",
      totalEarned: "0.00",
      totalWithdrawn: "0.00",
    }).onConflictDoNothing();

    // Create a couple of sample links for Idris
    await db.insert(schema.links).values({
      id: randomUUID(),
      originalUrl: "https://example.com/welcome",
      shortCode: "IDRIS1",
      userId: idrisId,
      creatorIp: null,
      expiresAt: null,
      isDisabled: false,
      isBanned: false,
      createdAt: new Date(),
    }).onConflictDoNothing();

    await db.insert(schema.links).values({
      id: randomUUID(),
      originalUrl: "https://example.com/offers",
      shortCode: "IDRIS2",
      userId: idrisId,
      creatorIp: null,
      expiresAt: null,
      isDisabled: false,
      isBanned: false,
      createdAt: new Date(),
    }).onConflictDoNothing();

    console.log("✅ Database seeded successfully!");
    console.log("");
    console.log("📧 Admin credentials:");
    console.log("   Email: admin@adshrtpro.com");
    console.log("   Password: admin123");
    console.log("");
    console.log("⚠️  Remember to change the admin password after first login!");
    
  } catch (error) {
    console.error("❌ Seed error:", error);
    throw error;
  } finally {
    await client.end();
  }
}

seed().catch(console.error);
