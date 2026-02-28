# Unified Observability Portal

A real-time observability platform purpose-built for AWM engineering — combining AI-powered incident detection, service dependency mapping, SLO management, proactive health monitoring, and product-centric views across the entire platform ecosystem.

> **Powered by AWM Site Reliability Engineering (SRE)**

---

## Demo

### Executive Overview
> AI-driven summary, live health status, and context-driven measures across your entire platform ecosystem.

<img src="docs/gifs/dashboard-overview.gif" alt="Executive Overview" width="100%">

---

### AURA AI Assistant
> AI-Powered Observability Insights — smart prompts, rich visual responses, and context-aware platform analysis.

<img src="docs/gifs/aura-chat.gif" alt="AURA AI Assistant" width="100%">

---

### Blast Radius
> Assess severity of business impacts — trace upstream and downstream impact across components, platforms, and data centers.

<img src="docs/gifs/blast-radius.gif" alt="Blast Radius" width="100%">

---

### Incident Zero
> Proactive pre-incident management — burn rate alerts, error budgets, breach ETAs, and prevention timelines to stop P1s before they start.

<img src="docs/gifs/incident-zero.gif" alt="Incident Zero" width="100%">

---

### Multi-Tenant Portal
> Branded portal instances with custom logos, titles, default scope filters, and one-click tenant switching.

<img src="docs/gifs/admin.gif" alt="Multi-Tenant Portal" width="100%">

---

### View Central
> Customizable dashboards for your team — drag-and-drop widgets, real-time notifications, and personalized views.

<img src="docs/gifs/view-central.gif" alt="View Central" width="100%">

---

### Applications
> Full application registry with health status, SLA targets, team ownership, and 30-day incident history.

<img src="docs/gifs/applications.gif" alt="Applications" width="100%">

---

### Product Catalog
> Business products at a glance — health status, service counts, and direct links to observability views.

<img src="docs/gifs/product-catalog.gif" alt="Product Catalog" width="100%">

---

### Customer Journeys
> End-to-end path health — step-by-step latency and error rates across every service hop in your critical workflows.

<img src="docs/gifs/customer-journey.gif" alt="Customer Journeys" width="100%">

---

### SLO Agent
> Autonomous agent that predicts SLO breaches, tracks error budgets, and proposes remediation before incidents happen.

<img src="docs/gifs/slo-agent.gif" alt="SLO Agent" width="100%">

---

### Announcements
> Create, manage, and broadcast platform announcements — with search, filters, pinning, and live auto-refresh.

<img src="docs/gifs/announcements.gif" alt="Announcements" width="100%">

---

## Architecture

| Layer    | Stack                        | Port  |
|----------|------------------------------|-------|
| Frontend | React + Vite + MUI           | 5174  |
| Backend  | Python FastAPI + Uvicorn     | 8080  |

The frontend proxies all `/api/*` requests to the backend via Vite's dev server proxy.

---

## Platform Capabilities

| Feature | Description |
|---------|-------------|
| **Executive Overview** | AI-driven summary, live health status, and context-driven measures across your entire platform ecosystem |
| **AURA AI Assistant** | AI-Powered Observability Insights — smart prompts, rich visual responses, and context-aware platform analysis |
| **Blast Radius** | Assess severity of business impacts — trace upstream and downstream impact across components, platforms, and data centers |
| **Incident Zero** | Proactive pre-incident management — burn rate alerts, error budgets, breach ETAs, and prevention timelines to stop P1s before they start |
| **Multi-Tenant Portal** | Branded portal instances with custom logos, titles, default scope filters, and one-click tenant switching |
| **View Central** | Customizable dashboards for your team — drag-and-drop widgets, real-time notifications, and personalized views |
| **Applications** | Full application registry with health status, SLA targets, team ownership, and 30-day incident history |
| **Product Catalog** | Business products at a glance — health status, service counts, and direct links to observability views |
| **Customer Journeys** | End-to-end path health — step-by-step latency and error rates across every service hop in your critical workflows |
| **SLO Agent** | Autonomous agent that predicts SLO breaches, tracks error budgets, and proposes remediation before incidents happen |
| **Announcements** | Create, manage, and broadcast platform announcements — with search, filters, pinning, and live auto-refresh |

---

## Navigation

The top nav starts with only the **Home** tab visible. Click the **+** button to add any tab. Tabs can be **dragged and reordered** like browser tabs. Each added tab has an **×** to close it. Tab order and selection persist across browser sessions via localStorage.

---

## Multi-Tenant Portal Instances

Teams can create their own branded portal instance via **Admin** (accessible from the profile menu):

- **Custom Branding** — Logo (image upload or gradient+letter), portal title, subtitle, description, and powered-by text
- **Default Scope** — Pre-configured filters (SEAL, LOB, team, CTO, risk level, etc.) that auto-apply when the instance is activated
- **One-Click Switching** — Switch between portal instances from the profile dropdown; clicking the logo resets to the instance's default scope
- **localStorage Persistence** — All tenant configs persist locally, ready for backend migration

---

## Start

Open two terminals from the project root.

**Backend**
```bash
cd backend
python -m uvicorn main:app --reload --port 8080
```

**Frontend**
```bash
cd frontend
npm run dev
```

Open: http://localhost:5174

---

## Stop

**Kill all (recommended)**
```bash
taskkill //F //IM python.exe
taskkill //F //IM node.exe
```

**Kill by specific port**
```bash
# Find PIDs
netstat -ano | grep -E "8080|5174"

# Kill specific PID
taskkill //F //PID <pid>
```

**Check what's running**
```bash
netstat -ano | grep "LISTENING" | grep -E "8080|5174"
tasklist | grep -E "node|python"
```

---

## Project Structure

```
obs-dashboard/
├── backend/
│   ├── main.py          # FastAPI app — all endpoints and mock data
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/  # TopNav, ScopeBar, ViewCard, CriticalApps, DependencyFlow,
│   │   │                #   LayeredDependencyFlow, layerNodeTypes,
│   │   │                #   IncidentTrends, BrochureModal, ActiveIncidentsPanel,
│   │   │                #   FrequentIncidents, RecentActivities, AIHealthPanel,
│   │   │                #   SearchFilterPopover, WarningApps, SummaryCards
│   │   ├── aura/        # AuraChatFab, AuraChatPanel, AuraChatContext,
│   │   │                #   AuraChatMessages, AuraChatInput, mockPrompts,
│   │   │                #   blocks/ (text, metrics, charts, tables, recommendations)
│   │   ├── pages/       # Dashboard, GraphLayers, Applications, Favorites,
│   │   │                #   ProductCatalog, CustomerJourney, SloAgent,
│   │   │                #   IncidentZero, Announcements, Links, Admin
│   │   ├── view-central/ # ViewCentralListing, ViewCentralDashboard,
│   │   │                #   viewCentralStorage, WidgetWrapper, WidgetAddDrawer,
│   │   │                #   ViewCentralForm, widgetRegistry, NotificationDrawer
│   │   ├── tenant/      # TenantContext, tenantStorage — multi-tenant support
│   │   ├── data/        # appData.js — application registry and filter fields
│   │   ├── FilterContext.jsx  # Global search & filter context
│   │   ├── ThemeContext.jsx   # Dark/light mode context + provider
│   │   └── App.jsx      # Router and nav
│   └── vite.config.js   # Dev server — proxy to :8080, serves GIFs from docs/
└── docs/
    ├── make_gifs.py     # Playwright script to regenerate all GIFs
    └── gifs/            # 11 demo GIFs (1440p, animated)
```

---

## API Endpoints

| Method | Path                               | Description                          |
|--------|------------------------------------|--------------------------------------|
| GET    | `/api/health-summary`              | Critical/warning/incident counts     |
| GET    | `/api/ai-analysis`                 | AI-generated health analysis         |
| GET    | `/api/regional-status`             | Per-region health status             |
| GET    | `/api/critical-apps`               | Apps in critical/warning state       |
| GET    | `/api/incident-trends`             | 90-day P1/P2 incident trend data     |
| GET    | `/api/frequent-incidents`          | Top recurring incidents (30d)        |
| GET    | `/api/active-incidents`            | P1/P2/Convey/Spectrum breakdowns     |
| GET    | `/api/recent-activities`           | Activity feed by category            |
| GET    | `/api/announcements`               | List announcements (?status, ?search)|
| POST   | `/api/announcements`               | Create announcement                  |
| PUT    | `/api/announcements/{id}`          | Update announcement                  |
| PATCH  | `/api/announcements/{id}/status`   | Toggle open/closed                   |
| DELETE | `/api/announcements/{id}`          | Delete announcement                  |
| GET    | `/api/graph/nodes`                 | All service nodes                    |
| GET    | `/api/graph/dependencies/{id}`     | Downstream dependencies for service  |
| GET    | `/api/graph/blast-radius/{id}`     | Upstream impact for service          |
| GET    | `/api/graph/layer-seals`           | Available SEALs for layer graphs     |
| GET    | `/api/graph/layers/{seal_id}`      | Multi-layer graph data for a SEAL    |

Interactive API docs: http://localhost:8080/docs

---

## Regenerate GIFs

Requires the app running at http://localhost:5174 first, plus Playwright and Pillow:

```bash
pip install playwright pillow
playwright install chromium
python docs/make_gifs.py
```

GIFs are generated at full 1440p resolution for best quality. The brochure modal serves GIFs via Vite's dev server from `docs/gifs/`.
