# Backend Quick Reference

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration & database setup
│   ├── types/           # TypeScript type definitions
│   ├── services/        # Business logic (5 services)
│   ├── routes/          # API endpoints (6 route files)
│   ├── middleware/      # Auth, validation, error handling
│   ├── rules-engine/    # Intelligent rule evaluation
│   ├── utils/           # Helper functions & validators
│   ├── app.ts           # Express server setup
│   └── index.ts         # Entry point
├── database.sql         # Database schema
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript config
```

## Services Overview

| Service              | Purpose          | Key Methods                                                   |
| -------------------- | ---------------- | ------------------------------------------------------------- |
| **UserService**      | Auth & user mgmt | register, authenticate, generateTokens                        |
| **HubService**       | Hub management   | createHub, getHubById, getUserHubs, updateHub, deleteHub      |
| **LinkService**      | Link management  | createLink, getHubLinks, updateLink, deleteLink, reorderLinks |
| **RuleService**      | Rule management  | createRule, getHubRules, updateRule, deleteRule               |
| **AnalyticsService** | Event tracking   | trackEvent, getHubAnalytics, exportAnalytics                  |

## Database Tables

```sql
users
├── id (UUID)
├── email (UNIQUE)
├── password_hash
└── full_name

link_hubs
├── id (UUID)
├── user_id → users.id
├── slug (UNIQUE)
├── title, description, theme
├── is_active, view_count
└── timestamps

links
├── id (UUID)
├── hub_id → link_hubs.id
├── title, url, description
├── display_order, icon_url
├── is_active, click_count
└── timestamps

rules
├── id (UUID)
├── hub_id → link_hubs.id
├── rule_type (time/device/location/performance)
├── rule_name, rule_config (JSONB)
├── priority, is_active
└── timestamps

analytics
├── id (UUID)
├── hub_id → link_hubs.id
├── link_id → links.id (nullable)
├── visitor_ip, country, device_type
├── referrer, user_agent
└── clicked_at (timestamp)
```

## API Endpoints Cheat Sheet

### Auth (No Auth Required)

```
POST   /api/auth/register      - Register user
POST   /api/auth/login         - Login user
GET    /api/auth/me            - Get profile (requires token)
POST   /api/auth/logout        - Logout
```

### Hubs (Authenticated)

```
POST   /api/hubs               - Create hub
GET    /api/hubs               - List user's hubs
GET    /api/hubs/:id           - Get hub details
PUT    /api/hubs/:id           - Update hub
DELETE /api/hubs/:id           - Delete hub
```

### Links (Authenticated)

```
POST   /api/hubs/:hubId/links             - Create link
GET    /api/hubs/:hubId/links             - List links
PUT    /api/hubs/:hubId/links/:linkId     - Update link
DELETE /api/hubs/:hubId/links/:linkId     - Delete link
POST   /api/hubs/:hubId/links/reorder     - Reorder links
```

### Rules (Authenticated)

```
POST   /api/hubs/:hubId/rules             - Create rule
GET    /api/hubs/:hubId/rules             - List rules
PUT    /api/hubs/:hubId/rules/:ruleId     - Update rule
DELETE /api/hubs/:hubId/rules/:ruleId     - Delete rule
```

### Analytics (Authenticated)

```
GET    /api/hubs/:hubId/analytics         - Get analytics (period=7d)
GET    /api/hubs/:hubId/analytics/export  - Export as CSV/JSON
```

### Public (No Auth Required)

```
GET    /api/public/hub/:slug              - View public hub with rules applied
POST   /api/public/hub/:slug/track-click  - Track link click
```

## Rule Engine Logic

### Input

```typescript
{
  hubId: string,
  visitorContext: {
    ip: string,
    country?: string,
    deviceType?: 'mobile' | 'tablet' | 'desktop',
    userAgent?: string,
    referrer?: string
  },
  allLinks: Link[],
  allRules: Rule[]
}
```

### Process

1. Sort rules by priority (highest first)
2. For each rule:
   - Evaluate condition (time, device, location, or performance)
   - If matches, add matching link IDs to prioritized list
3. Return links in order: [prioritized] + [remaining by display_order]

### Rule Evaluation Methods

**Time Rules**

- Check current time against configured time ranges
- Match days of week (0-6)
- Support wrap-around times (22:00-06:00)

**Device Rules**

- Detect device from User-Agent (mobile/tablet/desktop)
- Map device type to specific links

**Location Rules**

- Geolocate IP to country (via ipapi.co)
- Match against configured country list

**Performance Rules**

- Query analytics for clicks in time window
- Auto-promote top N% of clicked links

## Environment Variables

```bash
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:pass@localhost:5432/smart_link_hub
JWT_SECRET=super-secret-key
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=30d
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100
GEO_IP_API=https://ipapi.co
LOG_LEVEL=debug
```

## Common Tasks

### Register User

```javascript
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "securePass123",
  "full_name": "John Doe"
}
// Returns: { user, accessToken, refreshToken }
```

### Create Hub with Rules

```javascript
// 1. Create hub
POST /api/hubs
{
  "title": "My Links",
  "description": "All my important links",
  "theme": "green"
}

// 2. Add links
POST /api/hubs/{hubId}/links
{
  "title": "GitHub",
  "url": "https://github.com",
  "description": "My source code"
}

// 3. Add time-based rule
POST /api/hubs/{hubId}/rules
{
  "rule_type": "time",
  "rule_name": "Support Hours",
  "priority": 10,
  "rule_config": {
    "timeRanges": [{
      "start": "09:00",
      "end": "17:00",
      "days": [1,2,3,4,5],
      "link_ids": ["uuid-1", "uuid-2"]
    }]
  }
}

// 4. View public hub
GET /api/public/hub/{slug}
```

### Export Analytics

```javascript
// CSV
GET /api/hubs/{hubId}/analytics/export?format=csv&period=7d

// JSON
GET /api/hubs/{hubId}/analytics/export?format=json&period=7d
```

## Error Codes

| Code | Meaning                              |
| ---- | ------------------------------------ |
| 200  | OK                                   |
| 201  | Created                              |
| 400  | Bad Request (validation error)       |
| 401  | Unauthorized (missing/invalid token) |
| 403  | Forbidden (no permission)            |
| 404  | Not Found                            |
| 409  | Conflict (duplicate key)             |
| 500  | Internal Server Error                |

## Authentication

All authenticated endpoints require:

```
Authorization: Bearer <accessToken>
```

Tokens expire after 24 hours. Refresh tokens last 30 days (refresh token endpoint not yet implemented, planned for phase 2).

## Rate Limiting

- **General**: 100 requests/min per IP
- **Auth**: 5 requests/15min per IP (stricter for security)

Response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1234567890
```

## Testing Checklist

- [ ] Register user
- [ ] Login user
- [ ] Create hub with valid theme
- [ ] Add multiple links
- [ ] Create time-based rule with valid hours
- [ ] Create device-based rule
- [ ] Create location-based rule
- [ ] Create performance-based rule
- [ ] Verify rule ordering by priority
- [ ] Get public hub (rule evaluation)
- [ ] Track click event
- [ ] Get analytics summary
- [ ] Export analytics (CSV & JSON)
- [ ] Update hub
- [ ] Reorder links
- [ ] Delete rule
- [ ] Delete link
- [ ] Delete hub (cascade)
- [ ] Verify ownership protection
- [ ] Test rate limiting
- [ ] Test validation errors

## Performance Optimization Opportunities

1. **Caching Rules** - Cache evaluated rules for 1 min per visitor context
2. **Analytics Buffer** - Batch analytics writes every 30 seconds
3. **Link Query Optimization** - Use ONLY needed columns
4. **Pagination** - Always paginate large result sets
5. **Index Analytics** - Consider partial indexes on is_active=true

## Next Phase Improvements

- [ ] Refresh token endpoint
- [ ] Password reset flow
- [ ] Email verification
- [ ] Rule caching with Redis
- [ ] Webhook system
- [ ] Custom rule engine plugins
- [ ] Rate limiting per user (not just IP)
- [ ] Audit logging
- [ ] API usage analytics
