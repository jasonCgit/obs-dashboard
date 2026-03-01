# Application Status Observability Dashboard — Architecture Guide

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Data Model & Hierarchies](#3-data-model--hierarchies)
4. [Health Status Propagation](#4-health-status-propagation)
5. [Knowledge Graph (Blast Radius)](#5-knowledge-graph-blast-radius)
6. [External System Integration Requirements](#6-external-system-integration-requirements)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Data Source Validation & Known Issues](#8-data-source-validation--known-issues)
9. [Deployment Guide](#9-deployment-guide)
10. [Appendices](#appendices)

**API Documentation** — see separate files under [`apidocs/`](apidocs/):
- [Current API Reference](apidocs/current-api.md) — all existing backend endpoints, mock data details, developer guide
- [Future API Endpoints](apidocs/future-api.md) — endpoints to build for Incident Zero, Customer Journey, SLO Agent, AURA AI

---

## 1. Overview

The Application Status Observability Dashboard is a real-time operational health monitoring platform. It provides a unified view of application health, dependency relationships, incident management, and SLO tracking across the enterprise.

### Current State

The application uses **mock data** for demonstration purposes. All data structures, API contracts, and business logic are designed to be replaced with live integrations. See the [API docs](apidocs/) for exact contracts and mock data details.

### Key Capabilities

- **Home Dashboard**: Aggregated health summary, AI analysis, regional status, incident trends
- **Applications Registry**: Hierarchical browse/filter by business and technology taxonomy
- **Blast Radius (Knowledge Graph)**: Interactive multi-layer dependency graph with cross-application impact analysis
- **Incident Zero**: Pre-incident SLO burn-rate monitoring and prevention
- **Customer Journeys**: End-to-end journey path health tracking
- **SLO Agent**: AI-driven SLO monitoring with automated remediation actions
- **View Central**: Customizable widget dashboards scoped by application SEAL
- **AURA AI**: Natural language chat interface for observability queries and summarization
- **Announcements**: Multi-channel notification management (Teams, email, Connect banners)

---

## 2. Architecture

### System Components

```
┌─────────────────────────────────────────────────────┐
│  Frontend (React + Vite)                            │
│  ┌─────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │ ScopeBar│ │Dashboard │ │ View Central Widgets │ │
│  │(Filters)│ │  Pages   │ │ (Drag-Drop Layout)   │ │
│  └────┬────┘ └────┬─────┘ └──────────┬───────────┘ │
│       │           │                  │              │
│       └─────┬─────┴──────────────────┘              │
│             │  FilterContext + buildFilterQueryString│
│             ▼                                       │
│       /api/* endpoints (with query params)          │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP
┌─────────────────────▼───────────────────────────────┐
│  Backend (FastAPI + Uvicorn)                        │
│  ┌────────────────┐ ┌────────────────────────────┐  │
│  │ APPS_REGISTRY  │ │ NODES / EDGES / INDICATORS │  │
│  │ (81 apps)      │ │ (Knowledge Graph)          │  │
│  └───────┬────────┘ └────────────┬───────────────┘  │
│          │                       │                  │
│          ▼                       ▼                  │
│  ┌─────────────────────────────────────────────┐    │
│  │  _get_enriched_apps()  — cached enrichment  │    │
│  │  Indicator → Component → Deployment → App   │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Data Flow

1. **Frontend APPS** (`appData.js`): 81 applications with business metadata (LOB, CTO, CBT, etc.) used for filter cascading and tree navigation
2. **Backend APPS_REGISTRY** (`apps_registry.py`): Same 81 applications with additional operational fields (incidents, region, recent_issues)
3. **Backend Enrichment**: `_get_enriched_apps()` computes health status bottom-up from graph data, attaches deployments, SLO metrics, and completeness scores
4. **API Filtering**: All dashboard endpoints accept filter query params and return scoped data
5. **Frontend Rendering**: Pages fetch filtered data from API, render with scoped context

### Single Source of Truth Principle

| Data Domain | Current Source | Target Live Source |
|---|---|---|
| Application catalog | `APPS_REGISTRY` (backend) + `APPS` (frontend) | **Product Catalog API (PATOOLS)** |
| Business hierarchy (LOB → Sub-LOB → Product Line → Product) | Hardcoded in both registries | **Product Catalog API** |
| Technology hierarchy (LOB → CTO → CBT) | Hardcoded in both registries | **V12 / ERMA** |
| Dependency graph (Component → edges) | `NODES`, `EDGES_RAW` (backend) | **ERMA / V12 / Knowledge Graph** |
| Deployments & platforms | `DEPLOYMENT_OVERRIDES`, `PLATFORM_NODES` | **ERMA / V12** |
| Health indicators | `INDICATOR_NODES` (backend) | **Dynatrace / Monitoring Platform** |
| Incidents (P1/P2) | Hardcoded `INCIDENT_TRENDS`, `recent_issues` | **ServiceNow API** |
| SLO targets & actuals | `APP_SLO_DATA` (backend) | **SLO Monitoring Platform** |
| AI analysis & chat | Hardcoded responses | **AURA AI Streaming API** |

> **Critical**: In production, `APPS` (frontend) and `APPS_REGISTRY` (backend) must be replaced by a single API call to the Product Catalog. The current dual-source pattern exists only because mock data is static.

---

## 3. Data Model & Hierarchies

### 3.1 Business Hierarchy

```
LOB (Line of Business)
 └─ Sub-LOB (may not exist — skip when empty)
     └─ Product Line
         └─ Product
             └─ Application (identified by SEAL ID)
```

**Current LOBs**: AWM, CCB, CDAO, CIB, CT, EP, IP

**Sub-LOB behavior**: Some LOBs have no Sub-LOBs (CCB, CDAO, CT, EP, IP have `subLob: ""`). When Sub-LOB is empty, the hierarchy skips directly from LOB to Product Line. The `SUB_LOB_MAP` in `appData.js` only includes LOBs with Sub-LOBs:

```javascript
SUB_LOB_MAP = {
  AWM: ['Asset Management', 'AWM Shared', 'Global Private Bank'],
  CIB: ['Digital Platform and Services', 'Global Banking', 'Markets', 'Payments'],
}
```

### 3.2 Technology Hierarchy

```
LOB (Line of Business)
 └─ CTO (Chief Technology Officer)
     └─ CBT (Component Business Team / Center of Business Transformation)
         └─ Application (identified by SEAL ID)
```

### 3.3 Application Schema

Every application across the system uses this schema:

| Field | Type | Source | Description |
|---|---|---|---|
| `name` | string | Product Catalog | Application display name |
| `seal` | string | Product Catalog | Unique application SEAL ID |
| `team` | string | Product Catalog | Primary support team |
| `sla` | string | Product Catalog | SLA target (e.g., "99.9%") |
| `lob` | string | Product Catalog | Line of Business |
| `subLob` | string | Product Catalog | Sub-LOB (empty if none) |
| `cto` | string | V12/ERMA | Chief Technology Officer |
| `cbt` | string | V12/ERMA | Component Business Team lead |
| `appOwner` | string | Product Catalog | Application owner |
| `cpof` | string | Product Catalog | Critical Path of Failure ("Yes"/"No") |
| `riskRanking` | string | Product Catalog | Risk level (Critical/High/Medium/Low) |
| `classification` | string | Product Catalog | In House / Third Party Internal |
| `state` | string | Product Catalog | Lifecycle state (Operate/etc.) |
| `investmentStrategy` | string | Product Catalog | Invest / Maintain |
| `rto` | string | Product Catalog | Recovery Time Objective (hours) |
| `productLine` | string | Product Catalog | Business product line |
| `product` | string | Product Catalog | Business product |
| `deploymentTypes` | string[] | ERMA/V12 | Platform types (gap/gkp/ecs/eks/aws) |
| `region` | string | ERMA/V12 | Primary region (NA/EMEA/APAC) |

**Backend-only operational fields** (from `APPS_REGISTRY`):

| Field | Type | Source | Description |
|---|---|---|---|
| `incidents_today` | number | ServiceNow | Active incidents today |
| `recurring_30d` | number | ServiceNow | Recurring incident count (30 days) |
| `p1_30d` | number | ServiceNow | P1 incidents (30 days) |
| `p2_30d` | number | ServiceNow | P2 incidents (30 days) |
| `recent_issues` | array | ServiceNow | Recent issue descriptions with severity and time |

### 3.4 Enriched Application Schema

The `/api/applications/enriched` endpoint returns applications augmented with computed data:

| Field | Type | Computed From | Description |
|---|---|---|---|
| `status` | string | Deployments | Worst deployment status (critical/warning/healthy) |
| `components` | array | SEAL_COMPONENTS + NODES | Components with effective status |
| `deployments` | array | COMPONENT_PLATFORM_EDGES | Deployments grouped by platform |
| `slo` | object | APP_SLO_DATA + computed | SLO metrics (target, current, burn rate, etc.) |
| `completeness` | object | Computed | Data completeness score (0-100%) |
| `team_ids` | array | APP_TEAM_ASSIGNMENTS | Multi-team assignment IDs |
| `excluded_indicators` | array | APP_EXCLUDED_INDICATORS | Excluded indicator types |

---

## 4. Health Status Propagation

Health status flows bottom-up through the hierarchy:

```
Health Indicator (green/amber/red)
    ↓  mapped to component
Component Status (healthy/warning/critical)
    ↓  BFS dependency traversal → effective status = worst of (self + all dependencies)
Deployment Status = worst of active component statuses
    ↓
Application Status = worst of deployment statuses
```

### 4.1 Status Values

| Layer | Values | Ranking (lower = worse) |
|---|---|---|
| Indicator | `green`, `amber`, `red` | red (0), amber (1), green (2) |
| Component/Deployment/App | `critical`, `warning`, `healthy`, `no_data` | critical (0), warning (1), healthy (2), no_data (3) |

### 4.2 Effective Component Status

The effective status of a component considers its own status AND the status of all transitive downstream dependencies:

```python
def _effective_status(component_id):
    # Get own status
    own_status = NODE_MAP[component_id]["status"]

    # BFS traverse all downstream dependencies
    dependency_ids = bfs(component_id, forward_adj)

    # Return worst status across self + all dependencies
    return worst_of(own_status, *[NODE_MAP[d]["status"] for d in dependency_ids])
```

### 4.3 Deployment Status

```python
# For each deployment (platform):
active_components = [c for c in deployment.components if c.indicator_type not in excluded_indicators]
rag_components = [c for c in active_components if c has health indicators]

if len(rag_components) == 0:
    deployment.status = "no_data" if len(active_components) > 0 else "healthy"
else:
    deployment.status = worst_of(rag_components.status)
```

### 4.4 SLO Computation

```python
# Component SLO = SLA target - penalty based on status
if effective_status == "critical":
    slo = target - 1.5 - (incidents_30d * 0.08)
elif effective_status == "warning":
    slo = target - 0.4 - (incidents_30d * 0.05)
else:
    slo = target - 0.05

# Deployment SLO = min of active component SLOs
# Application SLO = min of deployment SLOs (or APP_SLO_DATA default)
```

---

## 5. Knowledge Graph (Blast Radius)

### 5.1 Graph Structure

The knowledge graph represents application dependencies across five layers:

```
                    ┌─────────────────────┐
                    │  Health Indicators   │  (above components)
                    │  Process Group       │
                    │  Service             │
                    │  Synthetic           │
                    └──────────┬──────────┘
                               │
┌──────────────┐   ┌──────────▼──────────┐   ┌───────────────┐
│  Upstream    │───│     Components      │───│  Downstream   │
│ (left zone)  │   │   (center layer)    │   │ (right zone)  │
│ Cross-SEAL   │   │   Within SEAL       │   │ Cross-SEAL    │
└──────────────┘   └──────────┬──────────┘   └───────────────┘
                               │
                    ┌──────────▼──────────┐
                    │     Platform        │  (below components)
                    │  GAP / GKP / ECS    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │    Data Center      │  (below platform)
                    │  NA / EMEA / APAC   │
                    └─────────────────────┘
```

### 5.2 Node Types

| Node Type | Count | Fields | Source |
|---|---|---|---|
| Component | 90+ | id, label, status, team, sla, incidents_30d | ERMA/V12 Knowledge Graph |
| Indicator | 869 | id, label, indicator_type, health, component | Dynatrace/Monitoring |
| Platform | 10 | id, label, type, subtype, datacenter, status | Infrastructure CMDB |
| Data Center | 6 | id, label, region, status | Infrastructure CMDB |
| External (Cross-SEAL) | varies | Same as Component + external_seal, cross_direction | ERMA/V12 |

### 5.3 Edge Types

| Edge Type | Meaning | Direction |
|---|---|---|
| Component → Component | Runtime dependency | `uni` (unidirectional) or `bi` (bidirectional) |
| Component → Platform | Deployed on | Always uni |
| Platform → Data Center | Located in | Always uni |
| Component → Indicator | Monitored by | Always uni |
| Component → External Component | Cross-SEAL dependency | `upstream` / `downstream` / `both` |

### 5.4 SEAL-to-Component Mapping

Each application (SEAL) maps to a set of components. Currently 10 SEALs have knowledge graph data:

| SEAL | Application | Components |
|---|---|---|
| 16649 | Morgan Money | 3 |
| 35115 | PANDA | 4 |
| 88180 | Connect OS | 6 |
| 90176 | Advisor Connect | 10 |
| 81884 | Order Decision Engine | 8 |
| 91001 | Quantum | 7 |
| 45440 | Credit Card Processing | 11 |
| 102987 | AWM Entitlements (WEAVE) | 12 |
| 90215 | Spectrum Portfolio Mgmt | 14 |
| 62100 | Real-Time Payments | 15 |

### 5.5 Application → Deployment → Component Relationship

```
Application (SEAL: 88180 = "Connect OS")
 ├─ Deployment: "Connect OS Critical Applications and Services AWS" (id: 112224)
 │   ├─ Component: connect-cloud-gw (status: healthy, indicator: Process Group)
 │   ├─ Component: connect-auth-svc (status: healthy, indicator: Service)
 │   └─ Component: connect-portal (status: warning, indicator: Synthetic)
 ├─ Deployment: "Connect OS Mobile AWS" (id: 111848)
 │   ├─ Component: connect-portal (status: warning)
 │   └─ Component: connect-mobile-api (status: healthy)
 └─ ... (18 deployments total)
```

Deployments can be:
- **Auto-generated**: Grouped by platform (COMPONENT_PLATFORM_EDGES)
- **Overridden**: Via DEPLOYMENT_OVERRIDES for apps with specific deployment-to-component mappings

---

## 6. External System Integration Requirements

### 6.1 Product Catalog API (PATOOLS)

**Purpose**: Single source of truth for application metadata and business hierarchy.

**Provides**:
- Application catalog: name, SEAL, owner, SLA, risk ranking, classification, state
- Business hierarchy: LOB → Sub-LOB → Product Line → Product → Application
- Deployment types and lifecycle data

**Expected API**:
```
GET /product-catalog/applications
  → Returns all applications with full business hierarchy
  → Must include: seal, name, lob, subLob, productLine, product, appOwner, cpof, riskRanking, rto, sla

GET /product-catalog/applications/{seal}
  → Single application detail
```

**Integration notes**:
- Replace both `APPS_REGISTRY` (backend) and `APPS` (frontend) with this single source
- Frontend should fetch from backend proxy, not directly from Product Catalog
- Cache with TTL (recommend 5 minutes) since catalog data changes infrequently
- When `subLob` is empty/null, UI hierarchy should skip the Sub-LOB level

---

### 6.2 ERMA / V12 / Knowledge Graph

**Purpose**: Technology hierarchy and dependency graph data.

**Provides**:
- Technology hierarchy: LOB → CTO → CBT → Application
- Application → Deployment mapping (Essential Services → App → Deployment)
- Business Process → Application mapping
- Component dependency graph: nodes, edges, cross-application relationships

**Expected API**:
```
GET /v12/applications/{seal}/components
  → Component IDs for a given SEAL
  → Replaces: SEAL_COMPONENTS

GET /v12/components/{component_id}/dependencies
  → Forward and reverse dependencies
  → Replaces: EDGES_RAW, forward_adj, reverse_adj

GET /v12/applications/{seal}/deployments
  → Deployment definitions with component mappings
  → Replaces: DEPLOYMENT_OVERRIDES

GET /v12/components/{component_id}/platform
  → Platform and datacenter hosting information
  → Replaces: COMPONENT_PLATFORM_EDGES, PLATFORM_NODES, DATA_CENTER_NODES
```

**Integration notes**:
- Graph data is the most complex integration — must maintain node IDs consistently for edge references
- Bidirectional edges should be explicitly marked by the source system
- Cross-SEAL dependencies require mapping components to their owning SEAL

---

### 6.3 ServiceNow API

**Purpose**: Incident, Problem, and Change data correlated to applications.

**Provides**:
- Active incidents (P1/P2) with severity, status, timestamps
- Incident history (30-day, 90-day trends)
- Problem records
- Change records
- Correlation via Configuration Item (CI) → Application/Deployment

**Expected API**:
```
GET /servicenow/incidents
  ?ci={seal_or_deployment_id}
  ?priority=P1,P2
  ?state=open,resolved
  ?created_after=2025-12-01
  → Returns incident list

GET /servicenow/incidents/trends
  ?ci={seal}
  ?period=90d
  ?granularity=weekly
  → Returns aggregated P1/P2 counts by week

GET /servicenow/incidents/summary
  ?ci={seal}
  → MTTR, MTTA, resolution rate, escalation rate
```

**Integration notes**:
- Configuration Item (CI) in ServiceNow maps to Application (by SEAL) or Deployment (by deployment ID)
- `recent_issues` array in app data should come from latest 5 incidents for each app
- Incident trends endpoint should support the same filter params as dashboard (lob, cto, etc.)
- Need both current counts and historical trends for sparkline generation

---

### 6.4 Monitoring Platform (Dynatrace)

**Purpose**: Health indicator data for RAG status.

**Provides**:
- Health indicators per component: Process Group, Service, Synthetic
- Real-time health status (green/amber/red)
- Performance metrics (latency, error rate, throughput)

**Expected API**:
```
GET /monitoring/indicators
  ?component={component_id}
  → Returns indicator nodes with health status

GET /monitoring/indicators/summary
  ?seal={seal_id}
  → Aggregated indicator health for all components in a SEAL
```

**Integration notes**:
- Currently 869 mock indicator nodes across all components
- Indicator health (`green`/`amber`/`red`) maps to status (`healthy`/`warning`/`critical`)
- Indicator types: Process Group, Service, Synthetic — must be consistent with type labels
- Indicator exclusion feature allows users to ignore specific types from status computation

---

### 6.5 AURA AI Streaming API

**Purpose**: AI-powered analysis, summarization, and chat.

**Provides**:
- AURA Summary on Home page (critical alerts, trend analysis, recommendations)
- Recurring Application Issues — count, trend, over longer periods
- Blast Radius — Impact Severity, incident count/trend, Executive Summary (business perspective)
- Interactive chat with observability context

**Expected API**:
```
POST /aura/analyze
  Content-Type: application/json
  Body: { "context": { health_summary, incidents, trends }, "scope": { lob, seal } }
  → Returns: { critical_alert, trend_analysis, recommendations[] }

POST /aura/chat  (SSE streaming)
  Body: { "message": "...", "conversation_id": "...", "context": { current_state } }
  → Streams: token-by-token response with structured sections

POST /aura/summarize/blast-radius
  Body: { "seal": "88180", "graph_data": { components, dependencies, incidents } }
  → Returns: { impact_severity, incident_count, trend, executive_summary }
```

**Integration notes**:
- Chat should use SSE (Server-Sent Events) for streaming responses
- Context must include current filter scope so AI responses are relevant
- Executive Summary for Blast Radius should focus on business impact, not technical details
- Recurring issues analysis needs longer time windows (90d, 180d) beyond ServiceNow's incident data

---

### 6.6 Customer Journey Service

**Purpose**: End-to-end customer journey step health.

**Currently**: Mock data with 3 journeys (Trade Execution, Client Login, Document Delivery), each with steps mapping to service components.

**Expected API**:
```
GET /journeys
  → Returns journey definitions with steps

GET /journeys/{journey_id}/health
  → Returns current health of each step (latency, error rate, status)
  → Each step maps to a component/service in the knowledge graph
```

---

## 7. Frontend Architecture

### 7.1 Page Structure

| Page | Route | Data Source | Filters Apply? |
|---|---|---|---|
| Dashboard (Home) | `/` | 7 API endpoints | Yes — all endpoints filtered |
| Applications | `/applications` | `/api/applications/enriched` + local APPS | Yes — tree + status + search |
| Blast Radius | `/blast-radius` | `/api/graph/layers/{seal}` | Partial — SEAL from filter |
| Incident Zero | `/incident-zero` | Mock data (static) | No |
| Customer Journey | `/customer-journey` | Mock data (static) | No |
| SLO Agent | `/slo-agent` | Mock data (static) | No |
| Favorites | `/favorites` | localStorage | No |
| View Central | `/view-central` | localStorage + widget API calls | Yes — ScopeBar + view filters |

### 7.2 Filter System

```
ScopeBar (UI) → FilterContext (React Context) → buildFilterQueryString() → API calls
                                               → Frontend client-side filtering
```

**FilterContext state**:
- `activeFilters`: `{ lob: ["AWM"], seal: ["16649"], cto: [], ... }`
- `searchText`: `"Morgan"`
- Persisted to sessionStorage keyed by tenant ID

**Filter groups** (from `appData.js`):
- PATOOLS — Business Hierarchy: LOB, Sub-LOB, Product Line, Product
- V12 — Technology Hierarchy: CTO, CBT
- Application: SEAL, App Owner, CPOF, Risk Ranking, Classification, State, Investment Strategy, RTO
- Infrastructure: Deployment

**Cascading behavior**: Filter options dynamically update based on other active filters. When LOB = "AWM" is selected, CTO dropdown only shows CTOs within AWM apps.

### 7.3 State Persistence

| State | Storage | Scope |
|---|---|---|
| Active filters + search | sessionStorage (`obs-filter-state`) | Per tenant ID |
| Tree expansions (Applications) | sessionStorage (`apps-tree-expanded`) | Per tree mode |
| Application page state | sessionStorage (`apps-page-state`) | Global |
| GraphLayers SEAL + layers | URL search params (`?seal=X&layers=Y,Z`) | Shareable |
| GraphLayers sidebar tab | sessionStorage (`gl-sidebar-tab`) | Global |
| Customer Journey active tab | sessionStorage (`cj-active-journey`) | Global |
| View Central views + widgets | localStorage (`obs-view-centrals`) | Permanent |
| Favorites | localStorage (within view centrals) | Permanent |

### 7.4 Mobile Responsiveness

- Responsive font sizes using `clamp()` across all components
- Grid breakpoints: `xs={12} sm={6} md={3}` for summary cards; `xs={12} lg={8/4}` for main/sidebar
- ScopeBar: horizontal scroll for filter chips on narrow screens
- GraphLayers: mobile sidebar toggle button
- AppTable: column hiding via `display: { xs: 'none', md: 'table-cell' }` for SEAL and SLA columns
- View Central: auto-hiding header after 5s idle for maximum widget space

### 7.5 View Central Widget System

**Widget Registry** (`widgetRegistry.js`): 13 registered widgets in two categories:
- **Dashboard Panels** (8): Fetch from API, receive `data` prop from WidgetWrapper
- **Interactive Views** (5): Self-contained, receive `viewFilters` prop (merged ScopeBar + view filters)

**WidgetWrapper** merges FilterContext globals with view-specific filters and either:
- Fetches API data with filter query string → passes to widget as `data`
- Passes merged filters to self-contained widget as `viewFilters`

---

## 8. Data Source Validation & Known Issues

### 8.1 Dual Data Source (Frontend + Backend)

**Issue**: Application metadata exists in both `APPS` (frontend `appData.js`) and `APPS_REGISTRY` (backend `apps_registry.py`).

**Why it exists**: Frontend needs app data for instant client-side filter cascading without API round-trips. Backend needs it for enrichment and API responses.

**Risk**: If the two registries diverge, filter options (ScopeBar) may not match API results.

**Resolution for production**: Replace both with a single Product Catalog API call. Frontend can cache the catalog response for filter cascading.

### 8.2 Health/Status Terminology Inconsistency

**Issue**: Health indicators use `green`/`amber`/`red`, while components/deployments/apps use `healthy`/`warning`/`critical`.

**Current mapping** (implicit):
- `green` ↔ `healthy`
- `amber` ↔ `warning`
- `red` ↔ `critical`

**Recommendation**: Normalize to a single terminology. Prefer `healthy`/`warning`/`critical` throughout, including indicator nodes.

### 8.3 Static Pages Without API Integration

**Incident Zero**, **Customer Journey**, and **SLO Agent** pages use entirely hardcoded frontend data. They do not call any backend API and will need dedicated endpoints. See [Future API Endpoints](apidocs/future-api.md) for the planned endpoint specs.

### 8.4 Potential Bugs

1. **Regional status always returns 3 regions**: Even when all apps are filtered out, the endpoint returns NA/EMEA/APAC with zeroed metrics. This may be desirable for UI consistency but should be documented.

2. **SLO threshold edge case**: The 0.5% gap between "warning" and "critical" SLO thresholds (`current < target - 0.5 → critical`) may be too wide for high-target apps (99.99% target) where 0.5% drop is catastrophic.

3. **Indicator type mismatch**: ~~RESOLVED~~ — 6 components previously mapped to "Dependency Health" (not a valid indicator type) have been remapped to "Service".

4. **Empty deployment handling**: Deployments with no active components (all excluded) get status "healthy", which may be misleading — should arguably show "no_data" or be hidden.

5. **Incident trends scaling**: When filters reduce the scope to few apps, `get_incident_trends()` scales the global 90-day data proportionally. This can produce fractional P1 counts (e.g., 0.3 P1 incidents), which are rounded but may produce unrealistic distributions.

6. **SearchFilterPopover debouncing**: Search suggestions regenerate on every keystroke without debounce. For large app catalogs, this could cause performance issues.

### 8.5 Missing API Capabilities

| Feature | Current State | Needed For Production |
|---|---|---|
| Pagination | All endpoints return full result set | Required for 500+ app catalogs |
| Caching headers | No ETag / Cache-Control | Needed for performance |
| WebSocket/SSE | Chat is request/response | AURA AI streaming |
| Bulk operations | Individual updates only | Team assignments, exclusions at scale |
| Audit trail | No history tracking | Change tracking for exclusions, team assignments |

---

## 9. Deployment Guide

### 9.1 Project Structure

```
obs-dashboard/
├── backend/
│   ├── main.py              # FastAPI application (all endpoints)
│   ├── apps_registry.py     # Application registry (81 apps)
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/                  # React source code
│   ├── dist/                 # Built output (after npm run build)
│   └── package.json
├── manifest.yml              # Cloud Foundry deployment config
├── requirements.txt          # Root-level requirements for CF
├── runtime.txt               # Python version for CF
├── .cfignore                 # CF ignore (excludes node_modules, keeps dist/)
└── .gitignore                # Git ignore (excludes dist/, node_modules/)
```

### 9.2 Local Development

```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --port 8080 --reload

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev          # Vite dev server at localhost:5174, proxies /api → localhost:8080
```

### 9.3 Cloud Foundry Deployment

The backend serves both the API and the built frontend static files. The `_FRONTEND_DIST` path auto-detects both repo layout (`backend/main.py`) and flat deploy layout (`main.py` at root).

**From the repository:**
```bash
cd frontend && npm run build && cd ..    # Build frontend → frontend/dist/
cf push                                  # Uses manifest.yml
```

**From flat deploy structure** (if copying files manually):
```bash
# Ensure these are at root: main.py, apps_registry.py, frontend/dist/
# Ensure .cfignore does NOT list dist/
cf push
```

### 9.4 Environment Variables (Future)

When integrating with live APIs, the following environment variables should be configured:

| Variable | Description |
|---|---|
| `PRODUCT_CATALOG_URL` | Product Catalog API base URL |
| `ERMA_V12_URL` | ERMA/V12 Knowledge Graph API base URL |
| `SERVICENOW_URL` | ServiceNow instance URL |
| `SERVICENOW_AUTH` | ServiceNow API credentials |
| `DYNATRACE_URL` | Dynatrace monitoring API URL |
| `DYNATRACE_TOKEN` | Dynatrace API token |
| `AURA_API_URL` | AURA AI streaming API endpoint |
| `AURA_API_KEY` | AURA AI API key |
| `TEAMS_WEBHOOK_URL` | Microsoft Teams webhook for notifications |
| `SMTP_HOST` / `SMTP_PORT` | SMTP gateway for email notifications |

---

## Appendices

### Appendix A: Application SEAL Reference

| SEAL | Application | LOB | Sub-LOB | Knowledge Graph? |
|---|---|---|---|---|
| 16649 | Morgan Money | AWM | Asset Management | Yes (3 components) |
| 35115 | PANDA | AWM | Asset Management | Yes (4 components) |
| 88180 | Connect OS | AWM | Global Private Bank | Yes (6 components) |
| 90176 | Advisor Connect | AWM | Global Private Bank | Yes (10 components) |
| 81884 | Order Decision Engine | AWM | Asset Management | Yes (8 components) |
| 91001 | Quantum | AWM | Asset Management | Yes (7 components) |
| 45440 | Credit Card Processing | CCB | — | Yes (11 components) |
| 102987 | AWM Entitlements (WEAVE) | AWM | AWM Shared | Yes (12 components) |
| 90215 | Spectrum Portfolio Mgmt | AWM | Asset Management | Yes (14 components) |
| 62100 | Real-Time Payments | CIB | Payments | Yes (15 components) |

*71 additional applications in the registry without knowledge graph data.*

### Appendix B: Indicator Type Reference

| Type | Description | Examples |
|---|---|---|
| Process Group | Backend processes, databases, caches, queues | PostgreSQL, Redis, Kafka, RabbitMQ |
| Service | API endpoints, business services, middleware | API Gateway, Auth Service, Trade Engine |
| Synthetic | End-user-facing UI, portals, synthetic monitors | Web Portal, Mobile UI, Synthetic Check |

### Appendix C: Platform Type Reference

| Type | Full Name | Description |
|---|---|---|
| `gap` | Global Application Platform | Traditional application hosting |
| `gkp` | Global Kubernetes Platform | Kubernetes container orchestration |
| `ecs` | Elastic Container Service | AWS ECS container hosting |
| `eks` | Elastic Kubernetes Service | AWS EKS managed Kubernetes |
| `aws` | Amazon Web Services | Direct AWS hosting |
