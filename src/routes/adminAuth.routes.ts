import { Router } from "express";
import {prisma} from "../utils/prisma";
import bcrypt from "bcrypt";
import { isAuth } from "../middlewares/isAuth";

const router = Router();

// ADMIN LOGIN WITH SECRET CODE
router.post("/login", async (req, res) => {
  try {
    const { email, password, adminCode } = req.body;

    // basic validation
    if (!email || !password || !adminCode) {
      return res.status(400).json({
        message: "Email, password and admin code are required",
      });
    }

    // 🔐 Check admin secret code
    if (adminCode !== process.env.ADMIN_SECRET) {
      return res.status(403).json({
        message: "Invalid admin secret code",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 🔐 Role check
    if (user.role !== "ADMIN") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ Create admin session
    req.session.userId = user.id;
    req.session.role = user.role;

    res.json({
      success: true,
      admin: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Admin login failed" });
  }
});

/* =========================
   ADMIN SIGNUP (SECURE)
========================= */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, secret } = req.body;

    // 🔐 Secret check
    if (secret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: "Invalid admin secret" });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Admin already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: "ADMIN",
      },
    });

    // 🔐 create session
    req.session.userId = admin.id;
    req.session.role = admin.role;

    res.status(201).json({
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Admin signup failed" });
  }
});

router.get("/me", isAuth, async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ user: null });

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({ user: null });
    }

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//Logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Failed to logout" });
    }

    res.clearCookie("aniicones.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.json({ success: true });
  });
});

export default router;
