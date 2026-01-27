import { query } from "../config/database";
import { Analytics, VisitorContext, AnalyticsSummary } from "../types";
import {
  generateId,
  calculatePercentage,
  getDateRange,
} from "../utils/helpers";

/**
 * Analytics Service - Track and retrieve analytics data
 */

export class AnalyticsService {
  /**
   * Track an analytics event (hub view or link click)
   */
  static async trackEvent(
    hubId: string,
    visitorContext: VisitorContext,
    linkId?: string,
  ): Promise<Analytics> {
    const result = await query(
      `
      INSERT INTO analytics (id, hub_id, link_id, visitor_ip, country, device_type, referrer, user_agent, clicked_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
      `,
      [
        generateId(),
        hubId,
        linkId || null,
        visitorContext.ip,
        visitorContext.country || null,
        visitorContext.deviceType || null,
        visitorContext.referrer || null,
        visitorContext.userAgent || null,
      ],
    );

    return result.rows[0];
  }

  /**
   * Get analytics summary for a hub
   */
  static async getHubAnalytics(
    hubId: string,
    period = "7d",
  ): Promise<AnalyticsSummary> {
    const { start, end } = getDateRange(period);

    // Total views (hub visits)
    const viewsResult = await query(
      `SELECT COUNT(*) as total FROM analytics WHERE hub_id = $1 AND clicked_at >= $2 AND clicked_at <= $3 AND link_id IS NULL`,
      [hubId, start.toISOString(), end.toISOString()],
    );

    // Total clicks (link clicks)
    const clicksResult = await query(
      `SELECT COUNT(*) as total FROM analytics WHERE hub_id = $1 AND clicked_at >= $2 AND clicked_at <= $3 AND link_id IS NOT NULL`,
      [hubId, start.toISOString(), end.toISOString()],
    );

    // Per-link analytics
    const linksResult = await query(
      `
      SELECT link_id, COUNT(*) as click_count
      FROM analytics
      WHERE hub_id = $1 AND clicked_at >= $2 AND clicked_at <= $3 AND link_id IS NOT NULL
      GROUP BY link_id
      ORDER BY click_count DESC
      LIMIT 10
      `,
      [hubId, start.toISOString(), end.toISOString()],
    );

    // Device breakdown
    const deviceResult = await query(
      `
      SELECT device_type, COUNT(*) as count
      FROM analytics
      WHERE hub_id = $1 AND clicked_at >= $2 AND clicked_at <= $3
      GROUP BY device_type
      `,
      [hubId, start.toISOString(), end.toISOString()],
    );

    // Country breakdown
    const countryResult = await query(
      `
      SELECT country, COUNT(*) as count
      FROM analytics
      WHERE hub_id = $1 AND clicked_at >= $2 AND clicked_at <= $3 AND country IS NOT NULL
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
      `,
      [hubId, start.toISOString(), end.toISOString()],
    );

    // Clicks over time (last 7 days, daily)
    const timeseriesResult = await query(
      `
      SELECT DATE(clicked_at) as date, COUNT(*) as count
      FROM analytics
      WHERE hub_id = $1 AND clicked_at >= $2 AND clicked_at <= $3
      GROUP BY DATE(clicked_at)
      ORDER BY DATE(clicked_at) ASC
      `,
      [hubId, start.toISOString(), end.toISOString()],
    );

    const totalClicks = parseInt(clicksResult.rows[0]?.total || 0);

    // Get link details for top links
    const linkIds = linksResult.rows.map((r) => r.link_id);
    const linkDetailsResult =
      linkIds.length > 0
        ? await query(
            `SELECT id, title, url FROM links WHERE id = ANY($1::uuid[])`,
            [[linkIds]],
          )
        : { rows: [] };

    const linkMap = Object.fromEntries(
      linkDetailsResult.rows.map((l) => [l.id, l]),
    );

    return {
      totalViews: parseInt(viewsResult.rows[0]?.total || 0),
      totalClicks,
      topLinks: linksResult.rows.map((row) => ({
        link: linkMap[row.link_id] || {
          id: row.link_id,
          title: "Unknown",
          url: "",
        },
        clickCount: parseInt(row.click_count),
        percentage: calculatePercentage(parseInt(row.click_count), totalClicks),
      })),
      deviceBreakdown: Object.fromEntries(
        deviceResult.rows.map((r) => [
          r.device_type || "unknown",
          parseInt(r.count),
        ]),
      ),
      countryBreakdown: Object.fromEntries(
        countryResult.rows.map((r) => [
          r.country || "unknown",
          parseInt(r.count),
        ]),
      ),
      clicksOverTime: timeseriesResult.rows.map((r) => ({
        date: r.date,
        count: parseInt(r.count),
      })),
    };
  }

  /**
   * Get per-link analytics
   */
  static async getLinkAnalytics(linkId: string, period = "7d") {
    const { start, end } = getDateRange(period);

    const result = await query(
      `
      SELECT COUNT(*) as total_clicks
      FROM analytics
      WHERE link_id = $1 AND clicked_at >= $2 AND clicked_at <= $3
      `,
      [linkId, start.toISOString(), end.toISOString()],
    );

    return {
      linkId,
      totalClicks: parseInt(result.rows[0]?.total_clicks || 0),
      period,
    };
  }

  /**
   * Get analytics in export format (CSV)
   */
  static async exportAnalytics(hubId: string, period = "7d"): Promise<string> {
    const { start, end } = getDateRange(period);

    const result = await query(
      `
      SELECT 
        clicked_at,
        link_id,
        visitor_ip,
        country,
        device_type,
        referrer
      FROM analytics
      WHERE hub_id = $1 AND clicked_at >= $2 AND clicked_at <= $3
      ORDER BY clicked_at DESC
      `,
      [hubId, start.toISOString(), end.toISOString()],
    );

    // Convert to CSV
    const headers = ["Date", "Link ID", "IP", "Country", "Device", "Referrer"];
    const rows = result.rows.map((row) => [
      new Date(row.clicked_at).toISOString(),
      row.link_id || "",
      row.visitor_ip || "",
      row.country || "",
      row.device_type || "",
      row.referrer || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    return csv;
  }
}

export default AnalyticsService;
