# Incident Trends — API Integration Guide

> Incident Trends chart panel on the Dashboard home page (right column, bottom).

---

## Architecture Overview

```
┌──────────────────┐      ┌─────────────────────────┐      ┌────────────────────┐
│  Incident Mgmt   │ ──►  │  Backend API             │ ──►  │  IncidentTrends.jsx │
│  (ServiceNow,    │      │  /api/incident-trends    │      │  Line chart + stats │
│   PagerDuty)     │      │                          │      │  (Recharts)         │
└──────────────────┘      └─────────────────────────┘      └────────────────────┘
```

**Current state:** Mock data built dynamically in `backend/main.py`
(lines 108–155). Generates 13 weekly data points (90 days) with
randomized P1/P2 counts and pre-computed MTTR/MTTA summary.

**What to change:** Replace with real weekly incident aggregations
from the incident management system.

---

## Endpoint & Response Contract

### `GET /api/incident-trends`

#### Response — `200 OK`

```jsonc
{
  "data": [
    { "week": "Oct 14", "p1": 3, "p2": 8 },
    { "week": "Oct 21", "p1": 2, "p2": 6 },
    { "week": "Oct 28", "p1": 4, "p2": 9 },
    { "week": "Nov 04", "p1": 1, "p2": 5 },
    { "week": "Nov 11", "p1": 3, "p2": 7 },
    { "week": "Nov 18", "p1": 2, "p2": 4 },
    { "week": "Nov 25", "p1": 5, "p2": 10 },
    { "week": "Dec 02", "p1": 2, "p2": 6 },
    { "week": "Dec 09", "p1": 3, "p2": 8 },
    { "week": "Dec 16", "p1": 1, "p2": 3 },
    { "week": "Dec 23", "p1": 4, "p2": 7 },
    { "week": "Dec 30", "p1": 2, "p2": 5 },
    { "week": "Jan 06", "p1": 3, "p2": 6 }
  ],
  "summary": {
    "mttr": "2.4h",
    "mtta": "8.2m",
    "resolution_rate": 94,
    "escalation_rate": 12
  }
}
```

#### Data Point Schema

| Field  | Type   | Required | Description                           |
|--------|--------|----------|---------------------------------------|
| `week` | string | yes      | Week label (e.g. `"Oct 14"`, `"Jan 06"`) — displayed on X-axis |
| `p1`   | number | yes      | P1 (critical) incident count for the week |
| `p2`   | number | yes      | P2 (warning) incident count for the week  |

#### Summary Schema

| Field             | Type   | Required | Description                                 |
|-------------------|--------|----------|---------------------------------------------|
| `mttr`            | string | yes      | Mean Time to Resolve (e.g. `"2.4h"`)        |
| `mtta`            | string | yes      | Mean Time to Acknowledge (e.g. `"8.2m"`)    |
| `resolution_rate` | number | yes      | Percentage of incidents resolved (0–100)     |
| `escalation_rate` | number | yes      | Percentage of incidents escalated (0–100)    |

---

## UI Rendering

### Stats Row (3 clickable tiles)

| Tile       | Shows                              | Click Action              |
|------------|-------------------------------------|---------------------------|
| **P1**     | Total, Max, Avg, trend % with arrow | Toggles P1 line on/off    |
| **P2**     | Total, Max, Avg, trend % with arrow | Toggles P2 line on/off    |
| **Resolved** | Resolution rate %                | Non-clickable (green)     |

Stats (total, max, avg) are **computed client-side** from the `data` array.

### Line Chart (Recharts)

- **Height:** 180px, responsive width
- **X-axis:** `week` labels (deduplicated if >20 points)
- **Y-axis:** integer count
- **Lines:**
  - P1 — solid red (`#f44336`), 2px stroke
  - P2 — solid amber (`#ffab00`), 2px stroke
  - P1 trend — dashed dark red (`#8a5050`), computed via linear regression
  - P2 trend — dashed dark amber (`#8a7a50`), computed via linear regression
- **Labeled dots:**
  - Max value: labeled `"max N"` with larger dot
  - Last data point: labeled with the value
- **Tooltip:** shows P1 and P2 values; hides trend lines

### Trend Lines

The frontend computes **linear regression** trend lines client-side from the
`data` array. These are not expected from the API — only raw weekly counts are needed.

---

## What to Change

### Backend (`backend/main.py`, lines 108–155)

Replace mock data with real weekly aggregations:

```python
@app.get("/api/incident-trends")
def incident_trends():
    # Aggregate weekly P1/P2 counts for last 90 days (13 weeks)
    weeks = incident_db.weekly_counts(days=90, severities=["P1", "P2"])
    data = [
        {
            "week": w.label,  # "Oct 14" format
            "p1": w.p1_count,
            "p2": w.p2_count,
        }
        for w in weeks
    ]

    return {
        "data": data,
        "summary": {
            "mttr": format_duration(incident_db.avg_resolution_time()),
            "mtta": format_duration(incident_db.avg_ack_time()),
            "resolution_rate": incident_db.resolution_rate_pct(),
            "escalation_rate": incident_db.escalation_rate_pct(),
        },
    }
```

---

## Integration Checklist

- [ ] Aggregate weekly P1 and P2 incident counts over 90 days
- [ ] Format week labels as `"Mon DD"` (e.g. `"Oct 14"`)
- [ ] Provide 13 data points (one per week) in chronological order
- [ ] Compute MTTR from average resolution time
- [ ] Compute MTTA from average acknowledgement time
- [ ] Compute resolution rate as percentage
- [ ] Compute escalation rate as percentage
- [ ] Trend lines are computed client-side — no need to include them in API response
