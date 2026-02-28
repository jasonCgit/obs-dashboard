from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
from collections import deque
from datetime import datetime
import copy
import asyncio
import random
import uuid
import json

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
    "warnings": 1,
    "recurring_30d": 29,
    "incidents_today": 5,
    "trends": {
        "critical_issues": {"spark": [4, 3, 3, 2, 3, 2, 2], "pct": -33},
        "warnings":        {"spark": [3, 2, 2, 1, 2, 1, 1], "pct": -50},
        "recurring_30d":   {"spark": [20, 22, 24, 25, 26, 27, 29], "pct": 21},
        "incidents_today": {"spark": [8, 11, 7, 9, 6, 8, 5], "pct": -38},
    },
}

AI_ANALYSIS = {
    "critical_alert": (
        "Currently tracking 2 critical applications affecting approximately 6,220 users. "
        "GWM Global Collateral Management and Payment Gateway API experiencing critical "
        "database connection timeouts and connection pool exhaustion. Both services showing "
        "recurring patterns indicating systemic database infrastructure issues in APAC."
    ),
    "trend_analysis": (
        "Issue frequency has increased 34% over the past 7 days. GWM Global Collateral has "
        "experienced 12 incidents in 30 days with recurring database timeouts. Payment Gateway "
        "has seen 8 incidents, primarily connection pool exhaustion on the primary DB cluster."
    ),
    "recommendations": [
        "Investigate GWM Global Collateral database connection timeout — scale connection pool and add circuit breaker on /api/margin endpoint",
        "Address Payment Gateway connection pool exhaustion — increase max connections on primary DB cluster and add connection recycling",
        "Schedule incident review with Collateral Engineering and Payments teams to address recurring APAC infrastructure patterns",
    ],
}

REGIONAL_STATUS = [
    {"region": "NA",   "status": "healthy",  "sod_impacts": 0, "app_issues": 0},
    {"region": "EMEA", "status": "healthy",  "sod_impacts": 0, "app_issues": 0},
    {"region": "APAC", "status": "critical", "sod_impacts": 2, "app_issues": 2},
]

CRITICAL_APPS = [
    {
        "id": "gwm-global-collateral",
        "name": "GWM GLOBAL COLLATERAL MANAGEMENT",
        "seal": "SEAL - 90083",
        "status": "critical",
        "current_issues": 3,
        "recurring_30d": 12,
        "last_incident": "15m ago",
        "recent_issues": [
            {"description": "Database connection timeout - Unable to process collateral calculations", "time_ago": "15m ago", "severity": "critical"},
            {"description": "High response time (>5s) on /api/margin endpoint", "time_ago": "45m ago", "severity": "warning"},
            {"description": "Memory usage at 85%", "time_ago": "2h ago", "severity": "warning"},
        ],
    },
    {
        "id": "payment-gateway-api",
        "name": "PAYMENT GATEWAY API",
        "seal": "SEAL - 90176",
        "status": "critical",
        "current_issues": 2,
        "recurring_30d": 8,
        "last_incident": "10m ago",
        "recent_issues": [
            {"description": "Connection pool exhaustion - Max connections reached on primary DB cluster", "time_ago": "10m ago", "severity": "critical"},
            {"description": "Latency spike on /api/payments/process (p99 > 8s)", "time_ago": "1h ago", "severity": "warning"},
        ],
    },
]

WARNING_APPS = [
    {
        "id": "user-authentication",
        "name": "USER AUTHENTICATION SERVICE",
        "seal": "SEAL - 92156",
        "status": "warning",
        "current_issues": 1,
        "recurring_30d": 5,
        "last_incident": "4h ago",
        "recent_issues": [
            {"description": "Elevated login failure rate — LDAP response time >3s during peak hours", "time_ago": "4h ago", "severity": "warning"},
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
    p1_days_map = {3:1, 12:1, 17:1, 24:2, 31:1, 38:1, 45:1, 52:2, 58:1, 65:1, 72:1, 80:1, 87:1, 90:1}
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
            {"status": "CRITICAL", "description": "GWM Global Collateral Mgmt — Database connection timeout affecting collateral calculations", "time_ago": "15m ago"},
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
        "app": "GWM Global Collateral Mgmt",
        "seal": "90083",
        "status": "critical",
        "description": "Database connection timeout",
        "occurrences": 12,
        "last_seen": "15m ago",
    },
    {
        "app": "Payment Gateway API",
        "seal": "90176",
        "status": "critical",
        "description": "Connection pool exhaustion",
        "occurrences": 8,
        "last_seen": "10m ago",
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
        "status": "warning",
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
    {"id": "ipbol-account",        "label": "IPBOL-ACCOUNT-SERVICES",                    "status": "critical", "team": "IPBOL",       "sla": "99.0%",  "incidents_30d": 4},
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
    {"id": "connect-cloud-gw",        "label": "CONNECT-CLOUD-GATEWAY",           "status": "warning",  "team": "Connect Platform",  "sla": "99.99%", "incidents_30d": 1},
    {"id": "connect-profile-svc",     "label": "CONNECT-SERVICE-PROFILE-SERVICE", "status": "warning",  "team": "Connect Identity",  "sla": "99.5%",  "incidents_30d": 2},
    {"id": "connect-auth-svc",        "label": "CONNECT-AUTH-SERVICE",            "status": "healthy",  "team": "Connect Identity",  "sla": "99.99%", "incidents_30d": 0},
    {"id": "connect-notification",    "label": "CONNECT-NOTIFICATION-SERVICE",    "status": "warning",  "team": "Connect Messaging", "sla": "99.5%",  "incidents_30d": 2},
    {"id": "connect-data-sync",       "label": "CONNECT-DATA-SYNC-SERVICE",      "status": "healthy",  "team": "Connect Data",      "sla": "99.0%",  "incidents_30d": 1},
    {"id": "connect-coverage-app",    "label": "CONNECT-COVERAGE-APP",            "status": "critical", "team": "Connect CRM",       "sla": "99.5%",  "incidents_30d": 5},
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

    # Additional edges for Blast Radius Layers internal connectivity
    ("active-advisory",          "connect-profile-svc"),
    ("connect-coverage-app",     "ipbol-account"),
    ("ipbol-account",            "ipbol-doc-domain"),
    ("spieq-settlement-svc",     "spieq-notif-svc"),
    ("spieq-api-gateway",        "payment-gateway"),
    ("payment-gateway",          "spieq-notif-svc"),
]

# ── Blast Radius Layers — mock data ──────────────────────────────────────────

SEAL_COMPONENTS = {
    # Simple graph (6 components) — all interconnected via cloud gateway hub
    "88180": [
        "connect-portal", "connect-cloud-gw", "connect-auth-svc",
        "connect-home-app-na", "connect-home-app-apac", "connect-home-app-emea",
    ],
    # Medium graph (10 components) — profile-svc hub with coverage + IPBOL branches
    "90176": [
        "connect-profile-svc", "connect-coverage-app", "connect-notification",
        "connect-data-sync", "connect-doc-svc", "connect-pref-svc",
        "connect-audit-svc", "active-advisory", "ipbol-account", "ipbol-doc-domain",
    ],
    # Complex graph (14 components) — deep SPIEQ trading chain + payment branch
    "90215": [
        "spieq-ui-service", "spieq-api-gateway", "spieq-trade-service",
        "spieq-portfolio-svc", "spieq-pricing-engine", "spieq-risk-service",
        "spieq-order-router", "spieq-market-data", "spieq-compliance-svc",
        "spieq-settlement-svc", "spieq-audit-trail", "spieq-notif-svc",
        "payment-gateway", "email-notification",
    ],
}

PLATFORM_NODES = [
    # GAP (Global Application Platform) pools
    {"id": "gap-pool-na-01",      "label": "NA-5S",    "type": "gap", "subtype": "pool",    "datacenter": "NA-NW-C02",      "status": "healthy"},
    {"id": "gap-pool-apac-01",    "label": "AP-6T",    "type": "gap", "subtype": "pool",    "datacenter": "AP-HK-C02",      "status": "warning"},
    {"id": "gap-pool-emea-01",    "label": "EM-5U",    "type": "gap", "subtype": "pool",    "datacenter": "EM-CH-Lausanne",  "status": "healthy"},
    # GKP (Global Kubernetes Platform) clusters
    {"id": "gkp-cluster-na-01",   "label": "NA-K8S-01",   "type": "gkp", "subtype": "cluster", "datacenter": "NA-NW-C02",      "status": "critical"},
    {"id": "gkp-cluster-apac-01", "label": "AP-K8S-02",   "type": "gkp", "subtype": "cluster", "datacenter": "AP-HK-C02",      "status": "healthy"},
    {"id": "gkp-cluster-emea-01", "label": "EM-K8S-01",   "type": "gkp", "subtype": "cluster", "datacenter": "EM-CH-Lausanne",  "status": "warning"},
    # ECS (Elastic Container Service)
    {"id": "ecs-na-01",           "label": "NA-ECS-01",   "type": "ecs", "subtype": "service", "datacenter": "NA-NW-C02",      "status": "healthy"},
    {"id": "ecs-apac-01",         "label": "AP-ECS-02",   "type": "ecs", "subtype": "service", "datacenter": "AP-HK-C02",      "status": "healthy"},
    # EKS (Elastic Kubernetes Service)
    {"id": "eks-na-01",           "label": "NA-EKS-01",   "type": "eks", "subtype": "service", "datacenter": "NA-NW-C02",      "status": "warning"},
    {"id": "eks-emea-01",         "label": "EM-EKS-01",   "type": "eks", "subtype": "service", "datacenter": "EM-CH-Lausanne",  "status": "healthy"},
]

PLATFORM_NODE_MAP = {n["id"]: n for n in PLATFORM_NODES}

# Every component in every SEAL has exactly one platform edge
COMPONENT_PLATFORM_EDGES = [
    # ── Connect OS (88180) — Simple ──
    ("connect-portal",        "gap-pool-na-01"),
    ("connect-cloud-gw",      "gkp-cluster-na-01"),
    ("connect-auth-svc",      "gkp-cluster-na-01"),
    ("connect-home-app-na",   "gap-pool-na-01"),
    ("connect-home-app-apac", "gap-pool-apac-01"),
    ("connect-home-app-emea", "gap-pool-emea-01"),
    # ── Advisor Connect (90176) — Medium ──
    ("connect-profile-svc",   "gap-pool-na-01"),
    ("connect-coverage-app",  "gap-pool-na-01"),
    ("connect-notification",  "gkp-cluster-na-01"),
    ("connect-data-sync",     "gkp-cluster-apac-01"),
    ("connect-doc-svc",       "ecs-na-01"),
    ("connect-pref-svc",      "gap-pool-na-01"),
    ("connect-audit-svc",     "gkp-cluster-na-01"),
    ("active-advisory",       "ecs-na-01"),
    ("ipbol-account",         "gap-pool-apac-01"),
    ("ipbol-doc-domain",      "gap-pool-emea-01"),
    # ── Spectrum Portfolio Mgmt (90215) — Complex ──
    ("spieq-ui-service",      "gap-pool-na-01"),
    ("spieq-api-gateway",     "gkp-cluster-na-01"),
    ("spieq-trade-service",   "gkp-cluster-na-01"),
    ("spieq-portfolio-svc",   "gkp-cluster-na-01"),
    ("spieq-pricing-engine",  "eks-na-01"),
    ("spieq-risk-service",    "gkp-cluster-na-01"),
    ("spieq-order-router",    "eks-na-01"),
    ("spieq-market-data",     "ecs-apac-01"),
    ("spieq-compliance-svc",  "gkp-cluster-emea-01"),
    ("spieq-settlement-svc",  "gkp-cluster-emea-01"),
    ("spieq-audit-trail",     "ecs-apac-01"),
    ("spieq-notif-svc",       "eks-emea-01"),
    ("payment-gateway",       "gap-pool-na-01"),
    ("email-notification",    "ecs-na-01"),
]

DATA_CENTER_NODES = [
    {"id": "dc-na-nw-c02",      "label": "NA-NW-C02",      "region": "NA",   "status": "healthy"},
    {"id": "dc-na-ne-c01",      "label": "NA-NE-C01",      "region": "NA",   "status": "warning"},
    {"id": "dc-ap-hk-c02",      "label": "AP-HK-C02",      "region": "APAC", "status": "healthy"},
    {"id": "dc-ap-sg-c01",      "label": "AP-SG-C01",      "region": "APAC", "status": "critical"},
    {"id": "dc-em-ch-lausanne", "label": "EM-CH-Lausanne",  "region": "EMEA", "status": "healthy"},
    {"id": "dc-em-uk-c01",      "label": "EM-UK-C01",      "region": "EMEA", "status": "healthy"},
]

DC_LOOKUP = {
    "NA-NW-C02":      "dc-na-nw-c02",
    "NA-NE-C01":      "dc-na-ne-c01",
    "AP-HK-C02":      "dc-ap-hk-c02",
    "AP-SG-C01":      "dc-ap-sg-c01",
    "EM-CH-Lausanne": "dc-em-ch-lausanne",
    "EM-UK-C01":      "dc-em-uk-c01",
}

# Every component in every SEAL has at least one indicator
INDICATOR_NODES = [
    # ── Connect OS (88180) — 8 indicators across 6 components ──
    {"id": "dt-pg-cloud-gw",       "label": "connect-cloud-gateway",  "indicator_type": "process_group", "health": "amber", "component": "connect-cloud-gw"},
    {"id": "dt-pg-portal",         "label": "connect-portal",         "indicator_type": "process_group", "health": "green", "component": "connect-portal"},
    {"id": "dt-svc-auth",          "label": "AuthenticationSvc",      "indicator_type": "service",       "health": "green", "component": "connect-auth-svc"},
    {"id": "dt-syn-login",         "label": "Login Flow",             "indicator_type": "synthetic",     "health": "green", "component": "connect-auth-svc"},
    {"id": "dt-syn-home-na",       "label": "Home Page NA",           "indicator_type": "synthetic",     "health": "green", "component": "connect-home-app-na"},
    {"id": "dt-svc-home-apac",     "label": "HomeApp-APAC",           "indicator_type": "service",       "health": "amber", "component": "connect-home-app-apac"},
    {"id": "dt-syn-home-apac",     "label": "Home Page APAC",         "indicator_type": "synthetic",     "health": "amber", "component": "connect-home-app-apac"},
    {"id": "dt-svc-home-emea",     "label": "HomeApp-EMEA",           "indicator_type": "service",       "health": "green", "component": "connect-home-app-emea"},

    # ── Advisor Connect (90176) — 14 indicators across 10 components ──
    {"id": "dt-pg-profile-svc",    "label": "connect-profile-svc",    "indicator_type": "process_group", "health": "amber", "component": "connect-profile-svc"},
    {"id": "dt-svc-profile",       "label": "ProfileService",         "indicator_type": "service",       "health": "amber", "component": "connect-profile-svc"},
    {"id": "dt-pg-coverage-app",   "label": "connect-coverage-app",   "indicator_type": "process_group", "health": "red",   "component": "connect-coverage-app"},
    {"id": "dt-syn-coverage",      "label": "Coverage Lookup",        "indicator_type": "synthetic",     "health": "amber", "component": "connect-coverage-app"},
    {"id": "dt-svc-notification",  "label": "NotificationSvc",        "indicator_type": "service",       "health": "amber", "component": "connect-notification"},
    {"id": "dt-pg-data-sync",      "label": "connect-data-sync",      "indicator_type": "process_group", "health": "green", "component": "connect-data-sync"},
    {"id": "dt-svc-doc-svc",       "label": "DocumentService",        "indicator_type": "service",       "health": "amber", "component": "connect-doc-svc"},
    {"id": "dt-pg-pref-svc",       "label": "connect-pref-svc",       "indicator_type": "process_group", "health": "green", "component": "connect-pref-svc"},
    {"id": "dt-syn-audit-trail",   "label": "Audit Trail",            "indicator_type": "synthetic",     "health": "green", "component": "connect-audit-svc"},
    {"id": "dt-svc-advisory",      "label": "ActiveAdvisorySvc",      "indicator_type": "service",       "health": "green", "component": "active-advisory"},
    {"id": "dt-pg-ipbol-acct",     "label": "ipbol-account",          "indicator_type": "process_group", "health": "red",   "component": "ipbol-account"},
    {"id": "dt-syn-ipbol-acct",    "label": "Account Lookup",         "indicator_type": "synthetic",     "health": "red",   "component": "ipbol-account"},
    {"id": "dt-svc-doc-domain",    "label": "DocDomainSvc",           "indicator_type": "service",       "health": "red",   "component": "ipbol-doc-domain"},
    {"id": "dt-pg-doc-domain",     "label": "ipbol-doc-domain",       "indicator_type": "process_group", "health": "red",   "component": "ipbol-doc-domain"},

    # ── Spectrum Portfolio Mgmt (90215) — 22 indicators across 14 components ──
    {"id": "dt-syn-ui-health",     "label": "UI Health Check",        "indicator_type": "synthetic",     "health": "green", "component": "spieq-ui-service"},
    {"id": "dt-svc-api-gw",        "label": "APIGatewaySvc",          "indicator_type": "service",       "health": "amber", "component": "spieq-api-gateway"},
    {"id": "dt-pg-api-gw",         "label": "spieq-api-gateway",      "indicator_type": "process_group", "health": "amber", "component": "spieq-api-gateway"},
    {"id": "dt-pg-trade-svc",      "label": "spieq-trade-service",    "indicator_type": "process_group", "health": "red",   "component": "spieq-trade-service"},
    {"id": "dt-svc-trade",         "label": "TradeExecutionSvc",      "indicator_type": "service",       "health": "red",   "component": "spieq-trade-service"},
    {"id": "dt-syn-trade-submit",  "label": "Trade Submission",       "indicator_type": "synthetic",     "health": "red",   "component": "spieq-trade-service"},
    {"id": "dt-syn-portfolio",     "label": "Portfolio View",         "indicator_type": "synthetic",     "health": "green", "component": "spieq-portfolio-svc"},
    {"id": "dt-pg-pricing",        "label": "spieq-pricing-engine",   "indicator_type": "process_group", "health": "amber", "component": "spieq-pricing-engine"},
    {"id": "dt-svc-pricing",       "label": "PricingEngineSvc",       "indicator_type": "service",       "health": "amber", "component": "spieq-pricing-engine"},
    {"id": "dt-pg-risk-svc",       "label": "spieq-risk-service",     "indicator_type": "process_group", "health": "red",   "component": "spieq-risk-service"},
    {"id": "dt-svc-risk",          "label": "RiskAssessmentSvc",      "indicator_type": "service",       "health": "red",   "component": "spieq-risk-service"},
    {"id": "dt-svc-order-router",  "label": "OrderRouterSvc",         "indicator_type": "service",       "health": "green", "component": "spieq-order-router"},
    {"id": "dt-pg-market-data",    "label": "MarketDataFeed",         "indicator_type": "process_group", "health": "amber", "component": "spieq-market-data"},
    {"id": "dt-syn-compliance",    "label": "Compliance Check",       "indicator_type": "synthetic",     "health": "green", "component": "spieq-compliance-svc"},
    {"id": "dt-svc-settlement",    "label": "SettlementSvc",          "indicator_type": "service",       "health": "amber", "component": "spieq-settlement-svc"},
    {"id": "dt-pg-audit-trail",    "label": "spieq-audit-trail",      "indicator_type": "process_group", "health": "green", "component": "spieq-audit-trail"},
    {"id": "dt-svc-notif",         "label": "NotificationSvc",        "indicator_type": "service",       "health": "green", "component": "spieq-notif-svc"},
    {"id": "dt-svc-payment",       "label": "PaymentGatewaySvc",      "indicator_type": "service",       "health": "red",   "component": "payment-gateway"},
    {"id": "dt-syn-payment",       "label": "Payment Processing",     "indicator_type": "synthetic",     "health": "red",   "component": "payment-gateway"},
    {"id": "dt-pg-email",          "label": "email-notification",     "indicator_type": "process_group", "health": "red",   "component": "email-notification"},
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

@app.get("/api/warning-apps")
def get_warning_apps():
    return WARNING_APPS

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

@app.get("/api/graph/layer-seals")
def get_layer_seals():
    return [
        {"seal": s, "label": l, "component_count": len(SEAL_COMPONENTS[s])}
        for s, l in [("88180", "Connect OS"), ("90176", "Advisor Connect"), ("90215", "Spectrum Portfolio Mgmt")]
    ]

# Component-to-component edges that communicate in both directions
BIDIRECTIONAL_PAIRS = {
    # Connect OS — portal and cloud gateway exchange requests/responses
    ("connect-portal", "connect-cloud-gw"),
    # Advisor Connect — profile service and data sync synchronize bidirectionally
    ("connect-profile-svc", "connect-data-sync"),
    # Spectrum — API gateway and trade service exchange order flow
    ("spieq-api-gateway", "spieq-trade-service"),
    # Spectrum — trade service and risk service validate in both directions
    ("spieq-trade-service", "spieq-risk-service"),
}


@app.get("/api/graph/layers/{seal_id}")
def get_graph_layers(seal_id: str):
    if seal_id not in SEAL_COMPONENTS:
        raise HTTPException(status_code=404, detail=f"SEAL '{seal_id}' not found")

    component_ids = SEAL_COMPONENTS[seal_id]
    component_set = set(component_ids)

    # Component layer
    component_nodes = [NODE_MAP[cid] for cid in component_ids if cid in NODE_MAP]
    component_edges = [
        {
            "source": src,
            "target": dst,
            "direction": "bi" if (src, dst) in BIDIRECTIONAL_PAIRS or (dst, src) in BIDIRECTIONAL_PAIRS else "uni",
        }
        for src, dst in EDGES_RAW
        if src in component_set and dst in component_set
    ]

    # Platform layer
    platform_node_ids: set[str] = set()
    platform_edge_list = []
    for comp_id, plat_id in COMPONENT_PLATFORM_EDGES:
        if comp_id in component_set:
            platform_edge_list.append({"source": comp_id, "target": plat_id, "layer": "platform"})
            platform_node_ids.add(plat_id)
    platform_nodes = [pn for pn in PLATFORM_NODES if pn["id"] in platform_node_ids]

    # Data Center layer
    dc_node_ids: set[str] = set()
    dc_edge_list = []
    for pn in platform_nodes:
        dc_id = DC_LOOKUP.get(pn["datacenter"])
        if dc_id:
            dc_edge_list.append({"source": pn["id"], "target": dc_id, "layer": "datacenter"})
            dc_node_ids.add(dc_id)
    dc_nodes = [dc for dc in DATA_CENTER_NODES if dc["id"] in dc_node_ids]

    # Indicator layer
    indicator_nodes = [ind for ind in INDICATOR_NODES if ind["component"] in component_set]
    indicator_edges = [
        {"source": ind["component"], "target": ind["id"], "layer": "indicator"}
        for ind in indicator_nodes
    ]

    return {
        "seal": seal_id,
        "components": {"nodes": component_nodes, "edges": component_edges},
        "platform":   {"nodes": platform_nodes,   "edges": platform_edge_list},
        "datacenter": {"nodes": dc_nodes,          "edges": dc_edge_list},
        "indicators": {"nodes": indicator_nodes,   "edges": indicator_edges},
    }


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


# ── AURA Assistant Chat ──────────────────────────────────────────────────────

class AuraChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    attachments: Optional[list] = None
    context: Optional[dict] = None


def _aura_incident_analysis():
    return {
        "message_id": str(uuid.uuid4()),
        "content": [
            {"type": "text", "data": "Here's the current incident analysis for your environment. I'm tracking 2 critical and 1 warning application across all regions."},
            {"type": "metric_cards", "data": [
                {"label": "Active P1s", "value": 2, "color": "#f44336", "trend": -33, "icon": "error", "sparkline": [5, 4, 6, 3, 4, 3, 2]},
                {"label": "Active P2s", "value": 5, "color": "#ff9800", "trend": 12, "icon": "warning", "sparkline": [3, 4, 3, 5, 4, 6, 5]},
                {"label": "MTTR (avg)", "value": "2.4h", "color": "#60a5fa", "trend": -18, "icon": "timer", "sparkline": [3.8, 3.5, 3.2, 2.9, 2.7, 2.5, 2.4]},
                {"label": "Affected Users", "value": "6,220", "color": "#a78bfa", "trend": -5, "icon": "people", "sparkline": [8200, 7800, 7200, 6800, 6500, 6400, 6220]},
            ]},
            {"type": "status_list", "title": "Affected Applications", "data": [
                {"name": "GWM Global Collateral Mgmt", "status": "critical", "detail": "Database connection timeout — recurring pattern in APAC", "seal": "SEAL-90083"},
                {"name": "Payment Gateway API", "status": "critical", "detail": "Connection pool exhaustion on primary DB cluster", "seal": "SEAL-90176"},
                {"name": "User Authentication Service", "status": "warning", "detail": "Elevated login failure rate — 3.2% (threshold 2%)", "seal": "SEAL-92156"},
            ]},
            {"type": "recommendations", "data": [
                {"priority": "high", "text": "Scale database connection pool for GWM Collateral service from 50 to 150 connections", "impact": "Reduces timeout incidents by ~60%"},
                {"priority": "high", "text": "Implement circuit breaker on Payment Gateway upstream calls", "impact": "Prevents cascade failures to 12 downstream services"},
                {"priority": "medium", "text": "Review APAC infrastructure capacity — recurring pattern suggests undersizing", "impact": "Addresses root cause of 67% of recent P1s"},
            ]},
        ],
        "suggested_followups": [
            "What is the blast radius of the Payment Gateway issue?",
            "Show me the MTTR trend for the last quarter",
            "Give me an executive summary for leadership",
        ],
        "timestamp": datetime.now().isoformat(),
    }


def _aura_slo_report():
    return {
        "message_id": str(uuid.uuid4()),
        "content": [
            {"type": "text", "data": "Here's the SLO compliance report across all monitored services. 3 services are currently burning error budget faster than expected."},
            {"type": "metric_cards", "data": [
                {"label": "Overall SLO", "value": "94.2%", "color": "#4caf50", "trend": -1.3, "icon": "check", "sparkline": [95.1, 94.8, 94.5, 94.3, 94.1, 94.0, 94.2]},
                {"label": "Error Budget Left", "value": "38%", "color": "#ff9800", "trend": -12, "icon": "data_usage", "sparkline": [62, 55, 50, 46, 42, 40, 38]},
                {"label": "Services at Risk", "value": 3, "color": "#f44336", "trend": 50, "icon": "error", "sparkline": [1, 1, 2, 2, 2, 3, 3]},
                {"label": "Services Healthy", "value": 41, "color": "#4caf50", "trend": 2, "icon": "check_circle", "sparkline": [38, 39, 39, 40, 40, 41, 41]},
            ]},
            {"type": "table", "title": "SLO Compliance by Service", "data": {
                "columns": ["Service", "SLO Target", "Current", "Error Budget", "Status"],
                "rows": [
                    ["GWM Global Collateral", "99.9%", "98.2%", "12%", "critical"],
                    ["Payment Gateway API", "99.95%", "99.1%", "22%", "warning"],
                    ["User Auth Service", "99.9%", "99.4%", "45%", "warning"],
                    ["Trading Engine", "99.99%", "99.98%", "89%", "healthy"],
                    ["Market Data Feed", "99.9%", "99.85%", "78%", "healthy"],
                    ["Risk Calculator", "99.5%", "99.6%", "92%", "healthy"],
                    ["Notification Hub", "99.9%", "99.7%", "67%", "healthy"],
                ],
            }},
            {"type": "bar_chart", "title": "Error Budget Remaining by Team", "data": {
                "bars": [
                    {"name": "Collateral", "value": 12, "color": "#f44336"},
                    {"name": "Payments", "value": 22, "color": "#ff9800"},
                    {"name": "Security", "value": 45, "color": "#ff9800"},
                    {"name": "Trading", "value": 89, "color": "#4caf50"},
                    {"name": "Data", "value": 78, "color": "#4caf50"},
                    {"name": "Risk", "value": 92, "color": "#4caf50"},
                ],
                "xKey": "name",
                "yKey": "value",
                "unit": "%",
            }},
        ],
        "suggested_followups": [
            "What's causing the GWM Collateral SLO breach?",
            "Show capacity planning recommendations",
            "How are the engineering teams performing?",
        ],
        "timestamp": datetime.now().isoformat(),
    }


def _aura_blast_radius():
    return {
        "message_id": str(uuid.uuid4()),
        "content": [
            {"type": "text", "data": "I've analyzed the blast radius for a potential Payment Gateway failure. This service sits on a critical path — a full outage would cascade to 14 downstream services across 3 teams."},
            {"type": "status_list", "title": "Cascade Impact Chain", "data": [
                {"name": "Payment Gateway API", "status": "critical", "detail": "Primary failure point — connection pool exhaustion", "seal": "SEAL-90176"},
                {"name": "Order Processing Service", "status": "critical", "detail": "Direct dependency — all orders would fail", "seal": "SEAL-91002"},
                {"name": "Invoice Generator", "status": "critical", "detail": "Cannot generate invoices without payment confirmation", "seal": "SEAL-91045"},
                {"name": "Settlement Engine", "status": "warning", "detail": "Queued transactions would back up within 15 min", "seal": "SEAL-91078"},
                {"name": "Client Portal Dashboard", "status": "warning", "detail": "Payment status widgets would show stale data", "seal": "SEAL-92200"},
                {"name": "Mobile Banking App", "status": "warning", "detail": "Payment flows degraded, other features unaffected", "seal": "SEAL-92301"},
            ]},
            {"type": "pie_chart", "title": "Impact by Team", "data": {
                "slices": [
                    {"label": "Payments", "value": 5, "color": "#f44336"},
                    {"label": "Trading", "value": 4, "color": "#ff9800"},
                    {"label": "Client Exp.", "value": 3, "color": "#60a5fa"},
                    {"label": "Operations", "value": 2, "color": "#a78bfa"},
                ],
                "trend": 15,
            }},
            {"type": "recommendations", "data": [
                {"priority": "high", "text": "Implement async fallback queue for Order Processing Service", "impact": "Allows 30-min degraded operation without data loss"},
                {"priority": "high", "text": "Add read replica for Settlement Engine queries", "impact": "Reduces blast radius by isolating read vs write paths"},
                {"priority": "medium", "text": "Enable circuit breaker with 5s timeout on all downstream callers", "impact": "Prevents cascade propagation beyond direct dependencies"},
            ]},
        ],
        "suggested_followups": [
            "Show me the full dependency graph for Payment Gateway",
            "What is the current incident status?",
            "Compare regional health across NA, EMEA, and APAC",
        ],
        "timestamp": datetime.now().isoformat(),
    }


def _aura_mttr_analysis():
    return {
        "message_id": str(uuid.uuid4()),
        "content": [
            {"type": "text", "data": "Here's the MTTR and MTTA analysis for the last quarter. Overall resolution times have improved 18% driven by the new automated runbook adoption."},
            {"type": "metric_cards", "data": [
                {"label": "Avg MTTR", "value": "2.4h", "color": "#60a5fa", "trend": -18, "icon": "timer", "sparkline": [3.8, 3.5, 3.2, 2.9, 2.7, 2.5, 2.4]},
                {"label": "Avg MTTA", "value": "4.2m", "color": "#4caf50", "trend": -25, "icon": "notifications", "sparkline": [6.5, 6.0, 5.5, 5.0, 4.8, 4.5, 4.2]},
                {"label": "Resolution Rate", "value": "94.2%", "color": "#4caf50", "trend": 3, "icon": "check_circle", "sparkline": [89, 90, 91, 92, 93, 93, 94]},
                {"label": "Escalation Rate", "value": "12%", "color": "#ff9800", "trend": -8, "icon": "trending_down", "sparkline": [18, 16, 15, 14, 13, 13, 12]},
            ]},
            {"type": "line_chart", "title": "MTTR Trend (12 Weeks)", "data": {
                "series": [
                    {"key": "mttr", "name": "MTTR (hours)", "color": "#60a5fa", "showTrendLine": True, "showLabeledDots": True},
                    {"key": "mtta", "name": "MTTA (minutes)", "color": "#4caf50", "showTrendLine": True, "showLabeledDots": True},
                ],
                "stats": [
                    {"label": "MTTR", "value": "2.4h", "color": "#60a5fa", "trend": -18},
                    {"label": "MTTA", "value": "4.2m", "color": "#4caf50", "trend": -25},
                ],
                "points": [
                    {"label": "W1", "mttr": 3.8, "mtta": 6.5},
                    {"label": "W2", "mttr": 3.5, "mtta": 6.0},
                    {"label": "W3", "mttr": 3.2, "mtta": 5.8},
                    {"label": "W4", "mttr": 3.6, "mtta": 5.5},
                    {"label": "W5", "mttr": 2.9, "mtta": 5.0},
                    {"label": "W6", "mttr": 2.7, "mtta": 4.8},
                    {"label": "W7", "mttr": 2.8, "mtta": 4.5},
                    {"label": "W8", "mttr": 2.5, "mtta": 4.2},
                    {"label": "W9", "mttr": 2.3, "mtta": 4.0},
                    {"label": "W10", "mttr": 2.6, "mtta": 4.3},
                    {"label": "W11", "mttr": 2.2, "mtta": 3.8},
                    {"label": "W12", "mttr": 2.4, "mtta": 4.2},
                ],
            }},
            {"type": "table", "title": "MTTR by Team", "data": {
                "columns": ["Team", "Avg MTTR", "Avg MTTA", "Incidents Handled", "Resolution Rate"],
                "rows": [
                    ["Security", "1.2h", "2.1m", 18, "97%"],
                    ["Trading", "1.8h", "3.5m", 24, "95%"],
                    ["Payments", "2.9h", "4.8m", 31, "92%"],
                    ["Collateral", "3.4h", "5.2m", 22, "88%"],
                    ["Data Platform", "2.1h", "3.8m", 15, "96%"],
                ],
            }},
        ],
        "suggested_followups": [
            "Why is Collateral team's MTTR so high?",
            "Show me the team performance breakdown",
            "What's the executive summary?",
        ],
        "timestamp": datetime.now().isoformat(),
    }


def _aura_executive_summary():
    return {
        "message_id": str(uuid.uuid4()),
        "content": [
            {"type": "text", "data": "Good morning. Here's your executive platform health briefing. Overall stability has improved week-over-week, though two critical applications require continued attention."},
            {"type": "metric_cards", "data": [
                {"label": "Platform Health", "value": "94.2%", "color": "#4caf50", "trend": 1.5, "icon": "health", "sparkline": [91.5, 92.0, 92.8, 93.2, 93.5, 94.0, 94.2]},
                {"label": "Availability", "value": "99.87%", "color": "#4caf50", "trend": 0.02, "icon": "cloud", "sparkline": [99.82, 99.83, 99.84, 99.85, 99.85, 99.86, 99.87]},
                {"label": "Active Incidents", "value": 7, "color": "#ff9800", "trend": -22, "icon": "warning", "sparkline": [12, 10, 9, 11, 8, 9, 7]},
                {"label": "Est. Impact", "value": "$142K", "color": "#f44336", "trend": -35, "icon": "money", "sparkline": [280, 240, 210, 195, 180, 160, 142]},
            ]},
            {"type": "bar_chart", "title": "Incidents by Line of Business", "data": {
                "bars": [
                    {"name": "GWM", "value": 14, "color": "#f44336"},
                    {"name": "IB", "value": 9, "color": "#ff9800"},
                    {"name": "Consumer", "value": 7, "color": "#60a5fa"},
                    {"name": "Operations", "value": 5, "color": "#a78bfa"},
                    {"name": "Corporate", "value": 3, "color": "#34d399"},
                ],
                "xKey": "name",
                "yKey": "value",
            }},
            {"type": "line_chart", "title": "Weekly Incident Trend", "data": {
                "series": [
                    {"key": "p1", "name": "P1 Incidents", "color": "#f44336", "showTrendLine": True, "showLabeledDots": True},
                    {"key": "p2", "name": "P2 Incidents", "color": "#ffab00", "showTrendLine": True, "showLabeledDots": True},
                ],
                "stats": [
                    {"label": "P1", "value": 18, "color": "#f44336", "trend": -29},
                    {"label": "P2", "value": 137, "color": "#ffab00", "trend": -10},
                    {"label": "Resolved", "value": "94.2%", "color": "#4caf50"},
                ],
                "points": [
                    {"label": "W1", "p1": 3, "p2": 18},
                    {"label": "W2", "p1": 2, "p2": 22},
                    {"label": "W3", "p1": 4, "p2": 19},
                    {"label": "W4", "p1": 1, "p2": 15},
                    {"label": "W5", "p1": 2, "p2": 20},
                    {"label": "W6", "p1": 3, "p2": 17},
                    {"label": "W7", "p1": 1, "p2": 14},
                    {"label": "W8", "p1": 2, "p2": 12},
                ],
            }},
            {"type": "recommendations", "data": [
                {"priority": "high", "text": "Prioritize database infrastructure upgrade for APAC region", "impact": "Addresses root cause of 67% of P1 incidents"},
                {"priority": "medium", "text": "Accelerate automated runbook rollout to Collateral team", "impact": "Expected 40% MTTR improvement"},
                {"priority": "low", "text": "Schedule quarterly architecture review for high-incident services", "impact": "Proactive risk reduction for next quarter"},
            ]},
        ],
        "suggested_followups": [
            "Drill into the GWM incidents",
            "Show me SLO compliance details",
            "How are engineering teams performing?",
        ],
        "timestamp": datetime.now().isoformat(),
    }


def _aura_capacity_planning():
    return {
        "message_id": str(uuid.uuid4()),
        "content": [
            {"type": "text", "data": "Here's the current capacity utilization analysis. Three services are approaching their resource limits and should be reviewed for scaling before the next quarter."},
            {"type": "bar_chart", "title": "Resource Utilization by Service (%)", "data": {
                "bars": [
                    {"name": "Payment DB", "value": 92, "color": "#f44336"},
                    {"name": "Auth Cache", "value": 87, "color": "#f44336"},
                    {"name": "Trade Engine", "value": 78, "color": "#ff9800"},
                    {"name": "Msg Queue", "value": 65, "color": "#60a5fa"},
                    {"name": "Risk Calc", "value": 52, "color": "#4caf50"},
                    {"name": "Data Lake", "value": 44, "color": "#4caf50"},
                ],
                "xKey": "name",
                "yKey": "value",
                "unit": "%",
            }},
            {"type": "table", "title": "Services Approaching Limits", "data": {
                "columns": ["Service", "CPU", "Memory", "Disk", "Projected Full"],
                "rows": [
                    ["Payment DB Primary", "92%", "88%", "76%", "3 weeks"],
                    ["Auth Redis Cluster", "87%", "91%", "45%", "5 weeks"],
                    ["Trading Engine", "78%", "72%", "68%", "8 weeks"],
                ],
            }},
            {"type": "recommendations", "data": [
                {"priority": "high", "text": "Scale Payment DB from 4 to 8 read replicas and increase connection pool", "impact": "Extends capacity runway to 6+ months"},
                {"priority": "high", "text": "Migrate Auth Redis to clustered mode with 3 additional shards", "impact": "Reduces memory pressure by 60%"},
                {"priority": "medium", "text": "Enable auto-scaling for Trading Engine compute tier", "impact": "Handles peak loads without manual intervention"},
            ]},
        ],
        "suggested_followups": [
            "What's the cost estimate for scaling Payment DB?",
            "Show me the deployment status",
            "What are the current active incidents?",
        ],
        "timestamp": datetime.now().isoformat(),
    }


def _aura_deployment_status():
    return {
        "message_id": str(uuid.uuid4()),
        "content": [
            {"type": "text", "data": "Here's the deployment activity for the past 7 days. 23 deployments completed with a 91% success rate. Two rollbacks occurred due to integration test failures."},
            {"type": "table", "title": "Recent Deployments", "data": {
                "columns": ["Service", "Version", "Time", "Status", "Deployer"],
                "rows": [
                    ["Payment Gateway API", "v3.12.1", "2h ago", "healthy", "CI/CD"],
                    ["User Auth Service", "v2.8.0", "5h ago", "healthy", "Jenkins"],
                    ["GWM Collateral", "v4.1.3", "8h ago", "rollback", "CI/CD"],
                    ["Trading Engine", "v7.22.0", "1d ago", "healthy", "ArgoCD"],
                    ["Risk Calculator", "v1.15.2", "1d ago", "healthy", "CI/CD"],
                    ["Notification Hub", "v2.3.1", "2d ago", "rollback", "Jenkins"],
                    ["Market Data Feed", "v5.9.0", "3d ago", "healthy", "ArgoCD"],
                ],
            }},
            {"type": "pie_chart", "title": "Deployment Outcomes (7 Days)", "data": {
                "slices": [
                    {"label": "Successful", "value": 21, "color": "#4caf50"},
                    {"label": "Rolled Back", "value": 2, "color": "#f44336"},
                ],
                "trend": -8,
            }},
            {"type": "status_list", "title": "Upcoming Scheduled Deployments", "data": [
                {"name": "Payment Gateway API v3.13.0", "status": "healthy", "detail": "Scheduled: Tomorrow 2:00 AM EST — connection pool fix", "seal": "SEAL-90176"},
                {"name": "GWM Collateral v4.2.0", "status": "warning", "detail": "Scheduled: Friday 11:00 PM EST — DB migration included", "seal": "SEAL-90083"},
            ]},
        ],
        "suggested_followups": [
            "Why did the GWM Collateral deployment roll back?",
            "Show me the incident analysis",
            "What are the SLO compliance numbers?",
        ],
        "timestamp": datetime.now().isoformat(),
    }


def _aura_alert_analysis():
    return {
        "message_id": str(uuid.uuid4()),
        "content": [
            {"type": "text", "data": "I've analyzed your alerting patterns for the past 30 days. Alert noise is at 34%, meaning roughly 1 in 3 alerts doesn't require human action. Here's the breakdown."},
            {"type": "metric_cards", "data": [
                {"label": "Total Alerts", "value": "1,247", "color": "#60a5fa", "trend": 8, "icon": "notifications", "sparkline": [980, 1020, 1050, 1100, 1150, 1200, 1247]},
                {"label": "Actionable", "value": "66%", "color": "#4caf50", "trend": 5, "icon": "check", "sparkline": [58, 60, 61, 63, 64, 65, 66]},
                {"label": "Noise Rate", "value": "34%", "color": "#f44336", "trend": -3, "icon": "volume_off", "sparkline": [42, 40, 39, 37, 36, 35, 34]},
                {"label": "Avg Response", "value": "4.2m", "color": "#60a5fa", "trend": -12, "icon": "timer", "sparkline": [5.8, 5.5, 5.2, 4.9, 4.6, 4.4, 4.2]},
            ]},
            {"type": "bar_chart", "title": "Alert Volume by Source", "data": {
                "bars": [
                    {"name": "Prometheus", "value": 423, "color": "#f44336"},
                    {"name": "Datadog", "value": 312, "color": "#a78bfa"},
                    {"name": "PagerDuty", "value": 198, "color": "#60a5fa"},
                    {"name": "Custom", "value": 167, "color": "#34d399"},
                    {"name": "CloudWatch", "value": 147, "color": "#ff9800"},
                ],
                "xKey": "name",
                "yKey": "value",
            }},
            {"type": "table", "title": "Noisiest Alerting Rules", "data": {
                "columns": ["Rule Name", "Triggers (30d)", "Actionable", "Noise %", "Owner"],
                "rows": [
                    ["CPU > 80% (5min)", 89, 12, "87%", "Platform"],
                    ["Memory > 90%", 67, 23, "66%", "Platform"],
                    ["Latency P99 > 500ms", 54, 38, "30%", "SRE"],
                    ["Error Rate > 1%", 43, 41, "5%", "SRE"],
                    ["Disk > 85%", 38, 8, "79%", "Platform"],
                ],
            }},
            {"type": "recommendations", "data": [
                {"priority": "high", "text": "Increase CPU alert threshold from 80% to 90% with 15-min window", "impact": "Eliminates ~77 false alerts per month"},
                {"priority": "high", "text": "Add auto-resolve for memory alerts that self-heal within 5 minutes", "impact": "Reduces noise by ~44 alerts per month"},
                {"priority": "medium", "text": "Consolidate disk alerts to daily digest instead of real-time", "impact": "Reduces alert fatigue for non-urgent capacity issues"},
            ]},
        ],
        "suggested_followups": [
            "How can we improve our MTTA?",
            "Show me the incident trends",
            "What's the team performance on alert response?",
        ],
        "timestamp": datetime.now().isoformat(),
    }


def _aura_regional_comparison():
    return {
        "message_id": str(uuid.uuid4()),
        "content": [
            {"type": "text", "data": "Here's the regional operational health comparison. APAC is currently the most impacted region, driven primarily by database infrastructure issues affecting the GWM platform."},
            {"type": "metric_cards", "data": [
                {"label": "NA Health", "value": "97.1%", "color": "#4caf50", "trend": 0.3, "icon": "public", "sparkline": [96.2, 96.5, 96.7, 96.8, 96.9, 97.0, 97.1]},
                {"label": "EMEA Health", "value": "95.8%", "color": "#4caf50", "trend": -0.5, "icon": "public", "sparkline": [96.5, 96.3, 96.1, 96.0, 95.9, 95.8, 95.8]},
                {"label": "APAC Health", "value": "89.4%", "color": "#f44336", "trend": -2.1, "icon": "public", "sparkline": [93.2, 92.5, 91.8, 91.0, 90.5, 90.0, 89.4]},
                {"label": "LATAM Health", "value": "96.2%", "color": "#4caf50", "trend": 1.2, "icon": "public", "sparkline": [94.8, 95.0, 95.3, 95.5, 95.8, 96.0, 96.2]},
            ]},
            {"type": "bar_chart", "title": "Incidents by Region (30 Days)", "data": {
                "bars": [
                    {"name": "NA", "value": 12, "color": "#60a5fa"},
                    {"name": "EMEA", "value": 18, "color": "#a78bfa"},
                    {"name": "APAC", "value": 31, "color": "#f44336"},
                    {"name": "LATAM", "value": 7, "color": "#34d399"},
                ],
                "xKey": "name",
                "yKey": "value",
            }},
            {"type": "table", "title": "Regional SLA Comparison", "data": {
                "columns": ["Region", "Availability", "Avg Latency", "P1 Count", "MTTR", "Status"],
                "rows": [
                    ["North America", "99.95%", "45ms", 2, "1.8h", "healthy"],
                    ["EMEA", "99.88%", "62ms", 4, "2.2h", "healthy"],
                    ["APAC", "99.12%", "128ms", 8, "3.6h", "critical"],
                    ["LATAM", "99.91%", "78ms", 1, "1.5h", "healthy"],
                ],
            }},
        ],
        "suggested_followups": [
            "Why is APAC health degraded?",
            "Show me capacity planning for APAC",
            "What's the executive summary?",
        ],
        "timestamp": datetime.now().isoformat(),
    }


def _aura_trend_forecast():
    return {
        "message_id": str(uuid.uuid4()),
        "content": [
            {"type": "text", "data": "Based on the last 12 weeks of data and seasonal patterns, here's the projected incident forecast. The model suggests a continued downward trend in P1s, but P2 volume may increase slightly due to upcoming deployment activity."},
            {"type": "line_chart", "title": "Incident Forecast (Historical + Projected)", "data": {
                "series": [
                    {"key": "actual", "name": "Actual", "color": "#60a5fa", "showTrendLine": True, "showLabeledDots": True},
                    {"key": "forecast", "name": "Forecast", "color": "#60a5fa", "dashed": True},
                ],
                "stats": [
                    {"label": "Actual (Avg)", "value": "24.3", "color": "#60a5fa", "trend": -18},
                    {"label": "Forecast", "value": "15.5", "color": "#a78bfa", "trend": -36},
                ],
                "points": [
                    {"label": "W-8", "actual": 28, "forecast": None},
                    {"label": "W-7", "actual": 32, "forecast": None},
                    {"label": "W-6", "actual": 25, "forecast": None},
                    {"label": "W-5", "actual": 22, "forecast": None},
                    {"label": "W-4", "actual": 27, "forecast": None},
                    {"label": "W-3", "actual": 20, "forecast": None},
                    {"label": "W-2", "actual": 18, "forecast": None},
                    {"label": "W-1", "actual": 19, "forecast": 19},
                    {"label": "This Wk", "actual": None, "forecast": 17},
                    {"label": "Next Wk", "actual": None, "forecast": 15},
                    {"label": "W+2", "actual": None, "forecast": 16},
                    {"label": "W+3", "actual": None, "forecast": 14},
                ],
            }},
            {"type": "metric_cards", "data": [
                {"label": "Predicted P1s", "value": 1, "color": "#4caf50", "trend": -50, "icon": "error", "sparkline": [4, 3, 3, 2, 2, 2, 1]},
                {"label": "Predicted P2s", "value": 14, "color": "#ff9800", "trend": 8, "icon": "warning", "sparkline": [10, 11, 12, 12, 13, 13, 14]},
                {"label": "Confidence", "value": "78%", "color": "#60a5fa", "trend": None, "icon": "analytics"},
                {"label": "Risk Level", "value": "Medium", "color": "#ff9800", "trend": None, "icon": "shield"},
            ]},
            {"type": "recommendations", "data": [
                {"priority": "medium", "text": "Schedule change freeze for GWM platform during APAC peak hours", "impact": "Reduces deployment-related incident risk by 40%"},
                {"priority": "medium", "text": "Pre-scale database resources ahead of month-end processing", "impact": "Historical pattern shows 25% traffic increase at month-end"},
                {"priority": "low", "text": "Review and update runbooks for top 5 recurring incident types", "impact": "Supports continued MTTR improvement trend"},
            ]},
        ],
        "suggested_followups": [
            "What are the top recurring incident patterns?",
            "Show me the current incident analysis",
            "How are engineering teams performing?",
        ],
        "timestamp": datetime.now().isoformat(),
    }


def _aura_team_performance():
    return {
        "message_id": str(uuid.uuid4()),
        "content": [
            {"type": "text", "data": "Here's the engineering team performance breakdown for incident response. The Security team leads in response time, while the Collateral team has opportunities for improvement."},
            {"type": "table", "title": "Team Performance Metrics", "data": {
                "columns": ["Team", "MTTR", "MTTA", "Incidents (30d)", "Resolution Rate", "SLO Compliance"],
                "rows": [
                    ["Security", "1.2h", "2.1m", 18, "97%", "99.4%"],
                    ["Trading", "1.8h", "3.5m", 24, "95%", "99.98%"],
                    ["Data Platform", "2.1h", "3.8m", 15, "96%", "99.85%"],
                    ["Payments", "2.9h", "4.8m", 31, "92%", "99.1%"],
                    ["Collateral", "3.4h", "5.2m", 22, "88%", "98.2%"],
                    ["Client Experience", "2.3h", "4.1m", 12, "94%", "99.7%"],
                ],
            }},
            {"type": "bar_chart", "title": "MTTR by Team (hours)", "data": {
                "bars": [
                    {"name": "Security", "value": 1.2, "color": "#4caf50"},
                    {"name": "Trading", "value": 1.8, "color": "#4caf50"},
                    {"name": "Data", "value": 2.1, "color": "#60a5fa"},
                    {"name": "Client Exp", "value": 2.3, "color": "#60a5fa"},
                    {"name": "Payments", "value": 2.9, "color": "#ff9800"},
                    {"name": "Collateral", "value": 3.4, "color": "#f44336"},
                ],
                "xKey": "name",
                "yKey": "value",
                "unit": "h",
            }},
            {"type": "recommendations", "data": [
                {"priority": "high", "text": "Pair Collateral team with Security team for runbook best-practice sharing", "impact": "Target: reduce Collateral MTTR from 3.4h to 2.5h within 6 weeks"},
                {"priority": "medium", "text": "Implement automated incident classification for Payments team", "impact": "Reduces triage time, expected 20% MTTA improvement"},
                {"priority": "low", "text": "Recognize Security and Trading teams for top performance", "impact": "Reinforces best practices and team morale"},
            ]},
        ],
        "suggested_followups": [
            "What's driving the Collateral team's high MTTR?",
            "Give me the executive summary",
            "Show me the SLO compliance report",
        ],
        "timestamp": datetime.now().isoformat(),
    }


def _aura_default_response(message: str):
    return {
        "message_id": str(uuid.uuid4()),
        "content": [
            {"type": "text", "data": f"Thanks for your question. I'm AURA Assistant, your AI-powered observability companion. I can help you with a wide range of operational topics. Here are some things I'm great at:"},
            {"type": "text", "data": "• **Incident Analysis** — Real-time incident tracking, root cause, and impact assessment\n• **SLO Compliance** — Service level objectives, error budgets, and compliance reporting\n• **Blast Radius Analysis** — Dependency mapping and cascade failure prediction\n• **MTTR / MTTA Trends** — Mean time to resolve and acknowledge, team benchmarks\n• **Executive Summaries** — High-level platform health for leadership briefings\n• **Capacity Planning** — Resource utilization monitoring and scaling recommendations\n• **Deployment Status** — Recent and upcoming deployments with success metrics\n• **Alert Analysis** — Alert noise reduction and optimization insights\n• **Regional Comparison** — Cross-region health and performance benchmarking\n• **Trend Forecasting** — Predictive incident trends and risk assessment\n• **Team Performance** — Engineering team metrics and improvement areas"},
            {"type": "text", "data": "Try asking me something like \"What are the current incidents?\" or \"Give me an executive summary.\""},
        ],
        "suggested_followups": [
            "What are the current active incidents?",
            "Give me an executive summary",
            "Show me SLO compliance",
            "How are the engineering teams performing?",
        ],
        "timestamp": datetime.now().isoformat(),
    }


_AURA_SCENARIOS = [
    (["incident", "issues", "what's happening", "what is happening", "current status", "active p1", "active p2"], _aura_incident_analysis),
    (["slo", "compliance", "service level", "error budget"], _aura_slo_report),
    (["dependency", "blast", "cascade", "downstream", "upstream"], _aura_blast_radius),
    (["mttr", "mtta", "response time", "resolution time", "mean time"], _aura_mttr_analysis),
    (["executive", "summary", "overview", "leadership", "briefing"], _aura_executive_summary),
    (["capacity", "scaling", "resource", "utilization", "cpu", "memory"], _aura_capacity_planning),
    (["deployment", "deploy", "release", "rollout", "rollback"], _aura_deployment_status),
    (["alert", "noise", "false positive", "pager", "alarm"], _aura_alert_analysis),
    (["region", "comparison", "apac", "emea", "latam", "geographic"], _aura_regional_comparison),
    (["forecast", "prediction", "trend", "predict", "next week", "projected"], _aura_trend_forecast),
    (["team", "performance", "engineering", "productivity", "staff"], _aura_team_performance),
]


@app.post("/api/aura/chat")
async def aura_chat(payload: AuraChatRequest):
    msg_lower = payload.message.lower()
    response = None
    for keywords, handler in _AURA_SCENARIOS:
        if any(kw in msg_lower for kw in keywords):
            response = handler()
            break
    if response is None:
        response = _aura_default_response(payload.message)

    async def stream_sse():
        # Send metadata event first
        meta = {
            "message_id": response["message_id"],
            "timestamp": response["timestamp"],
        }
        yield f"event: meta\ndata: {json.dumps(meta)}\n\n"
        await asyncio.sleep(random.uniform(0.3, 0.6))

        # Stream each content block with a delay
        for block in response["content"]:
            yield f"event: block\ndata: {json.dumps(block)}\n\n"
            await asyncio.sleep(random.uniform(0.4, 0.9))

        # Send suggested followups
        if response.get("suggested_followups"):
            yield f"event: followups\ndata: {json.dumps(response['suggested_followups'])}\n\n"

        # Signal completion
        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(
        stream_sse(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
