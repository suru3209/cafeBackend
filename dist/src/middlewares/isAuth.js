"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.isAuth = void 0;
/**
 * Check if user is authenticated (session based)
 */
const isAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    next();
};
exports.isAuth = isAuth;
/**
 * Check if user is ADMIN
 * (isAuth must run before this)
 */
const isAdmin = (req, res, next) => {
    if (!req.session || req.session.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin only" });
    }
    next();
};
exports.isAdmin = isAdmin;
