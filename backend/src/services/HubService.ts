import { query } from "../config/database";
import { LinkHub, Link, CreateHubRequest, UpdateHubRequest } from "../types";
import { generateId, generateSlug, parsePagination } from "../utils/helpers";

/**
 * Hub Service - Manage link hubs
 */

export class HubService {
  /**
   * Create a new hub
   */
  static async createHub(
    userId: string,
    data: CreateHubRequest,
  ): Promise<LinkHub> {
    const id = generateId();
    const slug = generateSlug(data.title);

    const result = await query(
      `
      INSERT INTO link_hubs (id, user_id, slug, title, description, theme, is_active, view_count, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, TRUE, 0, NOW(), NOW())
      RETURNING *
      `,
      [
        id,
        userId,
        slug,
        data.title,
        data.description || null,
        data.theme || "green",
      ],
    );

    if (result.rows.length === 0) {
      throw new Error("Failed to create hub");
    }

    return result.rows[0];
  }

  /**
   * Get hub by ID
   */
  static async getHubById(hubId: string): Promise<LinkHub | null> {
    const result = await query("SELECT * FROM link_hubs WHERE id = $1", [
      hubId,
    ]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get hub by slug (public)
   */
  static async getHubBySlug(slug: string): Promise<LinkHub | null> {
    const result = await query(
      "SELECT * FROM link_hubs WHERE slug = $1 AND is_active = TRUE",
      [slug],
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get user's hubs with pagination
   */
  static async getUserHubs(userId: string, page?: number, limit?: number) {
    const { offset, limit: l, page: p } = parsePagination(page, limit);

    // Get total count
    const countResult = await query(
      "SELECT COUNT(*) as total FROM link_hubs WHERE user_id = $1",
      [userId],
    );
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const result = await query(
      `
      SELECT * FROM link_hubs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [userId, l, offset],
    );

    return {
      data: result.rows,
      pagination: {
        page: p,
        limit: l,
        total,
        pages: Math.ceil(total / l),
      },
    };
  }

  /**
   * Update hub
   */
  static async updateHub(
    hubId: string,
    data: UpdateHubRequest,
  ): Promise<LinkHub> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      params.push(data.title);
      paramIndex++;
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(data.description);
      paramIndex++;
    }

    if (data.theme !== undefined) {
      updates.push(`theme = $${paramIndex}`);
      params.push(data.theme);
      paramIndex++;
    }

    if (data.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      params.push(data.is_active);
      paramIndex++;
    }

    updates.push(`updated_at = NOW()`);
    params.push(hubId);

    if (updates.length === 1) {
      // Only updated_at, no actual changes
      const result = await query("SELECT * FROM link_hubs WHERE id = $1", [
        hubId,
      ]);
      return result.rows[0];
    }

    const result = await query(
      `UPDATE link_hubs SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      params,
    );

    if (result.rows.length === 0) {
      throw new Error("Hub not found");
    }

    return result.rows[0];
  }

  /**
   * Delete hub
   */
  static async deleteHub(hubId: string): Promise<boolean> {
    const result = await query("DELETE FROM link_hubs WHERE id = $1", [hubId]);
    return result.rowCount! > 0;
  }

  /**
   * Increment hub view count
   */
  static async incrementViewCount(hubId: string): Promise<void> {
    await query(
      "UPDATE link_hubs SET view_count = view_count + 1 WHERE id = $1",
      [hubId],
    );
  }

  /**
   * Verify hub ownership
   */
  static async verifyHubOwnership(
    hubId: string,
    userId: string,
  ): Promise<boolean> {
    const result = await query(
      "SELECT id FROM link_hubs WHERE id = $1 AND user_id = $2",
      [hubId, userId],
    );
    return result.rows.length > 0;
  }
}

export default HubService;
