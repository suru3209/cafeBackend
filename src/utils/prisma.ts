import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { Pool } from "pg";

// Connection status tracking
let dbConnectionStatus: "connecting" | "connected" | "disconnected" | "error" = "connecting";
let lastConnectionError: string | null = null;

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is not set");
  dbConnectionStatus = "error";
  lastConnectionError = "DATABASE_URL not set";
  throw new Error("DATABASE_URL environment variable is not set");
}

const isProduction = process.env.NODE_ENV === "production";
const isRailway = !!(
  process.env.RAILWAY_ENVIRONMENT ||
  process.env.RAILWAY_ENVIRONMENT_NAME ||
  process.env.RAILWAY_PROJECT_ID
);

console.log("🔌 Initializing database connection...");
console.log(`📍 Environment: ${isProduction ? "Production" : "Development"}`);
console.log(`🚂 Railway: ${isRailway ? "Yes" : "No"}`);

// Remove any existing sslmode parameters from connection string
try {
  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("sslaccept");
  connectionString = url.toString();
} catch {
  // If URL parsing fails, use original connection string
}

// Configure SSL based on environment
// Railway sometimes has certificate chain issues, so we allow self-signed for Railway
const sslConfig = isRailway
  ? { rejectUnauthorized: false } // Railway may have certificate chain issues
  : isProduction
  ? { rejectUnauthorized: true }
  : { rejectUnauthorized: false }; // Development only

// Create pg Pool with Railway-optimized settings
const pool = new Pool({
  connectionString,
  ssl: sslConfig,
  // Railway-optimized pool settings
  max: 5, // Reduced for Railway (better connection management)
  min: 0, // Start with 0, let pool grow as needed
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 30000, // 30 seconds for Railway
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Enhanced connection event handling
pool.on("error", (err, client) => {
  console.error("❌ Database pool error:", err.message);
  dbConnectionStatus = "error";
  lastConnectionError = err.message;
});

pool.on("connect", (client) => {
  console.log("✅ New database connection established");
  if (dbConnectionStatus !== "connected") {
    dbConnectionStatus = "connected";
    lastConnectionError = null;
  }
});

pool.on("acquire", () => {
  // Silent - too verbose
});

pool.on("remove", () => {
  // Silent - too verbose
});

// Connection test function with retry logic
async function testConnection(retries = 3, delay = 2000): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Testing database connection (attempt ${i + 1}/${retries})...`);
      
      const result = await Promise.race([
        pool.query("SELECT NOW() as current_time, version() as pg_version"),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Connection timeout")), 25000)
        )
      ]) as any;
      
      const time = result.rows[0]?.current_time;
      const version = result.rows[0]?.pg_version?.split(" ")[0] || "unknown";
      
      console.log("✅ Database connection test successful!");
      console.log(`   📅 Server time: ${time}`);
      console.log(`   🗄️  PostgreSQL version: ${version}`);
      if (connectionString) {
        const connInfo = connectionString.split("@")[1] || "hidden";
        console.log(`   🔗 Connection: ${connInfo}`);
      }
      
      dbConnectionStatus = "connected";
      lastConnectionError = null;
      return true;
    } catch (err: any) {
      const errorMsg = err.message || "Unknown error";
      console.error(`❌ Connection test failed (attempt ${i + 1}/${retries}):`, errorMsg);
      lastConnectionError = errorMsg;
      dbConnectionStatus = "error";
      
      if (i < retries - 1) {
        console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Exponential backoff
      }
    }
  }
  
  console.error("❌ All connection attempts failed!");
  dbConnectionStatus = "disconnected";
  return false;
}

// Test connection on startup (non-blocking)
testConnection().catch((err) => {
  console.error("❌ Fatal: Could not establish database connection:", err);
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ 
  adapter,
  log: isProduction ? ["error", "warn"] : ["error", "warn"],
});

// Export connection status getter
export const getDbStatus = () => ({
  status: dbConnectionStatus,
  error: lastConnectionError,
  pool: {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  }
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("🛑 Closing database connections...");
  dbConnectionStatus = "disconnected";
  await pool.end();
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("🛑 Closing database connections...");
  dbConnectionStatus = "disconnected";
  await pool.end();
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma };