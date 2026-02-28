# Search & Filter — API Integration Guide

> How the Observability Dashboard sources, filters, and scopes application data.

---

## Architecture Overview

```
┌──────────────┐      ┌───────────────┐      ┌──────────────────────┐
│  Real CMDB / │ ──►  │  Backend API  │ ──►  │  Frontend            │
│  App Registry│      │  /api/apps    │      │  FilterContext        │
│  (ServiceNow,│      │  /api/filters │      │  ScopeBar             │
│   AppDyn, ..)│      │               │      │  SearchFilterPopover  │
└──────────────┘      └───────────────┘      └──────────────────────┘
```

**Current state:** The application inventory is hardcoded in
`frontend/src/data/appData.js` as the `APPS` array (24 entries).
All filtering happens **client-side** inside `FilterContext.jsx`.

**Target state:** A backend endpoint serves the full application list and
available filter options. The frontend fetches on load (and optionally on
tenant switch) and continues to filter client-side for instant UX.

**What to change:** Replace the static `APPS` array and `getFilterOptions()`
with data fetched from new backend endpoints. The frontend filter logic
(`FilterContext.jsx`) and UI components (`SearchFilterPopover.jsx`,
`ScopeBar.jsx`) do **not** need to change — they already consume
the data generically.

---

## Endpoints & Response Contracts

### 1. `GET /api/apps`

Returns the full application inventory. Every panel and page that shows
application data should ultimately source from this list.

#### Response — `200 OK`

```jsonc
[
  {
    "name": "GWM GLOBAL COLLATERAL MANAGEMENT",
    "seal": "90176",
    "team": "Collateral",
    "status": "critical",
    "sla": "99.9%",
    "incidents": 12,
    "last": "15m ago",
    "lob": "AWM",
    "subLob": "Global Private Bank",
    "cto": "Gitanjali Nistala",
    "cbt": "Aadi Thayyar",
    "appOwner": "Nathan Brooks",
    "cpof": "Yes",
    "riskRanking": "Critical",
    "classification": "In House",
    "state": "Operate",
    "investmentStrategy": "Invest",
    "rto": "2"
  }
]
```

#### App Object Schema

| Field               | Type   | Required | Description                                     | Used By                          |
|---------------------|--------|----------|-------------------------------------------------|----------------------------------|
| `name`              | string | yes      | Application display name (uppercase convention) | Applications table, search       |
| `seal`              | string | yes      | Unique SEAL identifier (e.g. `"90176"`)         | All panels, scope filtering      |
| `team`              | string | yes      | Owning team name                                | Applications table, search       |
| `status`            | string | yes      | Current health: `critical` \| `warning` \| `healthy` | Status chips, CriticalApps  |
| `sla`               | string | yes      | SLA target percentage                           | Applications table               |
| `incidents`         | number | yes      | Active incident count                           | Applications table, sorting      |
| `last`              | string | yes      | Last incident relative timestamp                | Applications table               |
| `lob`               | string | yes      | Line of Business                                | Filter: Taxonomy group           |
| `subLob`            | string | no       | Sub-LOB (only for AWM, CIB)                     | Filter: Taxonomy group           |
| `cto`               | string | yes      | CTO name                                        | Filter: People group, search     |
| `cbt`               | string | yes      | CBT name                                        | Filter: People group             |
| `appOwner`          | string | yes      | Application owner name                          | Filter: People group, search     |
| `cpof`              | string | yes      | Critical Point of Failure flag (`Yes` \| `No`)  | Filter: Risk & Compliance group  |
| `riskRanking`       | string | yes      | `Critical` \| `High` \| `Medium` \| `Low`       | Filter: Risk & Compliance group  |
| `classification`    | string | yes      | `In House` \| `Vendor` \| `SaaS`                | Filter: Taxonomy group           |
| `state`             | string | yes      | `Operate` \| `Build` \| `Sunset`                | Filter: Taxonomy group           |
| `investmentStrategy`| string | yes      | `Invest` \| `Maintain` \| `Retire`              | Filter: Taxonomy group           |
| `rto`               | string | yes      | Recovery Time Objective (hours)                 | Filter: Risk & Compliance group  |

---

### 2. `GET /api/filters`

Returns filter field definitions, option values, and grouping metadata.
Replaces the static `FILTER_FIELDS` array and `getFilterOptions()` in `appData.js`.

#### Response — `200 OK`

```jsonc
{
  "fields": [
    { "key": "seal",               "label": "App" },
    { "key": "lob",                "label": "LOB" },
    { "key": "subLob",             "label": "Sub LOB" },
    { "key": "cto",                "label": "CTO" },
    { "key": "cbt",                "label": "CBT" },
    { "key": "appOwner",           "label": "App Owner" },
    { "key": "cpof",               "label": "CPOF" },
    { "key": "riskRanking",        "label": "Risk Ranking" },
    { "key": "classification",     "label": "Classification" },
    { "key": "state",              "label": "State" },
    { "key": "investmentStrategy", "label": "Investment Strategy" },
    { "key": "rto",                "label": "RTO" }
  ],
  "groups": [
    { "label": "Taxonomy",          "keys": ["lob", "subLob", "seal", "state", "classification", "investmentStrategy"] },
    { "label": "People",            "keys": ["cto", "cbt", "appOwner"] },
    { "label": "Risk & Compliance", "keys": ["cpof", "riskRanking", "rto"] }
  ],
  "options": {
    "seal":               ["Advisor Connect - 90176", "Spectrum Equities - 90215"],
    "lob":                ["AWM", "CCB", "CIB", "Corporate"],
    "cpof":               ["Yes", "No"],
    "riskRanking":        ["Critical", "High", "Medium", "Low"],
    "classification":     ["In House", "Vendor", "SaaS"],
    "state":              ["Operate", "Build", "Sunset"],
    "investmentStrategy": ["Invest", "Maintain", "Retire"]
  },
  "subLobMap": {
    "AWM": ["Asset Management", "AWM Shared", "Global Private Bank"],
    "CIB": ["Digital Platform and Services", "Global Banking", "Markets", "Payments"]
  },
  "sealDisplay": {
    "90176": "Advisor Connect - 90176",
    "90215": "Spectrum Equities - 90215",
    "88180": "Connect OS - 88180"
  }
}
```

---

## Filter Logic

Filtering is applied **client-side** after fetching the full app list.

### Text Search
- Free-text substring match (case-insensitive)
- Searched fields: `name`, `seal`, `team`, `appOwner`, `cto`

### Structured Filters
- **AND across fields:** an app must satisfy every active filter field
- **OR within a field:** selecting multiple values matches any of them
- **SEAL display parsing:** values use display format `"Name - 90176"`, raw ID extracted via `/ - (\d+)$/`
- **Sub-LOB dependency:** disabled unless a LOB with known sub-LOBs (AWM or CIB) is selected

### Tenant Scoping
- Each tenant defines `defaultFilters` (e.g. `{ seal: ['90176'] }`)
- Filters reset to tenant defaults on tenant switch
- "Reset" restores tenant defaults, not a blank state

---

## Frontend Components

| Component              | File                                              | Role                                              |
|------------------------|---------------------------------------------------|----------------------------------------------------|
| `FilterProvider`       | `frontend/src/FilterContext.jsx`                  | Global context — search text, active filters, filtered results |
| `SearchFilterPopover`  | `frontend/src/components/SearchFilterPopover.jsx` | Popover with search box + grouped filter dropdowns |
| `ScopeBar`             | `frontend/src/components/ScopeBar.jsx`            | Collapsible strip below TopNav showing active filters |

### Data Flow

```
FilterProvider (context)
  ├─ searchText        ← SearchFilterPopover input
  ├─ activeFilters     ← SearchFilterPopover dropdowns / ScopeBar chip delete
  ├─ filteredApps      ← useMemo(APPS + searchText + activeFilters)
  │
  ├──► SearchFilterPopover  (reads/writes)
  ├──► ScopeBar             (reads, can clear)
  ├──► Applications page    (reads filteredApps)
  ├──► GraphLayers page     (reads activeFilters.seal)
  └──► Dashboard panels     (reads filteredApps for scoped counts)
```

---

## What to Change

### Backend (`backend/main.py`)

Add two endpoints sourcing from a real CMDB / app registry:

```python
@app.get("/api/apps")
def get_apps():
    # Replace with real data source
    return APPS

@app.get("/api/filters")
def get_filters():
    return {
        "fields": FILTER_FIELDS,
        "groups": FILTER_GROUPS,
        "options": { f["key"]: get_distinct(f["key"]) for f in FILTER_FIELDS },
        "subLobMap": SUB_LOB_MAP,
        "sealDisplay": build_seal_display_map(APPS),
    }
```

### Frontend (`frontend/src/FilterContext.jsx`)

Replace the static `APPS` import with a fetch on mount:

```javascript
const [apps, setApps] = useState([])
useEffect(() => {
  fetch('/api/apps').then(r => r.json()).then(setApps)
}, [tenant.id])
```

---

## Integration Checklist

- [ ] Implement `GET /api/apps` backed by real CMDB / app registry
- [ ] Implement `GET /api/filters` with dynamically derived options
- [ ] Every app object includes all 18 fields from the schema
- [ ] SEAL display format: `"<Name> - <ID>"`
- [ ] Sub-LOB map reflects real LOB hierarchy
- [ ] Tenant `defaultFilters` sourced from tenant config
- [ ] Frontend fetches `/api/apps` instead of using static import
- [ ] Filter options refresh when app inventory changes
