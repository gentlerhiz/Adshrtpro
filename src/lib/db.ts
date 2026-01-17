import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// Get connection string from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Remove any schema parameter from connection string if present (Prisma-specific)
const cleanConnectionString = connectionString.split('?')[0];

// Create postgres client with connection pooling optimized for serverless
const client = postgres(cleanConnectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  max_lifetime: 60 * 30, // 30 minutes
  onnotice: () => {}, // Suppress notices
});

// Create drizzle instance
export const db = drizzle(client, { schema });

export { schema };
