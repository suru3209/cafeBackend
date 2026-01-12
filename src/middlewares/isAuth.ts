import { Request, Response, NextFunction } from "express";

/**
 * Check if user is authenticated (session based)
 */
export const isAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};

/**
 * Check if user is ADMIN
 * (isAuth must run before this)
 */
export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session || req.session.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
};
