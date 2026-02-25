from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from collections import deque

app = FastAPI(title="Observability Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mock Data ─────────────────────────────────────────────────────────────────

HEALTH_SUMMARY = {
    "critical_issues": 2,
    "warnings": 9,
    "recurring_30d": 27,
    "incidents_today": 11,
}

AI_ANALYSIS = {
    "critical_alert": (
        "Payment Gateway API and Email Notification Service experiencing critical "
        "database connectivity and SMTP server failures. Both services showing recurring "
        "patterns indicating systemic infrastructure issues. Currently tracking 2 critical "
        "applications affecting approximately 6,220 users."
    ),
    "trend_analysis": (
        "Issue frequency has increased 34% over the past 7 days. Payment Gateway has "
        "experienced 12 incidents in 30 days, suggesting database connection pool sizing "
        "or network stability problems."
    ),
    "recommendations": [
        "Immediately investigate database connection pool exhaustion on Payment Gateway API — scale connections and add monitoring",
        "Trigger manual failover for Email Notification Service to secondary SMTP provider",
        "Schedule incident review meeting with Payments Engineering and Communications Platform teams to address recurring patterns",
    ],
}

REGIONAL_STATUS = [
    {"region": "US-East",      "status": "critical", "issues": 1},
    {"region": "US-West",      "status": "healthy",  "issues": 0},
    {"region": "EU-Central",   "status": "healthy",  "issues": 0},
    {"region": "Asia-Pacific", "status": "critical", "issues": 1},
]

CRITICAL_APPS = [
    {
        "id": "gwm-global-collateral",
        "name": "GWM GLOBAL COLLATERAL MANAGEMENT",
        "seal": "SEAL-90083",
        "status": "critical",
        "current_issues": 5,
        "recurring_30d": 12,
        "last_incident": "15m ago",
    },
    {
        "id": "payment-gateway",
        "name": "PAYMENT GATEWAY API",
        "seal": "SEAL-88451",
        "status": "critical",
        "current_issues": 3,
        "recurring_30d": 8,
        "last_incident": "2h ago",
    },
]

# 90-day incident trend — deterministic, no random
def _build_incident_trends():
    base = [1,0,2,1,0,0,3,1,0,2, 1,0,0,1,0,0,0,1,2,0,
            0,1,2,1,0,0,1,0,2,0, 1,0,1,0,0,2,1,0,0,1,
            2,0,0,1,0,0,2,1,3,0, 0,1,0,2,1,0,0,1,2,0,
            1,0,0,2,1,0,1,0,2,1, 0,0,1,0,2,1,0,0,1,3,
            0,1,2,0,1,0,2,1,0,0]
    spikes = {15:8, 16:11, 30:7, 31:9, 45:10, 46:6, 60:8, 75:9, 76:7, 88:12, 89:10}
    return [{"day": i + 1, "incidents": spikes.get(i + 1, base[i])} for i in range(90)]

INCIDENT_TRENDS = _build_incident_trends()

# ── Knowledge Graph ───────────────────────────────────────────────────────────

NODES = [
    {"id": "api-gateway",          "label": "API-GATEWAY",                               "status": "healthy",  "team": "Platform",    "sla": "99.99%", "incidents_30d": 0},
    {"id": "meridian-query",       "label": "MERIDIAN~~SERVICE-QUERY~V1",                "status": "critical", "team": "Trading",     "sla": "99.5%",  "incidents_30d": 7},
    {"id": "meridian-order",       "label": "MERIDIAN~~SERVICE-ORDER~V1",                "status": "warning",  "team": "Trading",     "sla": "99.5%",  "incidents_30d": 3},
    {"id": "sb-service-order",     "label": "SPRINGBOOT (PROD) SERVICE-ORDER",           "status": "healthy",  "team": "Orders",      "sla": "99.0%",  "incidents_30d": 0},
    {"id": "sb-service-query",     "label": "SPRINGBOOT (PROD) SERVICE-QUERY",           "status": "healthy",  "team": "Orders",      "sla": "99.0%",  "incidents_30d": 0},
    {"id": "active-advisory",      "label": "ACTIVE-ADVISORY",                           "status": "healthy",  "team": "Advisory",    "sla": "99.0%",  "incidents_30d": 1},
    {"id": "ipbol-account",        "label": "IPBOL-ACCOUNT-SERVICES",                    "status": "warning",  "team": "IPBOL",       "sla": "99.0%",  "incidents_30d": 2},
    {"id": "ipbol-account-green",  "label": "IPBOL-ACCOUNT-SERVICES#GREEN",              "status": "healthy",  "team": "IPBOL",       "sla": "99.0%",  "incidents_30d": 0},
    {"id": "ipbol-contact-sync",   "label": "IPBOL-CONTACT-SYNC_OFFLINE-NOTIFICATIONS",  "status": "healthy",  "team": "IPBOL",       "sla": "99.0%",  "incidents_30d": 0},
    {"id": "ipbol-doc-delivery",   "label": "IPBOL-DOC-DELIVERY#GREEN",                  "status": "healthy",  "team": "IPBOL",       "sla": "99.0%",  "incidents_30d": 0},
    {"id": "ipbol-doc-domain",     "label": "IPBOL-DOC-DOMAIN",                          "status": "critical", "team": "IPBOL",       "sla": "99.0%",  "incidents_30d": 4},
    {"id": "ipbol-doc-domain-g",   "label": "IPBOL-DOC-DOMAIN#GREEN",                    "status": "healthy",  "team": "IPBOL",       "sla": "99.0%",  "incidents_30d": 0},
    {"id": "ipbol-investments",    "label": "IPBOL-INVESTMENTS-SERVICES",                "status": "warning",  "team": "IPBOL",       "sla": "99.0%",  "incidents_30d": 3},
    {"id": "ipbol-manager-auth",   "label": "IPBOL-MANAGER-AUTH#GREEN",                  "status": "healthy",  "team": "IPBOL",       "sla": "99.5%",  "incidents_30d": 0},
    {"id": "payment-gateway",      "label": "PAYMENT-GATEWAY-API",                       "status": "critical", "team": "Payments",    "sla": "99.99%", "incidents_30d": 8},
    {"id": "email-notification",   "label": "EMAIL-NOTIFICATION-SERVICE",                "status": "critical", "team": "Messaging",   "sla": "99.5%",  "incidents_30d": 5},
    {"id": "auth-service",         "label": "AUTH-SERVICE-V2",                           "status": "healthy",  "team": "Security",    "sla": "99.99%", "incidents_30d": 0},
    {"id": "cache-layer",          "label": "REDIS-CACHE-CLUSTER",                       "status": "healthy",  "team": "Platform",    "sla": "99.9%",  "incidents_30d": 1},
    {"id": "db-primary",           "label": "POSTGRES-DB-PRIMARY",                       "status": "critical", "team": "Database",    "sla": "99.99%", "incidents_30d": 9},
    {"id": "db-replica",           "label": "POSTGRES-DB-REPLICA",                       "status": "warning",  "team": "Database",    "sla": "99.9%",  "incidents_30d": 2},
    {"id": "message-queue",        "label": "KAFKA-MESSAGE-QUEUE",                       "status": "healthy",  "team": "Platform",    "sla": "99.9%",  "incidents_30d": 1},
    {"id": "data-pipeline",        "label": "DATA-PIPELINE-SERVICE",                     "status": "warning",  "team": "Data",        "sla": "99.0%",  "incidents_30d": 3},
]

# (source, target) means source DEPENDS ON target
EDGES_RAW = [
    ("api-gateway",       "meridian-query"),
    ("api-gateway",       "meridian-order"),
    ("api-gateway",       "payment-gateway"),
    ("api-gateway",       "auth-service"),
    ("meridian-query",    "sb-service-order"),
    ("meridian-query",    "sb-service-query"),
    ("meridian-query",    "active-advisory"),
    ("meridian-query",    "ipbol-account"),
    ("meridian-query",    "ipbol-account-green"),
    ("meridian-query",    "ipbol-contact-sync"),
    ("meridian-query",    "ipbol-doc-delivery"),
    ("meridian-query",    "ipbol-doc-domain"),
    ("meridian-query",    "ipbol-doc-domain-g"),
    ("meridian-query",    "ipbol-investments"),
    ("meridian-query",    "ipbol-manager-auth"),
    ("meridian-query",    "auth-service"),
    ("meridian-query",    "cache-layer"),
    ("meridian-order",    "sb-service-order"),
    ("meridian-order",    "auth-service"),
    ("meridian-order",    "payment-gateway"),
    ("meridian-order",    "email-notification"),
    ("meridian-order",    "message-queue"),
    ("payment-gateway",   "db-primary"),
    ("payment-gateway",   "cache-layer"),
    ("payment-gateway",   "email-notification"),
    ("ipbol-account",     "db-primary"),
    ("ipbol-investments", "db-primary"),
    ("ipbol-doc-domain",  "db-primary"),
    ("email-notification","message-queue"),
    ("data-pipeline",     "db-replica"),
    ("data-pipeline",     "message-queue"),
]

# Precompute adjacency maps once at startup
NODE_MAP = {n["id"]: n for n in NODES}

forward_adj: dict[str, list[str]] = {n["id"]: [] for n in NODES}
reverse_adj: dict[str, list[str]] = {n["id"]: [] for n in NODES}

for src, dst in EDGES_RAW:
    forward_adj[src].append(dst)
    reverse_adj[dst].append(src)


def bfs(start_id: str, adj: dict[str, list[str]]) -> list[str]:
    visited: set[str] = {start_id}
    queue: deque[str] = deque([start_id])
    result: list[str] = []
    while queue:
        curr = queue.popleft()
        for neighbor in adj.get(curr, []):
            if neighbor not in visited:
                visited.add(neighbor)
                result.append(neighbor)
                queue.append(neighbor)
    return result


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/api/health-summary")
def get_health_summary():
    return HEALTH_SUMMARY

@app.get("/api/ai-analysis")
def get_ai_analysis():
    return AI_ANALYSIS

@app.get("/api/regional-status")
def get_regional_status():
    return REGIONAL_STATUS

@app.get("/api/critical-apps")
def get_critical_apps():
    return CRITICAL_APPS

@app.get("/api/incident-trends")
def get_incident_trends():
    return INCIDENT_TRENDS

@app.get("/api/graph/nodes")
def get_all_nodes():
    return NODES

@app.get("/api/graph/dependencies/{service_id}")
def get_dependencies(service_id: str):
    if service_id not in NODE_MAP:
        raise HTTPException(status_code=404, detail=f"Service '{service_id}' not found")
    dep_ids = bfs(service_id, forward_adj)
    root = NODE_MAP[service_id]
    dependencies = [NODE_MAP[i] for i in dep_ids if i in NODE_MAP]
    edges = [{"source": service_id, "target": t} for t in forward_adj.get(service_id, [])]
    return {"root": root, "dependencies": dependencies, "edges": edges}

@app.get("/api/graph/blast-radius/{service_id}")
def get_blast_radius(service_id: str):
    if service_id not in NODE_MAP:
        raise HTTPException(status_code=404, detail=f"Service '{service_id}' not found")
    impacted_ids = bfs(service_id, reverse_adj)
    root = NODE_MAP[service_id]
    impacted = [NODE_MAP[i] for i in impacted_ids if i in NODE_MAP]
    edges = [{"source": s, "target": service_id} for s in reverse_adj.get(service_id, [])]
    return {"root": root, "impacted": impacted, "edges": edges}
