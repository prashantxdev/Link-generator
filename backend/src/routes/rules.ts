import { Router } from "express";
import { RuleService } from "../services/RuleService";
import { HubService } from "../services/HubService";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";
import {
  ruleValidationSchemas,
  validate,
  formatValidationErrors,
} from "../utils/validators";
import { Response } from "express";

const router = Router({ mergeParams: true });

/**
 * POST /api/hubs/:hubId/rules
 * Create a rule for a hub
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

      const hub = await HubService.getHubById(hubId);
      if (!hub) {
        return res.status(404).json({ error: "Hub not found" });
      }

      const owns = await HubService.verifyHubOwnership(hubId, req.userId);
      if (!owns) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const { error, value } = validate(ruleValidationSchemas.create, req.body);

      if (error) {
        return res.status(400).json({
          error: "Validation failed",
          details: formatValidationErrors(error),
        });
      }

      const rule = await RuleService.createRule(hubId, value);

      res.status(201).json({
        message: "Rule created successfully",
        rule,
      });
    } catch (error: any) {
      console.error("Create rule error:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * GET /api/hubs/:hubId/rules
 * Get all rules for a hub
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

      const rules = await RuleService.getHubRules(hubId, false);

      res.status(200).json({ rules });
    } catch (error: any) {
      console.error("Get rules error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * PUT /api/rules/:id
 * Update a rule
 */
router.put(
  "/:ruleId",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { hubId, ruleId } = req.params;

      const hub = await HubService.getHubById(hubId);
      if (!hub) {
        return res.status(404).json({ error: "Hub not found" });
      }

      const owns = await HubService.verifyHubOwnership(hubId, req.userId);
      if (!owns) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const ruleOwns = await RuleService.verifyRuleOwnership(ruleId, hubId);
      if (!ruleOwns) {
        return res.status(404).json({ error: "Rule not found" });
      }

      const { error, value } = validate(ruleValidationSchemas.update, req.body);

      if (error) {
        return res.status(400).json({
          error: "Validation failed",
          details: formatValidationErrors(error),
        });
      }

      const rule = await RuleService.updateRule(ruleId, value);

      res.status(200).json({
        message: "Rule updated successfully",
        rule,
      });
    } catch (error: any) {
      console.error("Update rule error:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * DELETE /api/rules/:id
 * Delete a rule
 */
router.delete(
  "/:ruleId",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { hubId, ruleId } = req.params;

      const hub = await HubService.getHubById(hubId);
      if (!hub) {
        return res.status(404).json({ error: "Hub not found" });
      }

      const owns = await HubService.verifyHubOwnership(hubId, req.userId);
      if (!owns) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const ruleOwns = await RuleService.verifyRuleOwnership(ruleId, hubId);
      if (!ruleOwns) {
        return res.status(404).json({ error: "Rule not found" });
      }

      await RuleService.deleteRule(ruleId);

      res.status(200).json({ message: "Rule deleted successfully" });
    } catch (error: any) {
      console.error("Delete rule error:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

export default router;
