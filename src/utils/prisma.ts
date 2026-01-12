import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { Pool } from "pg";

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

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

// Create pg Pool with explicit SSL configuration for self-signed certificates
// The ssl object with rejectUnauthorized: false is crucial for self-signed certs
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // This allows self-signed certificates
  },
});

// Ensure pool handles errors gracefully
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export { prisma };