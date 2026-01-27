# Smart Link Hub Generator - API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <accessToken>
```

---

## Authentication Endpoints

### POST /auth/register

Register a new user.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "full_name": "John Doe"
}
```

**Response (201):**

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2024-01-25T10:00:00Z",
    "updated_at": "2024-01-25T10:00:00Z"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

### POST /auth/login

Authenticate and get tokens.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**

```json
{
  "message": "Logged in successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2024-01-25T10:00:00Z",
    "updated_at": "2024-01-25T10:00:00Z"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

### GET /auth/me

Get current user profile (requires authentication).

**Response (200):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2024-01-25T10:00:00Z",
    "updated_at": "2024-01-25T10:00:00Z"
  }
}
```

---

### POST /auth/logout

Logout user (requires authentication).

**Response (200):**

```json
{
  "message": "Logged out successfully"
}
```

---

## Hub Management Endpoints

### POST /hubs

Create a new link hub.

**Request:**

```json
{
  "title": "My Product Links",
  "description": "All important links in one place",
  "theme": "green"
}
```

**Response (201):**

```json
{
  "message": "Hub created successfully",
  "hub": {
    "id": "uuid",
    "user_id": "uuid",
    "slug": "hub-abc123def456",
    "title": "My Product Links",
    "description": "All important links in one place",
    "theme": "green",
    "is_active": true,
    "view_count": 0,
    "created_at": "2024-01-25T10:00:00Z",
    "updated_at": "2024-01-25T10:00:00Z"
  }
}
```

---

### GET /hubs

List user's hubs with pagination.

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)

**Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "hub-abc123def456",
      "title": "My Product Links",
      "description": "...",
      "theme": "green",
      "view_count": 42,
      "created_at": "2024-01-25T10:00:00Z",
      "updated_at": "2024-01-25T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

---

### GET /hubs/:id

Get hub details with all links and rules.

**Response (200):**

```json
{
  "hub": {
    "id": "uuid",
    "slug": "hub-abc123def456",
    "title": "My Product Links",
    "description": "...",
    "theme": "green",
    "view_count": 42,
    "created_at": "2024-01-25T10:00:00Z",
    "updated_at": "2024-01-25T10:00:00Z"
  },
  "links": [
    {
      "id": "uuid",
      "hub_id": "uuid",
      "title": "GitHub",
      "url": "https://github.com",
      "description": "Source code",
      "display_order": 1,
      "icon_url": "...",
      "is_active": true,
      "click_count": 10,
      "created_at": "2024-01-25T10:00:00Z",
      "updated_at": "2024-01-25T10:00:00Z"
    }
  ],
  "rules": [
    {
      "id": "uuid",
      "hub_id": "uuid",
      "rule_type": "time",
      "rule_name": "Business Hours",
      "rule_config": { "timeRanges": [...] },
      "priority": 10,
      "is_active": true,
      "created_at": "2024-01-25T10:00:00Z",
      "updated_at": "2024-01-25T10:00:00Z"
    }
  ]
}
```

---

### PUT /hubs/:id

Update hub.

**Request:**

```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "theme": "blue",
  "is_active": true
}
```

**Response (200):**

```json
{
  "message": "Hub updated successfully",
  "hub": { ... }
}
```

---

### DELETE /hubs/:id

Delete hub (cascades to all links and rules).

**Response (200):**

```json
{
  "message": "Hub deleted successfully"
}
```

---

## Link Endpoints

### POST /hubs/:hubId/links

Create a link in a hub.

**Request:**

```json
{
  "title": "GitHub",
  "url": "https://github.com",
  "description": "Source code repository",
  "icon_url": "https://github.com/favicon.ico"
}
```

**Response (201):**

```json
{
  "message": "Link created successfully",
  "link": {
    "id": "uuid",
    "hub_id": "uuid",
    "title": "GitHub",
    "url": "https://github.com",
    "description": "Source code repository",
    "display_order": 1,
    "icon_url": "...",
    "is_active": true,
    "click_count": 0,
    "created_at": "2024-01-25T10:00:00Z",
    "updated_at": "2024-01-25T10:00:00Z"
  }
}
```

---

### GET /hubs/:hubId/links

Get all links in a hub.

**Response (200):**

```json
{
  "links": [...]
}
```

---

### PUT /hubs/:hubId/links/:linkId

Update a link.

**Request:**

```json
{
  "title": "Updated Title",
  "url": "https://github.com",
  "display_order": 2,
  "is_active": true
}
```

**Response (200):**

```json
{
  "message": "Link updated successfully",
  "link": { ... }
}
```

---

### DELETE /hubs/:hubId/links/:linkId

Delete a link.

**Response (200):**

```json
{
  "message": "Link deleted successfully"
}
```

---

### POST /hubs/:hubId/links/reorder

Reorder links in a hub.

**Request:**

```json
{
  "linkOrder": ["uuid-1", "uuid-2", "uuid-3"]
}
```

**Response (200):**

```json
{
  "message": "Links reordered successfully"
}
```

---

## Rule Endpoints

### POST /hubs/:hubId/rules

Create a rule for a hub.

**Request (Time-based rule):**

```json
{
  "rule_type": "time",
  "rule_name": "Business Hours",
  "priority": 10,
  "rule_config": {
    "timeRanges": [
      {
        "name": "Weekday Business Hours",
        "start": "09:00",
        "end": "17:00",
        "days": [1, 2, 3, 4, 5],
        "link_ids": ["uuid-1", "uuid-2"]
      }
    ]
  }
}
```

**Request (Device-based rule):**

```json
{
  "rule_type": "device",
  "rule_name": "Mobile Optimization",
  "priority": 5,
  "rule_config": {
    "deviceMappings": {
      "mobile": ["uuid-mobile-link"],
      "tablet": ["uuid-tablet-link"],
      "desktop": ["uuid-desktop-link"]
    }
  }
}
```

**Request (Location-based rule):**

```json
{
  "rule_type": "location",
  "rule_name": "US Only",
  "priority": 8,
  "rule_config": {
    "countries": ["US", "CA"],
    "link_ids": ["uuid-1"]
  }
}
```

**Request (Performance-based rule):**

```json
{
  "rule_type": "performance",
  "rule_name": "Top Links",
  "priority": 1,
  "rule_config": {
    "topPercentage": 30,
    "timeWindow": "7d"
  }
}
```

**Response (201):**

```json
{
  "message": "Rule created successfully",
  "rule": {
    "id": "uuid",
    "hub_id": "uuid",
    "rule_type": "time",
    "rule_name": "Business Hours",
    "rule_config": { ... },
    "priority": 10,
    "is_active": true,
    "created_at": "2024-01-25T10:00:00Z",
    "updated_at": "2024-01-25T10:00:00Z"
  }
}
```

---

### GET /hubs/:hubId/rules

Get all rules for a hub.

**Response (200):**

```json
{
  "rules": [...]
}
```

---

### PUT /hubs/:hubId/rules/:ruleId

Update a rule.

**Request:**

```json
{
  "priority": 15,
  "is_active": false,
  "rule_config": { ... }
}
```

**Response (200):**

```json
{
  "message": "Rule updated successfully",
  "rule": { ... }
}
```

---

### DELETE /hubs/:hubId/rules/:ruleId

Delete a rule.

**Response (200):**

```json
{
  "message": "Rule deleted successfully"
}
```

---

## Analytics Endpoints

### GET /hubs/:hubId/analytics

Get analytics summary for a hub.

**Query Parameters:**

- `period` (string, default: '7d'): '24h', '7d', '30d', '90d'

**Response (200):**

```json
{
  "analytics": {
    "totalViews": 150,
    "totalClicks": 45,
    "topLinks": [
      {
        "link": {
          "id": "uuid",
          "title": "GitHub",
          "url": "https://github.com"
        },
        "clickCount": 25,
        "percentage": 56
      }
    ],
    "deviceBreakdown": {
      "mobile": 30,
      "tablet": 10,
      "desktop": 105
    },
    "countryBreakdown": {
      "US": 100,
      "GB": 30,
      "CA": 20
    },
    "clicksOverTime": [
      {
        "date": "2024-01-25",
        "count": 10
      }
    ]
  },
  "period": "7d"
}
```

---

### GET /hubs/:hubId/analytics/export

Export analytics data.

**Query Parameters:**

- `period` (string, default: '7d')
- `format` (string, default: 'csv'): 'csv' or 'json'

**Response (CSV):**

```
Date,Link ID,IP,Country,Device,Referrer
"2024-01-25T10:00:00Z","uuid-1","192.168.1.1","US","mobile",""
```

**Response (JSON):**

```json
{
  "totalViews": 150,
  "totalClicks": 45,
  ...
}
```

---

## Public Endpoints (NO Authentication Required)

### GET /public/hub/:slug

Get a public hub with evaluated rules.

**Response (200):**

```json
{
  "hub": {
    "id": "uuid",
    "slug": "hub-abc123",
    "title": "My Links",
    "description": "...",
    "theme": "green",
    "viewCount": 42
  },
  "links": [
    {
      "id": "uuid",
      "title": "GitHub (Mobile Optimized)",
      "url": "https://github.com",
      "description": "...",
      "display_order": 1,
      "icon_url": "...",
      "is_active": true,
      "click_count": 10
    }
  ],
  "metadata": {
    "ip": "192.168.1.1",
    "country": "US",
    "deviceType": "mobile",
    "ruleCount": 3
  }
}
```

---

### POST /public/hub/:slug/track-click

Track a link click.

**Request:**

```json
{
  "linkId": "uuid"
}
```

**Response (200):**

```json
{
  "message": "Click tracked successfully"
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Validation failed",
  "details": {
    "email": ["Invalid email format"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

### 401 Unauthorized

```json
{
  "error": "Access token required"
}
```

### 403 Forbidden

```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found

```json
{
  "error": "Hub not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

- **General endpoints**: 100 requests per minute per IP
- **Auth endpoints**: 5 requests per 15 minutes per IP

All endpoints return `X-RateLimit-*` headers indicating rate limit status.
