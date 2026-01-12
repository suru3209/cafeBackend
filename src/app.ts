import express from "express";
import cors from "cors";
import pgSession from "connect-pg-simple";
import session from "express-session";
import pg from "pg";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import http from "http";

import authRoutes from "./routes/auth.routes";
import categoryRoutes from "./routes/category.routes";
import menuRoutes from "./routes/menu.routes";
import userRoutes from "./routes/user.routes";
import orderRoutes from "./routes/order.routes";
import invoiceRoutes from "./routes/invoice.routes";
import addressRoutes from "./routes/address.routes";

import adminAuthroutes from "./routes/adminAuth.routes";
import adminOrderRoutes from "./routes/adminOrder.routes";
import adminProductRoutes from "./routes/adminProduct.routes";

import { initSocket } from "./socket";
import { prisma } from "./utils/prisma";

dotenv.config();

// Environment detection
const isProduction = process.env.NODE_ENV === "production";
const isRailway = !!(
  process.env.RAILWAY_ENVIRONMENT ||
  process.env.RAILWAY_ENVIRONMENT_NAME ||
  process.env.RAILWAY_PROJECT_ID
);

// Validate required environment variables
const requiredEnvVars = ["DATABASE_URL", "SESSION_SECRET"];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  console.error("❌ Missing required environment variables:", missingEnvVars.join(", "));
  if (isProduction) {
    console.error("⚠️  Application may not work correctly without these variables.");
  }
}

declare module "express-session" {
  interface SessionData {
    userId?: string;
    role?: "USER" | "ADMIN";
  }
}

const app = express();
const server = http.createServer(app);

// ====================
// 🧠 BODY
// ====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 Socket Init
initSocket(server);
app.set("trust proxy", 1);

// ====================
// 🌍 CORS (Must be before helmet)
// ====================
// CORS configuration with fallback for Railway
const corsOrigin = process.env.CLIENT_URL || (isProduction ? false : "http://localhost:3000");

if (!corsOrigin && isProduction) {
  console.warn("⚠️  WARNING: CLIENT_URL not set in production. CORS may not work correctly.");
}

// Enhanced CORS configuration for Railway
// cors package automatically handles preflight OPTIONS requests
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// ====================
// 🔐 SECURITY
// ====================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

const PgStore = pgSession(session);

// Clean connection string and create pool with SSL config
let sessionConnectionString = process.env.DATABASE_URL || "";

// Remove any existing sslmode parameters from connection string
// We'll handle SSL through Pool config instead
try {
  const url = new URL(sessionConnectionString);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("sslaccept");
  sessionConnectionString = url.toString();
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

const pool = new pg.Pool({
  connectionString: sessionConnectionString,
  ssl: sslConfig,
  // Railway-optimized settings
  max: 10, // Reduced for better connection management
  min: 1,
  idleTimeoutMillis: 60000, // Keep connections alive longer
  connectionTimeoutMillis: 20000, // Increased timeout for Railway (20 seconds)
});

// Enhanced error handling
pool.on("error", (err) => {
  console.error("Session store pool error:", err.message);
});

// Graceful shutdown for session pool
process.on("SIGINT", async () => {
  await pool.end();
});

process.on("SIGTERM", async () => {
  await pool.end();
});

// ====================
// 🚫 RATE LIMIT
// ====================
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

// ====================
// 🔑 SESSION
// ====================
app.use(
  session({
    store: new PgStore({ pool }),
    secret: process.env.SESSION_SECRET || "fallback-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax", // Railway needs 'none' for cross-origin
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// ====================
// 📁 STATIC FILES
// ====================
app.use("/uploads", express.static("uploads"));

// ====================
// 🚀 ROUTES
// ====================
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/user", userRoutes);
app.use("/api/invoice", invoiceRoutes);
app.use("/api/addresses", addressRoutes);

// ADMIN
app.use("/api/admin/auth", adminAuthroutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/products", adminProductRoutes);

// ====================
// 🏠 ROOT & HEALTH CHECK
// ====================
app.get("/", (req, res) => {
  res.json({ 
    message: "Aniicones Cafe Backend Running 🚀",
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint for Railway
app.get("/health", async (req, res) => {
  try {
    // Test database connection with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Database query timeout")), 10000)
    );
    
    await Promise.race([
      prisma.$queryRaw`SELECT 1 as health`,
      timeoutPromise
    ]);
    
    res.json({ 
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: "unhealthy",
      database: "disconnected",
      error: isProduction ? undefined : (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database status endpoint
app.get("/db-status", async (req, res) => {
  try {
    const { getDbStatus } = await import("./utils/prisma");
    const status = getDbStatus();
    
    // Try a quick query to verify actual connectivity
    let querySuccess = false;
    try {
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
      ]);
      querySuccess = true;
    } catch {
      querySuccess = false;
    }
    
    res.json({
      ...status,
      queryTest: querySuccess ? "success" : "failed",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

// ====================
// ❌ 404
// ====================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ====================
// ⚠️ ERROR HANDLER
// ====================
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Error:", err);
  
  // Don't leak error details in production
  const message = isProduction 
    ? "Internal Server Error" 
    : err.message || "Internal Server Error";
  
  res.status(err.status || 500).json({ 
    message,
    ...(isProduction ? {} : { stack: err.stack })
  });
});

// ====================
// 🔥 START SERVER
// ====================
const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${isProduction ? "Production" : "Development"}`);
  console.log(`🚂 Railway: ${isRailway ? "Yes" : "No"}`);
  if (corsOrigin) {
    console.log(`🌐 CORS Origin: ${corsOrigin}`);
  }
});
