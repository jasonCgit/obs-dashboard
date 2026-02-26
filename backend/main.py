from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from collections import deque
from datetime import datetime
import copy

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
        "seal": "SEAL - 90083",
        "status": "critical",
        "current_issues": 5,
        "recurring_30d": 12,
        "last_incident": "15m ago",
        "recent_issues": [
            {"description": "Database connection timeout - Unable to process collateral calculations", "time_ago": "15m ago", "severity": "critical"},
            {"description": "High response time (>5s) on /api/margin endpoint", "time_ago": "45m ago", "severity": "warning"},
            {"description": "Memory usage at 85%", "time_ago": "2h ago", "severity": "warning"},
        ],
    },
    {
        "id": "client-service-case",
        "name": "CLIENT SERVICE CASE MANAGEMENT",
        "seal": "SEAL - 88652",
        "status": "critical",
        "current_issues": 4,
        "recurring_30d": 15,
        "last_incident": "5m ago",
        "recent_issues": [
            {"description": "Database server unreachable - All case updates failing", "time_ago": "5m ago", "severity": "critical"},
            {"description": "Case queue backed up with 10,000+ pending items", "time_ago": "20m ago", "severity": "critical"},
            {"description": "Assignment failure rate increased to 12%", "time_ago": "4h ago", "severity": "warning"},
        ],
    },
]

ACTIVE_INCIDENTS = {
    "p1": {
        "total": 0,
        "breakdown": [],
    },
    "p2": {
        "total": 1,
        "breakdown": [
            {"label": "Reassigned", "count": 1, "color": "#60a5fa"},
        ],
    },
    "convey": {
        "total": 4,
        "breakdown": [
            {"label": "Unresolved", "count": 2, "color": "#60a5fa"},
            {"label": "Resolved",   "count": 2, "color": "#fbbf24"},
        ],
    },
    "spectrum": {
        "total": 4,
        "breakdown": [
            {"label": "Info", "count": 3, "color": "#60a5fa"},
            {"label": "High", "count": 1, "color": "#f44336"},
        ],
    },
}

RECENT_ACTIVITIES = [
    {
        "category": "P1 INCIDENTS",
        "items": [],
    },
    {
        "category": "P2 INCIDENTS",
        "items": [
            {"status": "REASSIGNED", "status_type": "info",
             "description": "Cannot load the review page", "time_ago": "25m ago"},
        ],
    },
    {
        "category": "CONVEY NOTIFICATIONS",
        "items": [
            {"status": "UNRESOLVED", "status_type": "warning",
             "description": "Starting February 26th, all Flipper tasks targeting Production Load Balancers will be blocked and need to be re-targeted to new Flipper feature toggles.", "time_ago": "22h ago"},
            {"status": "RESOLVED",   "status_type": "success",
             "description": "Rest of the NAMR alerts are ready to review as well.", "time_ago": "23h ago"},
            {"status": "UNRESOLVED", "status_type": "warning",
             "description": "Fees and Billing — Invoice delivery functionality will be down for 15 minutes between 8–10 PM ET for maintenance.", "time_ago": "1d ago"},
        ],
    },
    {
        "category": "SPECTRUM ALERTS",
        "items": [
            {"status": "INFO", "status_type": "info",
             "description": "Please note for EMEA MAS, SPMMA has migrated 501388 and 72301 to Axis. Remaining accounts will be migrated in subsequent phases.", "time_ago": "20h ago"},
        ],
    },
]

FREQUENT_INCIDENTS = [
    {
        "app": "Payment Gateway API",
        "seal": "90083",
        "status": "critical",
        "description": "Database timeout",
        "occurrences": 12,
        "last_seen": "15m ago",
    },
    {
        "app": "Email Notification Service",
        "seal": "85421",
        "status": "error",
        "description": "SMTP connection failure",
        "occurrences": 8,
        "last_seen": "2h ago",
    },
    {
        "app": "User Authentication",
        "seal": "92156",
        "status": "warning",
        "description": "Elevated login failures",
        "occurrences": 5,
        "last_seen": "4h ago",
    },
    {
        "app": "Trade Execution Engine",
        "seal": "90215",
        "status": "critical",
        "description": "Order queue backlog >500",
        "occurrences": 4,
        "last_seen": "6h ago",
    },
]

# 90-day incident trend — deterministic, split into P1 / P2
def _build_incident_trends():
    p1_base = [0,0,1,0,0,0,1,0,0,1, 0,0,0,0,0,0,0,0,1,0,
               0,0,1,0,0,0,0,0,1,0, 0,0,0,0,0,1,0,0,0,0,
               1,0,0,0,0,0,1,0,1,0, 0,0,0,1,0,0,0,0,1,0,
               0,0,0,1,0,0,0,0,1,0, 0,0,0,0,1,0,0,0,0,1,
               0,0,1,0,0,0,1,0,0,0]
    p2_base = [1,0,1,1,0,0,2,1,0,1, 1,0,0,1,0,0,0,1,1,0,
               0,1,1,1,0,0,1,0,1,0, 1,0,1,0,0,1,1,0,0,1,
               1,0,0,1,0,0,1,1,2,0, 0,1,0,1,1,0,0,1,1,0,
               1,0,0,1,1,0,1,0,1,1, 0,0,1,0,1,1,0,0,1,2,
               0,1,1,0,1,0,1,1,0,0]
    p1_spikes = {15:3, 16:4, 30:2, 31:3, 45:4, 46:2, 60:3, 75:4, 76:3, 88:4, 89:3}
    p2_spikes = {15:6, 16:8, 30:5, 31:7, 45:7, 46:5, 60:6, 75:7, 76:5, 88:8, 89:7}
    return [
        {
            "day": i + 1,
            "p1": p1_spikes.get(i + 1, p1_base[i]),
            "p2": p2_spikes.get(i + 1, p2_base[i]),
        }
        for i in range(90)
    ]

INCIDENT_TRENDS = _build_incident_trends()

# ── Knowledge Graph ───────────────────────────────────────────────────────────

NODES = [
    # Core platform services
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

    # SPIEQ cluster (Spectrum Portfolio Mgmt — Equities)
    {"id": "spieq-ui-service",       "label": "SPIEQ-UI-SERVICE",               "status": "healthy",  "team": "SPIEQ Platform",   "sla": "99.9%",  "incidents_30d": 1},
    {"id": "spieq-api-gateway",      "label": "SPIEQ-API-GATEWAY",              "status": "warning",  "team": "SPIEQ Platform",   "sla": "99.99%", "incidents_30d": 4},
    {"id": "spieq-trade-service",    "label": "SPIEQ-TRADE-SERVICE",            "status": "critical", "team": "SPIEQ Trading",    "sla": "99.9%",  "incidents_30d": 6},
    {"id": "spieq-portfolio-svc",    "label": "SPIEQ-PORTFOLIO-SERVICE",         "status": "healthy",  "team": "SPIEQ Trading",    "sla": "99.5%",  "incidents_30d": 1},
    {"id": "spieq-pricing-engine",   "label": "SPIEQ-PRICING-ENGINE",           "status": "warning",  "team": "SPIEQ Quant",      "sla": "99.9%",  "incidents_30d": 3},
    {"id": "spieq-risk-service",     "label": "SPIEQ-RISK-SERVICE",             "status": "critical", "team": "SPIEQ Risk",       "sla": "99.99%", "incidents_30d": 5},
    {"id": "spieq-order-router",     "label": "SPIEQ-ORDER-ROUTER",             "status": "healthy",  "team": "SPIEQ Trading",    "sla": "99.9%",  "incidents_30d": 1},
    {"id": "spieq-market-data",      "label": "SPIEQ-MARKET-DATA-FEED",         "status": "warning",  "team": "SPIEQ Quant",      "sla": "99.9%",  "incidents_30d": 3},
    {"id": "spieq-compliance-svc",   "label": "SPIEQ-COMPLIANCE-SERVICE",       "status": "healthy",  "team": "SPIEQ Compliance", "sla": "99.5%",  "incidents_30d": 0},
    {"id": "spieq-settlement-svc",   "label": "SPIEQ-SETTLEMENT-SERVICE",       "status": "warning",  "team": "SPIEQ Settlement", "sla": "99.5%",  "incidents_30d": 2},
    {"id": "spieq-audit-trail",      "label": "SPIEQ-AUDIT-TRAIL",              "status": "healthy",  "team": "SPIEQ Compliance", "sla": "99.0%",  "incidents_30d": 0},
    {"id": "spieq-notif-svc",        "label": "SPIEQ-NOTIFICATION-SERVICE",     "status": "healthy",  "team": "SPIEQ Platform",   "sla": "99.5%",  "incidents_30d": 1},

    # CONNECT cluster (Advisor Connect + Connect OS)
    {"id": "connect-portal",          "label": "CONNECT-PORTAL",                  "status": "healthy",  "team": "Connect Platform",  "sla": "99.9%",  "incidents_30d": 0},
    {"id": "connect-cloud-gw",        "label": "CONNECT-CLOUD-GATEWAY",           "status": "healthy",  "team": "Connect Platform",  "sla": "99.99%", "incidents_30d": 0},
    {"id": "connect-profile-svc",     "label": "CONNECT-SERVICE-PROFILE-SERVICE", "status": "warning",  "team": "Connect Identity",  "sla": "99.5%",  "incidents_30d": 2},
    {"id": "connect-auth-svc",        "label": "CONNECT-AUTH-SERVICE",            "status": "healthy",  "team": "Connect Identity",  "sla": "99.99%", "incidents_30d": 0},
    {"id": "connect-notification",    "label": "CONNECT-NOTIFICATION-SERVICE",    "status": "warning",  "team": "Connect Messaging", "sla": "99.5%",  "incidents_30d": 2},
    {"id": "connect-data-sync",       "label": "CONNECT-DATA-SYNC-SERVICE",      "status": "healthy",  "team": "Connect Data",      "sla": "99.0%",  "incidents_30d": 1},
    {"id": "connect-coverage-app",    "label": "CONNECT-COVERAGE-APP",            "status": "warning",  "team": "Connect CRM",       "sla": "99.5%",  "incidents_30d": 3},
    {"id": "connect-home-app-na",     "label": "CONNECT-HOME-APP-NA",             "status": "healthy",  "team": "Connect Platform",  "sla": "99.9%",  "incidents_30d": 0},
    {"id": "connect-home-app-apac",   "label": "CONNECT-HOME-APP-APAC",           "status": "warning",  "team": "Connect Platform",  "sla": "99.9%",  "incidents_30d": 2},
    {"id": "connect-home-app-emea",   "label": "CONNECT-HOME-APP-EMEA",           "status": "healthy",  "team": "Connect Platform",  "sla": "99.9%",  "incidents_30d": 1},
    {"id": "connect-team-mgr",        "label": "CONNECT-TEAM-MANAGER",            "status": "healthy",  "team": "Connect HR",        "sla": "99.5%",  "incidents_30d": 0},
    {"id": "connect-search-svc",      "label": "CONNECT-SEARCH-SERVICE",          "status": "healthy",  "team": "Connect Platform",  "sla": "99.0%",  "incidents_30d": 1},
    {"id": "connect-pref-svc",        "label": "CONNECT-PREFERENCES-SERVICE",     "status": "healthy",  "team": "Connect Identity",  "sla": "99.0%",  "incidents_30d": 0},
    {"id": "connect-audit-svc",       "label": "CONNECT-AUDIT-SERVICE",           "status": "healthy",  "team": "Connect Compliance", "sla": "99.0%", "incidents_30d": 0},
    {"id": "connect-doc-svc",         "label": "CONNECT-DOCUMENT-SERVICE",        "status": "warning",  "team": "Connect Documents", "sla": "99.5%",  "incidents_30d": 2},
    {"id": "connect-session-svc",     "label": "CONNECT-SESSION-SERVICE",         "status": "healthy",  "team": "Connect Identity",  "sla": "99.9%",  "incidents_30d": 0},
    {"id": "connect-config-svc",      "label": "CONNECT-CONFIG-SERVICE",          "status": "healthy",  "team": "Connect Platform",  "sla": "99.0%",  "incidents_30d": 0},
    {"id": "connect-metrics-svc",     "label": "CONNECT-METRICS-COLLECTOR",       "status": "healthy",  "team": "Connect Observability", "sla": "99.0%", "incidents_30d": 0},
]

# (source, target) means source DEPENDS ON target
EDGES_RAW = [
    # Core platform edges
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

    # SPIEQ cluster — comprehensive dependency tree
    ("spieq-ui-service",       "spieq-api-gateway"),
    ("spieq-api-gateway",      "spieq-trade-service"),
    ("spieq-api-gateway",      "spieq-portfolio-svc"),
    ("spieq-api-gateway",      "spieq-pricing-engine"),
    ("spieq-api-gateway",      "auth-service"),
    ("spieq-api-gateway",      "spieq-compliance-svc"),
    ("spieq-api-gateway",      "spieq-market-data"),
    ("spieq-trade-service",    "spieq-risk-service"),
    ("spieq-trade-service",    "spieq-pricing-engine"),
    ("spieq-trade-service",    "db-primary"),
    ("spieq-trade-service",    "message-queue"),
    ("spieq-trade-service",    "spieq-order-router"),
    ("spieq-trade-service",    "spieq-settlement-svc"),
    ("spieq-trade-service",    "spieq-audit-trail"),
    ("spieq-pricing-engine",   "cache-layer"),
    ("spieq-pricing-engine",   "spieq-market-data"),
    ("spieq-portfolio-svc",    "db-primary"),
    ("spieq-portfolio-svc",    "cache-layer"),
    ("spieq-risk-service",     "db-primary"),
    ("spieq-risk-service",     "cache-layer"),
    ("spieq-risk-service",     "spieq-market-data"),
    ("spieq-order-router",     "message-queue"),
    ("spieq-order-router",     "spieq-risk-service"),
    ("spieq-market-data",      "cache-layer"),
    ("spieq-market-data",      "db-replica"),
    ("spieq-compliance-svc",   "db-primary"),
    ("spieq-compliance-svc",   "spieq-audit-trail"),
    ("spieq-settlement-svc",   "db-primary"),
    ("spieq-settlement-svc",   "message-queue"),
    ("spieq-audit-trail",      "db-replica"),
    ("spieq-notif-svc",        "message-queue"),

    # CONNECT cluster — Advisor Connect (connect-profile-svc) dependencies
    ("connect-profile-svc",    "db-primary"),
    ("connect-profile-svc",    "connect-data-sync"),
    ("connect-profile-svc",    "connect-coverage-app"),
    ("connect-profile-svc",    "cache-layer"),
    ("connect-profile-svc",    "connect-pref-svc"),
    ("connect-profile-svc",    "connect-audit-svc"),
    ("connect-profile-svc",    "connect-notification"),
    ("connect-coverage-app",   "db-primary"),
    ("connect-coverage-app",   "connect-notification"),
    ("connect-coverage-app",   "cache-layer"),
    ("connect-coverage-app",   "connect-doc-svc"),
    ("connect-pref-svc",       "db-replica"),
    ("connect-pref-svc",       "cache-layer"),
    ("connect-audit-svc",      "db-replica"),
    ("connect-audit-svc",      "message-queue"),
    ("connect-doc-svc",        "db-primary"),
    ("connect-doc-svc",        "connect-data-sync"),
    ("connect-data-sync",      "db-replica"),
    ("connect-notification",   "message-queue"),

    # CONNECT cluster — Connect OS (connect-cloud-gw) dependencies
    ("connect-portal",           "connect-cloud-gw"),
    ("connect-cloud-gw",         "connect-profile-svc"),
    ("connect-cloud-gw",         "connect-auth-svc"),
    ("connect-cloud-gw",         "connect-notification"),
    ("connect-cloud-gw",         "connect-home-app-na"),
    ("connect-cloud-gw",         "connect-home-app-apac"),
    ("connect-cloud-gw",         "connect-home-app-emea"),
    ("connect-cloud-gw",         "connect-team-mgr"),
    ("connect-cloud-gw",         "connect-search-svc"),
    ("connect-cloud-gw",         "connect-doc-svc"),
    ("connect-cloud-gw",         "connect-session-svc"),
    ("connect-cloud-gw",         "connect-config-svc"),
    ("connect-cloud-gw",         "connect-metrics-svc"),
    ("connect-home-app-na",      "connect-profile-svc"),
    ("connect-home-app-na",      "connect-auth-svc"),
    ("connect-home-app-apac",    "connect-profile-svc"),
    ("connect-home-app-apac",    "connect-auth-svc"),
    ("connect-home-app-emea",    "connect-profile-svc"),
    ("connect-home-app-emea",    "connect-auth-svc"),
    ("connect-team-mgr",         "db-primary"),
    ("connect-team-mgr",         "connect-auth-svc"),
    ("connect-search-svc",       "cache-layer"),
    ("connect-search-svc",       "db-replica"),
    ("connect-auth-svc",         "cache-layer"),
    ("connect-session-svc",      "cache-layer"),
    ("connect-config-svc",       "db-replica"),
    ("connect-metrics-svc",      "message-queue"),
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

@app.get("/api/frequent-incidents")
def get_frequent_incidents():
    return FREQUENT_INCIDENTS

@app.get("/api/active-incidents")
def get_active_incidents():
    return ACTIVE_INCIDENTS

@app.get("/api/recent-activities")
def get_recent_activities():
    return RECENT_ACTIVITIES

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

    # Return ALL edges within the subgraph, not just root edges
    subgraph_ids = {service_id} | set(dep_ids)
    edges = []
    for src, dst in EDGES_RAW:
        if src in subgraph_ids and dst in subgraph_ids:
            edges.append({"source": src, "target": dst})

    return {"root": root, "dependencies": dependencies, "edges": edges}

@app.get("/api/graph/blast-radius/{service_id}")
def get_blast_radius(service_id: str):
    if service_id not in NODE_MAP:
        raise HTTPException(status_code=404, detail=f"Service '{service_id}' not found")
    impacted_ids = bfs(service_id, reverse_adj)
    root = NODE_MAP[service_id]
    impacted = [NODE_MAP[i] for i in impacted_ids if i in NODE_MAP]

    # Return ALL edges within the subgraph
    subgraph_ids = {service_id} | set(impacted_ids)
    edges = []
    for src, dst in EDGES_RAW:
        if src in subgraph_ids and dst in subgraph_ids:
            edges.append({"source": src, "target": dst})

    return {"root": root, "impacted": impacted, "edges": edges}


# ── Announcements CRUD ────────────────────────────────────────────────────────

class AnnouncementCreate(BaseModel):
    type: str  # maintenance, incident, security, general, info
    title: str
    body: str
    author: str
    tags: list[str] = []
    pinned: bool = False

class AnnouncementUpdate(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = None
    body: Optional[str] = None
    author: Optional[str] = None
    tags: Optional[list[str]] = None
    pinned: Optional[bool] = None

_next_announcement_id = 8

ANNOUNCEMENTS = [
    {
        "id": 1, "type": "incident", "pinned": True, "status": "open",
        "title": "Active: Payment Gateway & Email Service Degradation",
        "body": "Two critical services are currently experiencing degraded performance. Payment Gateway API (SEAL-88451) has a database connection pool issue. Email Notification Service (SEAL-86001) has SMTP connectivity loss. Both teams are actively working on resolution. ETA: 2h.",
        "author": "Platform NOC",
        "date": "2026-02-25 09:45 UTC",
        "tags": ["P1", "Active"],
    },
    {
        "id": 2, "type": "maintenance", "pinned": True, "status": "open",
        "title": "Scheduled Maintenance: POSTGRES-DB-PRIMARY — 2026-02-26 02:00–04:00 UTC",
        "body": "Planned maintenance window for the primary PostgreSQL cluster. This includes connection pool reconfiguration (50→150 connections) and application of security patch PSQ-2024-119. Services PAYMENT GATEWAY API and IPBOL applications will have read-only access during this window. Write operations will be queued.",
        "author": "Database Team",
        "date": "2026-02-25 08:00 UTC",
        "tags": ["Planned", "DB"],
    },
    {
        "id": 3, "type": "security", "pinned": False, "status": "open",
        "title": "Action Required: Rotate SMTP Credentials by 2026-03-01",
        "body": "Following the Email Notification Service incident, the Security team has identified that secondary SMTP credentials were last rotated 18 months ago, exceeding our 90-day rotation policy. All teams using external SMTP providers must rotate credentials by 2026-03-01. Runbook: https://wiki/smtp-rotation.",
        "author": "Security Team",
        "date": "2026-02-25 10:30 UTC",
        "tags": ["Action Required"],
    },
    {
        "id": 4, "type": "general", "pinned": False, "status": "open",
        "title": "Post-Incident Review: MERIDIAN SERVICE-QUERY V1 Latency — 2026-02-24",
        "body": "PIR scheduled for 2026-02-26 14:00 UTC. Root cause: missing compound index on doc_domain.account_ref column introduced in migration 2024-218. Fix deployed. Contributing factor: no automated index coverage check in CI pipeline. Action items to be discussed in PIR.",
        "author": "Trading Engineering",
        "date": "2026-02-25 07:00 UTC",
        "tags": ["PIR", "Resolved"],
    },
    {
        "id": 5, "type": "info", "pinned": False, "status": "open",
        "title": "New Feature: Blast Radius View in Knowledge Graph",
        "body": "The Knowledge Graph explorer now supports Blast Radius mode. Select any service and toggle to \"Blast Radius\" to instantly visualise all upstream services that depend on it. Useful for assessing incident impact scope before initiating changes.",
        "author": "Platform Tools Team",
        "date": "2026-02-24 16:00 UTC",
        "tags": ["New Feature"],
    },
    {
        "id": 6, "type": "maintenance", "pinned": False, "status": "closed",
        "title": "Completed: API-GATEWAY TLS Certificate Renewal",
        "body": "TLS certificates for API-GATEWAY (SEAL-70001) were renewed without service interruption on 2026-02-24. New certificate expiry: 2027-02-24. No action required from application teams.",
        "author": "Platform NOC",
        "date": "2026-02-24 11:00 UTC",
        "tags": ["Completed"],
    },
    {
        "id": 7, "type": "info", "pinned": False, "status": "closed",
        "title": "Reminder: SLO Review Meeting — 2026-02-27 10:00 UTC",
        "body": "Quarterly SLO review for all platform services. Please review your team's current SLO performance in the SLO Corrector dashboard before the meeting. Agenda: Q1 2026 SLO retrospective, error budget policy updates, and new target proposals for H1 2026.",
        "author": "Platform Engineering",
        "date": "2026-02-23 09:00 UTC",
        "tags": ["Meeting"],
    },
]


@app.get("/api/announcements")
def get_announcements(status: Optional[str] = None, search: Optional[str] = None):
    results = ANNOUNCEMENTS
    if status:
        results = [a for a in results if a["status"] == status]
    if search:
        q = search.lower()
        results = [a for a in results if q in a["title"].lower() or q in a["body"].lower() or q in a["author"].lower()]
    return results


@app.post("/api/announcements")
def create_announcement(payload: AnnouncementCreate):
    global _next_announcement_id
    new = {
        "id": _next_announcement_id,
        "type": payload.type,
        "title": payload.title,
        "body": payload.body,
        "author": payload.author,
        "tags": payload.tags,
        "pinned": payload.pinned,
        "status": "open",
        "date": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
    }
    _next_announcement_id += 1
    ANNOUNCEMENTS.insert(0, new)
    return new


@app.put("/api/announcements/{announcement_id}")
def update_announcement(announcement_id: int, payload: AnnouncementUpdate):
    ann = next((a for a in ANNOUNCEMENTS if a["id"] == announcement_id), None)
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    if payload.type is not None:
        ann["type"] = payload.type
    if payload.title is not None:
        ann["title"] = payload.title
    if payload.body is not None:
        ann["body"] = payload.body
    if payload.author is not None:
        ann["author"] = payload.author
    if payload.tags is not None:
        ann["tags"] = payload.tags
    if payload.pinned is not None:
        ann["pinned"] = payload.pinned
    return ann


@app.patch("/api/announcements/{announcement_id}/status")
def toggle_announcement_status(announcement_id: int):
    ann = next((a for a in ANNOUNCEMENTS if a["id"] == announcement_id), None)
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    ann["status"] = "closed" if ann["status"] == "open" else "open"
    return ann


@app.delete("/api/announcements/{announcement_id}")
def delete_announcement(announcement_id: int):
    global ANNOUNCEMENTS
    before = len(ANNOUNCEMENTS)
    ANNOUNCEMENTS = [a for a in ANNOUNCEMENTS if a["id"] != announcement_id]
    if len(ANNOUNCEMENTS) == before:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return {"ok": True}
