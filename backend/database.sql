-- Smart Link Hub Generator Database Schema
-- PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Link Hubs table (main entity)
CREATE TABLE IF NOT EXISTS link_hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  theme VARCHAR(50) DEFAULT 'green',
  is_active BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_theme CHECK (theme IN ('green', 'blue', 'red'))
);

-- Links table (individual links in a hub)
CREATE TABLE IF NOT EXISTS links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID NOT NULL REFERENCES link_hubs(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  url VARCHAR(2048) NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL,
  icon_url VARCHAR(2048),
  is_active BOOLEAN DEFAULT TRUE,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Rules table (flexible rule engine)
CREATE TABLE IF NOT EXISTS rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID NOT NULL REFERENCES link_hubs(id) ON DELETE CASCADE,
  rule_type VARCHAR(50) NOT NULL,
  rule_name VARCHAR(255),
  rule_config JSONB NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_rule_type CHECK (rule_type IN ('time', 'device', 'location', 'performance'))
);

-- Analytics table (event tracking)
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID NOT NULL REFERENCES link_hubs(id) ON DELETE CASCADE,
  link_id UUID REFERENCES links(id) ON DELETE SET NULL,
  visitor_ip VARCHAR(45),
  country VARCHAR(2),
  device_type VARCHAR(20),
  referrer VARCHAR(2048),
  user_agent TEXT,
  clicked_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_link_hubs_user_id ON link_hubs(user_id);
CREATE INDEX IF NOT EXISTS idx_link_hubs_slug ON link_hubs(slug);
CREATE INDEX IF NOT EXISTS idx_links_hub_id ON links(hub_id);
CREATE INDEX IF NOT EXISTS idx_rules_hub_id ON rules(hub_id);
CREATE INDEX IF NOT EXISTS idx_analytics_hub_id ON analytics(hub_id);
CREATE INDEX IF NOT EXISTS idx_analytics_link_id ON analytics(link_id);
CREATE INDEX IF NOT EXISTS idx_analytics_clicked_at ON analytics(clicked_at);
CREATE INDEX IF NOT EXISTS idx_analytics_country ON analytics(country);
CREATE INDEX IF NOT EXISTS idx_analytics_device_type ON analytics(device_type);

-- Example data
INSERT INTO users (email, password_hash, full_name) VALUES
  ('demo@example.com', '$2b$10$...', 'Demo User')
ON CONFLICT (email) DO NOTHING;

INSERT INTO link_hubs (user_id, slug, title, description, theme) VALUES
  ((SELECT id FROM users WHERE email = 'demo@example.com' LIMIT 1), 
   'startup-links', 
   'Startup Resources', 
   'All essential startup links in one place',
   'green')
ON CONFLICT (slug) DO NOTHING;

-- Sample links
INSERT INTO links (hub_id, title, url, description, display_order) VALUES
  ((SELECT id FROM link_hubs WHERE slug = 'startup-links' LIMIT 1),
   'Product Hunt',
   'https://producthunt.com',
   'Discover new products',
   1),
  ((SELECT id FROM link_hubs WHERE slug = 'startup-links' LIMIT 1),
   'Y Combinator',
   'https://ycombinator.com',
   'Startup accelerator',
   2)
ON CONFLICT DO NOTHING;
