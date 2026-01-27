import axios, { AxiosInstance } from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export interface LinkHub {
  id: string;
  user_id: string;
  title: string;
  description: string;
  slug: string;
  view_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Link {
  id: string;
  hub_id: string;
  title: string;
  url: string;
  display_order: number;
  click_count: number;
  created_at: string;
}

export interface Rule {
  id: string;
  hub_id: string;
  rule_type: "time" | "device" | "location" | "performance";
  priority: number;
  rule_config: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor to attach token
    this.client.interceptors.request.use((config) => {
      const token = Cookies.get("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      },
    );
  }

  // Auth
  async register(
    email: string,
    username: string,
    password: string,
  ): Promise<User> {
    const response = await this.client.post<User>("/auth/register", {
      email,
      username,
      password,
    });
    return response.data;
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const response = await this.client.post<AuthTokens>("/auth/login", {
      email,
      password,
    });
    const { access_token, refresh_token } = response.data;
    Cookies.set("access_token", access_token);
    Cookies.set("refresh_token", refresh_token);
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await this.client.get<User>("/auth/me");
    return response.data;
  }

  async logout(): Promise<void> {
    await this.client.post("/auth/logout");
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
  }

  // Hubs
  async getHubs(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: LinkHub[]; total: number }> {
    const response = await this.client.get<{ data: LinkHub[]; total: number }>(
      "/hubs",
      {
        params: { page, limit },
      },
    );
    return response.data;
  }

  async getHub(id: string): Promise<LinkHub> {
    const response = await this.client.get<LinkHub>(`/hubs/${id}`);
    return response.data;
  }

  async createHub(data: {
    title: string;
    description: string;
    is_public: boolean;
  }): Promise<LinkHub> {
    const response = await this.client.post<LinkHub>("/hubs", data);
    return response.data;
  }

  async updateHub(
    id: string,
    data: {
      title?: string;
      description?: string;
      is_public?: boolean;
    },
  ): Promise<LinkHub> {
    const response = await this.client.put<LinkHub>(`/hubs/${id}`, data);
    return response.data;
  }

  async deleteHub(id: string): Promise<void> {
    await this.client.delete(`/hubs/${id}`);
  }

  // Links
  async getLinks(hubId: string): Promise<Link[]> {
    const response = await this.client.get<Link[]>(`/hubs/${hubId}/links`);
    return response.data;
  }

  async createLink(
    hubId: string,
    data: {
      title: string;
      url: string;
    },
  ): Promise<Link> {
    const response = await this.client.post<Link>(`/hubs/${hubId}/links`, data);
    return response.data;
  }

  async updateLink(
    hubId: string,
    linkId: string,
    data: {
      title?: string;
      url?: string;
    },
  ): Promise<Link> {
    const response = await this.client.put<Link>(
      `/hubs/${hubId}/links/${linkId}`,
      data,
    );
    return response.data;
  }

  async deleteLink(hubId: string, linkId: string): Promise<void> {
    await this.client.delete(`/hubs/${hubId}/links/${linkId}`);
  }

  async reorderLinks(
    hubId: string,
    links: { id: string; display_order: number }[],
  ): Promise<void> {
    await this.client.post(`/hubs/${hubId}/links/reorder`, { links });
  }

  // Rules
  async getRules(hubId: string): Promise<Rule[]> {
    const response = await this.client.get<Rule[]>(`/hubs/${hubId}/rules`);
    return response.data;
  }

  async createRule(
    hubId: string,
    data: {
      rule_type: string;
      priority: number;
      rule_config: Record<string, any>;
    },
  ): Promise<Rule> {
    const response = await this.client.post<Rule>(`/hubs/${hubId}/rules`, data);
    return response.data;
  }

  async updateRule(
    hubId: string,
    ruleId: string,
    data: {
      priority?: number;
      rule_config?: Record<string, any>;
      is_active?: boolean;
    },
  ): Promise<Rule> {
    const response = await this.client.put<Rule>(
      `/hubs/${hubId}/rules/${ruleId}`,
      data,
    );
    return response.data;
  }

  async deleteRule(hubId: string, ruleId: string): Promise<void> {
    await this.client.delete(`/hubs/${hubId}/rules/${ruleId}`);
  }

  // Analytics
  async getAnalytics(
    hubId: string,
    timeWindow: "24h" | "7d" | "30d" | "90d" = "7d",
  ): Promise<any> {
    const response = await this.client.get(`/hubs/${hubId}/analytics`, {
      params: { timeWindow },
    });
    return response.data;
  }

  async getLinkAnalytics(
    hubId: string,
    timeWindow: "24h" | "7d" | "30d" | "90d" = "7d",
  ): Promise<any> {
    const response = await this.client.get(`/hubs/${hubId}/analytics/links`, {
      params: { timeWindow },
    });
    return response.data;
  }

  async exportAnalytics(
    hubId: string,
    format: "csv" | "json",
    timeWindow: "24h" | "7d" | "30d" | "90d" = "7d",
  ): Promise<string> {
    const response = await this.client.get(`/hubs/${hubId}/analytics/export`, {
      params: { format, timeWindow },
      responseType: "blob",
    });
    return URL.createObjectURL(response.data);
  }

  // Public
  async getPublicHub(slug: string): Promise<any> {
    const response = await this.client.get(`/public/hub/${slug}`);
    return response.data;
  }
}

export const api = new ApiClient();
