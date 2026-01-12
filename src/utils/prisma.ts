import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { Pool } from "pg";

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const isProduction = process.env.NODE_ENV === "production";
const isRailway = !!(
  process.env.RAILWAY_ENVIRONMENT ||
  process.env.RAILWAY_ENVIRONMENT_NAME ||
  process.env.RAILWAY_PROJECT_ID
);

// Remove any existing sslmode parameters from connection string
// We'll handle SSL through Pool config instead
try {
  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("sslaccept");
  connectionString = url.toString();
} catch {
  // If URL parsing fails, use original connection string
}

// Configure SSL based on environment
// Railway requires SSL but with proper certificates
const sslConfig = isRailway
  ? { rejectUnauthorized: true } // Railway uses proper SSL certificates
  : isProduction
  ? { rejectUnauthorized: true }
  : { rejectUnauthorized: false }; // Development only

// Create pg Pool with Railway-optimized settings
const pool = new Pool({
  connectionString,
  ssl: sslConfig,
  // Railway-optimized pool settings
  max: 10, // Reduced for Railway (better connection management)
  min: 1, // Minimum connections
  idleTimeoutMillis: 60000, // Keep connections alive longer (60 seconds)
  connectionTimeoutMillis: 20000, // Increased timeout for Railway (20 seconds)
  // Remove statement_timeout and query_timeout from Pool config
  // These should be set per-query if needed
});

// Enhanced error handling for Railway
pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
  // Don't exit process, let pool handle reconnection
});

pool.on("connect", (client) => {
  console.log("Database connection established");
});

pool.on("acquire", (client) => {
  console.log("Client acquired from pool");
});

pool.on("remove", (client) => {
  console.log("Client removed from pool");
});

// Test connection on startup
pool.query("SELECT NOW()")
  .then(() => {
    console.log("✅ Database connection test successful");
  })
  .catch((err) => {
    console.error("❌ Database connection test failed:", err.message);
  });

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ 
  adapter,
  log: isProduction ? ["error", "warn"] : ["error", "warn"],
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Closing database connections...");
  await pool.end();
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Closing database connections...");
  await pool.end();
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma };