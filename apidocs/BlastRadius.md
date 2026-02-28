# Blast Radius Layers — API Integration Guide

How to swap mock data for a real Knowledge Graph API.

---

## Architecture Overview

```
Real Knowledge Graph API
        ↓
Backend (main.py)         ← Only layer that changes
        ↓
  /api/graph/layers/{seal_id}
  /api/graph/layer-seals
        ↓
Frontend (GraphLayers.jsx → LayeredDependencyFlow.jsx)   ← No changes needed
```

The frontend consumes **two endpoints** and renders whatever data they return. All mock data lives in the backend — replacing it with real API calls is a backend-only change.

---

## Endpoints & Response Contracts

### 1. `GET /api/graph/layer-seals`

Returns the list of available SEALs for the dropdown selector.

```json
[
  { "seal": "88180", "label": "Connect OS",              "component_count": 6  },
  { "seal": "90176", "label": "Advisor Connect",         "component_count": 10 },
  { "seal": "90215", "label": "Spectrum Portfolio Mgmt",  "component_count": 14 }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `seal` | string | Unique SEAL identifier |
| `label` | string | Human-readable name for dropdown display |
| `component_count` | int | Number of components in this SEAL (shown as badge) |

### 2. `GET /api/graph/layers/{seal_id}`

Returns all four layers of graph data for a given SEAL. Each layer contains `nodes` and `edges`.

```json
{
  "seal": "90176",
  "components": {
    "nodes": [ ... ],
    "edges": [ ... ]
  },
  "platform": {
    "nodes": [ ... ],
    "edges": [ ... ]
  },
  "datacenter": {
    "nodes": [ ... ],
    "edges": [ ... ]
  },
  "indicators": {
    "nodes": [ ... ],
    "edges": [ ... ]
  }
}
```

---

## Node Schemas (per layer)

### Component Nodes

Services/microservices — the core of the graph.

```json
{
  "id":            "connect-portal",
  "label":         "CONNECT PORTAL",
  "status":        "healthy",
  "team":          "Connect",
  "sla":           "99.95%",
  "incidents_30d": 0
}
```

| Field | Type | Required | Values | Used For |
|-------|------|----------|--------|----------|
| `id` | string | yes | unique identifier | Node key, edge references |
| `label` | string | yes | display name | Rendered on node |
| `status` | string | yes | `healthy` / `warning` / `critical` | Node border color, edge colors |
| `team` | string | no | team name | Sidebar details |
| `sla` | string | no | e.g. `"99.95%"` | Sidebar details |
| `incidents_30d` | int | no | count | Sidebar details |

### Platform Nodes

Infrastructure where components run (GAP, GKP, ECS, EKS).

```json
{
  "id":         "gap-pool-na-01",
  "label":      "NA-5S",
  "type":       "gap",
  "subtype":    "pool",
  "datacenter": "NA-NW-C02",
  "status":     "healthy"
}
```

| Field | Type | Required | Values | Used For |
|-------|------|----------|--------|----------|
| `id` | string | yes | unique identifier | Node key, edge references |
| `label` | string | yes | display name | Rendered on node |
| `type` | string | yes | `gap` / `gkp` / `ecs` / `eks` | Type badge on node |
| `subtype` | string | no | `pool` / `cluster` / `service` | Sidebar details |
| `datacenter` | string | yes | datacenter label | Links to datacenter layer (used by backend to build DC edges) |
| `status` | string | no | `healthy` / `warning` / `critical` | Edge colors |

### Data Center Nodes

Physical/regional infrastructure locations.

```json
{
  "id":     "dc-na-nw-c02",
  "label":  "NA-NW-C02",
  "region": "NA",
  "status": "healthy"
}
```

| Field | Type | Required | Values | Used For |
|-------|------|----------|--------|----------|
| `id` | string | yes | unique identifier | Node key, edge references |
| `label` | string | yes | display name | Rendered on node |
| `region` | string | yes | `NA` / `APAC` / `EMEA` | Region chip color on node |
| `status` | string | no | `healthy` / `warning` / `critical` | Edge colors |

### Indicator Nodes

Observability health signals (Dynatrace entities).

```json
{
  "id":             "dt-pg-cloud-gw",
  "label":          "connect-cloud-gateway",
  "indicator_type": "process_group",
  "health":         "amber",
  "component":      "connect-cloud-gw"
}
```

| Field | Type | Required | Values | Used For |
|-------|------|----------|--------|----------|
| `id` | string | yes | unique identifier | Node key, edge references |
| `label` | string | yes | display name | Rendered as `{type}: {label}` on node |
| `indicator_type` | string | yes | `process_group` / `service` / `synthetic` | Type badge on node |
| `health` | string | yes | `green` / `amber` / `red` | Node color, flash animation (red/amber pulse) |
| `component` | string | yes | component `id` | Back-reference — used by backend to build indicator edges |

---

## Edge Schemas (per layer)

All edges support a `direction` field that controls arrowhead rendering:

| Value | Arrows | Description |
|-------|--------|-------------|
| `"uni"` (default) | `A ──→ B` | One-way dependency — source depends on target |
| `"bi"` | `A ←──→ B` | Two-way communication — both services exchange data |

If `direction` is omitted, it defaults to `"uni"`.

### Component → Component (uni-directional)

```json
{ "source": "connect-cloud-gw", "target": "connect-auth-svc", "direction": "uni" }
```

One-way dependency: cloud gateway calls auth service.

### Component ↔ Component (bi-directional)

```json
{ "source": "connect-portal", "target": "connect-cloud-gw", "direction": "bi" }
```

Two-way communication: portal and cloud gateway exchange requests and responses. Rendered with arrowheads on both ends.

### Component → Platform

```json
{ "source": "connect-portal", "target": "gap-pool-na-01", "layer": "platform", "direction": "uni" }
```

### Platform → Data Center

```json
{ "source": "gap-pool-na-01", "target": "dc-na-nw-c02", "layer": "datacenter", "direction": "uni" }
```

### Component → Indicator

```json
{ "source": "connect-cloud-gw", "target": "dt-pg-cloud-gw", "layer": "indicator", "direction": "uni" }
```

> The `layer` field on non-component edges is used by the frontend to determine edge styling (color, dash pattern, handle routing). The `direction` field controls arrow rendering on all edge types.

---

## Layer Hierarchy

```
                    ┌──────────────┐
                    │  Indicators  │  Health signals (above components)
                    └──────┬───────┘
                           │ component → indicator edges
                    ┌──────┴───────┐
                    │  Components  │  Services/microservices (always visible)
                    └──────┬───────┘
                           │ component → platform edges
                    ┌──────┴───────┐
                    │   Platform   │  GAP/GKP/ECS/EKS (below components)
                    └──────┬───────┘
                           │ platform → datacenter edges
                    ┌──────┴───────┐
                    │ Data Centers │  Physical locations (below platform)
                    └──────────────┘
```

| Layer | Toggle | Dependency | Position |
|-------|--------|------------|----------|
| **Components** | Always on | None (root) | Center |
| **Platform** | Optional | None | Below components |
| **Data Centers** | Optional | Requires Platform on | Below platform |
| **Health Indicators** | Optional | None | Above components |

---

## What to Change (Backend Only)

### Current: Mock Data

The backend has hardcoded dictionaries:

| Variable | Purpose | Lines |
|----------|---------|-------|
| `SEAL_COMPONENTS` | Maps SEAL → list of component IDs | main.py:473–493 |
| `PLATFORM_NODES` | 10 platform infrastructure nodes | main.py:495–510 |
| `COMPONENT_PLATFORM_EDGES` | 26 component→platform mappings | main.py:515–549 |
| `DATA_CENTER_NODES` | 6 data center nodes | main.py:551–558 |
| `DC_LOOKUP` | Maps datacenter label → node ID | main.py:560–567 |
| `INDICATOR_NODES` | 44 Dynatrace indicator nodes | main.py:570–618 |
| `BIDIRECTIONAL_PAIRS` | Component pairs with two-way communication | main.py:728–735 |

### Target: Real API

Replace the two endpoint functions (`get_layer_seals` and `get_graph_layers`) to query your Knowledge Graph API instead of reading from dictionaries. The response shape must match the contracts above.

```python
# Example: swap mock for real API call
@app.get("/api/graph/layers/{seal_id}")
async def get_graph_layers(seal_id: str):
    # Call your Knowledge Graph API
    kg_data = await knowledge_graph_client.get_seal_data(seal_id)

    # Transform into the expected shape
    return {
        "seal": seal_id,
        "components": {
            "nodes": [transform_component(c) for c in kg_data.components],
            "edges": [{"source": e.src, "target": e.dst, "direction": "bi" if e.bidirectional else "uni"} for e in kg_data.component_edges],
        },
        "platform": {
            "nodes": [transform_platform(p) for p in kg_data.platforms],
            "edges": [{"source": e.src, "target": e.dst, "layer": "platform"} for e in kg_data.platform_edges],
        },
        "datacenter": {
            "nodes": [transform_datacenter(d) for d in kg_data.datacenters],
            "edges": [{"source": e.src, "target": e.dst, "layer": "datacenter"} for e in kg_data.dc_edges],
        },
        "indicators": {
            "nodes": [transform_indicator(i) for i in kg_data.indicators],
            "edges": [{"source": i.component_id, "target": i.id, "layer": "indicator"} for i in kg_data.indicators],
        },
    }
```

### Transform Functions

If the real API returns fields with different names, write thin mappers:

```python
def transform_component(c):
    return {
        "id": c.component_id,
        "label": c.name.upper(),
        "status": map_health_to_status(c.health_score),  # e.g. score > 90 → healthy
        "team": c.owning_team,
        "sla": f"{c.sla_target}%",
        "incidents_30d": c.incident_count,
    }

def transform_platform(p):
    return {
        "id": p.platform_id,
        "label": p.short_name,
        "type": p.platform_type.lower(),     # gap, gkp, ecs, eks
        "subtype": p.subtype.lower(),
        "datacenter": p.datacenter_label,
        "status": map_health_to_status(p.health_score),
    }

def transform_datacenter(d):
    return {
        "id": d.dc_id,
        "label": d.name,
        "region": d.region,                  # NA, APAC, EMEA
        "status": map_health_to_status(d.health_score),
    }

def transform_indicator(i):
    return {
        "id": i.entity_id,
        "label": i.display_name,
        "indicator_type": i.entity_type,     # process_group, service, synthetic
        "health": map_dt_health(i.status),   # green, amber, red
        "component": i.linked_component_id,
    }
```

---

## Frontend Files (No Changes Needed)

These files consume the API response and render the graph. They stay untouched as long as the response shape matches.

| File | Role |
|------|------|
| `frontend/src/pages/GraphLayers.jsx` | Page shell — SEAL dropdown, layer toggles, sidebar, fetches `/api/graph/layers/{seal_id}` |
| `frontend/src/components/LayeredDependencyFlow.jsx` | React Flow canvas — two-phase Dagre layout, status-colored edges, `buildLayeredGraph(apiData, activeLayers)` |
| `frontend/src/components/layerNodeTypes.jsx` | Custom node components — ServiceNode, PlatformNode, DataCenterNode, IndicatorNode |

---

## Edge Rendering Logic (Frontend Reference)

### Colors

The frontend colors edges based on the **target node's status/health**:

| Edge Type | Color Source | Fallback |
|-----------|-------------|----------|
| Component → Component | Target's `status` → green/orange/red | `#5C8CC2` (muted blue) |
| Component → Platform | Target's `status` → green/orange/red | `#C27BA0` (muted pink) |
| Platform → Data Center | Target's `status` → green/orange/red | `#5DA5A0` (muted teal) |
| Component → Indicator | Target's `health` → green/orange/red | `#B8976B` (muted gold) |

Status/health mapping:

```
healthy / green  → #4caf50
warning / amber  → #ff9800
critical / red   → #f44336
```

### Arrows & Direction

Every edge renders an arrowhead at its target end. The `direction` field controls whether a second arrowhead appears at the source end:

| `direction` | Visual | Arrowheads |
|-------------|--------|------------|
| `"uni"` | `A ──────→ B` | Target only (`markerEnd`) |
| `"bi"` | `A ←─────→ B` | Both ends (`markerEnd` + `markerStart`) |

Arrow color always matches the edge stroke color (which is derived from the target node's health status).

### Dash Patterns

| Layer | Dash Pattern |
|-------|-------------|
| Component | Solid (no dash) |
| Platform | `6 3` (long dash) |
| Data Center | `3 3` (short dash) |
| Indicator | `4 2` (medium dash) |
| Highlighted | `6 3` (animated) |

---

## Checklist: Integrating the Real API

- [ ] Confirm Knowledge Graph API returns component, platform, datacenter, and indicator data for a given SEAL
- [ ] Write transform functions to map KG response fields to the schemas above
- [ ] Replace `get_layer_seals()` to query real SEAL list
- [ ] Replace `get_graph_layers()` to query real KG data and return the expected shape
- [ ] Remove mock data constants (`SEAL_COMPONENTS`, `PLATFORM_NODES`, `COMPONENT_PLATFORM_EDGES`, `DATA_CENTER_NODES`, `DC_LOOKUP`, `INDICATOR_NODES`, `BIDIRECTIONAL_PAIRS`)
- [ ] Set `direction: "bi"` on edges where the KG indicates two-way communication
- [ ] Test with each SEAL to verify nodes render and edges connect correctly
- [ ] Verify layer toggles still work (Platform, Data Centers, Health Indicators)
- [ ] Verify edge colors match node health status
- [ ] Verify uni-directional edges show single arrowhead, bi-directional show double arrowheads
