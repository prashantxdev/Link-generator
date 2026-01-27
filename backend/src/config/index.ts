import dotenv from "dotenv";

dotenv.config();

export const config = {
  // Server
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),

  // Database
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgresql://postgres:password@localhost:5432/smart_link_hub",

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "your-super-secret-key",
  JWT_EXPIRE: process.env.JWT_EXPIRE || "24h",
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || "30d",

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",

  // Rate Limiting
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || "60000", 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),

  // APIs
  GEO_IP_API: process.env.GEO_IP_API || "https://ipapi.co",

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
};

export default config;
