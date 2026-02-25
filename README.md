# Unified Observability Portal

A real-time observability dashboard for monitoring application health, service dependencies, incidents, and regional status across infrastructure.

---

## Demo

### Dashboard Overview
> Summary cards, AI health analysis, critical apps, regional status, and incident trends

![Dashboard Overview](docs/gifs/dashboard-overview.gif)

---

### Knowledge Graph — Dependency View
> Click any service node to explore its downstream dependencies

![Knowledge Graph Dependencies](docs/gifs/knowledge-graph-dependencies.gif)

---

### Knowledge Graph — Blast Radius View
> Switch to blast radius mode to see which services are impacted if a node fails

![Blast Radius](docs/gifs/blast-radius.gif)

---

### Incident Trends Chart
> 90-day bar chart with spike highlighting for major incident events

![Incident Trends](docs/gifs/incident-trends.gif)

---

## Architecture

| Layer    | Stack                        | Port  |
|----------|------------------------------|-------|
| Frontend | React + Vite + MUI           | 5174  |
| Backend  | Python FastAPI + Uvicorn     | 8080  |

The frontend proxies all `/api/*` requests to the backend via Vite's dev server proxy.

---

## Major Features

- **Dashboard** — Summary cards for critical issues, warnings, recurring incidents, and today's incident count
- **AI Health Panel** — AI-generated critical alert, trend analysis, and actionable recommendations
- **Critical Apps** — Applications in critical/warning state with incident history and SEAL numbers
- **Regional Status** — Health map across US-East, US-West, EU-Central, Asia-Pacific
- **Incident Trends** — 90-day bar chart with spike detection and highlighting
- **Knowledge Graph** — Interactive service dependency map with blast-radius and downstream dependency traversal
- **Customer Journey** — Customer-facing flow view
- **SLO Corrector** *(Beta)* — SLO tracking and correction tooling

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
│   │   ├── components/  # AIHealthPanel, CriticalApps, RegionalStatus, IncidentTrends, SummaryCards
│   │   ├── pages/       # Dashboard.jsx — main page, fetches all API data
│   │   └── App.jsx      # Router and nav
│   └── vite.config.js   # Dev server — proxy points to :8080
└── docs/
    └── gifs/            # Demo GIFs (add recordings here)
```

---

## API Endpoints

| Method | Path                               | Description                          |
|--------|------------------------------------|--------------------------------------|
| GET    | `/api/health-summary`              | Critical/warning/incident counts     |
| GET    | `/api/ai-analysis`                 | AI-generated health analysis         |
| GET    | `/api/regional-status`             | Per-region health status             |
| GET    | `/api/critical-apps`               | Apps in critical/warning state       |
| GET    | `/api/incident-trends`             | 90-day incident trend data           |
| GET    | `/api/graph/nodes`                 | All service nodes                    |
| GET    | `/api/graph/dependencies/{id}`     | Downstream dependencies for service  |
| GET    | `/api/graph/blast-radius/{id}`     | Upstream impact for service          |

Interactive API docs: http://localhost:8080/docs
