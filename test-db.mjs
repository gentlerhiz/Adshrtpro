// Test script to verify database and API connectivity
import { db } from "./src/lib/server/db.js";
import { users } from "./shared/schema.js";
import { eq } from "drizzle-orm";

async function testDatabaseConnection() {
  console.log("🔍 Testing database connection...");
  
  try {
    // Test 1: Basic database query
    console.log("\n1. Testing basic database query...");
    const allUsers = await db.select().from(users);
    console.log(`✅ Database connected! Found ${allUsers.length} users.`);
    
    // Test 2: Check for admin user
    console.log("\n2. Checking for admin user...");
    const adminUser = await db.select()
      .from(users)
      .where(eq(users.email, "admin@adshrtpro.com"))
      .limit(1);
    
    if (adminUser.length > 0) {
      console.log(`✅ Admin user exists:`, {
        id: adminUser[0].id,
        email: adminUser[0].email,
        isAdmin: adminUser[0].isAdmin,
        emailVerified: adminUser[0].emailVerified
      });
    } else {
      console.log(`⚠️ Admin user not found. You may need to run migrations or seed the database.`);
    }
    
    // Test 3: Check database tables
    console.log("\n3. Checking database structure...");
    const result = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log(`✅ Found ${result.rows.length} tables:`, result.rows.map(r => r.table_name));
    
    console.log("\n✅ All database tests passed!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Database test failed:", error);
    process.exit(1);
  }
}

testDatabaseConnection();
