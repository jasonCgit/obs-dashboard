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
        "Currently tracking 2 critical applications affecting approximately 6,220 users. "
        "Payment Gateway API and Email Notification Service experiencing critical "
        "database connectivity and SMTP server failures. Both services showing recurring "
        "patterns indicating systemic infrastructure issues."
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
    {"region": "NA",   "status": "healthy",  "sod_impacts": 0, "app_issues": 0},
    {"region": "EMEA", "status": "healthy",  "sod_impacts": 0, "app_issues": 0},
    {"region": "APAC", "status": "critical", "sod_impacts": 2, "app_issues": 3},
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
    {
        "id": "payment-gateway-api",
        "name": "PAYMENT GATEWAY API",
        "seal": "SEAL - 90176",
        "status": "critical",
        "current_issues": 3,
        "recurring_30d": 8,
        "last_incident": "10m ago",
        "recent_issues": [
            {"description": "Connection pool exhaustion - Max connections reached on primary DB cluster", "time_ago": "10m ago", "severity": "critical"},
            {"description": "SMTP relay timeout affecting transaction confirmation emails", "time_ago": "1h ago", "severity": "warning"},
            {"description": "Latency spike on /api/payments/process (p99 > 8s)", "time_ago": "3h ago", "severity": "warning"},
        ],
    },
]

# 90-day incident trend — deterministic, split into P1 / P2
# P1: ~15 total, max 2, mostly 0s with rare 1-2 spikes
# P2: ~450 total, max ~15, values typically 2-10 per day
def _build_incident_trends():
    """Daily incident data aggregated into weekly buckets (90 days / ~13 weeks).
    P1: ~15 total, max 2/day.  P2: ~480 total, max 15/day."""
    from datetime import date, timedelta

    today = date.today()
    # Build daily data first (same as original)
    p1_days_map = {3:1, 12:1, 17:1, 24:2, 31:1, 38:1, 45:1, 52:2, 58:1, 65:1, 72:1, 80:1, 87:1}
    p2_daily = [
        10, 5, 8, 3, 7, 6, 14, 2, 5, 10,   7, 3, 6, 5, 8, 1, 6, 4, 9, 3,
         5, 3, 8, 1, 4, 6, 3, 8, 4, 5,   7, 2, 4, 3, 8, 6, 5, 2, 4, 7,
         3, 9, 5, 3, 12, 4, 6, 2, 11, 3,  4, 5, 3, 7, 6, 2, 4, 8, 3, 5,
         7, 2, 15, 8, 4, 3, 5, 7, 2, 11,  4, 5, 3, 6, 10, 7, 2, 10, 5, 3,
         4, 2, 6, 3, 5, 4, 9, 3, 2, 1,
    ]
    daily = []
    for i in range(90):
        d = today - timedelta(days=89 - i)
        daily.append({
            "date": d,
            "p1": p1_days_map.get(i + 1, 0),
            "p2": p2_daily[i],
        })

    # Aggregate into weeks (Mon-Sun)
    weeks = {}
    for day in daily:
        # ISO week start (Monday)
        wk_start = day["date"] - timedelta(days=day["date"].weekday())
        key = wk_start.strftime("%Y-%m-%d")
        if key not in weeks:
            weeks[key] = {"week": key, "label": wk_start.strftime("%b %d"), "p1": 0, "p2": 0}
        weeks[key]["p1"] += day["p1"]
        weeks[key]["p2"] += day["p2"]

    return sorted(weeks.values(), key=lambda w: w["week"])

INCIDENT_TRENDS = _build_incident_trends()

INCIDENT_TREND_SUMMARY = {
    "mttr_hours": 2.4,
    "mtta_minutes": 8,
    "resolution_rate": 94.2,
    "escalation_rate": 12,
}

# Derive last-week P1/P2 from incident trends (with trend vs previous week)
_last_week = INCIDENT_TRENDS[-1] if INCIDENT_TRENDS else {"p1": 0, "p2": 0}
_prev_week = INCIDENT_TRENDS[-2] if len(INCIDENT_TRENDS) >= 2 else {"p1": 0, "p2": 0}
_p1_wk = _last_week["p1"]
_p2_wk = _last_week["p2"]
_p1_prev = _prev_week["p1"]
_p2_prev = _prev_week["p2"]
_p1_trend = round((_p1_wk - _p1_prev) / _p1_prev * 100) if _p1_prev else 0
_p2_trend = round((_p2_wk - _p2_prev) / _p2_prev * 100) if _p2_prev else 0

ACTIVE_INCIDENTS = {
    "week_label": "Last 7 Days",
    "p1": {
        "total": _p1_wk,
        "trend": _p1_trend,
        "breakdown": [
            {"label": "Unresolved", "count": max(0, _p1_wk),  "color": "#f44336"},
            {"label": "Resolved",   "count": 0,               "color": "#4ade80"},
        ],
    },
    "p2": {
        "total": _p2_wk,
        "trend": _p2_trend,
        "breakdown": [
            {"label": "Unresolved", "count": max(1, _p2_wk // 3),                          "color": "#ffab00"},
            {"label": "Resolved",   "count": max(0, _p2_wk - max(1, _p2_wk // 3)),         "color": "#4ade80"},
        ],
    },
    "convey": {
        "total": 4,
        "trend": -20,
        "breakdown": [
            {"label": "Unresolved", "count": 2, "color": "#60a5fa"},
            {"label": "Resolved",   "count": 2, "color": "#4ade80"},
        ],
    },
    "spectrum": {
        "total": 4,
        "trend": 0,
        "breakdown": [
            {"label": "Info", "count": 3, "color": "#60a5fa"},
            {"label": "High", "count": 1, "color": "#f44336"},
        ],
    },
}

RECENT_ACTIVITIES = [
    {
        "category": "P1 INCIDENTS",
        "color": "#f44336",
        "items": [
            {"status": "CRITICAL", "description": "Payment Gateway API — Connection pool exhaustion on primary DB cluster", "time_ago": "10m ago"},
        ],
    },
    {
        "category": "P2 INCIDENTS",
        "color": "#ff9800",
        "items": [
            {"status": "REASSIGNED", "description": "Cannot load the review page — reassigned to Platform Team", "time_ago": "25m ago"},
            {"status": "UNRESOLVED", "description": "Fees & Billing invoice delivery down for maintenance window 8–10 PM ET", "time_ago": "3h ago"},
        ],
    },
    {
        "category": "CONVEY NOTIFICATIONS",
        "color": "#60a5fa",
        "items": [
            {"status": "UNRESOLVED", "description": "Starting Feb 26, all Flipper tasks targeting Production Load Balancers will be blocked and need to be re-targeted.", "time_ago": "22h ago"},
            {"status": "RESOLVED", "description": "Rest of the NAMR alerts are ready to review.", "time_ago": "23h ago"},
            {"status": "UNRESOLVED", "description": "Fees and Billing — Invoice delivery will be down 15 min between 8–10 PM ET for maintenance.", "time_ago": "1d ago"},
        ],
    },
    {
        "category": "SPECTRUM ALERTS",
        "color": "#a78bfa",
        "items": [
            {"status": "INFO", "description": "EMEA MAS: SPMMA has migrated accounts 501388 and 72301 to Axis. Remaining accounts in subsequent phases.", "time_ago": "20h ago"},
            {"status": "WARNING", "description": "Elevated login failure rate on User Authentication service (SEAL-92156)", "time_ago": "4h ago"},
        ],
    },
    {
        "category": "DEPLOYMENTS",
        "color": "#4ade80",
        "items": [
            {"status": "SUCCESS", "description": "Connect OS v3.14.2 deployed to production (SEAL-88180)", "time_ago": "22m ago"},
            {"status": "SUCCESS", "description": "Advisor Connect hotfix v2.8.1 — DB connection pool fix rolled out", "time_ago": "1h ago"},
            {"status": "SUCCESS", "description": "Trade Execution Engine v5.2.0 deployed — order queue optimization", "time_ago": "8h ago"},
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
    return {"data": INCIDENT_TRENDS, "summary": INCIDENT_TREND_SUMMARY}

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
    title: str
    status: str = "ongoing"  # ongoing, resolved, closed
    severity: str = "none"  # none, standard, major
    impacted_apps: list[str] = []
    start_time: str = ""
    end_time: str = ""
    description: str = ""
    latest_updates: str = ""
    incident_number: str = ""
    impact_type: str = ""
    impact_description: str = ""
    header_message: str = ""
    email_recipients: list[str] = []
    category: str = ""
    region: str = ""
    next_steps: str = ""
    help_info: str = ""
    email_body: str = ""
    channels: dict = {"teams": False, "email": False, "connect": False, "banner": False}
    pinned: bool = False
    # Teams channel config
    teams_channels: list[str] = []
    # Email channel config
    email_source: str = ""
    email_hide_status: bool = False
    # Connect channel config
    connect_dont_send_notification: bool = False
    connect_banner_position: str = "in_ui"
    connect_target_entities: list[str] = []
    connect_target_regions: list[str] = []
    connect_weave_interfaces: list[int] = []

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    severity: Optional[str] = None
    impacted_apps: Optional[list[str]] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    description: Optional[str] = None
    latest_updates: Optional[str] = None
    incident_number: Optional[str] = None
    impact_type: Optional[str] = None
    impact_description: Optional[str] = None
    header_message: Optional[str] = None
    email_recipients: Optional[list[str]] = None
    category: Optional[str] = None
    region: Optional[str] = None
    next_steps: Optional[str] = None
    help_info: Optional[str] = None
    email_body: Optional[str] = None
    channels: Optional[dict] = None
    pinned: Optional[bool] = None
    teams_channels: Optional[list[str]] = None
    email_source: Optional[str] = None
    email_hide_status: Optional[bool] = None
    connect_dont_send_notification: Optional[bool] = None
    connect_banner_position: Optional[str] = None
    connect_target_entities: Optional[list[str]] = None
    connect_target_regions: Optional[list[str]] = None
    connect_weave_interfaces: Optional[list[int]] = None

_next_announcement_id = 1

WEAVE_INTERFACES = [
    {"id": 0, "ui_title": "Docusign eSign", "ui_name": "ConnectHomeEmbedDocusignWindow", "weave_function": "GWMConnectHomeView", "seal_id": "103845"},
    {"id": 1, "ui_title": "Conversations", "ui_name": "ConversationsMainWindow", "weave_function": "GWMConnectCallMemoRead", "seal_id": "90176"},
    {"id": 2, "ui_title": "EML/PLC Dashboard", "ui_name": "CreditConnect-GCM-EMLPLCDashboard", "weave_function": "GWMConnectCollateralMonitoringView", "seal_id": "90083"},
    {"id": 3, "ui_title": "EML Rule Maintenance", "ui_name": "CreditConnect-EML-Rule-Maintenance", "weave_function": "GWMConnectCollateralMonitoringView", "seal_id": "90083"},
    {"id": 4, "ui_title": "OnboardingConnectKycComp...", "ui_name": "OnboardingConnectKycComparisonManager", "weave_function": "OnboardingConnectLaunch", "seal_id": "84874"},
]

ANNOUNCEMENTS = [
    {
        "id": 5, "title": "Advisor Connect — Degraded Performance in EMEA",
        "status": "ongoing", "severity": "major",
        "impacted_apps": ["Advisor Connect (90176)"],
        "start_time": "2026-02-26 06:30 UTC", "end_time": "",
        "description": "Advisor Connect is experiencing elevated latency and intermittent timeouts for EMEA users. The platform team is actively investigating the root cause.",
        "latest_updates": "06:45 UTC — Identified database connection pool exhaustion in FRA region. Scaling operations in progress.",
        "incident_number": "INC-2026-0412",
        "impact_type": "Performance", "impact_description": "Users may experience slow page loads and occasional 504 errors.",
        "header_message": "Degraded performance impacting EMEA clients",
        "email_recipients": ["emea-ops@jpmchase.com", "connect-oncall@jpmchase.com"],
        "category": "Infrastructure", "region": "EMEA",
        "next_steps": "Database team scaling connection pools; ETA 30 min.",
        "help_info": "Contact the Connect Operations Center at ext. 4-7890",
        "email_body": "<p>Advisor Connect is currently experiencing degraded performance in the EMEA region.</p>",
        "channels": {"teams": True, "email": True, "connect": True, "banner": True},
        "pinned": True,
        "teams_channels": ["#connect-incidents", "#emea-operations"],
        "email_source": "Technology",
        "email_hide_status": False,
        "connect_dont_send_notification": False,
        "connect_banner_position": "in_ui",
        "connect_target_entities": ["FRA-PB", "LON-PB"],
        "connect_target_regions": ["EMEA"],
        "connect_weave_interfaces": [1],
        "ann_status": "open", "author": "J. Martinez",
        "date": "2026-02-26 06:30 UTC",
    },
    {
        "id": 4, "title": "Spectrum Portfolio Mgmt — Scheduled Maintenance Window",
        "status": "ongoing", "severity": "standard",
        "impacted_apps": ["Spectrum Portfolio Mgmt (90215)"],
        "start_time": "2026-02-27 02:00 UTC", "end_time": "2026-02-27 06:00 UTC",
        "description": "Scheduled maintenance for Spectrum Portfolio Management. The system will be unavailable during the maintenance window for database migration.",
        "latest_updates": "",
        "incident_number": "CHG-2026-1188",
        "impact_type": "Availability", "impact_description": "Full outage during maintenance window. Read-only mode 30 min before.",
        "header_message": "Planned downtime — Spectrum Portfolio Mgmt",
        "email_recipients": ["spectrum-users@jpmchase.com"],
        "category": "Maintenance", "region": "Global",
        "next_steps": "No action required. System will auto-recover after maintenance.",
        "help_info": "Reach out to Spectrum Support on ServiceNow",
        "email_body": "",
        "channels": {"teams": True, "email": True, "connect": False, "banner": True},
        "pinned": False,
        "teams_channels": ["#spectrum-announcements"],
        "email_source": "Operations",
        "email_hide_status": False,
        "connect_dont_send_notification": False,
        "connect_banner_position": "in_ui",
        "connect_target_entities": [],
        "connect_target_regions": [],
        "connect_weave_interfaces": [],
        "ann_status": "open", "author": "S. Patel",
        "date": "2026-02-25 14:00 UTC",
    },
    {
        "id": 3, "title": "Connect OS — New KYC Comparison Tool Rollout",
        "status": "resolved", "severity": "none",
        "impacted_apps": ["Connect OS (88180)"],
        "start_time": "2026-02-24 09:00 UTC", "end_time": "2026-02-24 09:00 UTC",
        "description": "New KYC Comparison Manager interface is now available in Connect OS for all regions. This release includes enhanced document matching and automated compliance checks.",
        "latest_updates": "Rollout complete to all regions.",
        "incident_number": "",
        "impact_type": "Enhancement", "impact_description": "No negative impact. New feature availability.",
        "header_message": "",
        "email_recipients": [],
        "category": "Release", "region": "Global",
        "next_steps": "Training materials available on the internal wiki.",
        "help_info": "",
        "email_body": "",
        "channels": {"teams": False, "email": False, "connect": True, "banner": False},
        "pinned": False,
        "teams_channels": [],
        "email_source": "",
        "email_hide_status": False,
        "connect_dont_send_notification": True,
        "connect_banner_position": "in_ui",
        "connect_target_entities": ["USA-PB", "USA-JPMS", "LON-PB"],
        "connect_target_regions": ["NA", "EMEA"],
        "connect_weave_interfaces": [4],
        "ann_status": "open", "author": "R. Chen",
        "date": "2026-02-24 09:00 UTC",
    },
    {
        "id": 2, "title": "EML Rule Maintenance — Collateral Monitoring Update",
        "status": "resolved", "severity": "standard",
        "impacted_apps": ["Advisor Connect (90176)"],
        "start_time": "2026-02-23 18:00 UTC", "end_time": "2026-02-23 20:15 UTC",
        "description": "Emergency update applied to EML rule engine to correct margin call calculation logic for APAC collateral pools.",
        "latest_updates": "20:15 UTC — Patch deployed and verified. All margin calculations confirmed accurate.",
        "incident_number": "INC-2026-0398",
        "impact_type": "Data Integrity", "impact_description": "Incorrect margin call values for APAC collateral during affected period.",
        "header_message": "EML rule engine patched",
        "email_recipients": ["credit-ops@jpmchase.com", "apac-risk@jpmchase.com"],
        "category": "Incident", "region": "APAC",
        "next_steps": "Post-incident review scheduled for Feb 28.",
        "help_info": "Contact Credit Risk Operations for reconciliation queries",
        "email_body": "<p>An emergency patch was applied to the EML rule engine.</p>",
        "channels": {"teams": True, "email": True, "connect": False, "banner": False},
        "pinned": False,
        "teams_channels": ["#credit-incidents", "#apac-operations"],
        "email_source": "Risk Management",
        "email_hide_status": False,
        "connect_dont_send_notification": False,
        "connect_banner_position": "in_ui",
        "connect_target_entities": [],
        "connect_target_regions": [],
        "connect_weave_interfaces": [],
        "ann_status": "open", "author": "A. Nakamura",
        "date": "2026-02-23 18:00 UTC",
    },
    {
        "id": 1, "title": "DocuSign eSign — Certificate Renewal Complete",
        "status": "closed", "severity": "none",
        "impacted_apps": [],
        "start_time": "2026-02-20 12:00 UTC", "end_time": "2026-02-20 12:30 UTC",
        "description": "SSL/TLS certificate renewal for DocuSign eSign integration endpoints completed successfully. No user impact was observed.",
        "latest_updates": "Certificates renewed. Monitoring confirmed no errors.",
        "incident_number": "CHG-2026-1145",
        "impact_type": "Security", "impact_description": "None — proactive renewal.",
        "header_message": "",
        "email_recipients": [],
        "category": "Maintenance", "region": "Global",
        "next_steps": "Next renewal scheduled for Aug 2026.",
        "help_info": "",
        "email_body": "",
        "channels": {"teams": False, "email": False, "connect": False, "banner": True},
        "pinned": False,
        "teams_channels": [],
        "email_source": "",
        "email_hide_status": False,
        "connect_dont_send_notification": False,
        "connect_banner_position": "in_ui",
        "connect_target_entities": [],
        "connect_target_regions": [],
        "connect_weave_interfaces": [],
        "ann_status": "closed", "author": "M. Williams",
        "date": "2026-02-20 12:00 UTC",
    },
]
_next_announcement_id = 6


@app.get("/api/announcements")
def get_announcements(status: Optional[str] = None, channel: Optional[str] = None, search: Optional[str] = None):
    results = ANNOUNCEMENTS
    if status:
        results = [a for a in results if a["ann_status"] == status]
    if channel:
        results = [a for a in results if a.get("channels", {}).get(channel, False)]
    if search:
        q = search.lower()
        results = [a for a in results if q in a["title"].lower() or q in a.get("description", "").lower() or q in a.get("author", "").lower()]
    return results


@app.get("/api/announcements/connect/weave-interfaces")
def get_weave_interfaces():
    return WEAVE_INTERFACES


@app.get("/api/announcements/connect/validate")
def validate_connect_selection(entities: str = "", regions: str = ""):
    entity_list = [e.strip() for e in entities.split(",") if e.strip()]
    region_list = [r.strip() for r in regions.split(",") if r.strip()]
    base_per_entity = {
        "CDG-PB": 420, "FRA-PB": 890, "JIB-PB": 310, "LON-PB": 1250,
        "MIL-PB": 380, "USA-PB": 3200, "USA-JPMS": 1800, "USA-CWM": 950, "BAH-ITS": 220,
    }
    total = sum(base_per_entity.get(e, 500) for e in entity_list) if entity_list else 0
    region_str = ", ".join(region_list) if region_list else "all"
    return {"message": f"Announcement will be sent to {total:,} {region_str} Connect users"}


@app.get("/api/announcements/notifications")
def get_notification_announcements():
    return [
        a for a in ANNOUNCEMENTS
        if a.get("channels", {}).get("banner", False) and a.get("ann_status") == "open"
    ]


@app.post("/api/announcements")
def create_announcement(payload: AnnouncementCreate):
    global _next_announcement_id
    new = {
        "id": _next_announcement_id,
        "title": payload.title,
        "status": payload.status,
        "severity": payload.severity,
        "impacted_apps": payload.impacted_apps,
        "start_time": payload.start_time,
        "end_time": payload.end_time,
        "description": payload.description,
        "latest_updates": payload.latest_updates,
        "incident_number": payload.incident_number,
        "impact_type": payload.impact_type,
        "impact_description": payload.impact_description,
        "header_message": payload.header_message,
        "email_recipients": payload.email_recipients,
        "category": payload.category,
        "region": payload.region,
        "next_steps": payload.next_steps,
        "help_info": payload.help_info,
        "email_body": payload.email_body,
        "channels": payload.channels,
        "pinned": payload.pinned,
        "teams_channels": payload.teams_channels,
        "email_source": payload.email_source,
        "email_hide_status": payload.email_hide_status,
        "connect_dont_send_notification": payload.connect_dont_send_notification,
        "connect_banner_position": payload.connect_banner_position,
        "connect_target_entities": payload.connect_target_entities,
        "connect_target_regions": payload.connect_target_regions,
        "connect_weave_interfaces": payload.connect_weave_interfaces,
        "ann_status": "open",
        "author": "Current User",
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
    for field in [
        "title", "status", "severity", "impacted_apps", "start_time", "end_time",
        "description", "latest_updates", "incident_number", "impact_type",
        "impact_description", "header_message", "email_recipients", "category",
        "region", "next_steps", "help_info", "email_body", "channels", "pinned",
        "teams_channels", "email_source", "email_hide_status",
        "connect_dont_send_notification", "connect_banner_position",
        "connect_target_entities", "connect_target_regions", "connect_weave_interfaces",
    ]:
        val = getattr(payload, field, None)
        if val is not None:
            ann[field] = val
    return ann


@app.patch("/api/announcements/{announcement_id}/status")
def toggle_announcement_status(announcement_id: int):
    ann = next((a for a in ANNOUNCEMENTS if a["id"] == announcement_id), None)
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    ann["ann_status"] = "closed" if ann["ann_status"] == "open" else "open"
    return ann


@app.delete("/api/announcements/{announcement_id}")
def delete_announcement(announcement_id: int):
    global ANNOUNCEMENTS
    before = len(ANNOUNCEMENTS)
    ANNOUNCEMENTS = [a for a in ANNOUNCEMENTS if a["id"] != announcement_id]
    if len(ANNOUNCEMENTS) == before:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return {"ok": True}
