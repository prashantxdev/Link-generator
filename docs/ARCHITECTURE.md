# Smart Link Hub Generator - Architecture Document

## System Overview

The Smart Link Hub Generator is a full-stack application that enables users to create dynamic, intelligent link hubs that adapt content based on rules like time, device, location, and performance metrics.

### Key Architectural Principles

1. **Scalability**: Stateless API, cached rule evaluations, indexed database queries
2. **Modularity**: Clear separation of concerns (rule engine, analytics, API layers)
3. **Extensibility**: Rule engine supports custom rule types without code changes
4. **Performance**: Heavy use of caching, pagination, and database indexing
5. **Security**: Input validation, rate limiting, CORS protection, JWT authentication

---

## System Components

### 1. Frontend (React/Next.js)

- **Dashboard**: User manages their hubs and links
- **Hub Editor**: Create/edit hubs with rules
- **Public Hub View**: Display links based on evaluated rules
- **Analytics Dashboard**: View performance metrics

### 2. Backend (Express.js)

- **REST API**: CRUD operations, public hub endpoint
- **Rule Engine**: Evaluates rules and returns prioritized links
- **Analytics Tracker**: Captures visitor events
- **Authentication**: JWT-based user auth
- **Validation Layer**: Input sanitization and validation

### 3. Database (PostgreSQL)

- **Hubs & Links**: Core content structure
- **Rules**: Flexible JSON-based rule configurations
- **Analytics**: Event log for tracking
- **Users**: User management

### 4. Rule Engine (Core Intelligence)

Located in `src/rules-engine/`, this evaluates multiple rule types:

```
Input: Hub ID, Visitor Context (device, location, time)
     ↓
Fetch all active rules for hub, sorted by priority
     ↓
For each rule type (in order):
  - Time rules: Check if current time matches rule config
  - Device rules: Check visitor device type
  - Location rules: Check visitor country
  - Performance rules: Analyze click history
     ↓
Build result set: Links in prioritized order
     ↓
Output: Reordered links list
```

---

## Data Flow

### Hub Visit Flow

1. User visits `example.com/hub/startup-links`
2. Backend loads hub + rules
3. Rule engine evaluates visitor context (device, IP → country, current time)
4. Links returned in priority order
5. Frontend displays hub with black background, green accent
6. User clicks link → Analytics event recorded
7. Link click count incremented

### Rule Configuration Example

```json
{
  "ruleType": "time",
  "ruleName": "Support Hours",
  "priority": 10,
  "ruleConfig": {
    "timeRanges": [
      {
        "name": "Business Hours",
        "start": "09:00",
        "end": "17:00",
        "days": [1, 2, 3, 4, 5],
        "linkIds": ["uuid-support", "uuid-help"]
      },
      {
        "name": "After Hours",
        "start": "17:01",
        "end": "08:59",
        "days": [0, 1, 2, 3, 4, 5, 6],
        "linkIds": ["uuid-faq"]
      }
    ]
  }
}
```

---

## API Routes Structure

### Authentication

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout

### Hub Management

- `GET /api/hubs` - List user's hubs
- `POST /api/hubs` - Create hub
- `GET /api/hubs/:id` - Get hub details
- `PUT /api/hubs/:id` - Update hub
- `DELETE /api/hubs/:id` - Delete hub

### Links

- `GET /api/hubs/:hubId/links` - List hub's links
- `POST /api/hubs/:hubId/links` - Add link
- `PUT /api/links/:id` - Update link
- `DELETE /api/links/:id` - Delete link
- `POST /api/links/:id/reorder` - Reorder links

### Rules

- `GET /api/hubs/:hubId/rules` - List hub's rules
- `POST /api/hubs/:hubId/rules` - Create rule
- `PUT /api/rules/:id` - Update rule
- `DELETE /api/rules/:id` - Delete rule

### Public Hub (No Auth Required)

- `GET /api/public/hub/:slug` - Get hub with evaluated rules
- `POST /api/public/hub/:slug/track` - Track click event

### Analytics

- `GET /api/hubs/:hubId/analytics` - Get analytics summary
- `GET /api/hubs/:hubId/analytics/links` - Per-link analytics
- `GET /api/hubs/:hubId/analytics/export` - Export as CSV/JSON

---

## Rule Engine Design

### Rule Types

#### 1. Time-Based Rules

```javascript
{
  type: 'time',
  timeRanges: [
    { start: '09:00', end: '17:00', days: [1,2,3,4,5], linkIds: [...] }
  ]
}
// Evaluates: Is current time in any active range?
// If yes: Show specified links first
```

#### 2. Device-Based Rules

```javascript
{
  type: 'device',
  deviceMappings: {
    'mobile': ['uuid-mobile-link'],
    'tablet': ['uuid-tablet-link'],
    'desktop': ['uuid-desktop-link']
  }
}
// Evaluates: What device is visitor using?
// Maps visitor device to links
```

#### 3. Location-Based Rules

```javascript
{
  type: 'location',
  countries: ['US', 'CA', 'MX'],
  linkIds: ['uuid-na-link']
}
// Evaluates: Is visitor in listed countries?
// If yes: Show specified links with higher priority
```

#### 4. Performance-Based Rules

```javascript
{
  type: 'performance',
  topPercentage: 30,
  timeWindow: '7d'
}
// Evaluates: Which links got most clicks in last 7 days?
// Auto-promote top 30% to beginning of list
```

### Rule Evaluation Algorithm

```javascript
function evaluateRules(hubId, visitorContext) {
  const rules = getRulesByPriority(hubId);
  let allLinks = getHubLinks(hubId);
  let prioritizedLinkIds = [];

  for (const rule of rules) {
    if (!rule.isActive) continue;

    switch (rule.ruleType) {
      case "time":
        prioritizedLinkIds.push(...evaluateTimeRule(rule, visitorContext));
        break;
      case "device":
        prioritizedLinkIds.push(...evaluateDeviceRule(rule, visitorContext));
        break;
      case "location":
        prioritizedLinkIds.push(...evaluateLocationRule(rule, visitorContext));
        break;
      case "performance":
        prioritizedLinkIds.push(...evaluatePerformanceRule(rule, hubId));
        break;
    }
  }

  // Remove duplicates, preserving order
  prioritizedLinkIds = [...new Set(prioritizedLinkIds)];

  // Append remaining links that weren't in prioritized set
  const remaining = allLinks
    .filter((link) => !prioritizedLinkIds.includes(link.id))
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return reorderLinksByIds(
    [...prioritizedLinkIds, ...remaining.map((l) => l.id)],
    allLinks,
  );
}
```

---

## Caching Strategy

1. **Hub Cache** (5 min TTL)
   - Cache: Hub metadata + active rules
   - Invalidated on: hub/rule updates

2. **Rule Evaluation Cache** (1 min TTL)
   - Cache: Rule evaluation results per visitor context
   - Invalidated on: rule/analytics updates

3. **Analytics Cache** (30 sec TTL)
   - Cache: Click counts, performance rankings
   - Flushed asynchronously to DB

---

## Security Measures

1. **Input Validation**: All inputs validated with Joi/Zod
2. **Rate Limiting**: 100 requests/min per IP (public), 500/min (auth)
3. **JWT Auth**: Tokens expire in 24 hours, refresh tokens in 30 days
4. **CORS**: Whitelist frontend domain
5. **SQL Injection**: Use parameterized queries (TypeORM/Prisma)
6. **XSS Protection**: DOMPurify on frontend, sanitize output
7. **HTTPS**: Enforce in production

---

## Performance Considerations

1. **Database Queries**:
   - Index on hub_id, link_id, clicked_at for analytics
   - Pagination for large datasets (default: 50 items/page)

2. **API Response Times**:
   - Get hub with rules: <100ms (cached)
   - Track event: <50ms (async write)
   - Analytics summary: <200ms (aggregated)

3. **Frontend Optimization**:
   - Code splitting with React.lazy
   - Image lazy loading
   - Responsive images

---

## Deployment Architecture

### Production Stack

- **Frontend**: Vercel (Next.js)
- **Backend**: Railway or Render (Express + Node)
- **Database**: Managed PostgreSQL (Supabase, Railway, Heroku Postgres)
- **CDN**: Cloudflare
- **Monitoring**: Sentry + LogRocket

### Environment Variables

**Backend (.env)**

```
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-secret-key
JWT_EXPIRE=24h
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100
GEO_IP_API_KEY=your-ip-geo-key (optional)
```

---

## Testing Strategy

1. **Unit Tests**: Rule engine, validators, utilities (Jest)
2. **Integration Tests**: API routes with test database
3. **E2E Tests**: Critical user flows (Cypress/Playwright)

---

## Next Steps

1. ✅ Architecture designed
2. ⏳ Backend APIs (Express, models, routes)
3. ⏳ Frontend UI (React/Next.js)
4. ⏳ Rule engine implementation
5. ⏳ Analytics dashboard
