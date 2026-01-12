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

dotenv.config();

declare module "express-session" {
  interface SessionData {
    userId?: string;
    role?: "USER" | "ADMIN";
  }
}

const app = express();
const server = http.createServer(app);

// 🔥 Socket Init
initSocket(server);
app.set("trust proxy", 1);

// ====================
// 🔐 SECURITY MIDDLEWARE
// ====================
app.use(helmet());
const PgStore = pgSession(session);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(
  cors({
    origin: process.env.CLIENT_URL, // production me apna domain
    credentials: true,
  })
);

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
// 🧠 BODY + SESSION
// ====================
app.use(express.json());

app.use(
  session({
    store: new PgStore({ pool }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
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
// 🏠 ROOT
// ====================
app.get("/", (req, res) => {
  res.send("Aniicones Cafe Backend Running 🚀");
});

// ====================
// ❌ 404 HANDLER
// ====================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ====================
// ⚠️ ERROR HANDLER
// ====================
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(500).json({ message: "Internal Server Error" });
});

// ====================
// 🔥 START SERVER
// ====================
const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
