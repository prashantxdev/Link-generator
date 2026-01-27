import { v4 as uuidv4 } from "uuid";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

/**
 * Generate a unique slug from title
 */
export function generateSlug(title: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `hub-${timestamp}-${random}`;
}

/**
 * Generate UUID
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Sanitize HTML input
 */
export function sanitizeHtml(dirty: string): string {
  const window = new JSDOM("").window;
  const purify = DOMPurify(window);
  return purify.sanitize(dirty);
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    return "";
  }
}

/**
 * Get visitor country from IP address
 * @param ip IP address
 * @returns Country code or null
 */
export async function getCountryFromIP(ip: string): Promise<string | null> {
  try {
    // Skip for localhost
    if (ip === "127.0.0.1" || ip === "localhost" || ip.startsWith("::1")) {
      return "US"; // Default for development
    }

    // Remove IPv6 prefix if present
    const cleanIp = ip.includes(":") ? ip.split(":").pop() : ip;

    const response = await fetch(`https://ipapi.co/${cleanIp}/json/`, {
      timeout: 5000,
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.country_code || null;
  } catch (error) {
    console.error("Error fetching country from IP:", error);
    return null;
  }
}

/**
 * Detect device type from user agent
 */
export function detectDeviceType(
  userAgent: string,
): "mobile" | "tablet" | "desktop" {
  if (/android/i.test(userAgent)) {
    if (/mobile/i.test(userAgent)) {
      return "mobile";
    }
    return "tablet";
  }

  if (/ip(hone|od|ad)/i.test(userAgent)) {
    return "mobile";
  }

  if (/tablet/i.test(userAgent) || /ipad/i.test(userAgent)) {
    return "tablet";
  }

  if (/windows phone|blackberry/i.test(userAgent)) {
    return "mobile";
  }

  return "desktop";
}

/**
 * Extract IP from request
 */
export function getClientIp(req: any): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket?.remoteAddress ||
    "unknown"
  );
}

/**
 * Format date to ISO string
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Parse pagination params
 */
export function parsePagination(
  page?: string | number,
  limit?: string | number,
) {
  const p = Math.max(1, parseInt(String(page || 1), 10));
  const l = Math.min(100, Math.max(1, parseInt(String(limit || 20), 10)));
  const offset = (p - 1) * l;

  return { page: p, limit: l, offset };
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Convert date range to SQL query
 */
export function getDateRange(period: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case "24h":
      start.setHours(start.getHours() - 24);
      break;
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "30d":
      start.setDate(start.getDate() - 30);
      break;
    case "90d":
      start.setDate(start.getDate() - 90);
      break;
    default:
      start.setDate(start.getDate() - 7); // Default to 7 days
  }

  return { start, end };
}
