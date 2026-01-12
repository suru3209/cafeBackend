import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { Pool } from "pg";

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const isProduction = process.env.NODE_ENV === "production";
const isRailway = process.env.RAILWAY_ENVIRONMENT === "production" || process.env.RAILWAY_ENVIRONMENT_NAME;

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
// Railway uses proper SSL certificates, so we only skip validation in development
const sslConfig = isProduction && !isRailway
  ? { rejectUnauthorized: true } // Production with proper certs
  : { rejectUnauthorized: false }; // Development/Railway (Railway handles SSL properly)

// Create pg Pool with optimized settings for Railway/production
const pool = new Pool({
  connectionString,
  ssl: sslConfig,
  // Railway/production optimized pool settings
  max: 20, // Maximum number of clients in the pool
  min: 2, // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Wait 10 seconds for connection (Railway needs more time)
  statement_timeout: 30000, // Query timeout
  query_timeout: 30000,
});

// Ensure pool handles errors gracefully
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

pool.on("connect", () => {
  console.log("Database connection established");
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ 
  adapter,
  log: isProduction ? ["error", "warn"] : ["query", "error", "warn"],
});

export { prisma };