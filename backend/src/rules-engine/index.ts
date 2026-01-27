import { Link, Rule, VisitorContext } from "../types";
import { query } from "../config/database";

/**
 * Rule Engine - Core intelligence for evaluating rules and prioritizing links
 */

class RuleEngine {
  /**
   * Main entry point: Evaluate all rules for a hub and return prioritized links
   * @param hubId Hub ID
   * @param visitorContext Visitor device, location, time context
   * @param allLinks All active links in the hub
   * @param allRules All active rules in the hub
   * @returns Links in priority order
   */
  public async evaluateLinkOrder(
    hubId: string,
    visitorContext: VisitorContext,
    allLinks: Link[],
    allRules: Rule[],
  ): Promise<Link[]> {
    // Sort rules by priority (higher priority first)
    const sortedRules = allRules
      .filter((r) => r.is_active)
      .sort((a, b) => b.priority - a.priority);

    // Collect prioritized link IDs in order
    const prioritizedLinkIds: Set<string> = new Set();
    const prioritizedLinkOrder: string[] = [];

    for (const rule of sortedRules) {
      const matchingLinkIds = await this.evaluateRule(
        rule,
        visitorContext,
        hubId,
      );

      // Add new links to the prioritized list
      for (const linkId of matchingLinkIds) {
        if (!prioritizedLinkIds.has(linkId)) {
          prioritizedLinkIds.add(linkId);
          prioritizedLinkOrder.push(linkId);
        }
      }
    }

    // Build result: prioritized links first, then remaining links by display_order
    const result: Link[] = [];

    // Add prioritized links
    for (const linkId of prioritizedLinkOrder) {
      const link = allLinks.find((l) => l.id === linkId);
      if (link) {
        result.push(link);
      }
    }

    // Add remaining links by display_order
    const remaining = allLinks
      .filter((l) => !prioritizedLinkIds.has(l.id))
      .sort((a, b) => a.display_order - b.display_order);
    result.push(...remaining);

    return result;
  }

  /**
   * Evaluate a single rule
   * @param rule Rule to evaluate
   * @param visitorContext Visitor context
   * @param hubId Hub ID (for performance rule queries)
   * @returns Array of link IDs that match the rule
   */
  private async evaluateRule(
    rule: Rule,
    visitorContext: VisitorContext,
    hubId: string,
  ): Promise<string[]> {
    switch (rule.rule_type) {
      case "time":
        return this.evaluateTimeRule(rule, visitorContext);
      case "device":
        return this.evaluateDeviceRule(rule, visitorContext);
      case "location":
        return this.evaluateLocationRule(rule, visitorContext);
      case "performance":
        return await this.evaluatePerformanceRule(rule, hubId);
      default:
        return [];
    }
  }

  /**
   * TIME-BASED RULE EVALUATION
   * Shows specific links during certain hours/days
   * Example: Show support link 9-5 Mon-Fri
   */
  private evaluateTimeRule(
    rule: Rule,
    visitorContext: VisitorContext,
  ): string[] {
    const config = rule.rule_config as any;
    const timeRanges = config.timeRanges || [];

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

    for (const range of timeRanges) {
      // Parse start and end times (format: "09:00", "17:00")
      const [startHour, startMin] = range.start.split(":").map(Number);
      const [endHour, endMin] = range.end.split(":").map(Number);

      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;
      const currentTime = currentHours * 60 + currentMinutes;

      // Check if today is in the allowed days
      const allowedDays = range.days || [0, 1, 2, 3, 4, 5, 6]; // Default: all days
      if (!allowedDays.includes(currentDay)) {
        continue;
      }

      // Check if current time is in range
      let timeMatches = false;
      if (startTime <= endTime) {
        // Normal range (e.g., 09:00 - 17:00)
        timeMatches = currentTime >= startTime && currentTime < endTime;
      } else {
        // Wrap-around range (e.g., 22:00 - 06:00)
        timeMatches = currentTime >= startTime || currentTime < endTime;
      }

      if (timeMatches && range.link_ids) {
        return range.link_ids;
      }
    }

    return [];
  }

  /**
   * DEVICE-BASED RULE EVALUATION
   * Shows different links based on device type (mobile, tablet, desktop)
   */
  private evaluateDeviceRule(
    rule: Rule,
    visitorContext: VisitorContext,
  ): string[] {
    const config = rule.rule_config as any;
    const deviceMappings = config.deviceMappings || {};

    const device = visitorContext.deviceType || "desktop";
    return deviceMappings[device] || [];
  }

  /**
   * LOCATION-BASED RULE EVALUATION
   * Shows specific links to users in certain countries
   */
  private evaluateLocationRule(
    rule: Rule,
    visitorContext: VisitorContext,
  ): string[] {
    const config = rule.rule_config as any;
    const countries = config.countries || [];

    if (!visitorContext.country) {
      return [];
    }

    if (countries.includes(visitorContext.country)) {
      return config.link_ids || [];
    }

    return [];
  }

  /**
   * PERFORMANCE-BASED RULE EVALUATION
   * Auto-promotes top performing links (most clicked) to the top
   */
  private async evaluatePerformanceRule(
    rule: Rule,
    hubId: string,
  ): Promise<string[]> {
    const config = rule.rule_config as any;
    const topPercentage = config.topPercentage || 30;
    const timeWindow = config.timeWindow || "7d";

    try {
      // Get time window start date
      const now = new Date();
      let startDate = new Date();

      switch (timeWindow) {
        case "24h":
          startDate.setHours(startDate.getHours() - 24);
          break;
        case "7d":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(startDate.getDate() - 30);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      // Query for top clicked links
      const result = await query(
        `
        SELECT link_id, COUNT(*) as click_count
        FROM analytics
        WHERE hub_id = $1 AND link_id IS NOT NULL AND clicked_at >= $2
        GROUP BY link_id
        ORDER BY click_count DESC
        `,
        [hubId, startDate.toISOString()],
      );

      if (result.rows.length === 0) {
        return [];
      }

      // Get total clicks
      const totalClicks = result.rows.reduce(
        (sum, row) => sum + parseInt(row.click_count),
        0,
      );
      const threshold = (totalClicks * topPercentage) / 100;

      // Return top links that make up topPercentage
      let cumulativeClicks = 0;
      const topLinkIds: string[] = [];

      for (const row of result.rows) {
        cumulativeClicks += parseInt(row.click_count);
        topLinkIds.push(row.link_id);
        if (cumulativeClicks >= threshold) {
          break;
        }
      }

      return topLinkIds;
    } catch (error) {
      console.error("Error evaluating performance rule:", error);
      return [];
    }
  }
}

export const ruleEngine = new RuleEngine();
export default ruleEngine;
