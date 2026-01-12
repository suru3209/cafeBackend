import { Router } from "express";
import { prisma } from "../utils/prisma";
import bcrypt from "bcrypt";
import { isAuth } from "../middlewares/isAuth";
const router = Router();
//signup
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        //basic validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fileds are required" });
        }
        //check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res
                .status(409)
                .json({ message: "User already exists with this email" });
        }
        // Hash password
        const hashed = await bcrypt.hash(password, 10);
        // Create user
        const user = await prisma.user.create({
            data: { name, email, password: hashed },
        });
        // Create session
        req.session.userId = user.id;
        req.session.role = user.role;
        // Send safe response (no password)
        res.status(201).json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
//login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        //validation
        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "Email and password are required" });
        }
        //find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(400).json({ message: "Invalid credentials" });
        const match = await bcrypt.compare(password, user.password);
        if (!match)
            return res.status(400).json({ message: "Invalid credentials" });
        //Create session
        req.session.userId = user.id;
        req.session.role = user.role;
        //Safe response (NO password)
        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
//me
router.get("/me", isAuth, async (req, res) => {
    try {
        if (!req.session.userId)
            return res.status(401).json({ user: null });
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
            res.status(401).json({ user: null });
        }
        res.json({ user });
    }
    catch (error) {
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
//check-email
router.post("/check-email", async (req, res) => {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    res.json({ exists: !!user });
});
export default router;
