# Health Summary — API Integration Guide

> Summary Cards panel at the top of the Dashboard home page.

---

## Architecture Overview

```
┌──────────────────┐      ┌───────────────────────┐      ┌──────────────────┐
│  Incident Mgmt   │ ──►  │  Backend API           │ ──►  │  SummaryCards.jsx │
│  (ServiceNow,    │      │  /api/health-summary   │      │  4 metric cards   │
│   PagerDuty)     │      │                        │      │  + sparklines     │
└──────────────────┘      └───────────────────────┘      └──────────────────┘
```

**Current state:** Mock data in `HEALTH_SUMMARY` dict inside `backend/main.py` (lines 25–36).

**What to change:** Replace `HEALTH_SUMMARY` with real aggregations from
incident management / monitoring systems. The frontend (`SummaryCards.jsx`)
renders whatever shape the endpoint returns — no frontend changes needed.

---

## Endpoint & Response Contract

### `GET /api/health-summary`

#### Response — `200 OK`

```jsonc
{
  "critical_issues": 3,
  "warnings": 12,
  "recurring_30d": 7,
  "incidents_today": 18,
  "trends": {
    "critical_issues":  { "pct": 15,  "direction": "up",   "spark": [1, 3, 2, 4, 3, 5, 3] },
    "warnings":         { "pct": 8,   "direction": "down", "spark": [10, 12, 11, 14, 13, 12, 12] },
    "recurring_30d":    { "pct": 5,   "direction": "up",   "spark": [4, 5, 6, 5, 7, 6, 7] },
    "incidents_today":  { "pct": 20,  "direction": "up",   "spark": [8, 10, 15, 12, 18, 14, 18] }
  }
}
```

#### Top-Level Fields

| Field             | Type   | Description                                  |
|-------------------|--------|----------------------------------------------|
| `critical_issues` | number | Count of currently open critical (P1) issues |
| `warnings`        | number | Count of currently open warnings             |
| `recurring_30d`   | number | Incidents that recurred within the last 30d  |
| `incidents_today` | number | Total incidents opened today                 |

#### Trend Object Schema

Each key in `trends` maps to an object:

| Field       | Type     | Description                                          |
|-------------|----------|------------------------------------------------------|
| `pct`       | number   | Percentage change vs. prior period                   |
| `direction` | string   | `"up"` or `"down"`                                   |
| `spark`     | number[] | 7 data points for the sparkline SVG (most recent last) |

#### Trend Color Logic (frontend)

The frontend applies **inverted color logic** for metrics where "down is good":

| Metric            | Up = ?  | Down = ? |
|-------------------|---------|----------|
| `critical_issues` | Red     | Green    |
| `warnings`        | Red     | Green    |
| `incidents_today` | Red     | Green    |
| `recurring_30d`   | Red     | Green    |

---

## Card Definitions

The frontend renders exactly 4 cards in this order:

| Key              | Label            | Icon                    | Accent Color |
|------------------|------------------|-------------------------|--------------|
| `critical_issues`| Critical Issues  | `ErrorIcon`             | `#f44336`    |
| `warnings`       | Warning          | `WarningAmberIcon`      | `#ff9800`    |
| `recurring_30d`  | Recurring (30d)  | `RepeatIcon`            | `#94a3b8`    |
| `incidents_today`| Incidents Today  | `NotificationsActiveIcon`| `#94a3b8`   |

Each card renders:
1. The **count** (large number)
2. A **sparkline** (SVG polyline from `trends[key].spark`)
3. A **trend badge** (percentage + up/down arrow icon)

---

## What to Change

### Backend (`backend/main.py`, lines 25–36)

Replace `HEALTH_SUMMARY` with real-time aggregations:

```python
@app.get("/api/health-summary")
def health_summary():
    # Query incident system for current counts
    critical = incident_db.count(severity="P1", status="open")
    warnings = incident_db.count(severity="P2", status="open")
    recurring = incident_db.count_recurring(days=30)
    today = incident_db.count(created_after=today_start())

    # Build 7-point sparklines from daily snapshots
    spark_critical = daily_snapshots("critical", days=7)
    # ... etc.

    return {
        "critical_issues": critical,
        "warnings": warnings,
        "recurring_30d": recurring,
        "incidents_today": today,
        "trends": {
            "critical_issues": { "pct": calc_pct_change(spark_critical), "direction": "up" if ... else "down", "spark": spark_critical },
            # ... etc.
        }
    }
```

---

## Integration Checklist

- [ ] Wire `critical_issues` to real P1 incident count
- [ ] Wire `warnings` to real P2/warning incident count
- [ ] Wire `recurring_30d` to incidents with >1 occurrence in 30 days
- [ ] Wire `incidents_today` to incidents created since midnight
- [ ] Generate 7-point sparkline arrays from daily snapshots
- [ ] Calculate `pct` trend from current vs. prior period
- [ ] Ensure `direction` accurately reflects the trend
