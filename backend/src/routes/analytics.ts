import { Router } from "express";
import { AnalyticsService } from "../services/AnalyticsService";
import { HubService } from "../services/HubService";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";
import { Response } from "express";

const router = Router();

/**
 * GET /api/hubs/:hubId/analytics
 * Get analytics summary for a hub
 */
router.get(
  "/:hubId/analytics",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { hubId } = req.params;
      const period = (req.query.period as string) || "7d";

      const hub = await HubService.getHubById(hubId);
      if (!hub) {
        return res.status(404).json({ error: "Hub not found" });
      }

      const owns = await HubService.verifyHubOwnership(hubId, req.userId);
      if (!owns) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const analytics = await AnalyticsService.getHubAnalytics(hubId, period);

      res.status(200).json({ analytics, period });
    } catch (error: any) {
      console.error("Get analytics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * GET /api/links/:linkId/analytics
 * Get analytics for a specific link
 */
router.get(
  "/links/:linkId",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { linkId } = req.params;
      const period = (req.query.period as string) || "7d";

      const analytics = await AnalyticsService.getLinkAnalytics(linkId, period);

      res.status(200).json({ analytics, period });
    } catch (error: any) {
      console.error("Get link analytics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * GET /api/hubs/:hubId/analytics/export
 * Export analytics as CSV
 */
router.get(
  "/:hubId/analytics/export",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { hubId } = req.params;
      const period = (req.query.period as string) || "7d";
      const format = (req.query.format as string) || "csv";

      const hub = await HubService.getHubById(hubId);
      if (!hub) {
        return res.status(404).json({ error: "Hub not found" });
      }

      const owns = await HubService.verifyHubOwnership(hubId, req.userId);
      if (!owns) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (format === "csv") {
        const csv = await AnalyticsService.exportAnalytics(hubId, period);

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="analytics-${hubId}-${period}.csv"`,
        );
        res.status(200).send(csv);
      } else {
        const analytics = await AnalyticsService.getHubAnalytics(hubId, period);

        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="analytics-${hubId}-${period}.json"`,
        );
        res.status(200).json(analytics);
      }
    } catch (error: any) {
      console.error("Export analytics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
