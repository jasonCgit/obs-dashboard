# Critical & Warning Apps — API Integration Guide

> Critical Applications and Warning Applications panels on the Dashboard home page (left column).

---

## Architecture Overview

```
┌──────────────────┐      ┌─────────────────────────┐      ┌───────────────────┐
│  Incident Mgmt   │ ──►  │  Backend API             │ ──►  │  CriticalApps.jsx  │
│  + App Registry  │      │  /api/critical-apps      │      │  WarningApps.jsx   │
│                  │      │  /api/warning-apps       │      │  App cards + issues│
└──────────────────┘      └─────────────────────────┘      └───────────────────┘
```

**Current state:** Mock data in `CRITICAL_APPS` (lines 63–91) and `WARNING_APPS`
(lines 93–106) inside `backend/main.py`.

**What to change:** Replace with real queries against the incident management
system, filtered by severity. Both endpoints share the same response shape.

---

## Endpoints & Response Contracts

### 1. `GET /api/critical-apps`

Returns applications with **critical** status that require immediate attention.
Panel is hidden if the array is empty.

### 2. `GET /api/warning-apps`

Returns applications with **warning** status to monitor.
Panel is hidden if the array is empty.

#### Response — `200 OK` (same shape for both)

```jsonc
[
  {
    "name": "GWM Collateral Management",
    "seal": "90176",
    "status": "critical",
    "issues": 12,
    "recurring": 4,
    "last_incident": "15m ago",
    "recent_issues": [
      {
        "severity": "critical",
        "description": "Connection pool exhaustion on primary DB cluster — 94% memory utilisation",
        "time_ago": "15m ago"
      },
      {
        "severity": "warning",
        "description": "Elevated API response times (p99 > 2s) on /collateral/positions endpoint",
        "time_ago": "45m ago"
      }
    ]
  }
]
```

#### App Object Schema

| Field           | Type     | Required | Description                                        |
|-----------------|----------|----------|----------------------------------------------------|
| `name`          | string   | yes      | Application display name                           |
| `seal`          | string   | yes      | SEAL identifier (shown below name)                 |
| `status`        | string   | yes      | `"critical"` or `"warning"`                        |
| `issues`        | number   | yes      | Active issue count                                 |
| `recurring`     | number   | yes      | Recurring incidents in last 30 days                |
| `last_incident` | string   | yes      | Relative timestamp of most recent incident         |
| `recent_issues` | array    | yes      | List of recent issue objects (see below)            |

#### Recent Issue Schema

| Field         | Type   | Required | Description                                       |
|---------------|--------|----------|---------------------------------------------------|
| `severity`    | string | yes      | `"critical"` or `"warning"`                       |
| `description` | string | yes      | Issue description text                            |
| `time_ago`    | string | yes      | Relative timestamp (e.g. `"15m ago"`, `"2h ago"`) |

---

## UI Rendering

### CriticalApps Panel
- Header: "Critical Applications (N)" with subtitle "Applications requiring immediate attention"
- Hidden if array is empty
- Each app card has a **red** left-border accent
- Status chip: `CRITICAL` (red)

### WarningApps Panel
- Header: "Warning Applications (N)" with subtitle "Applications with elevated issues to monitor"
- Hidden if array is empty
- Each app card has an **orange** left-border accent
- Status chip: `WARNING` (orange)

### Card Layout (both panels)

```
┌─ red/orange accent bar ──────────────────────────────┐
│  App Name                          [CRITICAL/WARNING] │
│  SEAL: 90176                                          │
│                                                       │
│  Issues: 12    Recurring (30d): 4    Last: 15m ago    │
│                                                       │
│  ⚠ Connection pool exhaustion...          15m ago     │
│  ⚠ Elevated API response times...         45m ago     │
└───────────────────────────────────────────────────────┘
```

#### Severity Icon Mapping

| Severity   | Icon (CriticalApps)  | Icon (WarningApps)   |
|------------|----------------------|----------------------|
| `critical` | `ErrorOutlineIcon`   | `WarningAmberIcon`   |
| `warning`  | `WarningAmberIcon`   | `WarningAmberIcon`   |

---

## What to Change

### Backend (`backend/main.py`, lines 63–106)

Replace mock arrays with real queries:

```python
@app.get("/api/critical-apps")
def critical_apps():
    apps = app_registry.get_by_status("critical")
    return [
        {
            "name": a.name,
            "seal": a.seal,
            "status": "critical",
            "issues": incident_db.count(seal=a.seal, status="open"),
            "recurring": incident_db.count_recurring(seal=a.seal, days=30),
            "last_incident": format_relative(incident_db.latest(seal=a.seal)),
            "recent_issues": [
                {
                    "severity": i.severity,
                    "description": i.description,
                    "time_ago": format_relative(i.created_at),
                }
                for i in incident_db.recent(seal=a.seal, limit=5)
            ],
        }
        for a in apps
    ]

@app.get("/api/warning-apps")
def warning_apps():
    # Same structure, filtered by status="warning"
    ...
```

---

## Integration Checklist

- [ ] Query incident system for apps with `critical` status → `/api/critical-apps`
- [ ] Query incident system for apps with `warning` status → `/api/warning-apps`
- [ ] Include `issues` count (open incidents per app)
- [ ] Include `recurring` count (30-day recurring incidents)
- [ ] Include `last_incident` as relative timestamp string
- [ ] Include `recent_issues` array with severity, description, time_ago
- [ ] Return empty array `[]` when no apps match (panel auto-hides)
- [ ] Order apps by severity / issue count (most critical first)
