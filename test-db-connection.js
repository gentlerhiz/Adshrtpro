import postgres from 'postgres';

const connectionString = "postgresql://postgres:postgres@localhost:5432/Adshrtpro";

console.log("Testing database connection...");
console.log("Connection string:", connectionString);

const sql = postgres(connectionString, {
  max: 1,
  connect_timeout: 5,
  onnotice: () => {},
});

try {
  const result = await sql`SELECT version()`;
  console.log("✅ Database connection successful!");
  console.log("PostgreSQL version:", result[0].version);
  
  // Test if database exists
  const dbCheck = await sql`SELECT datname FROM pg_database WHERE datname = 'Adshrtpro'`;
  if (dbCheck.length > 0) {
    console.log("✅ Database 'Adshrtpro' exists");
  } else {
    console.log("❌ Database 'Adshrtpro' does not exist");
  }
  
  // List tables
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  
  if (tables.length > 0) {
    console.log(`\n✅ Found ${tables.length} tables:`);
    tables.forEach(t => console.log(`  - ${t.table_name}`));
  } else {
    console.log("\n⚠️ No tables found in database. Run migrations with: npm run db:push");
  }
  
  await sql.end();
  process.exit(0);
} catch (error) {
  console.error("❌ Database connection failed:", error.message);
  await sql.end();
  process.exit(1);
}
