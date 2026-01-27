# Rule Engine Examples & Configuration Guide

## Overview

The rule engine allows non-technical users to configure intelligent link routing without code changes. All rules are stored in the database as JSONB, making them fully editable via API or UI.

---

## Rule Type 1: Time-Based Rules

Show different links based on time of day or day of week.

### Use Case

Show support link during business hours, FAQ link after hours.

### Configuration Example

```json
{
  "rule_type": "time",
  "rule_name": "Business Hours Support",
  "priority": 10,
  "rule_config": {
    "timeRanges": [
      {
        "name": "Weekday Business Hours",
        "start": "09:00",
        "end": "17:00",
        "days": [1, 2, 3, 4, 5],
        "link_ids": ["uuid-support-chat", "uuid-phone-support"]
      },
      {
        "name": "Evenings & Weekends",
        "start": "17:01",
        "end": "08:59",
        "days": [0, 5, 6],
        "link_ids": ["uuid-faq", "uuid-email-support"]
      }
    ]
  }
}
```

### Days of Week Reference

- 0 = Sunday
- 1 = Monday
- 2 = Tuesday
- 3 = Wednesday
- 4 = Thursday
- 5 = Friday
- 6 = Saturday

### Evaluation Logic

- Current time is checked against all time ranges
- If current time and day match, those links are prioritized first
- Time ranges can wrap around midnight (e.g., 22:00-06:00)

---

## Rule Type 2: Device-Based Rules

Show different links optimized for different device types.

### Use Case

Show mobile app links for mobile users, desktop dashboard for desktop users.

### Configuration Example

```json
{
  "rule_type": "device",
  "rule_name": "Device Optimization",
  "priority": 8,
  "rule_config": {
    "deviceMappings": {
      "mobile": [
        "uuid-mobile-app-ios",
        "uuid-mobile-app-android",
        "uuid-mobile-friendly-docs"
      ],
      "tablet": ["uuid-tablet-app", "uuid-responsive-dashboard"],
      "desktop": [
        "uuid-desktop-app",
        "uuid-full-documentation",
        "uuid-admin-panel"
      ]
    }
  }
}
```

### Device Detection

Automatically detected from User-Agent header:

- **Mobile**: iPhone, Android (phone), Windows Phone, BlackBerry
- **Tablet**: iPad, Android (tablet), other tablet user agents
- **Desktop**: All other devices (default)

### Evaluation Logic

- Visitor's device type is matched against the mapping
- Links for matching device type are prioritized
- If no match, no links are prioritized by this rule

---

## Rule Type 3: Location-Based Rules

Show different links based on visitor's country.

### Use Case

Show US-specific signup link for US users, EU GDPR-compliant link for EU users.

### Configuration Example

```json
{
  "rule_type": "location",
  "rule_name": "Region-Specific Links",
  "priority": 9,
  "rule_config": [
    {
      "name": "North America",
      "countries": ["US", "CA", "MX"],
      "link_ids": ["uuid-na-signup", "uuid-na-support"]
    },
    {
      "name": "European Union",
      "countries": ["GB", "DE", "FR", "IT", "ES", "NL", "BE", "SE", "DK", "PL"],
      "link_ids": ["uuid-eu-signup", "uuid-gdpr-compliant"]
    },
    {
      "name": "Asia Pacific",
      "countries": ["AU", "JP", "SG", "IN", "NZ"],
      "link_ids": ["uuid-apac-signup"]
    }
  ]
}
```

### Country Code Reference

Uses ISO 3166-1 alpha-2 country codes (2-letter abbreviations):

- US = United States
- GB = United Kingdom
- DE = Germany
- FR = France
- CA = Canada
- AU = Australia
- JP = Japan
- SG = Singapore
- [See full list](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)

### Evaluation Logic

- Visitor IP is geolocalised to determine country
- If country matches any rule, those links are prioritized
- Geolocation lookup is cached to reduce latency

---

## Rule Type 4: Performance-Based Rules

Auto-promote links with the most clicks to the top.

### Use Case

Let users click and naturally highlight the most useful links without manual management.

### Configuration Example

```json
{
  "rule_type": "performance",
  "rule_name": "Auto-Promote Top Links",
  "priority": 1,
  "rule_config": {
    "topPercentage": 30,
    "timeWindow": "7d"
  }
}
```

### Parameters

- `topPercentage` (1-100): Percentage of total clicks that make up "top links"
  - 30 = top 30% of clicks move to top
  - 50 = top 50% (median) move to top
- `timeWindow` (string): How far back to look
  - "24h" = last 24 hours
  - "7d" = last 7 days
  - "30d" = last 30 days
  - "90d" = last 90 days

### Evaluation Logic

- Queries all clicks in the time window
- Calculates cumulative clicks from top to bottom
- Returns links until cumulative equals topPercentage
- Example: If 100 total clicks and topPercentage=30:
  - Link A: 50 clicks (50%)
  - Link B: 30 clicks (30%)
  - Link C: 20 clicks (20%)
  - Result: Links A and B are promoted (together = 80% >= 30%)

---

## Rule Priority System

Rules are evaluated in order of priority (highest first):

```
Priority 10 → Priority 5 → Priority 2 → Priority 0
(highest)                              (lowest)
```

### Example

```
1. Time rule (priority 10) - Shows support link 9-5
2. Device rule (priority 8) - Shows mobile app for mobile users
3. Location rule (priority 5) - Shows regional signup
4. Performance rule (priority 1) - Auto-promotes top links
```

When evaluated:

1. Time rule is checked first - if current time matches, those links go to position 1-2
2. Device rule is checked - new matching links go to position 3+
3. Location rule - new matching links go to position N+
4. Performance rule - new matching links go to final positions
5. Remaining unmatched links keep their original display_order

---

## Combined Rule Example

Real-world hub with multiple overlapping rules:

```json
{
  "hub": "startup-resources",
  "rules": [
    {
      "rule_type": "time",
      "rule_name": "Support Hours",
      "priority": 10,
      "rule_config": {
        "timeRanges": [
          {
            "start": "09:00",
            "end": "17:00",
            "days": [1, 2, 3, 4, 5],
            "link_ids": ["uuid-live-chat"]
          }
        ]
      }
    },
    {
      "rule_type": "device",
      "rule_name": "Mobile Optimize",
      "priority": 8,
      "rule_config": {
        "deviceMappings": {
          "mobile": ["uuid-mobile-app"],
          "desktop": ["uuid-web-dashboard"]
        }
      }
    },
    {
      "rule_type": "location",
      "rule_name": "US Marketing",
      "priority": 5,
      "rule_config": {
        "countries": ["US"],
        "link_ids": ["uuid-us-webinar"]
      }
    },
    {
      "rule_type": "performance",
      "rule_name": "Popular Links",
      "priority": 1,
      "rule_config": {
        "topPercentage": 30,
        "timeWindow": "7d"
      }
    }
  ]
}
```

### Flow for a Mobile User in US at 2 PM on Wednesday

1. ✅ Time rule matches → Live chat link at top
2. ✅ Device rule matches (mobile) → Mobile app link next
3. ✅ Location rule matches (US) → US webinar link next
4. ✅ Performance rule → Top 30% clicked links after above
5. Remaining links by display_order at bottom

---

## Rule Validation & Error Handling

### Validation Rules

- `rule_type` must be one of: 'time', 'device', 'location', 'performance'
- `priority` must be integer between 0-100
- `rule_config` must be valid JSON object
- `link_ids` must be valid UUIDs (if specified)
- Time ranges must be HH:MM format (24-hour)

### Error Examples

```json
// ❌ Invalid time format
{
  "error": "Invalid time format in rule config",
  "details": "start time must be HH:MM format (e.g., 09:00)"
}

// ❌ Invalid priority
{
  "error": "Invalid priority",
  "details": "priority must be integer between 0-100"
}

// ❌ Unknown device type
{
  "error": "Invalid device type in config",
  "details": "device must be one of: mobile, tablet, desktop"
}
```

---

## API Examples

### Create a Time-Based Rule

```bash
curl -X POST http://localhost:5000/api/hubs/hub-uuid/rules \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "rule_type": "time",
    "rule_name": "Business Hours",
    "priority": 10,
    "rule_config": {
      "timeRanges": [
        {
          "start": "09:00",
          "end": "17:00",
          "days": [1,2,3,4,5],
          "link_ids": ["uuid-1", "uuid-2"]
        }
      ]
    }
  }'
```

### Update Rule Priority

```bash
curl -X PUT http://localhost:5000/api/hubs/hub-uuid/rules/rule-uuid \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "priority": 5
  }'
```

### Disable Rule

```bash
curl -X PUT http://localhost:5000/api/hubs/hub-uuid/rules/rule-uuid \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "is_active": false
  }'
```

---

## Best Practices

1. **Start Simple**: Use 1-2 rules initially, add more as needed
2. **Priority Matters**: Set time rules higher priority (10+) for control
3. **Test Thoroughly**: Verify rules work with different devices/locations/times
4. **Monitor Performance**: Use analytics to verify links are being prioritized correctly
5. **Use Meaningful Names**: "Mobile Optimization" vs "Rule 1"
6. **Documentation**: Document why each rule exists for team maintenance
