# Active Incidents — API Integration Guide

> Active Incidents panel on the Dashboard home page (right column, middle).
> Contains P1/P2 donut charts and notification donut charts.

---

## Architecture Overview

```
┌──────────────────┐      ┌──────────────────────────┐      ┌────────────────────────┐
│  Incident Mgmt   │ ──►  │  Backend API              │ ──►  │  ActiveIncidentsPanel   │
│  + Notification  │      │  /api/active-incidents    │      │  4 donut charts         │
│    System        │      │                           │      │  (Recharts PieChart)    │
└──────────────────┘      └──────────────────────────┘      └────────────────────────┘
```

**Current state:** Mock data in `ACTIVE_INCIDENTS` dict inside `backend/main.py` (lines 167–201).

**What to change:** Replace with real incident counts and notification breakdowns.

---

## Endpoint & Response Contract

### `GET /api/active-incidents`

#### Response — `200 OK`

```jsonc
{
  "week_label": "Jan 6 – Jan 12",
  "p1": {
    "total": 3,
    "trend_pct": -25,
    "breakdown": [
      { "name": "Infrastructure", "value": 1, "color": "#f44336" },
      { "name": "Application",    "value": 1, "color": "#ff9800" },
      { "name": "Network",        "value": 1, "color": "#ffeb3b" }
    ]
  },
  "p2": {
    "total": 8,
    "trend_pct": 14,
    "breakdown": [
      { "name": "Application",    "value": 4, "color": "#ff9800" },
      { "name": "Database",       "value": 2, "color": "#ce93d8" },
      { "name": "Infrastructure", "value": 1, "color": "#f44336" },
      { "name": "Security",       "value": 1, "color": "#4fc3f7" }
    ]
  },
  "convey": {
    "total": 12,
    "breakdown": [
      { "name": "Sent",      "value": 8,  "color": "#4caf50" },
      { "name": "Pending",   "value": 3,  "color": "#ff9800" },
      { "name": "Failed",    "value": 1,  "color": "#f44336" }
    ]
  },
  "spectrum_banners": {
    "total": 5,
    "breakdown": [
      { "name": "Active",    "value": 3, "color": "#42a5f5" },
      { "name": "Scheduled", "value": 2, "color": "#78909c" }
    ]
  }
}
```

#### Top-Level Fields

| Field              | Type   | Required | Description                                    |
|--------------------|--------|----------|------------------------------------------------|
| `week_label`       | string | yes      | Display label for the time range (e.g. `"Jan 6 – Jan 12"`) |
| `p1`               | object | yes      | P1 (critical) incident summary                 |
| `p2`               | object | yes      | P2 (high) incident summary                     |
| `convey`           | object | yes      | Convey notification summary                    |
| `spectrum_banners` | object | yes      | Spectrum banner summary                        |

#### Incident Section Schema (p1, p2)

| Field       | Type     | Required | Description                                    |
|-------------|----------|----------|------------------------------------------------|
| `total`     | number   | yes      | Total count for the period                     |
| `trend_pct` | number   | yes      | Percentage change vs. prior period (negative = improvement) |
| `breakdown` | array    | yes      | Category breakdown for the donut chart          |

#### Notification Section Schema (convey, spectrum_banners)

| Field       | Type     | Required | Description                                    |
|-------------|----------|----------|------------------------------------------------|
| `total`     | number   | yes      | Total notification count                       |
| `breakdown` | array    | yes      | Status breakdown for the donut chart            |

#### Breakdown Entry Schema

| Field   | Type   | Required | Description                           |
|---------|--------|----------|---------------------------------------|
| `name`  | string | yes      | Category/status label                 |
| `value` | number | yes      | Count for this segment                |
| `color` | string | yes      | Hex color for the donut segment       |

---

## UI Rendering

The panel is split into two sections by a `Divider`:

### Section 1 — Active Incidents

Subtitle: `week_label` (e.g. "Last 7 Days")

| Donut        | Center Value | Color Logic                          |
|--------------|--------------|--------------------------------------|
| P1 Incidents | `p1.total`   | Red center if >0, green if 0         |
| P2 Incidents | `p2.total`   | Amber center if >0, green if 0       |

Each donut shows:
- Recharts `PieChart` with `innerRadius=28, outerRadius=40`
- Center count label
- Legend stack to the right listing each breakdown entry
- Trend badge with `trend_pct` (up/down arrow)

### Section 2 — Notifications

Subtitle: "Last 24 Hours"

| Donut            | Center Value             |
|------------------|--------------------------|
| Convey           | `convey.total`           |
| Spectrum Banners | `spectrum_banners.total` |

Same donut rendering as above, without trend badges.

### Empty State

If a section's `total` is 0, the donut renders a single gray segment
with the label "No Incidents".

---

## What to Change

### Backend (`backend/main.py`, lines 167–201)

Replace `ACTIVE_INCIDENTS` with real data:

```python
@app.get("/api/active-incidents")
def active_incidents():
    week_start, week_end = current_week_range()
    prev_start, prev_end = previous_week_range()

    p1_current = incident_db.by_severity("P1", week_start, week_end)
    p1_prev = incident_db.count("P1", prev_start, prev_end)
    p2_current = incident_db.by_severity("P2", week_start, week_end)
    p2_prev = incident_db.count("P2", prev_start, prev_end)

    return {
        "week_label": format_week_label(week_start, week_end),
        "p1": {
            "total": sum(c["value"] for c in p1_current),
            "trend_pct": calc_trend(sum(c["value"] for c in p1_current), p1_prev),
            "breakdown": p1_current,  # [{name, value, color}]
        },
        "p2": { ... },
        "convey": notification_db.convey_summary(hours=24),
        "spectrum_banners": notification_db.banner_summary(hours=24),
    }
```

---

## Integration Checklist

- [ ] Aggregate P1 incidents for current week with category breakdown
- [ ] Aggregate P2 incidents for current week with category breakdown
- [ ] Compute `trend_pct` as % change vs. previous week
- [ ] Aggregate Convey notifications for last 24 hours (Sent/Pending/Failed)
- [ ] Aggregate Spectrum banners for last 24 hours (Active/Scheduled)
- [ ] Provide hex `color` for each breakdown segment
- [ ] Format `week_label` as `"Mon D – Mon D"` range
- [ ] Return `total: 0` with empty `breakdown: []` when no data (frontend handles empty state)
