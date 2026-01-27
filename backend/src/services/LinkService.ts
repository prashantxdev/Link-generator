import { query } from "../config/database";
import { Link, CreateLinkRequest, UpdateLinkRequest } from "../types";
import { generateId } from "../utils/helpers";

/**
 * Link Service - Manage links within hubs
 */

export class LinkService {
  /**
   * Create a new link
   */
  static async createLink(
    hubId: string,
    data: CreateLinkRequest,
  ): Promise<Link> {
    // Get the next display order
    const orderResult = await query(
      "SELECT MAX(display_order) as max_order FROM links WHERE hub_id = $1",
      [hubId],
    );

    const nextOrder = (orderResult.rows[0]?.max_order || 0) + 1;

    const result = await query(
      `
      INSERT INTO links (id, hub_id, title, url, description, display_order, icon_url, is_active, click_count, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, 0, NOW(), NOW())
      RETURNING *
      `,
      [
        generateId(),
        hubId,
        data.title,
        data.url,
        data.description || null,
        nextOrder,
        data.icon_url || null,
      ],
    );

    if (result.rows.length === 0) {
      throw new Error("Failed to create link");
    }

    return result.rows[0];
  }

  /**
   * Get all links for a hub
   */
  static async getHubLinks(hubId: string, activeOnly = true): Promise<Link[]> {
    const whereClause = activeOnly
      ? "WHERE hub_id = $1 AND is_active = TRUE"
      : "WHERE hub_id = $1";

    const result = await query(
      `
      SELECT * FROM links
      ${whereClause}
      ORDER BY display_order ASC
      `,
      [hubId],
    );

    return result.rows;
  }

  /**
   * Get link by ID
   */
  static async getLinkById(linkId: string): Promise<Link | null> {
    const result = await query("SELECT * FROM links WHERE id = $1", [linkId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Update link
   */
  static async updateLink(
    linkId: string,
    data: UpdateLinkRequest,
  ): Promise<Link> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      params.push(data.title);
      paramIndex++;
    }

    if (data.url !== undefined) {
      updates.push(`url = $${paramIndex}`);
      params.push(data.url);
      paramIndex++;
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(data.description);
      paramIndex++;
    }

    if (data.icon_url !== undefined) {
      updates.push(`icon_url = $${paramIndex}`);
      params.push(data.icon_url);
      paramIndex++;
    }

    if (data.display_order !== undefined) {
      updates.push(`display_order = $${paramIndex}`);
      params.push(data.display_order);
      paramIndex++;
    }

    if (data.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      params.push(data.is_active);
      paramIndex++;
    }

    updates.push(`updated_at = NOW()`);
    params.push(linkId);

    if (updates.length === 1) {
      const result = await query("SELECT * FROM links WHERE id = $1", [linkId]);
      return result.rows[0];
    }

    const result = await query(
      `UPDATE links SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      params,
    );

    if (result.rows.length === 0) {
      throw new Error("Link not found");
    }

    return result.rows[0];
  }

  /**
   * Delete link
   */
  static async deleteLink(linkId: string): Promise<boolean> {
    const result = await query("DELETE FROM links WHERE id = $1", [linkId]);
    return result.rowCount! > 0;
  }

  /**
   * Reorder links
   */
  static async reorderLinks(hubId: string, linkOrder: string[]): Promise<void> {
    const client = await require("../config/database").getClient();

    try {
      await client.query("BEGIN");

      for (let i = 0; i < linkOrder.length; i++) {
        await client.query(
          "UPDATE links SET display_order = $1 WHERE id = $2 AND hub_id = $3",
          [i + 1, linkOrder[i], hubId],
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Increment link click count
   */
  static async incrementClickCount(linkId: string): Promise<void> {
    await query(
      "UPDATE links SET click_count = click_count + 1 WHERE id = $1",
      [linkId],
    );
  }

  /**
   * Verify link belongs to hub
   */
  static async verifyLinkOwnership(
    linkId: string,
    hubId: string,
  ): Promise<boolean> {
    const result = await query(
      "SELECT id FROM links WHERE id = $1 AND hub_id = $2",
      [linkId, hubId],
    );
    return result.rows.length > 0;
  }
}

export default LinkService;
