import { Router } from "express";
import { HubService } from "../services/HubService";
import { LinkService } from "../services/LinkService";
import { RuleService } from "../services/RuleService";
import { AnalyticsService } from "../services/AnalyticsService";
import { ruleEngine } from "../rules-engine";
import {
  getClientIp,
  detectDeviceType,
  getCountryFromIP,
} from "../utils/helpers";
import { Response, Request } from "express";
import { VisitorContext } from "../types";

const router = Router();

/**
 * GET /api/public/hub/:slug
 * Get a public hub with evaluated rules and prioritized links
 * NO authentication required
 */
router.get("/hub/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    // Get hub by slug
    const hub = await HubService.getHubBySlug(slug);

    if (!hub) {
      return res.status(404).json({ error: "Hub not found or not public" });
    }

    // Get all links and rules
    const allLinks = await LinkService.getHubLinks(hub.id, true);
    const allRules = await RuleService.getHubRules(hub.id, true);

    // Build visitor context
    const ip = getClientIp(req);
    const userAgent = req.headers["user-agent"] || "";
    const deviceType = detectDeviceType(userAgent);
    const referrer = req.headers["referer"] as string | undefined;

    let country: string | undefined;
    try {
      country = (await getCountryFromIP(ip)) || undefined;
    } catch (error) {
      console.error("Error getting country from IP:", error);
    }

    const visitorContext: VisitorContext = {
      ip,
      country,
      deviceType,
      userAgent,
      referrer,
    };

    // Evaluate rules to get prioritized links
    const prioritizedLinks = await ruleEngine.evaluateLinkOrder(
      hub.id,
      visitorContext,
      allLinks,
      allRules,
    );

    // Track hub view event
    await AnalyticsService.trackEvent(hub.id, visitorContext);

    // Increment hub view count
    await HubService.incrementViewCount(hub.id);

    res.status(200).json({
      hub: {
        id: hub.id,
        slug: hub.slug,
        title: hub.title,
        description: hub.description,
        theme: hub.theme,
        viewCount: hub.view_count,
      },
      links: prioritizedLinks,
      metadata: {
        ip,
        country,
        deviceType,
        ruleCount: allRules.length,
      },
    });
  } catch (error: any) {
    console.error("Error getting public hub:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/public/hub/:slug/track-click
 * Track a link click
 * NO authentication required
 */
router.post("/hub/:slug/track-click", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { linkId } = req.body;

    if (!linkId) {
      return res.status(400).json({ error: "linkId is required" });
    }

    // Get hub
    const hub = await HubService.getHubBySlug(slug);

    if (!hub) {
      return res.status(404).json({ error: "Hub not found" });
    }

    // Verify link belongs to hub
    const link = await LinkService.getLinkById(linkId);
    if (!link || link.hub_id !== hub.id) {
      return res.status(404).json({ error: "Link not found in this hub" });
    }

    // Build visitor context
    const ip = getClientIp(req);
    const userAgent = req.headers["user-agent"] || "";
    const deviceType = detectDeviceType(userAgent);
    const referrer = req.headers["referer"] as string | undefined;

    let country: string | undefined;
    try {
      country = (await getCountryFromIP(ip)) || undefined;
    } catch (error) {
      console.error("Error getting country from IP:", error);
    }

    const visitorContext: VisitorContext = {
      ip,
      country,
      deviceType,
      userAgent,
      referrer,
    };

    // Track click event
    await AnalyticsService.trackEvent(hub.id, visitorContext, linkId);

    // Increment link click count
    await LinkService.incrementClickCount(linkId);

    res.status(200).json({ message: "Click tracked successfully" });
  } catch (error: any) {
    console.error("Error tracking click:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
