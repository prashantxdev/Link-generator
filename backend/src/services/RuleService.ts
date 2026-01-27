import { query } from "../config/database";
import { Rule, CreateRuleRequest, UpdateRuleRequest } from "../types";
import { generateId } from "../utils/helpers";

/**
 * Rule Service - Manage rules for hubs
 */

export class RuleService {
  /**
   * Create a new rule
   */
  static async createRule(
    hubId: string,
    data: CreateRuleRequest,
  ): Promise<Rule> {
    const result = await query(
      `
      INSERT INTO rules (id, hub_id, rule_type, rule_name, rule_config, priority, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW(), NOW())
      RETURNING *
      `,
      [
        generateId(),
        hubId,
        data.rule_type,
        data.rule_name || null,
        JSON.stringify(data.rule_config),
        data.priority || 0,
      ],
    );

    if (result.rows.length === 0) {
      throw new Error("Failed to create rule");
    }

    // Parse JSONB back to object
    const rule = result.rows[0];
    rule.rule_config =
      typeof rule.rule_config === "string"
        ? JSON.parse(rule.rule_config)
        : rule.rule_config;
    return rule;
  }

  /**
   * Get all rules for a hub
   */
  static async getHubRules(hubId: string, activeOnly = true): Promise<Rule[]> {
    const whereClause = activeOnly
      ? "WHERE hub_id = $1 AND is_active = TRUE"
      : "WHERE hub_id = $1";

    const result = await query(
      `
      SELECT * FROM rules
      ${whereClause}
      ORDER BY priority DESC, created_at ASC
      `,
      [hubId],
    );

    // Parse JSONB rule_config
    return result.rows.map((rule) => ({
      ...rule,
      rule_config:
        typeof rule.rule_config === "string"
          ? JSON.parse(rule.rule_config)
          : rule.rule_config,
    }));
  }

  /**
   * Get rule by ID
   */
  static async getRuleById(ruleId: string): Promise<Rule | null> {
    const result = await query("SELECT * FROM rules WHERE id = $1", [ruleId]);

    if (result.rows.length === 0) {
      return null;
    }

    const rule = result.rows[0];
    rule.rule_config =
      typeof rule.rule_config === "string"
        ? JSON.parse(rule.rule_config)
        : rule.rule_config;
    return rule;
  }

  /**
   * Update rule
   */
  static async updateRule(
    ruleId: string,
    data: UpdateRuleRequest,
  ): Promise<Rule> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.rule_name !== undefined) {
      updates.push(`rule_name = $${paramIndex}`);
      params.push(data.rule_name);
      paramIndex++;
    }

    if (data.rule_config !== undefined) {
      updates.push(`rule_config = $${paramIndex}`);
      params.push(JSON.stringify(data.rule_config));
      paramIndex++;
    }

    if (data.priority !== undefined) {
      updates.push(`priority = $${paramIndex}`);
      params.push(data.priority);
      paramIndex++;
    }

    if (data.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      params.push(data.is_active);
      paramIndex++;
    }

    updates.push(`updated_at = NOW()`);
    params.push(ruleId);

    if (updates.length === 1) {
      const result = await query("SELECT * FROM rules WHERE id = $1", [ruleId]);
      const rule = result.rows[0];
      rule.rule_config =
        typeof rule.rule_config === "string"
          ? JSON.parse(rule.rule_config)
          : rule.rule_config;
      return rule;
    }

    const result = await query(
      `UPDATE rules SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      params,
    );

    if (result.rows.length === 0) {
      throw new Error("Rule not found");
    }

    const rule = result.rows[0];
    rule.rule_config =
      typeof rule.rule_config === "string"
        ? JSON.parse(rule.rule_config)
        : rule.rule_config;
    return rule;
  }

  /**
   * Delete rule
   */
  static async deleteRule(ruleId: string): Promise<boolean> {
    const result = await query("DELETE FROM rules WHERE id = $1", [ruleId]);
    return result.rowCount! > 0;
  }

  /**
   * Verify rule belongs to hub
   */
  static async verifyRuleOwnership(
    ruleId: string,
    hubId: string,
  ): Promise<boolean> {
    const result = await query(
      "SELECT id FROM rules WHERE id = $1 AND hub_id = $2",
      [ruleId, hubId],
    );
    return result.rows.length > 0;
  }
}

export default RuleService;
