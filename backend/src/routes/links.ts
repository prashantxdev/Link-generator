import { Router } from "express";
import { LinkService } from "../services/LinkService";
import { HubService } from "../services/HubService";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";
import {
  linkValidationSchemas,
  validate,
  formatValidationErrors,
} from "../utils/validators";
import { Response } from "express";

const router = Router({ mergeParams: true });

/**
 * POST /api/hubs/:hubId/links
 * Create a link in a hub
 */
router.post(
  "/",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { hubId } = req.params;

      // Verify hub ownership
      const hub = await HubService.getHubById(hubId);
      if (!hub) {
        return res.status(404).json({ error: "Hub not found" });
      }

      const owns = await HubService.verifyHubOwnership(hubId, req.userId);
      if (!owns) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const { error, value } = validate(linkValidationSchemas.create, req.body);

      if (error) {
        return res.status(400).json({
          error: "Validation failed",
          details: formatValidationErrors(error),
        });
      }

      const link = await LinkService.createLink(hubId, value);

      res.status(201).json({
        message: "Link created successfully",
        link,
      });
    } catch (error: any) {
      console.error("Create link error:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * GET /api/hubs/:hubId/links
 * Get all links in a hub
 */
router.get(
  "/",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { hubId } = req.params;

      const hub = await HubService.getHubById(hubId);
      if (!hub) {
        return res.status(404).json({ error: "Hub not found" });
      }

      const owns = await HubService.verifyHubOwnership(hubId, req.userId);
      if (!owns) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const links = await LinkService.getHubLinks(hubId, false);

      res.status(200).json({ links });
    } catch (error: any) {
      console.error("Get links error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * PUT /api/links/:id
 * Update a link
 */
router.put(
  "/:linkId",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { hubId, linkId } = req.params;

      const hub = await HubService.getHubById(hubId);
      if (!hub) {
        return res.status(404).json({ error: "Hub not found" });
      }

      const owns = await HubService.verifyHubOwnership(hubId, req.userId);
      if (!owns) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const linkOwns = await LinkService.verifyLinkOwnership(linkId, hubId);
      if (!linkOwns) {
        return res.status(404).json({ error: "Link not found" });
      }

      const { error, value } = validate(linkValidationSchemas.update, req.body);

      if (error) {
        return res.status(400).json({
          error: "Validation failed",
          details: formatValidationErrors(error),
        });
      }

      const link = await LinkService.updateLink(linkId, value);

      res.status(200).json({
        message: "Link updated successfully",
        link,
      });
    } catch (error: any) {
      console.error("Update link error:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * DELETE /api/links/:id
 * Delete a link
 */
router.delete(
  "/:linkId",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { hubId, linkId } = req.params;

      const hub = await HubService.getHubById(hubId);
      if (!hub) {
        return res.status(404).json({ error: "Hub not found" });
      }

      const owns = await HubService.verifyHubOwnership(hubId, req.userId);
      if (!owns) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const linkOwns = await LinkService.verifyLinkOwnership(linkId, hubId);
      if (!linkOwns) {
        return res.status(404).json({ error: "Link not found" });
      }

      await LinkService.deleteLink(linkId);

      res.status(200).json({ message: "Link deleted successfully" });
    } catch (error: any) {
      console.error("Delete link error:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * POST /api/hubs/:hubId/links/reorder
 * Reorder links
 */
router.post(
  "/reorder",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { hubId } = req.params;
      const { linkOrder } = req.body;

      if (!Array.isArray(linkOrder)) {
        return res
          .status(400)
          .json({ error: "linkOrder must be an array of link IDs" });
      }

      const hub = await HubService.getHubById(hubId);
      if (!hub) {
        return res.status(404).json({ error: "Hub not found" });
      }

      const owns = await HubService.verifyHubOwnership(hubId, req.userId);
      if (!owns) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      await LinkService.reorderLinks(hubId, linkOrder);

      res.status(200).json({ message: "Links reordered successfully" });
    } catch (error: any) {
      console.error("Reorder links error:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

export default router;
