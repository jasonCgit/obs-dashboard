# Current API Reference

All endpoints are served by the FastAPI backend (`backend/main.py`).
Base URL: `http://localhost:8080` (dev) or deployed host.

> **Mock Data**: All endpoints currently return deterministic mock data from in-memory Python data structures. No external services are called. See the [Mock Data](#mock-data-implementation) section at the end for details on how each endpoint generates its data and what to replace for live integration.

---

## Common Query Parameters

All dashboard endpoints accept these filter parameters. Filters use AND logic — all active filters are additive.

| Parameter | Type | Format | Description |
|---|---|---|---|
| `lob` | string[] | `?lob=AWM&lob=CIB` | Filter by Line of Business |
| `subLob` | string[] | `?subLob=Asset+Management` | Filter by Sub-LOB |
| `cto` | string[] | `?cto=Jon+Glennie` | Filter by CTO name |
| `cbt` | string[] | `?cbt=Kalpesh+Narkhede` | Filter by CBT name |
| `seal` | string[] | `?seal=16649&seal=35115` | Filter by application SEAL ID |
| `status` | string[] | `?status=critical&status=warning` | Filter by computed health status |
| `search` | string | `?search=Morgan` | Free-text search on name or SEAL (case-insensitive substring) |

Multi-value params use repeated keys: `?lob=AWM&lob=CIB` (not comma-separated).

---

## Dashboard Endpoints

### GET /api/health-summary

Aggregated health metrics across all (or filtered) applications.

**Response**:
```json
{
  "critical_issues": 5,
  "warnings": 12,
  "recurring_30d": 23,
  "incidents_today": 8,
  "trends": {
    "critical_issues": { "spark": [3, 4, 5, 4, 5], "pct": 12.5 },
    "warnings":        { "spark": [10, 11, 12, 11, 12], "pct": -3.2 },
    "recurring_30d":   { "spark": [20, 22, 23, 21, 23], "pct": 5.0 },
    "incidents_today": { "spark": [6, 7, 8, 7, 8], "pct": 8.1 }
  }
}
```

---

### GET /api/ai-analysis

AI-generated health analysis and recommendations.

**Response**:
```json
{
  "critical_alert": "Payment Gateway API experiencing elevated error rates...",
  "trend_analysis": "P1 incidents trending 15% higher than 30-day average...",
  "recommendations": [
    "Investigate payment gateway connection pool exhaustion",
    "Review email notification service SMTP configuration",
    "Schedule capacity review for Morgan Money NAV service"
  ]
}
```

---

### GET /api/regional-status

Health status aggregated by region. Always returns all 3 regions (NA, EMEA, APAC).

**Response**:
```json
[
  { "region": "NA",   "status": "critical", "sod_impacts": 2, "app_issues": 5 },
  { "region": "EMEA", "status": "warning",  "sod_impacts": 1, "app_issues": 3 },
  { "region": "APAC", "status": "healthy",  "sod_impacts": 0, "app_issues": 0 }
]
```

---

### GET /api/critical-apps

Applications currently in critical status.

**Response**:
```json
[
  {
    "id": "morgan-money",
    "name": "Morgan Money",
    "seal": "16649",
    "status": "critical",
    "current_issues": 2,
    "recurring_30d": 6,
    "last_incident": "25m ago",
    "recent_issues": [
      { "description": "NAV calculation timeout — downstream pricing feed delay", "severity": "critical", "time_ago": "25m ago" },
      { "description": "Memory pressure on liquidity aggregation service", "severity": "warning", "time_ago": "2h ago" }
    ]
  }
]
```

---

### GET /api/warning-apps

Applications currently in warning status. Same response schema as `/api/critical-apps`.

---

### GET /api/incident-trends

90-day incident frequency data for trend charts.

**Response**:
```json
{
  "data": [
    { "week": 1, "label": "Dec 2", "p1": 1, "p2": 36 },
    { "week": 2, "label": "Dec 9", "p1": 2, "p2": 38 }
  ],
  "summary": {
    "mttr_hours": 4.2,
    "mtta_minutes": 12,
    "resolution_rate": 94,
    "escalation_rate": 18
  }
}
```

---

### GET /api/active-incidents

Current active incident breakdown by priority.

**Response**:
```json
{
  "week_label": "Feb 24 – Mar 2",
  "p1": {
    "total": 3,
    "trend": -15,
    "breakdown": [
      { "label": "Resolved", "count": 1, "color": "#4caf50" },
      { "label": "In Progress", "count": 2, "color": "#f44336" }
    ]
  },
  "p2": {
    "total": 12,
    "trend": 5,
    "breakdown": [
      { "label": "Resolved", "count": 8, "color": "#4caf50" },
      { "label": "In Progress", "count": 4, "color": "#ff9800" }
    ]
  },
  "convey": { "total": 2, "breakdown": [] },
  "spectrum": { "total": 1, "breakdown": [] }
}
```

---

### GET /api/recent-activities

Activity feed grouped by category.

**Response**:
```json
{
  "categories": [
    {
      "category": "P1 Critical",
      "color": "#f44336",
      "items": [
        { "status": "critical", "description": "Morgan Money — NAV calculation timeout", "time_ago": "25m ago" }
      ]
    }
  ],
  "frequent": [
    { "app": "Morgan Money", "seal": "16649", "status": "critical", "description": "NAV timeout", "occurrences": 6, "last_seen": "25m ago" }
  ]
}
```

---

## Application Endpoints

### GET /api/applications/enriched

Full application catalog with computed health data. See `ARCHITECTURE.md` Section 3.4 for the enriched application schema.

---

### GET /api/indicator-types

Available health indicator types for exclusion filtering.

**Response**: `["Process Group", "Service", "Synthetic"]`

---

### PUT /api/applications/{app_id}/excluded-indicators

Exclude indicator types from health computation for an application.

`app_id` = slug format (lowercase, spaces to hyphens). Example: `morgan-money`

**Request**: `{ "excluded_indicators": ["Synthetic"] }`

**Response**: `{ "app_id": "morgan-money", "excluded_indicators": ["Synthetic"] }`

---

### PUT /api/applications/{app_id}/deployments/{dep_id}/excluded-indicators

Exclude indicator types at the deployment level. Same request/response format.

---

### GET /api/applications/{app_id}/teams

**Response**: `{ "team_ids": [1, 5, 12] }`

---

### PUT /api/applications/{app_id}/teams

**Request**: `{ "team_ids": [1, 5, 12] }`

---

## Knowledge Graph Endpoints

### GET /api/graph/nodes

All component nodes in the dependency graph.

**Response**:
```json
[
  { "id": "connect-portal", "label": "CONNECT-PORTAL", "status": "warning", "team": "Connect Platform", "sla": "99.9%", "incidents_30d": 3 }
]
```

---

### GET /api/graph/dependencies/{service_id}

Forward dependency traversal — what does this service depend on?

**Response**:
```json
{
  "root": { "id": "connect-portal", "label": "CONNECT-PORTAL", "status": "warning" },
  "dependencies": [],
  "edges": [ { "source": "connect-portal", "target": "connect-cloud-gw" } ]
}
```

---

### GET /api/graph/blast-radius/{service_id}

Reverse dependency traversal — what is impacted if this service fails?

**Response**:
```json
{
  "root": { "id": "payment-gateway" },
  "impacted": [],
  "edges": [ { "source": "mm-api", "target": "payment-gateway" } ]
}
```

---

### GET /api/graph/layer-seals

Application SEALs with knowledge graph data.

**Response**:
```json
[
  { "seal": "88180", "label": "Connect OS", "component_count": 6 },
  { "seal": "90176", "label": "Advisor Connect", "component_count": 10 }
]
```

---

### GET /api/graph/layers/{seal_id}

Complete multi-layer graph for a specific application SEAL. Returns five layers: components, platform, datacenter, indicators, and cross-SEAL external nodes.

**Response**:
```json
{
  "seal": "88180",
  "components": {
    "nodes": [
      { "id": "connect-portal", "label": "CONNECT-PORTAL", "status": "warning", "team": "Connect Platform", "sla": "99.9%", "incidents_30d": 3 }
    ],
    "edges": [
      { "source": "connect-portal", "target": "connect-cloud-gw", "direction": "uni" }
    ],
    "external_nodes": [
      {
        "id": "advisor-api-gateway",
        "label": "ADVISOR-API-GATEWAY",
        "status": "healthy",
        "external": true,
        "external_seal": "90176",
        "external_seal_label": "Advisor Connect",
        "cross_direction": "downstream"
      }
    ]
  },
  "platform": {
    "nodes": [ { "id": "gap-pool-na-01", "label": "NA-5S", "type": "gap", "subtype": "pool", "datacenter": "NA-NW-C02", "status": "healthy" } ],
    "edges": [ { "source": "connect-portal", "target": "gap-pool-na-01" } ]
  },
  "datacenter": {
    "nodes": [ { "id": "dc-na-nw-c02", "label": "NA-NW-C02", "region": "NA", "status": "healthy" } ],
    "edges": [ { "source": "gap-pool-na-01", "target": "dc-na-nw-c02" } ]
  },
  "indicators": {
    "nodes": [ { "id": "dt-syn-portal", "label": "connect-portal", "indicator_type": "Synthetic", "health": "amber", "component": "connect-portal" } ],
    "edges": [ { "source": "connect-portal", "target": "dt-syn-portal" } ]
  }
}
```

---

## Team Management Endpoints

### GET /api/teams
Returns all teams. Response: `[{ "id": 1, "name": "Client Data", "emails": [], "teams_channels": [] }]`

### GET /api/teams/{team_id}
Returns a single team.

### POST /api/teams
Create a team. Request: `{ "name": "New Team", "emails": [], "teams_channels": [] }`

### PUT /api/teams/{team_id}
Update a team. All fields optional.

### DELETE /api/teams/{team_id}
Delete a team. Response: `{ "ok": true }`

---

## Announcement Endpoints

### GET /api/announcements
Query params: `status` (open/closed), `channel` (teams/email/connect/banner), `search`

### GET /api/announcements/notifications
Returns open announcements marked for banner display.

### POST /api/announcements
Create announcement with multi-channel targeting.

**Request**:
```json
{
  "title": "Scheduled Maintenance",
  "status": "open",
  "severity": "warning",
  "impacted_apps": ["Morgan Money"],
  "description": "Planned maintenance window...",
  "channels": {
    "teams": { "enabled": true },
    "email": { "enabled": true, "recipients": ["team@example.com"] },
    "connect": { "enabled": false },
    "banner": { "enabled": true }
  },
  "regions": ["NA", "EMEA"]
}
```

### PUT /api/announcements/{id}
Update announcement.

### PATCH /api/announcements/{id}/status
Toggle status between open/closed.

### DELETE /api/announcements/{id}

---

## AURA AI Chat Endpoint

### POST /api/aura/chat

Streams responses via Server-Sent Events (SSE).

**Request**:
```json
{
  "message": "What is the current health status of Morgan Money?",
  "conversation_id": "conv-123",
  "context": { "current_page": "dashboard", "active_filters": { "lob": ["AWM"] } }
}
```

**SSE Event Protocol**:

| Event | Payload | Description |
|---|---|---|
| `meta` | `{ message_id, timestamp }` | Sent first — conversation metadata |
| `block` | `{ type, data }` | Content block (see types below) |
| `followups` | `["question1", "question2"]` | Suggested follow-up questions |
| `done` | `{}` | Stream complete signal |

**Content block types**: `"text"` (markdown string), `"metric_cards"` (KPI array), `"status_list"` (RAG items), `"chart"` (chart data), `"recommendations"` (action items).

---

## Contact Endpoint

### POST /api/contact/send

Send notification to teams/individuals.

**Request**: `{ "type": "teams|email", "recipients": ["team@example.com"], "subject": "Alert", "message": "...", "app_name": "Morgan Money" }`

**Response**: `{ "status": "sent", "type": "email", "recipients": [...], "message_preview": "..." }`

---

## Mock Data Implementation

Every endpoint above currently returns **deterministic mock data**. This section documents where each endpoint's data originates and what needs to change for live integration.

### Data Sources (Backend)

| Source | File | Description |
|---|---|---|
| `APPS_REGISTRY` | `backend/apps_registry.py` | 81 applications with business metadata + operational fields (incidents, region) |
| `NODES` | `backend/main.py` line ~243 | 90+ component service nodes with id, label, status, team, sla, incidents_30d |
| `EDGES_RAW` | `backend/main.py` line ~450 | 100+ component dependency edges (source, target) tuples |
| `SEAL_COMPONENTS` | `backend/main.py` line ~671 | Mapping: SEAL ID → component IDs (10 SEALs) |
| `INDICATOR_NODES` | `backend/main.py` line ~869 | 869 health indicators with type, health status, parent component |
| `PLATFORM_NODES` | `backend/main.py` line ~727 | 10 platform infrastructure nodes (GAP, GKP, ECS, EKS) |
| `DATA_CENTER_NODES` | `backend/main.py` line ~850 | 6 data center nodes (NA, EMEA, APAC) |
| `COMPONENT_PLATFORM_EDGES` | `backend/main.py` line ~747 | Component → Platform hosting mappings |
| `DEPLOYMENT_OVERRIDES` | `backend/main.py` line ~1496 | Custom deployment definitions for 3 apps |
| `APP_SLO_DATA` | `backend/main.py` | SLO targets/actuals for 26 apps (others use 99.0% default) |
| `INCIDENT_TRENDS` | `backend/main.py` | 13-week hardcoded P1/P2 trend data |
| `_AURA_SCENARIOS` | `backend/main.py` line ~2848 | Keyword → response handler mapping for 11 chat scenarios |

### How Each Endpoint Uses Mock Data

| Endpoint | Mock Data Source | Replace With |
|---|---|---|
| `/api/health-summary` | Counts from `_get_enriched_apps()` + `APPS_REGISTRY` operational fields | ServiceNow incident API + enriched app status |
| `/api/ai-analysis` | Hardcoded text generated from filter scope | AURA AI streaming API |
| `/api/regional-status` | Aggregated from `_get_enriched_apps()` grouped by `region` | Same logic but with live app status data |
| `/api/critical-apps` | Filtered from `_get_enriched_apps()` where `status == "critical"` | Same filter but with live status + ServiceNow incidents |
| `/api/warning-apps` | Same, where `status == "warning"` | Same |
| `/api/incident-trends` | Static `INCIDENT_TRENDS` array, scaled proportionally by filter scope | ServiceNow incident data aggregated by week |
| `/api/active-incidents` | Derived from critical/warning app counts | ServiceNow active incident query |
| `/api/recent-activities` | Generated from critical/warning apps' `recent_issues` | ServiceNow recent activity feed |
| `/api/applications/enriched` | Full enrichment pipeline: `APPS_REGISTRY` → `SEAL_COMPONENTS` → status propagation | Product Catalog + ERMA/V12 + Dynatrace + ServiceNow |
| `/api/graph/*` | `NODES`, `EDGES_RAW`, `INDICATOR_NODES`, `PLATFORM_NODES` | ERMA/V12 Knowledge Graph + Dynatrace |
| `/api/aura/chat` | Keyword matching → hardcoded scenario responses | AURA AI streaming API |
| `/api/teams` | In-memory array of 55 pre-seeded teams | Teams/directory service |
| `/api/announcements` | In-memory array of 4 announcements | Persistent database |
| `/api/contact/send` | Returns mock "sent" response | Teams webhook + SMTP gateway |

### Developer Guide: Replacing Mock Data

1. **Keep the same response schemas** — the frontend depends on the exact field names and shapes documented above
2. **Add environment variables** for external service URLs and credentials (see `ARCHITECTURE.md` Section 9.4)
3. **Replace data sources one at a time** — start with `APPS_REGISTRY` (Product Catalog), then incidents (ServiceNow), then graph data (ERMA/V12)
4. **Cache expensive computations** — `_get_enriched_apps()` is currently cached at module level; maintain a similar caching strategy with TTL for live data
5. **Filter logic stays the same** — `_filter_dashboard_apps()` works on any array of app objects matching the schema, regardless of whether data is mock or live
6. **Test with mock data first** — run the app locally to verify frontend behavior, then swap in live API calls behind the same endpoint routes
