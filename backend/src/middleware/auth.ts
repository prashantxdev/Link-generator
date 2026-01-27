import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any;
}

/**
 * JWT authentication middleware
 */
export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    jwt.verify(token, config.JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        console.error("Token verification error:", err.message);
        return res.status(403).json({ error: "Invalid or expired token" });
      }

      req.userId = decoded.id;
      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Optional authentication middleware
 * Sets userId if valid token is provided, but doesn't fail if missing
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      jwt.verify(token, config.JWT_SECRET, (err: any, decoded: any) => {
        if (!err && decoded) {
          req.userId = decoded.id;
          req.user = decoded;
        }
        next();
      });
    } else {
      next();
    }
  } catch (error) {
    next();
  }
}
