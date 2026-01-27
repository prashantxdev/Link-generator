import { Router } from "express";
import { HubService } from "../services/HubService";
import { LinkService } from "../services/LinkService";
import { RuleService } from "../services/RuleService";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";
import {
  hubValidationSchemas,
  validate,
  formatValidationErrors,
} from "../utils/validators";
import { Response } from "express";

const router = Router();

/**
 * POST /api/hubs
 * Create a new hub
 */
router.post(
  "/",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { error, value } = validate(hubValidationSchemas.create, req.body);

      if (error) {
        return res.status(400).json({
          error: "Validation failed",
          details: formatValidationErrors(error),
        });
      }

      const hub = await HubService.createHub(req.userId, value);

      res.status(201).json({
        message: "Hub created successfully",
        hub,
      });
    } catch (error: any) {
      console.error("Create hub error:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * GET /api/hubs
 * List user's hubs with pagination
 */
router.get(
  "/",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await HubService.getUserHubs(req.userId, page, limit);

      res.status(200).json(result);
    } catch (error: any) {
      console.error("List hubs error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * GET /api/hubs/:id
 * Get hub details with links and rules
 */
router.get(
  "/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const hub = await HubService.getHubById(req.params.id);

      if (!hub) {
        return res.status(404).json({ error: "Hub not found" });
      }

      // Verify ownership
      const owns = await HubService.verifyHubOwnership(hub.id, req.userId);
      if (!owns) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const links = await LinkService.getHubLinks(hub.id, false);
      const rules = await RuleService.getHubRules(hub.id, false);

      res.status(200).json({
        hub,
        links,
        rules,
      });
    } catch (error: any) {
      console.error("Get hub error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * PUT /api/hubs/:id
 * Update hub
 */
router.put(
  "/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { error, value } = validate(hubValidationSchemas.update, req.body);

      if (error) {
        return res.status(400).json({
          error: "Validation failed",
          details: formatValidationErrors(error),
        });
      }

      const hub = await HubService.getHubById(req.params.id);

      if (!hub) {
        return res.status(404).json({ error: "Hub not found" });
      }

      const owns = await HubService.verifyHubOwnership(hub.id, req.userId);
      if (!owns) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const updatedHub = await HubService.updateHub(req.params.id, value);

      res.status(200).json({
        message: "Hub updated successfully",
        hub: updatedHub,
      });
    } catch (error: any) {
      console.error("Update hub error:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * DELETE /api/hubs/:id
 * Delete hub (cascades to links and rules)
 */
router.delete(
  "/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const hub = await HubService.getHubById(req.params.id);

      if (!hub) {
        return res.status(404).json({ error: "Hub not found" });
      }

      const owns = await HubService.verifyHubOwnership(hub.id, req.userId);
      if (!owns) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      await HubService.deleteHub(req.params.id);

      res.status(200).json({ message: "Hub deleted successfully" });
    } catch (error: any) {
      console.error("Delete hub error:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

export default router;
