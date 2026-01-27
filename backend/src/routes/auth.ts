import { Router } from "express";
import { UserService } from "../services/UserService";
import {
  userValidationSchemas,
  validate,
  formatValidationErrors,
} from "../utils/validators";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";
import { Response } from "express";

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post("/register", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { error, value } = validate(userValidationSchemas.register, req.body);

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationErrors(error),
      });
    }

    const user = await UserService.register(value);
    const { accessToken, refreshToken } = UserService.generateTokens(
      user.id,
      user.email,
    );

    res.status(201).json({
      message: "User registered successfully",
      user,
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and get tokens
 */
router.post("/login", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { error, value } = validate(userValidationSchemas.login, req.body);

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationErrors(error),
      });
    }

    const user = await UserService.authenticate(value.email, value.password);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const { accessToken, refreshToken } = UserService.generateTokens(
      user.id,
      user.email,
    );

    res.status(200).json({
      message: "Logged in successfully",
      user,
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get(
  "/me",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await UserService.getUserById(req.userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.status(200).json({ user });
    } catch (error: any) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * POST /api/auth/logout
 * Logout (token invalidation handled on frontend)
 */
router.post(
  "/logout",
  authenticateToken,
  (req: AuthenticatedRequest, res: Response) => {
    res.status(200).json({ message: "Logged out successfully" });
  },
);

export default router;
