import { query } from "../config/database";
import { User, CreateUserRequest } from "../types";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { generateId } from "../utils/helpers";

/**
 * User Service - Handle user authentication and management
 */

export class UserService {
  /**
   * Register a new user
   */
  static async register(
    data: CreateUserRequest,
  ): Promise<Omit<User, "password_hash">> {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const result = await query(
        `
        INSERT INTO users (id, email, password_hash, full_name)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, full_name, created_at, updated_at
        `,
        [generateId(), data.email, hashedPassword, data.full_name || null],
      );

      if (result.rows.length === 0) {
        throw new Error("Failed to create user");
      }

      return result.rows[0];
    } catch (error: any) {
      if (error.code === "23505") {
        throw new Error("Email already registered");
      }
      throw error;
    }
  }

  /**
   * Authenticate user by email and password
   */
  static async authenticate(
    email: string,
    password: string,
  ): Promise<Omit<User, "password_hash"> | null> {
    const result = await query(
      "SELECT id, email, password_hash, full_name, created_at, updated_at FROM users WHERE email = $1",
      [email],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return null;
    }

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get user by ID
   */
  static async getUserById(
    userId: string,
  ): Promise<Omit<User, "password_hash"> | null> {
    const result = await query(
      "SELECT id, email, full_name, created_at, updated_at FROM users WHERE id = $1",
      [userId],
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Generate JWT tokens
   */
  static generateTokens(userId: string, email: string) {
    const accessToken = jwt.sign({ id: userId, email }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRE,
    });

    const refreshToken = jwt.sign({ id: userId, email }, config.JWT_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRE,
    });

    return { accessToken, refreshToken };
  }
}

export default UserService;
