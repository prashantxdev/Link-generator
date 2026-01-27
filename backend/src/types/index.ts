/**
 * Type definitions for database models
 */

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name?: string;
  created_at: Date;
  updated_at: Date;
}

export interface LinkHub {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description?: string;
  theme: "green" | "blue" | "red";
  is_active: boolean;
  view_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface Link {
  id: string;
  hub_id: string;
  title: string;
  url: string;
  description?: string;
  display_order: number;
  icon_url?: string;
  is_active: boolean;
  click_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface Rule {
  id: string;
  hub_id: string;
  rule_type: "time" | "device" | "location" | "performance";
  rule_name?: string;
  rule_config: Record<string, any>;
  priority: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Analytics {
  id: string;
  hub_id: string;
  link_id?: string;
  visitor_ip?: string;
  country?: string;
  device_type?: string;
  referrer?: string;
  user_agent?: string;
  clicked_at: Date;
}

/**
 * Request/Response types
 */

export interface CreateUserRequest {
  email: string;
  password: string;
  full_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, "password_hash">;
}

export interface CreateHubRequest {
  title: string;
  description?: string;
  theme?: "green" | "blue" | "red";
}

export interface UpdateHubRequest {
  title?: string;
  description?: string;
  theme?: "green" | "blue" | "red";
  is_active?: boolean;
}

export interface CreateLinkRequest {
  title: string;
  url: string;
  description?: string;
  icon_url?: string;
}

export interface UpdateLinkRequest {
  title?: string;
  url?: string;
  description?: string;
  icon_url?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface CreateRuleRequest {
  rule_type: "time" | "device" | "location" | "performance";
  rule_name?: string;
  rule_config: Record<string, any>;
  priority?: number;
}

export interface UpdateRuleRequest {
  rule_name?: string;
  rule_config?: Record<string, any>;
  priority?: number;
  is_active?: boolean;
}

export interface VisitorContext {
  ip: string;
  country?: string;
  deviceType?: string;
  userAgent?: string;
  referrer?: string;
}

export interface HubWithLinks extends LinkHub {
  links: Link[];
  rules: Rule[];
}

export interface AnalyticsSummary {
  totalViews: number;
  totalClicks: number;
  topLinks: Array<{ link: Link; clickCount: number; percentage: number }>;
  deviceBreakdown: Record<string, number>;
  countryBreakdown: Record<string, number>;
  clicksOverTime: Array<{ date: string; count: number }>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
