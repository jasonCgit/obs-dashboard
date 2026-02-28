# Unified Observability Portal

A real-time observability platform purpose-built for AWM engineering — combining AI-powered incident detection, service dependency mapping, SLO management, proactive health monitoring, and product-centric views across the entire platform ecosystem.

> **Powered by AWM Site Reliability Engineering (SRE)**

---

## Demo

### Home Dashboard
> Single pane of glass — critical apps with recent issues, AI health analysis, regional status, P1/P2 incident donuts, 90-day trend line chart, frequent incidents, and live activity feed.

<img src="docs/gifs/dashboard-overview.gif" alt="Home Dashboard" width="100%">

---

### Favorites
> Pinned View Central dashboards for quick access. Star any custom dashboard and find them all here — searchable by name or description with SEAL associations and widget counts.

<img src="docs/gifs/favorites.gif" alt="Favorites" width="100%">

---

### View Central
> Custom dashboards scoped to product areas. Create, configure, and monitor with drag-and-drop widget grids, SEAL filtering, per-dashboard notifications, and full search.

<img src="docs/gifs/view-central.gif" alt="View Central" width="100%">

---

### Product Catalog
> 6 business products with per-product health status, service counts, and linked observability views.

<img src="docs/gifs/product-catalog.gif" alt="Product Catalog" width="100%">

---

### Applications Registry
> 20+ registered applications with status, SLA targets, team ownership, and 30-day incident history — filterable by health status with full search.

<img src="docs/gifs/applications.gif" alt="Applications Registry" width="100%">

---

### Blast Radius — Multi-Layer Dependency Graphs
> Multi-layer dependency visualization with toggleable platform, data center, and health indicator layers — SEAL-scoped component graphs with status-colored edges, dagre layout, and interactive node details.

<img src="docs/gifs/blast-radius.gif" alt="Blast Radius Layers" width="100%">

---

### Customer Journeys
> End-to-end path health for Trade Execution, Client Login, and Document Delivery — step-by-step latency and error rate visibility across every service hop.

<img src="docs/gifs/customer-journey.gif" alt="Customer Journeys" width="100%">

---

### SLO Agent
> Autonomous SLO monitoring agent that predicts breaches, proposes auto-remediation actions, and surfaces error budget burn rates before they cause incidents.

<img src="docs/gifs/slo-agent.gif" alt="SLO Agent" width="100%">

---

### Announcements
> Full CRUD announcement management — create, edit, close/reopen, delete, search, type filters, pinning, and auto-refresh every 30 seconds.

<img src="docs/gifs/announcements.gif" alt="Announcements" width="100%">

---

### Links
> Quick-access grid for monitoring, CI/CD, security, documentation, and team tools across 8 categories.

<img src="docs/gifs/links.gif" alt="Links" width="100%">

---

### Draggable Tabs & Dark / Light Mode
> Browser-style tab management — add, close, and drag-to-reorder tabs with persistent order via localStorage. Full dark/light theme toggle with theme-aware cards, graphs, nav bar, and components.

<img src="docs/gifs/tabs-and-theme.gif" alt="Draggable Tabs and Dark/Light Mode" width="100%">

---

### Incident Zero
> Proactive pre-incident management — burn rate alerts, error budget dashboards, breach ETAs, and prevention timelines to stop P1s before they happen.

<img src="docs/gifs/incident-zero.gif" alt="Incident Zero" width="100%">

---

### Admin — Portal Instances
> Create, edit, and manage branded portal instances with custom logos (image upload or gradient+letter), titles, subtitles, default scope filters, and one-click tenant switching from the profile menu.

<img src="docs/gifs/admin.gif" alt="Admin Portal Instances" width="100%">

---

### Search & Filter
> Global search and grouped multi-select filters (Taxonomy, People, Risk & Compliance) with a persistent scope bar showing active filters and filtered app counts. Scope bar can be hidden/revealed on hover.

<img src="docs/gifs/search-filter.gif" alt="Search and Filter" width="100%">

---

### Aura AI Chat
> AI-powered chat assistant with suggested prompts, rich block responses (metrics, charts, tables, recommendations), and context-aware observability insights accessible from a floating action button.

<img src="docs/gifs/aura-chat.gif" alt="Aura AI Chat" width="100%">

---

## Architecture

| Layer    | Stack                        | Port  |
|----------|------------------------------|-------|
| Frontend | React + Vite + MUI           | 5174  |
| Backend  | Python FastAPI + Uvicorn     | 8080  |

The frontend proxies all `/api/*` requests to the backend via Vite's dev server proxy.

---

## Platform Capabilities

| Tab | Feature | Description |
|-----|---------|-------------|
| **Home** | Dashboard | Critical apps, AI health analysis, regional status, active incidents, incident trends, frequent incidents, recent activities |
| **Favorites** | Pinned Dashboards | Star any View Central for quick access — searchable with SEAL associations and widget counts |
| **View Central** | Custom Dashboards | Create, configure, and monitor product-scoped dashboards with drag-and-drop widget grids and notifications |
| **Product Catalog** | 6 Products | Per-product health, service counts, linked views (Advisor Connect, Spectrum, Connect OS, GWM, Client Case, IPBOL) |
| **Applications** | Registry | 20+ apps with status, SLA, team ownership, incident history, search & filter |
| **Blast Radius** | Multi-Layer Graphs | SEAL-scoped component graphs with toggleable platform, data center, and health indicator layers |
| **Customer Journeys** | Path Health | Trade Execution, Client Login, Document Delivery with step-by-step latency |
| **SLO Agent** | AI Agent | Breach prediction, error budget tracking, auto-remediation actions |
| **Announcements** | CRUD Management | Create, edit, close/reopen, delete, search, type filters, pinning, auto-refresh |
| **Links** | Quick Access | 8 categories — monitoring, CI/CD, security, documentation, team tools |
| **Admin** | Portal Instances | Create, edit, activate branded tenant instances with custom logos, titles, default scope filters |

Additional features:
- **Incident Zero** — Proactive pre-incident management with burn rate alerts and error budgets
- **Search & Filter** — Global search with grouped multi-select filters and persistent scope bar
- **Multi-Tenant Branding** — Custom portal instances with logo upload, title/subtitle, powered-by text, and default scope filters
- **Draggable Tabs & Dark / Light Mode** — Browser-style tab reordering with drag-and-drop + full theme toggle (see demo above)
- **Aura AI Chat** — AI-powered chat assistant with suggested prompts, rich block responses, and context-aware observability insights
- **Brochure Modal** — Click any feature card in the brochure to preview a full-size animated GIF demo

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
    └── gifs/            # 15 demo GIFs (1440p, animated)
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
