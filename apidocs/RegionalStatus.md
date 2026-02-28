# Regional Status — API Integration Guide

> Regional Health Status panel on the Dashboard home page (right column, top).

---

## Architecture Overview

```
┌──────────────────┐      ┌───────────────────────┐      ┌────────────────────┐
│  Regional Health │ ──►  │  Backend API           │ ──►  │  RegionalStatus.jsx │
│  Monitoring      │      │  /api/regional-status  │      │  Status rows        │
│  (per-region     │      │                        │      │  with health icons  │
│   aggregation)   │      │                        │      │                    │
└──────────────────┘      └───────────────────────┘      └────────────────────┘
```

**Current state:** Mock data in `REGIONAL_STATUS` array inside `backend/main.py` (lines 57–61).

**What to change:** Replace with real per-region health aggregations.

---

## Endpoint & Response Contract

### `GET /api/regional-status`

#### Response — `200 OK`

```jsonc
[
  {
    "region": "North America",
    "status": "critical",
    "app_issues": 5,
    "sod_impacts": 2
  },
  {
    "region": "EMEA",
    "status": "warning",
    "app_issues": 3,
    "sod_impacts": 0
  },
  {
    "region": "APAC",
    "status": "healthy",
    "app_issues": 0,
    "sod_impacts": 0
  }
]
```

#### Region Object Schema

| Field        | Type   | Required | Description                                     |
|--------------|--------|----------|-------------------------------------------------|
| `region`     | string | yes      | Region display name                             |
| `status`     | string | yes      | `"healthy"` \| `"warning"` \| `"critical"`      |
| `app_issues` | number | yes      | Count of apps with active issues in this region  |
| `sod_impacts`| number | yes      | Count of Start-of-Day impacts (shown only if >0) |

#### Status → Icon & Color Mapping (frontend)

| Status     | Icon               | Color     |
|------------|--------------------|-----------|
| `healthy`  | `CheckCircleIcon`  | `#4caf50` |
| `warning`  | `WarningAmberIcon` | `#ff9800` |
| `critical` | `ErrorIcon`        | `#f44336` |

---

## UI Rendering

- Header: "Regional Health Status" with `PublicIcon`
- Each region is a row with: status icon + region name (left), then metric badges (right)
- `sod_impacts` badge only shown when value > 0
- `app_issues` badge only shown when value > 0
- Status label shown at the far right

---

## What to Change

### Backend (`backend/main.py`, lines 57–61)

Replace `REGIONAL_STATUS` with real aggregations:

```python
@app.get("/api/regional-status")
def regional_status():
    regions = ["North America", "EMEA", "APAC"]
    return [
        {
            "region": r,
            "status": compute_region_status(r),
            "app_issues": count_app_issues(r),
            "sod_impacts": count_sod_impacts(r),
        }
        for r in regions
    ]
```

---

## Integration Checklist

- [ ] Aggregate app health status per region
- [ ] Determine region status: `critical` if any P1, `warning` if any P2, else `healthy`
- [ ] Count `app_issues` from active incidents per region
- [ ] Count `sod_impacts` from SOD impact records per region
- [ ] Ensure region names match: `"North America"`, `"EMEA"`, `"APAC"`
