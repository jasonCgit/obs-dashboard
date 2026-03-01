from fastapi import FastAPI, HTTPException, Query
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

# ── Dashboard Apps — filter-aware app registry for dashboard aggregation ──────
# Mirrors frontend appData.js for API consistency. In production, this comes
# from PATOOLS (business hierarchy) and V12 (technology hierarchy) APIs.
# Filter params: lob, subLob, cto, cbt, seal, appOwner, status, region
DASHBOARD_APPS = [
    # AWM — Asset Management
    {"seal": "35115", "name": "PANDA",                                 "lob": "AWM", "subLob": "Asset Management", "cto": "Gitanjali Nistala", "cbt": "Karthik Rajagopalan", "status": "healthy",  "region": "NA",   "incidents_30d": 1,  "incidents_today": 0, "recurring_30d": 1,  "p1_30d": 0, "p2_30d": 1},
    {"seal": "16649", "name": "Morgan Money",                          "lob": "AWM", "subLob": "Asset Management", "cto": "Jon Glennie",       "cbt": "Kalpesh Narkhede",    "status": "critical", "region": "APAC", "incidents_30d": 8,  "incidents_today": 2, "recurring_30d": 6,  "p1_30d": 2, "p2_30d": 6,
     "recent_issues": [
         {"description": "NAV calculation timeout — downstream pricing feed delay in APAC region", "time_ago": "25m ago", "severity": "critical"},
         {"description": "Memory pressure on liquidity aggregation service (85% heap)", "time_ago": "2h ago", "severity": "warning"},
     ]},
    {"seal": "90556", "name": "Spectrum UI",                           "lob": "AWM", "subLob": "Asset Management", "cto": "Sheetal Gandhi",    "cbt": "Alex Feinberg",       "status": "healthy",  "region": "NA",   "incidents_30d": 0,  "incidents_today": 0, "recurring_30d": 0,  "p1_30d": 0, "p2_30d": 0},
    {"seal": "91001", "name": "Quantum",                               "lob": "AWM", "subLob": "Asset Management", "cto": "Alec Hamby",        "cbt": "Michael Hasing",      "status": "healthy",  "region": "APAC", "incidents_30d": 1,  "incidents_today": 0, "recurring_30d": 0,  "p1_30d": 0, "p2_30d": 1},
    {"seal": "90215", "name": "Spectrum Portfolio Mgmt (Equities)",    "lob": "AWM", "subLob": "Asset Management", "cto": "Lakith Leelasena",  "cbt": "Aadi Thayyar",        "status": "healthy",  "region": "NA",   "incidents_30d": 1,  "incidents_today": 0, "recurring_30d": 0,  "p1_30d": 0, "p2_30d": 1},
    {"seal": "107517","name": "AM PMT Routing Service",                "lob": "AWM", "subLob": "Asset Management", "cto": "Lakith Leelasena",  "cbt": "Ashvin Venkatraman",  "status": "warning",  "region": "EMEA", "incidents_30d": 3,  "incidents_today": 0, "recurring_30d": 2,  "p1_30d": 0, "p2_30d": 3,
     "recent_issues": [
         {"description": "Intermittent routing failures to EMEA settlement gateway", "time_ago": "4h ago", "severity": "warning"},
     ]},
    {"seal": "81884", "name": "Order Decision Engine",                 "lob": "AWM", "subLob": "Asset Management", "cto": "Lakith Leelasena",  "cbt": "Kent Zheng",          "status": "healthy",  "region": "NA",   "incidents_30d": 0,  "incidents_today": 0, "recurring_30d": 0,  "p1_30d": 0, "p2_30d": 0},
    # AWM — Global Private Bank
    {"seal": "88180", "name": "Connect OS",                            "lob": "AWM", "subLob": "Global Private Bank", "cto": "Rod Thomas",     "cbt": "Arun Tummalapalli",   "status": "healthy",  "region": "NA",   "incidents_30d": 0,  "incidents_today": 0, "recurring_30d": 0,  "p1_30d": 0, "p2_30d": 0},
    {"seal": "90176", "name": "Advisor Connect",                       "lob": "AWM", "subLob": "Global Private Bank", "cto": "Rod Thomas",     "cbt": "Arun Tummalapalli",   "status": "warning",  "region": "NA",   "incidents_30d": 2,  "incidents_today": 1, "recurring_30d": 1,  "p1_30d": 0, "p2_30d": 2,
     "recent_issues": [
         {"description": "Advisor profile sync latency elevated (p95 > 2s during peak)", "time_ago": "1h ago", "severity": "warning"},
     ]},
    {"seal": "102987","name": "AWM Entitlements (WEAVE)",              "lob": "AWM", "subLob": "Global Private Bank", "cto": "Stephen Musacchia","cbt": "Pranit Pan",         "status": "healthy",  "region": "NA",   "incidents_30d": 0,  "incidents_today": 0, "recurring_30d": 0,  "p1_30d": 0, "p2_30d": 0},
    # AWM — AWM Shared
    {"seal": "84540", "name": "AWM Data Platform",                     "lob": "AWM", "subLob": "AWM Shared",    "cto": "Michael Heizer",       "cbt": "Nidhi Verma",         "status": "healthy",  "region": "NA",   "incidents_30d": 1,  "incidents_today": 0, "recurring_30d": 0,  "p1_30d": 0, "p2_30d": 1},
    # CIB — Markets
    {"seal": "62100", "name": "Real-Time Payments Gateway",            "lob": "CIB", "subLob": "Payments",      "cto": "Joe Pedone",           "cbt": "Alex Rivera",         "status": "critical", "region": "NA",   "incidents_30d": 6,  "incidents_today": 2, "recurring_30d": 4,  "p1_30d": 1, "p2_30d": 5,
     "recent_issues": [
         {"description": "Connection pool exhaustion — max connections reached on primary DB cluster", "time_ago": "20m ago", "severity": "critical"},
         {"description": "Latency spike on /api/payments/process (p99 > 8s)", "time_ago": "1h ago", "severity": "warning"},
     ]},
    {"seal": "45440", "name": "Credit Card Processing Engine",         "lob": "CIB", "subLob": "Markets",       "cto": "Joe Pedone",           "cbt": "Robert Patel",        "status": "warning",  "region": "NA",   "incidents_30d": 4,  "incidents_today": 1, "recurring_30d": 3,  "p1_30d": 0, "p2_30d": 4,
     "recent_issues": [
         {"description": "Elevated transaction decline rate on Visa network (2.1% vs 0.8% baseline)", "time_ago": "6h ago", "severity": "warning"},
     ]},
    # CIB — Global Banking
    {"seal": "106003","name": "CIB Digital Onboarding",                "lob": "CIB", "subLob": "Global Banking","cto": "Jennifer Liu",         "cbt": "Alex Rivera",         "status": "healthy",  "region": "EMEA", "incidents_30d": 0,  "incidents_today": 0, "recurring_30d": 0,  "p1_30d": 0, "p2_30d": 0},
    {"seal": "85003", "name": "CIB Payments Gateway",                  "lob": "CIB", "subLob": "Payments",      "cto": "Thomas Anderson",      "cbt": "Samantha Park",       "status": "healthy",  "region": "NA",   "incidents_30d": 1,  "incidents_today": 0, "recurring_30d": 0,  "p1_30d": 0, "p2_30d": 1},
    # CCB
    {"seal": "83278", "name": "Consumer Lending Platform",             "lob": "CCB", "subLob": "",              "cto": "Michael Torres",       "cbt": "Sarah Kim",           "status": "healthy",  "region": "NA",   "incidents_30d": 2,  "incidents_today": 0, "recurring_30d": 1,  "p1_30d": 0, "p2_30d": 2},
    {"seal": "89749", "name": "Digital Banking Portal",                "lob": "CCB", "subLob": "",              "cto": "Michael Torres",       "cbt": "Robert Nguyen",       "status": "healthy",  "region": "NA",   "incidents_30d": 1,  "incidents_today": 0, "recurring_30d": 0,  "p1_30d": 0, "p2_30d": 1},
    # CDAO
    {"seal": "88652", "name": "Enterprise Data Lake",                  "lob": "CDAO","subLob": "",              "cto": "David Chen",           "cbt": "Nicole Chen",         "status": "healthy",  "region": "NA",   "incidents_30d": 0,  "incidents_today": 0, "recurring_30d": 0,  "p1_30d": 0, "p2_30d": 0},
    {"seal": "110787","name": "ML Feature Store",                      "lob": "CDAO","subLob": "",              "cto": "David Chen",           "cbt": "Derek Johnson",       "status": "healthy",  "region": "NA",   "incidents_30d": 1,  "incidents_today": 0, "recurring_30d": 0,  "p1_30d": 0, "p2_30d": 1},
    # EP
    {"seal": "110143","name": "Employee Portal",                       "lob": "EP",  "subLob": "",              "cto": "Lisa Zhang",           "cbt": "Rachel Kim",          "status": "healthy",  "region": "NA",   "incidents_30d": 0,  "incidents_today": 0, "recurring_30d": 0,  "p1_30d": 0, "p2_30d": 0},
]


def _filter_dashboard_apps(
    lob: list[str] | None = None,
    sub_lob: list[str] | None = None,
    cto: list[str] | None = None,
    cbt: list[str] | None = None,
    seal: list[str] | None = None,
    status: list[str] | None = None,
    search: str | None = None,
) -> list[dict]:
    """Filter DASHBOARD_APPS by the given scope params.
    In production this becomes a database query with WHERE clauses."""
    result = DASHBOARD_APPS
    if lob:
        result = [a for a in result if a["lob"] in lob]
    if sub_lob:
        result = [a for a in result if a.get("subLob", "") in sub_lob]
    if cto:
        result = [a for a in result if a["cto"] in cto]
    if cbt:
        result = [a for a in result if a["cbt"] in cbt]
    if seal:
        result = [a for a in result if a["seal"] in seal]
    if status:
        result = [a for a in result if a["status"] in status]
    if search:
        q = search.lower()
        result = [a for a in result if q in a["name"].lower() or q in a.get("seal", "").lower()]
    return result


def _parse_filters(
    lob: list[str] | None = None,
    sub_lob: list[str] | None = None,
    cto: list[str] | None = None,
    cbt: list[str] | None = None,
    seal: list[str] | None = None,
    status: list[str] | None = None,
    search: str | None = None,
) -> dict:
    """Bundle filter params for passing to helper functions."""
    return {k: v for k, v in {
        "lob": lob, "sub_lob": sub_lob, "cto": cto, "cbt": cbt,
        "seal": seal, "status": status, "search": search,
    }.items() if v}


# Filter-aware query param signature reused across all dashboard endpoints
FILTER_PARAMS = {
    "lob":     Query(None, description="LOB filter (multi-value, e.g. ?lob=AWM&lob=CIB)"),
    "sub_lob": Query(None, description="Sub LOB filter"),
    "cto":     Query(None, description="CTO filter"),
    "cbt":     Query(None, description="CBT filter"),
    "seal":    Query(None, description="SEAL ID filter"),
    "status":  Query(None, description="Status filter (critical/warning/healthy)"),
    "search":  Query(None, description="Free-text search across app name and SEAL"),
}


HEALTH_SUMMARY = {
    "critical_issues": 2,
    "warnings": 3,
    "recurring_30d": 16,
    "incidents_today": 4,
    "trends": {
        "critical_issues": {"spark": [4, 3, 3, 2, 3, 2, 2], "pct": -33},
        "warnings":        {"spark": [5, 4, 4, 3, 3, 3, 3], "pct": -40},
        "recurring_30d":   {"spark": [12, 13, 14, 14, 15, 15, 16], "pct": 14},
        "incidents_today": {"spark": [6, 8, 5, 7, 4, 6, 4], "pct": -33},
    },
}

AI_ANALYSIS = {
    "critical_alert": (
        "Currently tracking 2 critical applications affecting approximately 4,800 users. "
        "Morgan Money is experiencing NAV calculation timeouts due to a downstream pricing feed "
        "delay in APAC, and Real-Time Payments Gateway has connection pool exhaustion on the "
        "primary DB cluster. Both issues are being actively triaged."
    ),
    "trend_analysis": (
        "Issue frequency has decreased 33% over the past 7 days. Morgan Money has experienced "
        "8 incidents in 30 days, primarily NAV calculation timeouts during APAC market open. "
        "Real-Time Payments Gateway has seen 6 incidents related to connection pool capacity."
    ),
    "recommendations": [
        "Investigate Morgan Money NAV calculation timeout — coordinate with APAC pricing feed provider to resolve downstream latency",
        "Address Real-Time Payments Gateway connection pool exhaustion — increase max connections and add connection recycling on primary DB cluster",
        "Schedule incident review with Liquidity Management and Payments Core teams to prevent recurrence",
    ],
}

REGIONAL_STATUS = [
    {"region": "NA",   "status": "healthy",  "sod_impacts": 0, "app_issues": 0},
    {"region": "EMEA", "status": "warning",  "sod_impacts": 0, "app_issues": 1},
    {"region": "APAC", "status": "critical", "sod_impacts": 1, "app_issues": 1},
]

CRITICAL_APPS = [
    {
        "id": "morgan-money",
        "name": "MORGAN MONEY",
        "seal": "SEAL - 16649",
        "status": "critical",
        "current_issues": 2,
        "recurring_30d": 6,
        "last_incident": "25m ago",
        "recent_issues": [
            {"description": "NAV calculation timeout — downstream pricing feed delay in APAC region", "time_ago": "25m ago", "severity": "critical"},
            {"description": "Memory pressure on liquidity aggregation service (85% heap)", "time_ago": "2h ago", "severity": "warning"},
        ],
    },
    {
        "id": "real-time-payments-gateway",
        "name": "REAL-TIME PAYMENTS GATEWAY",
        "seal": "SEAL - 62100",
        "status": "critical",
        "current_issues": 2,
        "recurring_30d": 4,
        "last_incident": "20m ago",
        "recent_issues": [
            {"description": "Connection pool exhaustion — max connections reached on primary DB cluster", "time_ago": "20m ago", "severity": "critical"},
            {"description": "Latency spike on /api/payments/process (p99 > 8s)", "time_ago": "1h ago", "severity": "warning"},
        ],
    },
]

WARNING_APPS = [
    {
        "id": "am-pmt-routing",
        "name": "AM PMT ROUTING SERVICE",
        "seal": "SEAL - 107517",
        "status": "warning",
        "current_issues": 1,
        "recurring_30d": 2,
        "last_incident": "4h ago",
        "recent_issues": [
            {"description": "Intermittent routing failures to EMEA settlement gateway", "time_ago": "4h ago", "severity": "warning"},
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

    # MORGAN MONEY cluster (16649) — Ultra Simple (3 nodes)
    {"id": "mm-ui",               "label": "MORGAN-MONEY-UI",              "status": "healthy",  "team": "Client Data",       "sla": "99.9%",  "incidents_30d": 0},
    {"id": "mm-api",              "label": "MORGAN-MONEY-API",             "status": "warning",  "team": "Client Data",       "sla": "99.5%",  "incidents_30d": 3},
    {"id": "mm-data-svc",         "label": "MORGAN-MONEY-DATA-SERVICE",    "status": "critical", "team": "Client Data",       "sla": "99.9%",  "incidents_30d": 8},

    # PANDA cluster (35115) — Simple (4 nodes)
    {"id": "panda-gateway",       "label": "PANDA-GATEWAY",               "status": "healthy",  "team": "Client Data",       "sla": "99.9%",  "incidents_30d": 0},
    {"id": "panda-data-svc",      "label": "PANDA-DATA-SERVICE",          "status": "healthy",  "team": "Client Data",       "sla": "99.5%",  "incidents_30d": 1},
    {"id": "panda-cache-svc",     "label": "PANDA-CACHE-SERVICE",         "status": "warning",  "team": "Client Data",       "sla": "99.0%",  "incidents_30d": 2},
    {"id": "panda-export-svc",    "label": "PANDA-EXPORT-SERVICE",        "status": "healthy",  "team": "Client Data",       "sla": "99.0%",  "incidents_30d": 0},

    # QUANTUM cluster (91001) — Medium (7 nodes)
    {"id": "quantum-portal",         "label": "QUANTUM-PORTAL",              "status": "healthy",  "team": "JPMAIM Platform",   "sla": "99.9%",  "incidents_30d": 0},
    {"id": "quantum-api-gw",         "label": "QUANTUM-API-GATEWAY",         "status": "warning",  "team": "JPMAIM Platform",   "sla": "99.99%", "incidents_30d": 3},
    {"id": "quantum-portfolio-svc",  "label": "QUANTUM-PORTFOLIO-SERVICE",   "status": "critical", "team": "JPMAIM Platform",   "sla": "99.9%",  "incidents_30d": 6},
    {"id": "quantum-analytics-svc",  "label": "QUANTUM-ANALYTICS-ENGINE",    "status": "warning",  "team": "JPMAIM Platform",   "sla": "99.5%",  "incidents_30d": 2},
    {"id": "quantum-report-svc",     "label": "QUANTUM-REPORT-SERVICE",      "status": "healthy",  "team": "JPMAIM Platform",   "sla": "99.0%",  "incidents_30d": 0},
    {"id": "quantum-data-lake",      "label": "QUANTUM-DATA-LAKE",           "status": "critical", "team": "JPMAIM Platform",   "sla": "99.9%",  "incidents_30d": 5},
    {"id": "quantum-auth-svc",       "label": "QUANTUM-AUTH-SERVICE",        "status": "healthy",  "team": "JPMAIM Platform",   "sla": "99.99%", "incidents_30d": 0},

    # ORDER DECISION ENGINE cluster (81884) — Medium (8 nodes)
    {"id": "ode-router",          "label": "ODE-ORDER-ROUTER",             "status": "warning",  "team": "Trading",           "sla": "99.9%",  "incidents_30d": 3},
    {"id": "ode-rule-engine",     "label": "ODE-RULE-ENGINE",              "status": "healthy",  "team": "Trading",           "sla": "99.5%",  "incidents_30d": 0},
    {"id": "ode-market-feed",     "label": "ODE-MARKET-DATA-FEED",         "status": "warning",  "team": "Trading",           "sla": "99.9%",  "incidents_30d": 4},
    {"id": "ode-risk-check",      "label": "ODE-RISK-VALIDATION",          "status": "critical", "team": "Trading",           "sla": "99.99%", "incidents_30d": 7},
    {"id": "ode-exec-svc",        "label": "ODE-EXECUTION-SERVICE",        "status": "critical", "team": "Trading",           "sla": "99.9%",  "incidents_30d": 5},
    {"id": "ode-audit-log",       "label": "ODE-AUDIT-LOG",                "status": "healthy",  "team": "Trading",           "sla": "99.0%",  "incidents_30d": 0},
    {"id": "ode-notif-svc",       "label": "ODE-NOTIFICATION-SERVICE",     "status": "healthy",  "team": "Trading",           "sla": "99.5%",  "incidents_30d": 1},
    {"id": "ode-reconcile-svc",   "label": "ODE-RECONCILIATION-SERVICE",   "status": "warning",  "team": "Trading",           "sla": "99.5%",  "incidents_30d": 2},

    # CREDIT CARD PROCESSING ENGINE cluster (45440) — Complex (11 nodes)
    {"id": "ccpe-ingress",        "label": "CCPE-TRANSACTION-INGRESS",     "status": "healthy",  "team": "Cards Platform",    "sla": "99.99%", "incidents_30d": 0},
    {"id": "ccpe-auth-svc",       "label": "CCPE-AUTHORIZATION-SERVICE",   "status": "warning",  "team": "Cards Platform",    "sla": "99.99%", "incidents_30d": 3},
    {"id": "ccpe-fraud-engine",   "label": "CCPE-FRAUD-DETECTION-ENGINE",  "status": "critical", "team": "Cards Platform",    "sla": "99.99%", "incidents_30d": 5},
    {"id": "ccpe-ledger-svc",     "label": "CCPE-LEDGER-SERVICE",          "status": "critical", "team": "Cards Platform",    "sla": "99.99%", "incidents_30d": 4},
    {"id": "ccpe-limit-svc",      "label": "CCPE-CREDIT-LIMIT-SERVICE",    "status": "warning",  "team": "Cards Platform",    "sla": "99.9%",  "incidents_30d": 2},
    {"id": "ccpe-notif-svc",      "label": "CCPE-CUSTOMER-NOTIFICATIONS",  "status": "healthy",  "team": "Cards Platform",    "sla": "99.5%",  "incidents_30d": 0},
    {"id": "ccpe-dispute-svc",    "label": "CCPE-DISPUTE-HANDLER",         "status": "healthy",  "team": "Cards Platform",    "sla": "99.5%",  "incidents_30d": 1},
    {"id": "ccpe-rewards-svc",    "label": "CCPE-REWARDS-PROCESSING",      "status": "healthy",  "team": "Cards Platform",    "sla": "99.0%",  "incidents_30d": 0},
    {"id": "ccpe-settlement-svc", "label": "CCPE-SETTLEMENT-SERVICE",      "status": "warning",  "team": "Cards Platform",    "sla": "99.9%",  "incidents_30d": 2},
    {"id": "ccpe-report-svc",     "label": "CCPE-REPORTING-SERVICE",       "status": "healthy",  "team": "Cards Platform",    "sla": "99.0%",  "incidents_30d": 0},
    {"id": "ccpe-archive-svc",    "label": "CCPE-DATA-ARCHIVAL",           "status": "healthy",  "team": "Cards Platform",    "sla": "99.0%",  "incidents_30d": 0},

    # WEAVE / AWM ENTITLEMENTS cluster (102987) — Complex (12 nodes)
    {"id": "weave-gateway",       "label": "WEAVE-GATEWAY",                "status": "healthy",  "team": "Tech Shared Svc",   "sla": "99.99%", "incidents_30d": 0},
    {"id": "weave-policy-engine", "label": "WEAVE-POLICY-ENGINE",          "status": "critical", "team": "Tech Shared Svc",   "sla": "99.99%", "incidents_30d": 9},
    {"id": "weave-role-svc",      "label": "WEAVE-ROLE-SERVICE",           "status": "warning",  "team": "Tech Shared Svc",   "sla": "99.9%",  "incidents_30d": 3},
    {"id": "weave-user-store",    "label": "WEAVE-USER-DIRECTORY",         "status": "critical", "team": "Tech Shared Svc",   "sla": "99.99%", "incidents_30d": 7},
    {"id": "weave-audit-svc",     "label": "WEAVE-AUDIT-SERVICE",          "status": "healthy",  "team": "Tech Shared Svc",   "sla": "99.0%",  "incidents_30d": 0},
    {"id": "weave-sync-svc",      "label": "WEAVE-IDENTITY-SYNC",         "status": "warning",  "team": "Tech Shared Svc",   "sla": "99.5%",  "incidents_30d": 2},
    {"id": "weave-token-svc",     "label": "WEAVE-TOKEN-SERVICE",          "status": "healthy",  "team": "Tech Shared Svc",   "sla": "99.99%", "incidents_30d": 0},
    {"id": "weave-consent-svc",   "label": "WEAVE-CONSENT-SERVICE",        "status": "healthy",  "team": "Tech Shared Svc",   "sla": "99.5%",  "incidents_30d": 0},
    {"id": "weave-admin-portal",  "label": "WEAVE-ADMIN-PORTAL",           "status": "healthy",  "team": "Tech Shared Svc",   "sla": "99.9%",  "incidents_30d": 1},
    {"id": "weave-report-svc",    "label": "WEAVE-COMPLIANCE-REPORTS",     "status": "warning",  "team": "Tech Shared Svc",   "sla": "99.0%",  "incidents_30d": 2},
    {"id": "weave-cache-layer",   "label": "WEAVE-DISTRIBUTED-CACHE",      "status": "healthy",  "team": "Tech Shared Svc",   "sla": "99.9%",  "incidents_30d": 0},
    {"id": "weave-event-bus",     "label": "WEAVE-EVENT-BUS",              "status": "critical", "team": "Tech Shared Svc",   "sla": "99.9%",  "incidents_30d": 4},

    # REAL-TIME PAYMENTS GATEWAY cluster (62100) — Very Complex (15 nodes)
    {"id": "rtpg-ingress-lb",     "label": "RTPG-INGRESS-LB",             "status": "healthy",  "team": "Payments Core",     "sla": "99.99%", "incidents_30d": 0},
    {"id": "rtpg-api-gw",         "label": "RTPG-API-GATEWAY",            "status": "warning",  "team": "Payments Core",     "sla": "99.99%", "incidents_30d": 3},
    {"id": "rtpg-validation-svc", "label": "RTPG-VALIDATION-SERVICE",     "status": "healthy",  "team": "Payments Core",     "sla": "99.9%",  "incidents_30d": 1},
    {"id": "rtpg-routing-engine", "label": "RTPG-ROUTING-ENGINE",         "status": "critical", "team": "Payments Core",     "sla": "99.99%", "incidents_30d": 6},
    {"id": "rtpg-sanctions-svc",  "label": "RTPG-SANCTIONS-SCREENING",    "status": "warning",  "team": "Payments Core",     "sla": "99.99%", "incidents_30d": 2},
    {"id": "rtpg-aml-svc",        "label": "RTPG-AML-CHECK-SERVICE",      "status": "healthy",  "team": "Payments Core",     "sla": "99.9%",  "incidents_30d": 0},
    {"id": "rtpg-fx-converter",   "label": "RTPG-FX-CONVERTER",           "status": "warning",  "team": "Payments Core",     "sla": "99.9%",  "incidents_30d": 3},
    {"id": "rtpg-clearing-svc",   "label": "RTPG-CLEARING-ENGINE",        "status": "critical", "team": "Payments Core",     "sla": "99.99%", "incidents_30d": 5},
    {"id": "rtpg-settlement-svc", "label": "RTPG-SETTLEMENT-ENGINE",      "status": "critical", "team": "Payments Core",     "sla": "99.99%", "incidents_30d": 4},
    {"id": "rtpg-ledger-svc",     "label": "RTPG-CORE-LEDGER",            "status": "warning",  "team": "Payments Core",     "sla": "99.99%", "incidents_30d": 2},
    {"id": "rtpg-notif-svc",      "label": "RTPG-NOTIFICATION-DISPATCH",  "status": "healthy",  "team": "Payments Core",     "sla": "99.5%",  "incidents_30d": 0},
    {"id": "rtpg-audit-svc",      "label": "RTPG-AUDIT-TRAIL",            "status": "healthy",  "team": "Payments Core",     "sla": "99.0%",  "incidents_30d": 0},
    {"id": "rtpg-recon-svc",      "label": "RTPG-RECONCILIATION",         "status": "healthy",  "team": "Payments Core",     "sla": "99.5%",  "incidents_30d": 1},
    {"id": "rtpg-archive-svc",    "label": "RTPG-DATA-ARCHIVAL",          "status": "healthy",  "team": "Payments Core",     "sla": "99.0%",  "incidents_30d": 0},
    {"id": "rtpg-monitor-svc",    "label": "RTPG-HEALTH-MONITOR",         "status": "warning",  "team": "Payments Core",     "sla": "99.9%",  "incidents_30d": 2},
]

# ── Health Indicator Types ────────────────────────────────────────────────────
INDICATOR_TYPES = [
    "Process Group",
    "Service",
    "Synthetic",
]

COMPONENT_INDICATOR_MAP = {
    # Synthetic — UI services, portals, frontends (synthetic monitors)
    "connect-portal": "Synthetic", "spieq-ui-service": "Synthetic",
    "mm-ui": "Synthetic", "quantum-portal": "Synthetic",
    "weave-admin-portal": "Synthetic", "connect-home-app-na": "Synthetic",
    "connect-home-app-apac": "Synthetic", "connect-home-app-emea": "Synthetic",
    # Service — API gateways, query/order services
    "api-gateway": "Service", "spieq-api-gateway": "Service", "connect-cloud-gw": "Service",
    "panda-gateway": "Service", "quantum-api-gw": "Service", "rtpg-api-gw": "Service",
    "ode-router": "Service", "rtpg-ingress-lb": "Service", "ccpe-ingress": "Service",
    "weave-gateway": "Service", "meridian-query": "Service", "meridian-order": "Service",
    "sb-service-order": "Service", "sb-service-query": "Service", "mm-api": "Service",
    # Process Group — databases, caches, queues, data stores
    "db-primary": "Process Group", "db-replica": "Process Group",
    "cache-layer": "Process Group", "message-queue": "Process Group",
    "quantum-data-lake": "Process Group", "weave-cache-layer": "Process Group",
    "weave-event-bus": "Process Group", "rtpg-archive-svc": "Process Group",
    "ccpe-archive-svc": "Process Group", "panda-cache-svc": "Process Group",
    # Service — auth, fraud, validation, risk, compliance
    "auth-service": "Service", "connect-auth-svc": "Service",
    "ccpe-auth-svc": "Service", "ccpe-fraud-engine": "Service",
    "spieq-risk-service": "Service", "ode-risk-check": "Service",
    "rtpg-validation-svc": "Service", "rtpg-sanctions-svc": "Service",
    "rtpg-aml-svc": "Service", "weave-policy-engine": "Service",
    "weave-token-svc": "Service", "quantum-auth-svc": "Service",
    "ipbol-manager-auth": "Service", "spieq-compliance-svc": "Service",
    "weave-consent-svc": "Service",
    # Service — trade execution, routing, payments, settlement, clearing
    "spieq-trade-service": "Service", "payment-gateway": "Service",
    "ode-exec-svc": "Service", "rtpg-routing-engine": "Service",
    "rtpg-clearing-svc": "Service", "rtpg-settlement-svc": "Service",
    "ccpe-ledger-svc": "Service", "ccpe-settlement-svc": "Service",
    "ccpe-limit-svc": "Service", "ccpe-rewards-svc": "Service",
    "ccpe-dispute-svc": "Service", "spieq-settlement-svc": "Service",
    "spieq-order-router": "Service", "spieq-pricing-engine": "Service",
    "rtpg-ledger-svc": "Service", "rtpg-fx-converter": "Service",
    "mm-data-svc": "Service", "quantum-portfolio-svc": "Service",
    # Process Group — data sync, pipelines, profiles, integrations
    "data-pipeline": "Process Group", "connect-data-sync": "Process Group",
    "connect-profile-svc": "Dependency Health", "ipbol-account": "Dependency Health",
    "ipbol-account-green": "Dependency Health", "ipbol-doc-domain": "Dependency Health",
    "ipbol-doc-domain-g": "Dependency Health", "ipbol-doc-delivery": "Dependency Health",
    "ipbol-contact-sync": "Process Group", "ipbol-investments": "Process Group",
    "connect-coverage-app": "Process Group", "active-advisory": "Service",
    "spieq-market-data": "Process Group", "ode-market-feed": "Process Group",
    "spieq-portfolio-svc": "Synthetic", "panda-data-svc": "Process Group",
    "panda-export-svc": "Process Group", "quantum-analytics-svc": "Service",
    "weave-role-svc": "Service", "weave-user-store": "Process Group",
    "weave-sync-svc": "Process Group", "connect-team-mgr": "Service",
    "connect-search-svc": "Service", "connect-pref-svc": "Process Group",
    "connect-session-svc": "Service", "connect-config-svc": "Process Group",
    "connect-doc-svc": "Service", "ode-rule-engine": "Service",
    "ode-reconcile-svc": "Service", "rtpg-recon-svc": "Service",
    # Process Group — audit, notification, reporting, monitoring
    "email-notification": "Process Group", "spieq-audit-trail": "Process Group",
    "spieq-notif-svc": "Service", "connect-notification": "Service",
    "connect-audit-svc": "Synthetic", "connect-metrics-svc": "Process Group",
    "ode-audit-log": "Process Group", "ode-notif-svc": "Service",
    "ccpe-notif-svc": "Service", "ccpe-report-svc": "Service",
    "weave-audit-svc": "Process Group", "weave-report-svc": "Service",
    "quantum-report-svc": "Service", "rtpg-notif-svc": "Service",
    "rtpg-audit-svc": "Process Group", "rtpg-monitor-svc": "Process Group",
}


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

    # Cross-app downstream from Advisor Connect (90176)
    ("connect-coverage-app",     "spieq-portfolio-svc"),     # coverage reads portfolio data from Spectrum
    ("connect-data-sync",        "quantum-data-lake"),        # data sync pipeline to Quantum
    ("ipbol-account",            "ccpe-ledger-svc"),           # IPBOL account queries credit card ledger
    ("spieq-settlement-svc",     "spieq-notif-svc"),
    ("spieq-api-gateway",        "payment-gateway"),
    ("payment-gateway",          "spieq-notif-svc"),

    # MORGAN MONEY cluster (16649) — Ultra Simple
    ("mm-ui",              "mm-api"),
    ("mm-api",             "mm-data-svc"),

    # PANDA cluster (35115) — Simple
    ("panda-gateway",      "panda-data-svc"),
    ("panda-gateway",      "panda-cache-svc"),
    ("panda-data-svc",     "panda-cache-svc"),
    ("panda-data-svc",     "panda-export-svc"),

    # QUANTUM cluster (91001) — Medium
    ("quantum-portal",          "quantum-api-gw"),
    ("quantum-api-gw",          "quantum-portfolio-svc"),
    ("quantum-api-gw",          "quantum-analytics-svc"),
    ("quantum-api-gw",          "quantum-auth-svc"),
    ("quantum-portfolio-svc",   "quantum-data-lake"),
    ("quantum-analytics-svc",   "quantum-data-lake"),
    ("quantum-analytics-svc",   "quantum-report-svc"),
    ("quantum-report-svc",      "quantum-data-lake"),

    # ORDER DECISION ENGINE cluster (81884) — Medium
    ("ode-router",          "ode-rule-engine"),
    ("ode-router",          "ode-risk-check"),
    ("ode-router",          "ode-market-feed"),
    ("ode-rule-engine",     "ode-exec-svc"),
    ("ode-risk-check",      "ode-market-feed"),
    ("ode-risk-check",      "ode-exec-svc"),
    ("ode-exec-svc",        "ode-audit-log"),
    ("ode-exec-svc",        "ode-notif-svc"),
    ("ode-exec-svc",        "ode-reconcile-svc"),
    ("ode-reconcile-svc",   "ode-audit-log"),

    # CREDIT CARD PROCESSING ENGINE cluster (45440) — Complex
    ("ccpe-ingress",         "ccpe-auth-svc"),
    ("ccpe-auth-svc",        "ccpe-fraud-engine"),
    ("ccpe-auth-svc",        "ccpe-limit-svc"),
    ("ccpe-fraud-engine",    "ccpe-ledger-svc"),
    ("ccpe-limit-svc",       "ccpe-ledger-svc"),
    ("ccpe-ledger-svc",      "ccpe-settlement-svc"),
    ("ccpe-ledger-svc",      "ccpe-rewards-svc"),
    ("ccpe-ledger-svc",      "ccpe-notif-svc"),
    ("ccpe-settlement-svc",  "ccpe-report-svc"),
    ("ccpe-settlement-svc",  "ccpe-archive-svc"),
    ("ccpe-dispute-svc",     "ccpe-ledger-svc"),
    ("ccpe-dispute-svc",     "ccpe-notif-svc"),
    ("ccpe-report-svc",      "ccpe-archive-svc"),

    # WEAVE / AWM ENTITLEMENTS cluster (102987) — Complex
    ("weave-admin-portal",   "weave-gateway"),
    ("weave-gateway",        "weave-policy-engine"),
    ("weave-gateway",        "weave-token-svc"),
    ("weave-gateway",        "weave-audit-svc"),
    ("weave-policy-engine",  "weave-role-svc"),
    ("weave-policy-engine",  "weave-user-store"),
    ("weave-policy-engine",  "weave-cache-layer"),
    ("weave-role-svc",       "weave-user-store"),
    ("weave-role-svc",       "weave-cache-layer"),
    ("weave-user-store",     "weave-sync-svc"),
    ("weave-sync-svc",       "weave-event-bus"),
    ("weave-token-svc",      "weave-cache-layer"),
    ("weave-token-svc",      "weave-user-store"),
    ("weave-consent-svc",    "weave-user-store"),
    ("weave-consent-svc",    "weave-audit-svc"),
    ("weave-report-svc",     "weave-audit-svc"),
    ("weave-report-svc",     "weave-role-svc"),
    ("weave-event-bus",      "weave-audit-svc"),

    # REAL-TIME PAYMENTS GATEWAY cluster (62100) — Very Complex
    ("rtpg-ingress-lb",      "rtpg-api-gw"),
    ("rtpg-api-gw",          "rtpg-validation-svc"),
    ("rtpg-api-gw",          "rtpg-audit-svc"),
    ("rtpg-api-gw",          "rtpg-monitor-svc"),
    ("rtpg-validation-svc",  "rtpg-routing-engine"),
    ("rtpg-routing-engine",  "rtpg-sanctions-svc"),
    ("rtpg-routing-engine",  "rtpg-aml-svc"),
    ("rtpg-routing-engine",  "rtpg-fx-converter"),
    ("rtpg-routing-engine",  "rtpg-clearing-svc"),
    ("rtpg-sanctions-svc",   "rtpg-clearing-svc"),
    ("rtpg-aml-svc",         "rtpg-clearing-svc"),
    ("rtpg-clearing-svc",    "rtpg-settlement-svc"),
    ("rtpg-settlement-svc",  "rtpg-ledger-svc"),
    ("rtpg-settlement-svc",  "rtpg-notif-svc"),
    ("rtpg-settlement-svc",  "rtpg-recon-svc"),
    ("rtpg-recon-svc",       "rtpg-ledger-svc"),
    ("rtpg-recon-svc",       "rtpg-archive-svc"),
    ("rtpg-ledger-svc",      "rtpg-audit-svc"),
    ("rtpg-monitor-svc",     "rtpg-audit-svc"),
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
    # Ultra Simple (3 components) — linear data service chain
    "16649": ["mm-ui", "mm-api", "mm-data-svc"],
    # Simple (4 components) — data distribution with caching
    "35115": ["panda-gateway", "panda-data-svc", "panda-cache-svc", "panda-export-svc"],
    # Medium (7 components) — investment management platform
    "91001": [
        "quantum-portal", "quantum-api-gw", "quantum-portfolio-svc",
        "quantum-analytics-svc", "quantum-report-svc", "quantum-data-lake",
        "quantum-auth-svc",
    ],
    # Medium (8 components) — order routing and decision engine
    "81884": [
        "ode-router", "ode-rule-engine", "ode-market-feed", "ode-risk-check",
        "ode-exec-svc", "ode-audit-log", "ode-notif-svc", "ode-reconcile-svc",
    ],
    # Complex (11 components) — credit card processing chain
    "45440": [
        "ccpe-ingress", "ccpe-auth-svc", "ccpe-fraud-engine", "ccpe-ledger-svc",
        "ccpe-limit-svc", "ccpe-notif-svc", "ccpe-dispute-svc", "ccpe-rewards-svc",
        "ccpe-settlement-svc", "ccpe-report-svc", "ccpe-archive-svc",
    ],
    # Complex (12 components) — enterprise entitlements system
    "102987": [
        "weave-gateway", "weave-policy-engine", "weave-role-svc", "weave-user-store",
        "weave-audit-svc", "weave-sync-svc", "weave-token-svc", "weave-consent-svc",
        "weave-admin-portal", "weave-report-svc", "weave-cache-layer", "weave-event-bus",
    ],
    # Very Complex (15 components) — real-time payments processing
    "62100": [
        "rtpg-ingress-lb", "rtpg-api-gw", "rtpg-validation-svc", "rtpg-routing-engine",
        "rtpg-sanctions-svc", "rtpg-aml-svc", "rtpg-fx-converter", "rtpg-clearing-svc",
        "rtpg-settlement-svc", "rtpg-ledger-svc", "rtpg-notif-svc", "rtpg-audit-svc",
        "rtpg-recon-svc", "rtpg-archive-svc", "rtpg-monitor-svc",
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
    # ── Morgan Money (16649) — Ultra Simple ──
    ("mm-ui",                 "gap-pool-na-01"),
    ("mm-api",                "gkp-cluster-na-01"),
    ("mm-data-svc",           "gkp-cluster-na-01"),
    # ── PANDA (35115) — Simple ──
    ("panda-gateway",         "gap-pool-na-01"),
    ("panda-data-svc",        "gkp-cluster-na-01"),
    ("panda-cache-svc",       "gkp-cluster-na-01"),
    ("panda-export-svc",      "ecs-na-01"),
    # ── Quantum (91001) — Medium ──
    ("quantum-portal",        "gap-pool-na-01"),
    ("quantum-api-gw",        "gkp-cluster-na-01"),
    ("quantum-portfolio-svc", "gkp-cluster-na-01"),
    ("quantum-analytics-svc", "eks-na-01"),
    ("quantum-report-svc",    "ecs-na-01"),
    ("quantum-data-lake",     "gkp-cluster-apac-01"),
    ("quantum-auth-svc",      "gkp-cluster-na-01"),
    # ── Order Decision Engine (81884) — Medium ──
    ("ode-router",            "gap-pool-na-01"),
    ("ode-rule-engine",       "gkp-cluster-na-01"),
    ("ode-market-feed",       "eks-na-01"),
    ("ode-risk-check",        "gkp-cluster-na-01"),
    ("ode-exec-svc",          "gkp-cluster-na-01"),
    ("ode-audit-log",         "ecs-na-01"),
    ("ode-notif-svc",         "ecs-na-01"),
    ("ode-reconcile-svc",     "gkp-cluster-emea-01"),
    # ── Credit Card Processing Engine (45440) — Complex ──
    ("ccpe-ingress",          "gap-pool-na-01"),
    ("ccpe-auth-svc",         "gkp-cluster-na-01"),
    ("ccpe-fraud-engine",     "gkp-cluster-na-01"),
    ("ccpe-ledger-svc",       "gkp-cluster-na-01"),
    ("ccpe-limit-svc",        "eks-na-01"),
    ("ccpe-notif-svc",        "ecs-na-01"),
    ("ccpe-dispute-svc",      "gkp-cluster-emea-01"),
    ("ccpe-rewards-svc",      "ecs-apac-01"),
    ("ccpe-settlement-svc",   "gkp-cluster-emea-01"),
    ("ccpe-report-svc",       "ecs-apac-01"),
    ("ccpe-archive-svc",      "eks-emea-01"),
    # ── WEAVE / AWM Entitlements (102987) — Complex ──
    ("weave-gateway",         "gap-pool-na-01"),
    ("weave-policy-engine",   "gkp-cluster-na-01"),
    ("weave-role-svc",        "gkp-cluster-na-01"),
    ("weave-user-store",      "gkp-cluster-na-01"),
    ("weave-audit-svc",       "ecs-na-01"),
    ("weave-sync-svc",        "gkp-cluster-apac-01"),
    ("weave-token-svc",       "gkp-cluster-na-01"),
    ("weave-consent-svc",     "gap-pool-emea-01"),
    ("weave-admin-portal",    "gap-pool-na-01"),
    ("weave-report-svc",      "ecs-apac-01"),
    ("weave-cache-layer",     "eks-na-01"),
    ("weave-event-bus",       "gkp-cluster-emea-01"),
    # ── Real-Time Payments Gateway (62100) — Very Complex ──
    ("rtpg-ingress-lb",       "gap-pool-na-01"),
    ("rtpg-api-gw",           "gkp-cluster-na-01"),
    ("rtpg-validation-svc",   "gkp-cluster-na-01"),
    ("rtpg-routing-engine",   "gkp-cluster-na-01"),
    ("rtpg-sanctions-svc",    "eks-na-01"),
    ("rtpg-aml-svc",          "eks-na-01"),
    ("rtpg-fx-converter",     "gkp-cluster-emea-01"),
    ("rtpg-clearing-svc",     "gkp-cluster-na-01"),
    ("rtpg-settlement-svc",   "gkp-cluster-apac-01"),
    ("rtpg-ledger-svc",       "gkp-cluster-na-01"),
    ("rtpg-notif-svc",        "ecs-na-01"),
    ("rtpg-audit-svc",        "ecs-apac-01"),
    ("rtpg-recon-svc",        "gkp-cluster-emea-01"),
    ("rtpg-archive-svc",      "eks-emea-01"),
    ("rtpg-monitor-svc",      "ecs-na-01"),
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
    {"id": "dt-pg-cloud-gw",       "label": "connect-cloud-gateway",  "indicator_type": "Process Group", "health": "amber", "component": "connect-cloud-gw"},
    {"id": "dt-pg-portal",         "label": "connect-portal",         "indicator_type": "Process Group", "health": "green", "component": "connect-portal"},
    {"id": "dt-svc-auth",          "label": "AuthenticationSvc",      "indicator_type": "Service",       "health": "green", "component": "connect-auth-svc"},
    {"id": "dt-syn-login",         "label": "Login Flow",             "indicator_type": "Synthetic",     "health": "green", "component": "connect-auth-svc"},
    {"id": "dt-syn-home-na",       "label": "Home Page NA",           "indicator_type": "Synthetic",     "health": "green", "component": "connect-home-app-na"},
    {"id": "dt-svc-home-apac",     "label": "HomeApp-APAC",           "indicator_type": "Service",       "health": "amber", "component": "connect-home-app-apac"},
    {"id": "dt-syn-home-apac",     "label": "Home Page APAC",         "indicator_type": "Synthetic",     "health": "amber", "component": "connect-home-app-apac"},
    {"id": "dt-svc-home-emea",     "label": "HomeApp-EMEA",           "indicator_type": "Service",       "health": "green", "component": "connect-home-app-emea"},

    # ── Advisor Connect (90176) — 14 indicators across 10 components ──
    {"id": "dt-pg-profile-svc",    "label": "connect-profile-svc",    "indicator_type": "Process Group", "health": "amber", "component": "connect-profile-svc"},
    {"id": "dt-svc-profile",       "label": "ProfileService",         "indicator_type": "Service",       "health": "amber", "component": "connect-profile-svc"},
    {"id": "dt-pg-coverage-app",   "label": "connect-coverage-app",   "indicator_type": "Process Group", "health": "red",   "component": "connect-coverage-app"},
    {"id": "dt-syn-coverage",      "label": "Coverage Lookup",        "indicator_type": "Synthetic",     "health": "amber", "component": "connect-coverage-app"},
    {"id": "dt-svc-notification",  "label": "NotificationSvc",        "indicator_type": "Service",       "health": "amber", "component": "connect-notification"},
    {"id": "dt-pg-data-sync",      "label": "connect-data-sync",      "indicator_type": "Process Group", "health": "green", "component": "connect-data-sync"},
    {"id": "dt-svc-doc-svc",       "label": "DocumentService",        "indicator_type": "Service",       "health": "amber", "component": "connect-doc-svc"},
    {"id": "dt-pg-pref-svc",       "label": "connect-pref-svc",       "indicator_type": "Process Group", "health": "green", "component": "connect-pref-svc"},
    {"id": "dt-syn-audit-trail",   "label": "Audit Trail",            "indicator_type": "Synthetic",     "health": "green", "component": "connect-audit-svc"},
    {"id": "dt-svc-advisory",      "label": "ActiveAdvisorySvc",      "indicator_type": "Service",       "health": "green", "component": "active-advisory"},
    {"id": "dt-pg-ipbol-acct",     "label": "ipbol-account",          "indicator_type": "Process Group", "health": "red",   "component": "ipbol-account"},
    {"id": "dt-syn-ipbol-acct",    "label": "Account Lookup",         "indicator_type": "Synthetic",     "health": "red",   "component": "ipbol-account"},
    {"id": "dt-svc-doc-domain",    "label": "DocDomainSvc",           "indicator_type": "Service",       "health": "red",   "component": "ipbol-doc-domain"},
    {"id": "dt-pg-doc-domain",     "label": "ipbol-doc-domain",       "indicator_type": "Process Group", "health": "red",   "component": "ipbol-doc-domain"},

    # ── Spectrum Portfolio Mgmt (90215) — 22 indicators across 14 components ──
    {"id": "dt-syn-ui-health",     "label": "UI Health Check",        "indicator_type": "Synthetic",     "health": "green", "component": "spieq-ui-service"},
    {"id": "dt-svc-api-gw",        "label": "APIGatewaySvc",          "indicator_type": "Service",       "health": "amber", "component": "spieq-api-gateway"},
    {"id": "dt-pg-api-gw",         "label": "spieq-api-gateway",      "indicator_type": "Process Group", "health": "amber", "component": "spieq-api-gateway"},
    {"id": "dt-pg-trade-svc",      "label": "spieq-trade-service",    "indicator_type": "Process Group", "health": "red",   "component": "spieq-trade-service"},
    {"id": "dt-svc-trade",         "label": "TradeExecutionSvc",      "indicator_type": "Service",       "health": "red",   "component": "spieq-trade-service"},
    {"id": "dt-syn-trade-submit",  "label": "Trade Submission",       "indicator_type": "Synthetic",     "health": "red",   "component": "spieq-trade-service"},
    {"id": "dt-syn-portfolio",     "label": "Portfolio View",         "indicator_type": "Synthetic",     "health": "green", "component": "spieq-portfolio-svc"},
    {"id": "dt-pg-pricing",        "label": "spieq-pricing-engine",   "indicator_type": "Process Group", "health": "amber", "component": "spieq-pricing-engine"},
    {"id": "dt-svc-pricing",       "label": "PricingEngineSvc",       "indicator_type": "Service",       "health": "amber", "component": "spieq-pricing-engine"},
    {"id": "dt-pg-risk-svc",       "label": "spieq-risk-service",     "indicator_type": "Process Group", "health": "red",   "component": "spieq-risk-service"},
    {"id": "dt-svc-risk",          "label": "RiskAssessmentSvc",      "indicator_type": "Service",       "health": "red",   "component": "spieq-risk-service"},
    {"id": "dt-svc-order-router",  "label": "OrderRouterSvc",         "indicator_type": "Service",       "health": "green", "component": "spieq-order-router"},
    {"id": "dt-pg-market-data",    "label": "MarketDataFeed",         "indicator_type": "Process Group", "health": "amber", "component": "spieq-market-data"},
    {"id": "dt-syn-compliance",    "label": "Compliance Check",       "indicator_type": "Synthetic",     "health": "green", "component": "spieq-compliance-svc"},
    {"id": "dt-svc-settlement",    "label": "SettlementSvc",          "indicator_type": "Service",       "health": "amber", "component": "spieq-settlement-svc"},
    {"id": "dt-pg-audit-trail",    "label": "spieq-audit-trail",      "indicator_type": "Process Group", "health": "green", "component": "spieq-audit-trail"},
    {"id": "dt-svc-notif",         "label": "NotificationSvc",        "indicator_type": "Service",       "health": "green", "component": "spieq-notif-svc"},
    {"id": "dt-svc-payment",       "label": "PaymentGatewaySvc",      "indicator_type": "Service",       "health": "red",   "component": "payment-gateway"},
    {"id": "dt-syn-payment",       "label": "Payment Processing",     "indicator_type": "Synthetic",     "health": "red",   "component": "payment-gateway"},
    {"id": "dt-pg-email",          "label": "email-notification",     "indicator_type": "Process Group", "health": "red",   "component": "email-notification"},

    # ── Morgan Money (16649) — 4 indicators across 3 components ──
    {"id": "dt-pg-mm-ui",          "label": "morgan-money-ui",        "indicator_type": "Process Group", "health": "green", "component": "mm-ui"},
    {"id": "dt-svc-mm-api",        "label": "MorganMoneyAPI",         "indicator_type": "Service",       "health": "amber", "component": "mm-api"},
    {"id": "dt-pg-mm-data",        "label": "morgan-money-data",      "indicator_type": "Process Group", "health": "red",   "component": "mm-data-svc"},
    {"id": "dt-syn-mm-data",       "label": "Data Lookup",            "indicator_type": "Synthetic",     "health": "red",   "component": "mm-data-svc"},

    # ── PANDA (35115) — 5 indicators across 4 components ──
    {"id": "dt-pg-panda-gw",       "label": "panda-gateway",          "indicator_type": "Process Group", "health": "green", "component": "panda-gateway"},
    {"id": "dt-svc-panda-data",    "label": "PandaDataSvc",           "indicator_type": "Service",       "health": "green", "component": "panda-data-svc"},
    {"id": "dt-pg-panda-cache",    "label": "panda-cache",            "indicator_type": "Process Group", "health": "amber", "component": "panda-cache-svc"},
    {"id": "dt-syn-panda-cache",   "label": "Cache Hit Rate",         "indicator_type": "Synthetic",     "health": "amber", "component": "panda-cache-svc"},
    {"id": "dt-svc-panda-export",  "label": "PandaExportSvc",         "indicator_type": "Service",       "health": "green", "component": "panda-export-svc"},

    # ── Quantum (91001) — 10 indicators across 7 components ──
    {"id": "dt-syn-quantum-portal",   "label": "Portal Health",          "indicator_type": "Synthetic",     "health": "green", "component": "quantum-portal"},
    {"id": "dt-svc-quantum-api",      "label": "QuantumAPISvc",          "indicator_type": "Service",       "health": "amber", "component": "quantum-api-gw"},
    {"id": "dt-pg-quantum-api",       "label": "quantum-api-gateway",    "indicator_type": "Process Group", "health": "amber", "component": "quantum-api-gw"},
    {"id": "dt-pg-quantum-portfolio", "label": "quantum-portfolio",      "indicator_type": "Process Group", "health": "red",   "component": "quantum-portfolio-svc"},
    {"id": "dt-svc-quantum-portfolio","label": "PortfolioSvc",           "indicator_type": "Service",       "health": "red",   "component": "quantum-portfolio-svc"},
    {"id": "dt-pg-quantum-analytics", "label": "quantum-analytics",      "indicator_type": "Process Group", "health": "amber", "component": "quantum-analytics-svc"},
    {"id": "dt-svc-quantum-report",   "label": "QuantumReportSvc",       "indicator_type": "Service",       "health": "green", "component": "quantum-report-svc"},
    {"id": "dt-pg-quantum-lake",      "label": "quantum-data-lake",      "indicator_type": "Process Group", "health": "red",   "component": "quantum-data-lake"},
    {"id": "dt-syn-quantum-lake",     "label": "Data Lake Query",        "indicator_type": "Synthetic",     "health": "red",   "component": "quantum-data-lake"},
    {"id": "dt-svc-quantum-auth",     "label": "QuantumAuthSvc",         "indicator_type": "Service",       "health": "green", "component": "quantum-auth-svc"},

    # ── Order Decision Engine (81884) — 12 indicators across 8 components ──
    {"id": "dt-pg-ode-router",        "label": "ode-order-router",       "indicator_type": "Process Group", "health": "amber", "component": "ode-router"},
    {"id": "dt-svc-ode-router",       "label": "OrderRouterSvc",         "indicator_type": "Service",       "health": "amber", "component": "ode-router"},
    {"id": "dt-pg-ode-rules",         "label": "ode-rule-engine",        "indicator_type": "Process Group", "health": "green", "component": "ode-rule-engine"},
    {"id": "dt-pg-ode-market",        "label": "ode-market-data",        "indicator_type": "Process Group", "health": "amber", "component": "ode-market-feed"},
    {"id": "dt-syn-ode-market",       "label": "Market Feed Latency",    "indicator_type": "Synthetic",     "health": "amber", "component": "ode-market-feed"},
    {"id": "dt-pg-ode-risk",          "label": "ode-risk-validation",    "indicator_type": "Process Group", "health": "red",   "component": "ode-risk-check"},
    {"id": "dt-svc-ode-risk",         "label": "RiskValidationSvc",      "indicator_type": "Service",       "health": "red",   "component": "ode-risk-check"},
    {"id": "dt-pg-ode-exec",          "label": "ode-execution-svc",      "indicator_type": "Process Group", "health": "red",   "component": "ode-exec-svc"},
    {"id": "dt-syn-ode-exec",         "label": "Order Execution",        "indicator_type": "Synthetic",     "health": "red",   "component": "ode-exec-svc"},
    {"id": "dt-pg-ode-audit",         "label": "ode-audit-log",          "indicator_type": "Process Group", "health": "green", "component": "ode-audit-log"},
    {"id": "dt-svc-ode-notif",        "label": "OdeNotifSvc",            "indicator_type": "Service",       "health": "green", "component": "ode-notif-svc"},
    {"id": "dt-svc-ode-recon",        "label": "ReconciliationSvc",      "indicator_type": "Service",       "health": "amber", "component": "ode-reconcile-svc"},

    # ── Credit Card Processing Engine (45440) — 15 indicators across 11 components ──
    {"id": "dt-pg-ccpe-ingress",      "label": "ccpe-ingress",           "indicator_type": "Process Group", "health": "green", "component": "ccpe-ingress"},
    {"id": "dt-svc-ccpe-auth",        "label": "CCAuthorizationSvc",     "indicator_type": "Service",       "health": "amber", "component": "ccpe-auth-svc"},
    {"id": "dt-syn-ccpe-auth",        "label": "Auth Response Time",     "indicator_type": "Synthetic",     "health": "amber", "component": "ccpe-auth-svc"},
    {"id": "dt-pg-ccpe-fraud",        "label": "ccpe-fraud-engine",      "indicator_type": "Process Group", "health": "red",   "component": "ccpe-fraud-engine"},
    {"id": "dt-svc-ccpe-fraud",       "label": "FraudDetectionSvc",      "indicator_type": "Service",       "health": "red",   "component": "ccpe-fraud-engine"},
    {"id": "dt-pg-ccpe-ledger",       "label": "ccpe-ledger",            "indicator_type": "Process Group", "health": "red",   "component": "ccpe-ledger-svc"},
    {"id": "dt-syn-ccpe-ledger",      "label": "Ledger Posting",         "indicator_type": "Synthetic",     "health": "red",   "component": "ccpe-ledger-svc"},
    {"id": "dt-svc-ccpe-limit",       "label": "CreditLimitSvc",         "indicator_type": "Service",       "health": "amber", "component": "ccpe-limit-svc"},
    {"id": "dt-svc-ccpe-notif",       "label": "CustomerNotifSvc",       "indicator_type": "Service",       "health": "green", "component": "ccpe-notif-svc"},
    {"id": "dt-pg-ccpe-dispute",      "label": "ccpe-dispute",           "indicator_type": "Process Group", "health": "green", "component": "ccpe-dispute-svc"},
    {"id": "dt-svc-ccpe-rewards",     "label": "RewardsSvc",             "indicator_type": "Service",       "health": "green", "component": "ccpe-rewards-svc"},
    {"id": "dt-svc-ccpe-settlement",  "label": "SettlementSvc",          "indicator_type": "Service",       "health": "amber", "component": "ccpe-settlement-svc"},
    {"id": "dt-pg-ccpe-report",       "label": "ccpe-reporting",         "indicator_type": "Process Group", "health": "green", "component": "ccpe-report-svc"},
    {"id": "dt-pg-ccpe-archive",      "label": "ccpe-archive",           "indicator_type": "Process Group", "health": "green", "component": "ccpe-archive-svc"},
    {"id": "dt-syn-ccpe-settlement",  "label": "Settlement Cycle",       "indicator_type": "Synthetic",     "health": "amber", "component": "ccpe-settlement-svc"},

    # ── WEAVE / AWM Entitlements (102987) — 16 indicators across 12 components ──
    {"id": "dt-pg-weave-gw",          "label": "weave-gateway",          "indicator_type": "Process Group", "health": "green", "component": "weave-gateway"},
    {"id": "dt-pg-weave-policy",      "label": "weave-policy-engine",    "indicator_type": "Process Group", "health": "red",   "component": "weave-policy-engine"},
    {"id": "dt-svc-weave-policy",     "label": "PolicyEngineSvc",        "indicator_type": "Service",       "health": "red",   "component": "weave-policy-engine"},
    {"id": "dt-svc-weave-role",       "label": "RoleServiceSvc",         "indicator_type": "Service",       "health": "amber", "component": "weave-role-svc"},
    {"id": "dt-pg-weave-user",        "label": "weave-user-store",       "indicator_type": "Process Group", "health": "red",   "component": "weave-user-store"},
    {"id": "dt-syn-weave-user",       "label": "User Lookup",            "indicator_type": "Synthetic",     "health": "red",   "component": "weave-user-store"},
    {"id": "dt-pg-weave-audit",       "label": "weave-audit",            "indicator_type": "Process Group", "health": "green", "component": "weave-audit-svc"},
    {"id": "dt-svc-weave-sync",       "label": "IdentitySyncSvc",        "indicator_type": "Service",       "health": "amber", "component": "weave-sync-svc"},
    {"id": "dt-svc-weave-token",      "label": "TokenServiceSvc",        "indicator_type": "Service",       "health": "green", "component": "weave-token-svc"},
    {"id": "dt-pg-weave-consent",     "label": "weave-consent",          "indicator_type": "Process Group", "health": "green", "component": "weave-consent-svc"},
    {"id": "dt-syn-weave-admin",      "label": "Admin Portal Health",    "indicator_type": "Synthetic",     "health": "green", "component": "weave-admin-portal"},
    {"id": "dt-svc-weave-report",     "label": "ComplianceReportSvc",    "indicator_type": "Service",       "health": "amber", "component": "weave-report-svc"},
    {"id": "dt-pg-weave-cache",       "label": "weave-cache",            "indicator_type": "Process Group", "health": "green", "component": "weave-cache-layer"},
    {"id": "dt-pg-weave-eventbus",    "label": "weave-event-bus",        "indicator_type": "Process Group", "health": "red",   "component": "weave-event-bus"},
    {"id": "dt-svc-weave-eventbus",   "label": "EventBusSvc",            "indicator_type": "Service",       "health": "red",   "component": "weave-event-bus"},
    {"id": "dt-syn-weave-entitle",    "label": "Entitlement Check",      "indicator_type": "Synthetic",     "health": "red",   "component": "weave-policy-engine"},

    # ── Real-Time Payments Gateway (62100) — 20 indicators across 15 components ──
    {"id": "dt-pg-rtpg-lb",           "label": "rtpg-ingress-lb",        "indicator_type": "Process Group", "health": "green", "component": "rtpg-ingress-lb"},
    {"id": "dt-svc-rtpg-api",         "label": "RTPGApiGwSvc",           "indicator_type": "Service",       "health": "amber", "component": "rtpg-api-gw"},
    {"id": "dt-pg-rtpg-api",          "label": "rtpg-api-gateway",       "indicator_type": "Process Group", "health": "amber", "component": "rtpg-api-gw"},
    {"id": "dt-svc-rtpg-validation",  "label": "ValidationSvc",          "indicator_type": "Service",       "health": "green", "component": "rtpg-validation-svc"},
    {"id": "dt-pg-rtpg-routing",      "label": "rtpg-routing-engine",    "indicator_type": "Process Group", "health": "red",   "component": "rtpg-routing-engine"},
    {"id": "dt-svc-rtpg-routing",     "label": "RoutingEngineSvc",       "indicator_type": "Service",       "health": "red",   "component": "rtpg-routing-engine"},
    {"id": "dt-syn-rtpg-routing",     "label": "Payment Routing",        "indicator_type": "Synthetic",     "health": "red",   "component": "rtpg-routing-engine"},
    {"id": "dt-svc-rtpg-sanctions",   "label": "SanctionsSvc",           "indicator_type": "Service",       "health": "amber", "component": "rtpg-sanctions-svc"},
    {"id": "dt-svc-rtpg-aml",         "label": "AMLCheckSvc",            "indicator_type": "Service",       "health": "green", "component": "rtpg-aml-svc"},
    {"id": "dt-svc-rtpg-fx",          "label": "FXConverterSvc",         "indicator_type": "Service",       "health": "amber", "component": "rtpg-fx-converter"},
    {"id": "dt-pg-rtpg-clearing",     "label": "rtpg-clearing",          "indicator_type": "Process Group", "health": "red",   "component": "rtpg-clearing-svc"},
    {"id": "dt-syn-rtpg-clearing",    "label": "Clearing Cycle",         "indicator_type": "Synthetic",     "health": "red",   "component": "rtpg-clearing-svc"},
    {"id": "dt-pg-rtpg-settlement",   "label": "rtpg-settlement",        "indicator_type": "Process Group", "health": "red",   "component": "rtpg-settlement-svc"},
    {"id": "dt-svc-rtpg-settlement",  "label": "SettlementEngineSvc",    "indicator_type": "Service",       "health": "red",   "component": "rtpg-settlement-svc"},
    {"id": "dt-svc-rtpg-ledger",      "label": "CoreLedgerSvc",          "indicator_type": "Service",       "health": "amber", "component": "rtpg-ledger-svc"},
    {"id": "dt-svc-rtpg-notif",       "label": "NotifDispatchSvc",       "indicator_type": "Service",       "health": "green", "component": "rtpg-notif-svc"},
    {"id": "dt-pg-rtpg-audit",        "label": "rtpg-audit-trail",       "indicator_type": "Process Group", "health": "green", "component": "rtpg-audit-svc"},
    {"id": "dt-svc-rtpg-recon",       "label": "ReconciliationSvc",      "indicator_type": "Service",       "health": "green", "component": "rtpg-recon-svc"},
    {"id": "dt-pg-rtpg-archive",      "label": "rtpg-archive",           "indicator_type": "Process Group", "health": "green", "component": "rtpg-archive-svc"},
    {"id": "dt-svc-rtpg-monitor",     "label": "HealthMonitorSvc",       "indicator_type": "Service",       "health": "amber", "component": "rtpg-monitor-svc"},
]

# Precompute adjacency maps once at startup
NODE_MAP = {n["id"]: n for n in NODES}

# Components that have at least one health indicator — others get "no_data"
COMPONENTS_WITH_INDICATORS: set[str] = {ind["component"] for ind in INDICATOR_NODES}

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
def get_health_summary(
    lob: list[str] | None = Query(None), sub_lob: list[str] | None = Query(None, alias="subLob"),
    cto: list[str] | None = Query(None), cbt: list[str] | None = Query(None),
    seal: list[str] | None = Query(None), status: list[str] | None = Query(None),
    search: str | None = Query(None),
):
    apps = _filter_dashboard_apps(lob, sub_lob, cto, cbt, seal, status, search)
    if not apps:
        return {"critical_issues": 0, "warnings": 0, "recurring_30d": 0, "incidents_today": 0,
                "trends": {k: {"spark": [0]*7, "pct": 0} for k in ["critical_issues","warnings","recurring_30d","incidents_today"]}}
    crit = sum(1 for a in apps if a["status"] == "critical")
    warn = sum(1 for a in apps if a["status"] == "warning")
    rec = sum(a.get("recurring_30d", 0) for a in apps)
    inc = sum(a.get("incidents_today", 0) for a in apps)
    # Generate plausible sparklines from the aggregated values
    def _spark(val, trend_pct):
        if val == 0: return [0]*7
        base = max(1, int(val / (1 + trend_pct/100))) if trend_pct != -100 else val
        return [max(0, base + i) for i in [2,1,1,0,1,0,0]][:7]
    return {
        "critical_issues": crit, "warnings": warn, "recurring_30d": rec, "incidents_today": inc,
        "trends": {
            "critical_issues": {"spark": _spark(crit, -33), "pct": -33 if crit > 0 else 0},
            "warnings":        {"spark": _spark(warn, -50), "pct": -50 if warn > 0 else 0},
            "recurring_30d":   {"spark": _spark(rec, 21),   "pct": 21 if rec > 0 else 0},
            "incidents_today": {"spark": _spark(inc, -38),  "pct": -38 if inc > 0 else 0},
        },
    }


@app.get("/api/ai-analysis")
def get_ai_analysis(
    lob: list[str] | None = Query(None), sub_lob: list[str] | None = Query(None, alias="subLob"),
    cto: list[str] | None = Query(None), cbt: list[str] | None = Query(None),
    seal: list[str] | None = Query(None), status: list[str] | None = Query(None),
    search: str | None = Query(None),
):
    apps = _filter_dashboard_apps(lob, sub_lob, cto, cbt, seal, status, search)
    if not apps:
        return {"critical_alert": "No applications match the current filter scope.", "trend_analysis": "", "recommendations": []}
    crits = [a for a in apps if a["status"] == "critical"]
    warns = [a for a in apps if a["status"] == "warning"]
    total_inc = sum(a.get("incidents_30d", 0) for a in apps)
    # Build contextual AI text
    scope_label = lob[0] if lob and len(lob) == 1 else "the selected scope"
    if crits:
        names = " and ".join(a["name"] for a in crits[:3])
        alert = f"Currently tracking {len(crits)} critical application{'s' if len(crits)>1 else ''} in {scope_label}. {names} {'are' if len(crits)>1 else 'is'} experiencing active incidents requiring immediate attention."
    elif warns:
        alert = f"No critical issues in {scope_label}. {len(warns)} application{'s' if len(warns)>1 else ''} with warnings being monitored."
    else:
        alert = f"All {len(apps)} applications in {scope_label} are operating normally. No active issues detected."
    trend_msg = f"{total_inc} incidents recorded across {len(apps)} applications in the last 30 days." if total_inc > 0 else f"No incidents across {len(apps)} applications in the last 30 days."
    recs = []
    for a in crits[:2]:
        issues = a.get("recent_issues", [])
        desc = issues[0]["description"] if issues else "active critical issue"
        recs.append(f"Investigate {a['name']} — {desc}")
    for a in warns[:2]:
        issues = a.get("recent_issues", [])
        desc = issues[0]["description"] if issues else "warning condition"
        recs.append(f"Monitor {a['name']} — {desc}")
    if not recs:
        recs.append("Continue monitoring — all systems healthy in current scope")
    return {"critical_alert": alert, "trend_analysis": trend_msg, "recommendations": recs}


@app.get("/api/regional-status")
def get_regional_status(
    lob: list[str] | None = Query(None), sub_lob: list[str] | None = Query(None, alias="subLob"),
    cto: list[str] | None = Query(None), cbt: list[str] | None = Query(None),
    seal: list[str] | None = Query(None), status: list[str] | None = Query(None),
    search: str | None = Query(None),
):
    apps = _filter_dashboard_apps(lob, sub_lob, cto, cbt, seal, status, search)
    regions = {}
    for a in apps:
        r = a.get("region", "NA")
        if r not in regions:
            regions[r] = {"region": r, "status": "healthy", "sod_impacts": 0, "app_issues": 0}
        if a["status"] == "critical":
            regions[r]["status"] = "critical"
            regions[r]["sod_impacts"] += 1
            regions[r]["app_issues"] += a.get("incidents_today", 0)
        elif a["status"] == "warning" and regions[r]["status"] != "critical":
            regions[r]["status"] = "warning"
            regions[r]["app_issues"] += a.get("incidents_today", 0)
    # Always show all 3 regions even if no apps match
    for rname in ["NA", "EMEA", "APAC"]:
        if rname not in regions:
            regions[rname] = {"region": rname, "status": "healthy", "sod_impacts": 0, "app_issues": 0}
    return sorted(regions.values(), key=lambda r: {"NA":0,"EMEA":1,"APAC":2}.get(r["region"],3))


@app.get("/api/critical-apps")
def get_critical_apps(
    lob: list[str] | None = Query(None), sub_lob: list[str] | None = Query(None, alias="subLob"),
    cto: list[str] | None = Query(None), cbt: list[str] | None = Query(None),
    seal: list[str] | None = Query(None), status: list[str] | None = Query(None),
    search: str | None = Query(None),
):
    apps = _filter_dashboard_apps(lob, sub_lob, cto, cbt, seal, status, search)
    crits = [a for a in apps if a["status"] == "critical"]
    return [{
        "id": a["seal"],
        "name": a["name"],
        "seal": f"SEAL - {a['seal']}",
        "status": "critical",
        "current_issues": len(a.get("recent_issues", [])),
        "recurring_30d": a.get("recurring_30d", 0),
        "last_incident": (a.get("recent_issues", [{}])[0].get("time_ago", "—") if a.get("recent_issues") else "—"),
        "recent_issues": a.get("recent_issues", []),
    } for a in crits]


@app.get("/api/warning-apps")
def get_warning_apps(
    lob: list[str] | None = Query(None), sub_lob: list[str] | None = Query(None, alias="subLob"),
    cto: list[str] | None = Query(None), cbt: list[str] | None = Query(None),
    seal: list[str] | None = Query(None), status: list[str] | None = Query(None),
    search: str | None = Query(None),
):
    apps = _filter_dashboard_apps(lob, sub_lob, cto, cbt, seal, status, search)
    warns = [a for a in apps if a["status"] == "warning"]
    return [{
        "id": a["seal"],
        "name": a["name"],
        "seal": f"SEAL - {a['seal']}",
        "status": "warning",
        "current_issues": len(a.get("recent_issues", [])),
        "recurring_30d": a.get("recurring_30d", 0),
        "last_incident": (a.get("recent_issues", [{}])[0].get("time_ago", "—") if a.get("recent_issues") else "—"),
        "recent_issues": a.get("recent_issues", []),
    } for a in warns]


@app.get("/api/incident-trends")
def get_incident_trends(
    lob: list[str] | None = Query(None), sub_lob: list[str] | None = Query(None, alias="subLob"),
    cto: list[str] | None = Query(None), cbt: list[str] | None = Query(None),
    seal: list[str] | None = Query(None), status: list[str] | None = Query(None),
    search: str | None = Query(None),
):
    apps = _filter_dashboard_apps(lob, sub_lob, cto, cbt, seal, status, search)
    # Scale the global trend data proportionally to the filtered scope
    total_p1 = sum(a.get("p1_30d", 0) for a in apps)
    total_p2 = sum(a.get("p2_30d", 0) for a in apps)
    all_p1 = sum(a.get("p1_30d", 0) for a in DASHBOARD_APPS)
    all_p2 = sum(a.get("p2_30d", 0) for a in DASHBOARD_APPS)
    p1_ratio = total_p1 / all_p1 if all_p1 else 0
    p2_ratio = total_p2 / all_p2 if all_p2 else 0
    scaled = []
    for week in INCIDENT_TRENDS:
        scaled.append({
            "week": week["week"], "label": week["label"],
            "p1": max(0, round(week["p1"] * p1_ratio)),
            "p2": max(0, round(week["p2"] * p2_ratio)),
        })
    total_inc = sum(a.get("incidents_30d", 0) for a in apps)
    res_rate = 94.2 if total_inc > 5 else 100.0 if total_inc == 0 else 88.0
    return {"data": scaled, "summary": {**INCIDENT_TREND_SUMMARY, "resolution_rate": res_rate}}


@app.get("/api/frequent-incidents")
def get_frequent_incidents():
    return FREQUENT_INCIDENTS

@app.get("/api/active-incidents")
def get_active_incidents(
    lob: list[str] | None = Query(None), sub_lob: list[str] | None = Query(None, alias="subLob"),
    cto: list[str] | None = Query(None), cbt: list[str] | None = Query(None),
    seal: list[str] | None = Query(None), status: list[str] | None = Query(None),
    search: str | None = Query(None),
):
    apps = _filter_dashboard_apps(lob, sub_lob, cto, cbt, seal, status, search)
    p1_total = sum(a.get("p1_30d", 0) for a in apps)
    p2_total = sum(a.get("p2_30d", 0) for a in apps)
    p1_unresolved = sum(1 for a in apps if a["status"] == "critical")
    p2_unresolved = max(1, p2_total // 3) if p2_total > 0 else 0
    return {
        "week_label": "Last 7 Days",
        "p1": {
            "total": p1_total,
            "trend": -33 if p1_total > 0 else 0,
            "breakdown": [
                {"label": "Unresolved", "count": p1_unresolved, "color": "#f44336"},
                {"label": "Resolved",   "count": max(0, p1_total - p1_unresolved), "color": "#4ade80"},
            ],
        },
        "p2": {
            "total": p2_total,
            "trend": -20 if p2_total > 0 else 0,
            "breakdown": [
                {"label": "Unresolved", "count": p2_unresolved, "color": "#ffab00"},
                {"label": "Resolved",   "count": max(0, p2_total - p2_unresolved), "color": "#4ade80"},
            ],
        },
        "convey": {
            "total": max(1, len(apps) // 5),
            "trend": -20,
            "breakdown": [
                {"label": "Unresolved", "count": max(0, len(apps) // 10), "color": "#60a5fa"},
                {"label": "Resolved",   "count": max(1, len(apps) // 5) - max(0, len(apps) // 10), "color": "#4ade80"},
            ],
        },
        "spectrum": {
            "total": max(1, len(apps) // 6),
            "trend": 0,
            "breakdown": [
                {"label": "Info", "count": max(1, len(apps) // 8), "color": "#60a5fa"},
                {"label": "High", "count": max(0, max(1, len(apps) // 6) - max(1, len(apps) // 8)), "color": "#f44336"},
            ],
        },
    }

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
        for s, l in [
            ("16649", "Morgan Money"),
            ("35115", "PANDA"),
            ("88180", "Connect OS"),
            ("90176", "Advisor Connect"),
            ("81884", "Order Decision Engine"),
            ("91001", "Quantum"),
            ("45440", "Credit Card Processing Engine"),
            ("102987", "AWM Entitlements (WEAVE)"),
            ("90215", "Spectrum Portfolio Mgmt"),
            ("62100", "Real-Time Payments Gateway"),
        ]
    ]

# Reverse lookup: component_id → seal_id (for cross-app edge detection)
COMP_TO_SEAL = {}
for _sid, _comps in SEAL_COMPONENTS.items():
    for _cid in _comps:
        COMP_TO_SEAL[_cid] = _sid

# SEAL labels for external node display
SEAL_LABELS = {
    "16649": "Morgan Money", "35115": "PANDA", "88180": "Connect OS",
    "90176": "Advisor Connect", "81884": "Order Decision Engine",
    "91001": "Quantum", "45440": "Credit Card Processing Engine",
    "102987": "AWM Entitlements (WEAVE)", "90215": "Spectrum Portfolio Mgmt",
    "62100": "Real-Time Payments Gateway",
}

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
    # Quantum — portfolio service and data lake exchange data bidirectionally
    ("quantum-portfolio-svc", "quantum-data-lake"),
    # ODE — risk check and execution service validate in both directions
    ("ode-risk-check", "ode-exec-svc"),
    # CCPE — fraud engine and ledger exchange transaction data
    ("ccpe-fraud-engine", "ccpe-ledger-svc"),
    # WEAVE — role service and user store synchronize bidirectionally
    ("weave-role-svc", "weave-user-store"),
    # WEAVE — user store and identity sync exchange data
    ("weave-user-store", "weave-sync-svc"),
    # RTPG — routing engine and clearing engine exchange flow
    ("rtpg-routing-engine", "rtpg-clearing-svc"),
    # RTPG — clearing and settlement exchange transaction data
    ("rtpg-clearing-svc", "rtpg-settlement-svc"),
}


@app.get("/api/graph/layers/{seal_id}")
def get_graph_layers(seal_id: str):
    if seal_id not in SEAL_COMPONENTS:
        raise HTTPException(status_code=404, detail=f"SEAL '{seal_id}' not found")

    component_ids = SEAL_COMPONENTS[seal_id]
    component_set = set(component_ids)

    # Component layer
    component_nodes = [NODE_MAP[cid] for cid in component_ids if cid in NODE_MAP]
    component_edges = []
    external_ids: set[str] = set()
    external_dirs: dict[str, set[str]] = {}   # node_id → {"upstream","downstream"}
    for src, dst in EDGES_RAW:
        src_in = src in component_set
        dst_in = dst in component_set
        direction = "bi" if (src, dst) in BIDIRECTIONAL_PAIRS or (dst, src) in BIDIRECTIONAL_PAIRS else "uni"
        if src_in and dst_in:
            component_edges.append({"source": src, "target": dst, "direction": direction})
        elif src_in and dst in COMP_TO_SEAL and COMP_TO_SEAL[dst] != seal_id:
            component_edges.append({"source": src, "target": dst, "direction": direction, "cross_seal": COMP_TO_SEAL[dst]})
            external_ids.add(dst)
            external_dirs.setdefault(dst, set()).add("downstream")
        elif dst_in and src in COMP_TO_SEAL and COMP_TO_SEAL[src] != seal_id:
            component_edges.append({"source": src, "target": dst, "direction": direction, "cross_seal": COMP_TO_SEAL[src]})
            external_ids.add(src)
            external_dirs.setdefault(src, set()).add("upstream")
    external_nodes = [
        {
            **NODE_MAP[eid],
            "external": True,
            "external_seal": COMP_TO_SEAL[eid],
            "external_seal_label": SEAL_LABELS.get(COMP_TO_SEAL[eid], COMP_TO_SEAL[eid]),
            "cross_direction": sorted(external_dirs.get(eid, {"downstream"}))[0] if len(external_dirs.get(eid, set())) == 1 else "both",
        }
        for eid in external_ids if eid in NODE_MAP
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
        "components": {"nodes": component_nodes, "edges": component_edges, "external_nodes": external_nodes},
        "platform":   {"nodes": platform_nodes,   "edges": platform_edge_list},
        "datacenter": {"nodes": dc_nodes,          "edges": dc_edge_list},
        "indicators": {"nodes": indicator_nodes,   "edges": indicator_edges},
    }


# ── Enriched Applications ────────────────────────────────────────────────────

PRODUCT_MAPPING = {}  # No longer needed — product info is embedded in app data

# Map each app (by lowercase name slug) to its component IDs in the knowledge graph
# Representative mappings for apps that have known components in the graph
# Deployment overrides: pre-built deployment lists for apps with known deployment data
# Each deployment can have cpof (bool) and rto (hours or None)
# Deployment overrides use component IDs (resolved to full node data at runtime)
DEPLOYMENT_OVERRIDES = {
    # Connect OS (88180) — 6 components across 18 deployments
    # Components: connect-portal, connect-cloud-gw, connect-auth-svc, connect-home-app-na, connect-home-app-apac, connect-home-app-emea
    "connect-os": [
        {"id": "112224", "deployment_id": "112224", "label": "Connect OS Critical Applications and Services AWS - Global (xSwiss)", "status": "critical", "cpof": True,  "rto": 4,    "component_ids": ["connect-cloud-gw", "connect-auth-svc", "connect-portal"]},
        {"id": "111848", "deployment_id": "111848", "label": "Connect OS Mobile AWS - Global",                                     "status": "warning",  "cpof": False, "rto": 8,    "component_ids": ["connect-portal"]},
        {"id": "110175", "deployment_id": "110175", "label": "Connect OS Internet Facing Applications and Services Gaia Cloud Foundry - NA", "status": "healthy", "cpof": True, "rto": 4, "component_ids": ["connect-home-app-na", "connect-auth-svc"]},
        {"id": "103719", "deployment_id": "103719", "label": "Connect OS Legacy Infrastructure - NA",                              "status": "healthy",  "cpof": False, "rto": 24,   "component_ids": ["connect-home-app-na"]},
        {"id": "103720", "deployment_id": "103720", "label": "Connect Desktop - DEV",                                              "status": "healthy",  "cpof": False, "rto": None, "component_ids": []},
        {"id": "103721", "deployment_id": "103721", "label": "Connect Desktop - UAT",                                              "status": "healthy",  "cpof": False, "rto": None, "component_ids": []},
        {"id": "103722", "deployment_id": "103722", "label": "Connect Desktop - PROD",                                             "status": "warning",  "cpof": True,  "rto": 4,    "component_ids": ["connect-portal", "connect-cloud-gw"]},
        {"id": "103723", "deployment_id": "103723", "label": "Connect Desktop - Global Link",                                      "status": "healthy",  "cpof": False, "rto": 12,   "component_ids": []},
        {"id": "104739", "deployment_id": "104739", "label": "Connect OS WordPress CMS Gaia Cloud Foundry - NA",                   "status": "healthy",  "cpof": False, "rto": 24,   "component_ids": []},
        {"id": "108750", "deployment_id": "108750", "label": "Connect OS AI Machine Learning",                                     "status": "healthy",  "cpof": False, "rto": 12,   "component_ids": []},
        {"id": "109718", "deployment_id": "109718", "label": "Connect OS Critical Applications and Services Gaia Cloud Foundry - Global", "status": "critical", "cpof": True, "rto": 4, "component_ids": ["connect-cloud-gw", "connect-auth-svc"]},
        {"id": "109719", "deployment_id": "109719", "label": "Connect OS Mobile Gaia Cloud Foundry - Global",                      "status": "healthy",  "cpof": False, "rto": 8,    "component_ids": ["connect-portal"]},
        {"id": "109720", "deployment_id": "109720", "label": "Connect OS Non-Critical Applications and Services Gaia Cloud Foundry - Global", "status": "healthy", "cpof": False, "rto": 24, "component_ids": []},
        {"id": "109739", "deployment_id": "109739", "label": "Connect OS Swiss Applications and Services Gaia Cloud Foundry - SwissNet", "status": "healthy", "cpof": True, "rto": 4, "component_ids": ["connect-auth-svc"]},
        {"id": "111835", "deployment_id": "111835", "label": "Connect OS Gaia Oracle Services - Global",                           "status": "healthy",  "cpof": False, "rto": 12,   "component_ids": []},
        {"id": "111836", "deployment_id": "111836", "label": "Connect OS User Metrics Elastic/Cassandra - Global",                 "status": "healthy",  "cpof": False, "rto": 24,   "component_ids": []},
        {"id": "61867",  "deployment_id": "61867",  "label": "Connect OS Legacy Infrastructure - Asia",                            "status": "healthy",  "cpof": False, "rto": 24,   "component_ids": ["connect-home-app-apac"]},
        {"id": "61868",  "deployment_id": "61868",  "label": "Connect OS Legacy Infrastructure - EMEA",                            "status": "healthy",  "cpof": False, "rto": 24,   "component_ids": ["connect-home-app-emea"]},
    ],
    # Advisor Connect (90176) — 10 components across 10 deployments
    # Components: connect-profile-svc, connect-coverage-app, connect-notification, connect-data-sync,
    #             connect-doc-svc, connect-pref-svc, connect-audit-svc, active-advisory, ipbol-account, ipbol-doc-domain
    "advisor-connect": [
        {"id": "109974", "deployment_id": "109974", "label": "Advisor Connect Suite - NA - AWS",       "status": "warning",  "cpof": True,  "rto": 4,    "component_ids": ["connect-profile-svc", "connect-coverage-app", "connect-notification", "connect-data-sync"]},
        {"id": "112169", "deployment_id": "112169", "label": "ADVISOR CONNECT AWS - NA",               "status": "critical", "cpof": True,  "rto": 4,    "component_ids": ["connect-coverage-app", "ipbol-account", "ipbol-doc-domain"]},
        {"id": "102024", "deployment_id": "102024", "label": "ADVISOR CONNECT - EMEA",                 "status": "healthy",  "cpof": True,  "rto": 8,    "component_ids": ["connect-profile-svc", "connect-doc-svc"]},
        {"id": "102025", "deployment_id": "102025", "label": "ADVISOR CONNECT - Asia",                 "status": "healthy",  "cpof": False, "rto": 8,    "component_ids": ["connect-profile-svc", "connect-pref-svc"]},
        {"id": "102026", "deployment_id": "102026", "label": "ADVISOR CONNECT - US",                   "status": "warning",  "cpof": True,  "rto": 4,    "component_ids": ["connect-coverage-app", "connect-notification", "active-advisory"]},
        {"id": "104948", "deployment_id": "104948", "label": "JPMS Advisor Connect Deployment",        "status": "healthy",  "cpof": False, "rto": 12,   "component_ids": ["active-advisory", "connect-audit-svc"]},
        {"id": "109355", "deployment_id": "109355", "label": "ADVISOR CONNECT - Swiss AWS",            "status": "healthy",  "cpof": True,  "rto": 4,    "component_ids": ["connect-profile-svc", "connect-pref-svc"]},
        {"id": "62056",  "deployment_id": "62056",  "label": "Tool for Reaching and Acquiring Clients (TRAC)", "status": "healthy", "cpof": False, "rto": 24, "component_ids": ["connect-data-sync", "connect-doc-svc"]},
        {"id": "114650", "deployment_id": "114650", "label": "ADVISOR CONNECT AWS - AP",               "status": "healthy",  "cpof": False, "rto": 8,    "component_ids": ["connect-profile-svc", "connect-notification"]},
        {"id": "115060", "deployment_id": "115060", "label": "ADVISOR CONNECT AWS - EU",               "status": "healthy",  "cpof": False, "rto": 8,    "component_ids": ["connect-profile-svc", "connect-doc-svc", "connect-audit-svc"]},
    ],
    # Spectrum Portfolio Management Equities (90215) — 14 components across 5 deployments
    # Components: spieq-ui-service, spieq-api-gateway, spieq-trade-service, spieq-portfolio-svc,
    #             spieq-pricing-engine, spieq-risk-service, spieq-order-router, spieq-market-data,
    #             spieq-compliance-svc, spieq-settlement-svc, spieq-audit-trail, spieq-notif-svc,
    #             payment-gateway, email-notification
    "spectrum-portfolio-management-(equities)": [
        {"id": "64958",  "deployment_id": "64958",  "label": "Spectrum PI - Equities Deployment",           "status": "healthy",  "cpof": True,  "rto": 4,  "component_ids": ["spieq-ui-service", "spieq-api-gateway", "spieq-trade-service", "spieq-portfolio-svc", "spieq-order-router"]},
        {"id": "103262", "deployment_id": "103262", "label": "Spectrum PI - Equities - Deployment",         "status": "healthy",  "cpof": False, "rto": 8,  "component_ids": ["spieq-pricing-engine", "spieq-risk-service", "spieq-market-data"]},
        {"id": "109606", "deployment_id": "109606", "label": "Spectrum PI - Equities PSF",                  "status": "warning",  "cpof": True,  "rto": 4,  "component_ids": ["spieq-compliance-svc", "spieq-settlement-svc", "payment-gateway"]},
        {"id": "110724", "deployment_id": "110724", "label": "Spectrum PI - Equities GKP Config Server",    "status": "healthy",  "cpof": False, "rto": 12, "component_ids": ["spieq-audit-trail", "spieq-notif-svc", "email-notification"]},
        {"id": "112256", "deployment_id": "112256", "label": "Spectrum PI - Equities Dep 5",                "status": "healthy",  "cpof": False, "rto": 24, "component_ids": []},
    ],
}

# Map each app (by lowercase name slug) to its component IDs in the knowledge graph
# Representative mappings for apps that have known components in the graph
APP_COMPONENT_MAPPING = {
    "morgan-money":                             ["connect-coverage-app", "connect-notification"],
    "quantum":                                  ["meridian-query", "meridian-order"],
    "jedi---j.p.-morgan-etf-data-intelligence": ["spieq-ui-service", "spieq-risk-service"],
    "order-decision-engine":                    ["sb-service-order", "sb-service-query"],
    "awm-entitlements-aka-weave":               ["auth-service", "spieq-compliance-svc"],
    "connect-os":                               ["connect-coverage-app", "api-gateway", "connect-doc-svc"],
    "pam:-gwm-party-and-account-maintenance":   ["payment-gateway", "connect-notification"],
    "murex":                                    ["meridian-order", "email-notification"],
    "omni-core-accounting-(omnitrust)":         ["db-primary", "data-pipeline"],
}

# Mock SLO data per app slug — critical/warning apps get explicit data; healthy apps use default
APP_SLO_DATA = {
    # Critical apps
    "morgan-money":                             {"target": 99.9,  "current": 99.12, "error_budget": 12, "trend": "down",   "burn_rate": "4.2x",  "breach_eta": "6h",   "status": "critical"},
    "quantum":                                  {"target": 99.9,  "current": 98.9,  "error_budget": 8,  "trend": "down",   "burn_rate": "5.8x",  "breach_eta": "3h",   "status": "critical"},
    "jedi---j.p.-morgan-etf-data-intelligence": {"target": 99.9,  "current": 99.2,  "error_budget": 15, "trend": "down",   "burn_rate": "3.5x",  "breach_eta": "8h",   "status": "critical"},
    "order-decision-engine":                    {"target": 99.9,  "current": 98.5,  "error_budget": 5,  "trend": "down",   "burn_rate": "8.2x",  "breach_eta": "2h",   "status": "critical"},
    "awm-entitlements-aka-weave":               {"target": 99.9,  "current": 99.0,  "error_budget": 10, "trend": "down",   "burn_rate": "4.5x",  "breach_eta": "5h",   "status": "critical"},
    "pam:-gwm-party-and-account-maintenance":   {"target": 99.9,  "current": 99.15, "error_budget": 14, "trend": "down",   "burn_rate": "3.8x",  "breach_eta": "7h",   "status": "critical"},
    "murex":                                    {"target": 99.9,  "current": 99.3,  "error_budget": 18, "trend": "down",   "burn_rate": "3.1x",  "breach_eta": "12h",  "status": "critical"},
    "omni-core-accounting-(omnitrust)":         {"target": 99.9,  "current": 98.8,  "error_budget": 7,  "trend": "down",   "burn_rate": "6.1x",  "breach_eta": "4h",   "status": "critical"},
    # Warning apps
    "am-pmt-routing-service":                   {"target": 99.0,  "current": 98.8,  "error_budget": 42, "trend": "stable", "burn_rate": "1.2x",  "breach_eta": "72h",  "status": "warning"},
    "info-hub-and-data-oversight":              {"target": 99.5,  "current": 99.2,  "error_budget": 35, "trend": "down",   "burn_rate": "1.5x",  "breach_eta": "48h",  "status": "warning"},
    "gm-solutions-bmt-research-hb-desktop":     {"target": 99.0,  "current": 98.6,  "error_budget": 30, "trend": "down",   "burn_rate": "2.0x",  "breach_eta": "24h",  "status": "warning"},
    "ops-party":                                {"target": 99.0,  "current": 98.7,  "error_budget": 38, "trend": "stable", "burn_rate": "1.1x",  "breach_eta": None,   "status": "warning"},
    "salerio":                                  {"target": 99.0,  "current": 98.5,  "error_budget": 28, "trend": "down",   "burn_rate": "1.8x",  "breach_eta": "36h",  "status": "warning"},
    "onesentinel":                              {"target": 99.0,  "current": 98.4,  "error_budget": 25, "trend": "down",   "burn_rate": "2.2x",  "breach_eta": "18h",  "status": "warning"},
    "acey-eagle-stari":                         {"target": 99.0,  "current": 98.9,  "error_budget": 45, "trend": "stable", "burn_rate": "0.9x",  "breach_eta": None,   "status": "warning"},
    "meridian-data-services-platform":          {"target": 99.0,  "current": 98.7,  "error_budget": 32, "trend": "down",   "burn_rate": "1.6x",  "breach_eta": "40h",  "status": "warning"},
    "ipb-payments":                             {"target": 99.0,  "current": 98.8,  "error_budget": 40, "trend": "stable", "burn_rate": "1.0x",  "breach_eta": None,   "status": "warning"},
    "ipb-brokerage":                            {"target": 99.0,  "current": 98.6,  "error_budget": 33, "trend": "down",   "burn_rate": "1.7x",  "breach_eta": "38h",  "status": "warning"},
    "global-security-transfer":                 {"target": 99.0,  "current": 98.5,  "error_budget": 29, "trend": "down",   "burn_rate": "1.9x",  "breach_eta": "30h",  "status": "warning"},
    "wm-swift-middleware":                      {"target": 99.0,  "current": 98.4,  "error_budget": 26, "trend": "down",   "burn_rate": "2.1x",  "breach_eta": "20h",  "status": "warning"},
    "pb-loan-origination-system":               {"target": 99.0,  "current": 98.7,  "error_budget": 35, "trend": "stable", "burn_rate": "1.3x",  "breach_eta": None,   "status": "warning"},
    # Non-AWM critical/warning apps
    "credit-card-processing-engine":            {"target": 99.99, "current": 99.82, "error_budget": 9,  "trend": "down",   "burn_rate": "5.0x",  "breach_eta": "4h",   "status": "critical"},
    "consumer-lending-gateway":                 {"target": 99.9,  "current": 99.5,  "error_budget": 38, "trend": "down",   "burn_rate": "1.4x",  "breach_eta": "48h",  "status": "warning"},
    "analytics-workbench":                      {"target": 99.0,  "current": 98.6,  "error_budget": 32, "trend": "stable", "burn_rate": "1.3x",  "breach_eta": None,   "status": "warning"},
    "trade-execution-engine":                   {"target": 99.9,  "current": 99.4,  "error_budget": 28, "trend": "down",   "burn_rate": "2.0x",  "breach_eta": "24h",  "status": "warning"},
    "corporate-treasury-portal":                {"target": 99.5,  "current": 99.1,  "error_budget": 35, "trend": "down",   "burn_rate": "1.5x",  "breach_eta": "36h",  "status": "warning"},
    "real-time-payments-gateway":               {"target": 99.99, "current": 99.75, "error_budget": 6,  "trend": "down",   "burn_rate": "7.2x",  "breach_eta": "2h",   "status": "critical"},
    "enterprise-monitoring-platform":           {"target": 99.9,  "current": 99.5,  "error_budget": 40, "trend": "stable", "burn_rate": "1.1x",  "breach_eta": None,   "status": "warning"},
    "network-automation-suite":                 {"target": 99.9,  "current": 99.4,  "error_budget": 30, "trend": "down",   "burn_rate": "1.8x",  "breach_eta": "30h",  "status": "warning"},
}

# Frontend app names → slug mapping (built from the APPS array names)
def _app_slug(name: str) -> str:
    """Convert app name to a lookup slug (lowercase, spaces to hyphens)."""
    return name.lower().replace(" ", "-")


# Build component-to-platform lookup once
_comp_platform_map = {}
for _comp_id, _plat_id in COMPONENT_PLATFORM_EDGES:
    _comp_platform_map.setdefault(_comp_id, []).append(_plat_id)


@app.get("/api/applications/enriched")
def get_enriched_applications():
    """Return all apps enriched with components, deployments, SLO, and completeness."""
    from collections import OrderedDict
    from apps_registry import APPS_REGISTRY

    APPS_BACKEND = APPS_REGISTRY

    results = []
    for app in APPS_BACKEND:
        slug = _app_slug(app["name"])

        # ── Dependency-propagated effective status ──
        # Each component's effective status = worst of (own status, all transitive dependency statuses)
        _status_rank = {"critical": 0, "warning": 1, "healthy": 2, "no_data": 3}

        def _effective_status(cid):
            node = NODE_MAP.get(cid)
            if not node:
                return "no_data"
            # Components without health indicators → no_data
            if cid not in COMPONENTS_WITH_INDICATORS:
                return "no_data"
            own = node["status"]
            dep_ids = bfs(cid, forward_adj)
            worst = own
            for did in dep_ids:
                dn = NODE_MAP.get(did)
                if not dn:
                    continue
                dep_status = dn["status"] if did in COMPONENTS_WITH_INDICATORS else "no_data"
                if dep_status == "no_data":
                    continue
                if _status_rank.get(dep_status, 9) < _status_rank.get(worst, 9):
                    worst = dep_status
            return worst

        def _comp_slo(node, eff_status):
            """Compute deterministic component SLO from SLA target and effective status."""
            if eff_status == "no_data":
                return None
            try:
                target = float(node["sla"].replace("%", ""))
            except (ValueError, KeyError):
                target = 99.0
            if eff_status == "critical":
                return round(target - 1.5 - (node.get("incidents_30d", 0) * 0.08), 2)
            elif eff_status == "warning":
                return round(target - 0.4 - (node.get("incidents_30d", 0) * 0.05), 2)
            else:
                return round(target - 0.05, 2)

        def _build_comp_dict(cid):
            node = NODE_MAP.get(cid)
            if not node:
                return None
            eff = _effective_status(cid)
            return {
                "id": cid,
                "label": node["label"],
                "status": eff,
                "incidents_30d": node["incidents_30d"],
                "indicator_type": COMPONENT_INDICATOR_MAP.get(cid, "Service"),
                "slo": _comp_slo(node, eff),
            }

        # ── Exclusions for this app ──
        app_excl = set(APP_EXCLUDED_INDICATORS.get(slug, []))

        # Components from knowledge graph
        comp_ids = APP_COMPONENT_MAPPING.get(slug, [])
        components = []
        for cid in comp_ids:
            cd = _build_comp_dict(cid)
            if cd:
                components.append(cd)

        # Deployments: nest components under their platform
        plat_comp_map = {}  # plat_id → [component dicts]
        plat_order = []     # preserve discovery order
        for cid in comp_ids:
            node = NODE_MAP.get(cid)
            if not node:
                continue
            for plat_id in _comp_platform_map.get(cid, []):
                if plat_id not in plat_comp_map:
                    plat_comp_map[plat_id] = []
                    plat_order.append(plat_id)
                cd = _build_comp_dict(cid)
                if cd:
                    plat_comp_map[plat_id].append(cd)
        deployments = []
        for plat_id in plat_order:
            pn = PLATFORM_NODE_MAP.get(plat_id)
            if not pn:
                continue
            dep_comps = plat_comp_map[plat_id]
            dep_comps.sort(key=lambda c: _status_rank.get(c["status"], 9))
            # Deployment exclusions = app-level + deployment-level
            dep_excl = app_excl | set(DEPLOYMENT_EXCLUDED_INDICATORS.get(f"{slug}:{plat_id}", []))
            active = [c for c in dep_comps if c["indicator_type"] not in dep_excl]
            # Status = worst of active RAG statuses; if all are no_data → no_data
            rag_active = [c for c in active if c["status"] != "no_data"]
            if not rag_active:
                worst = "no_data"
            else:
                worst = "healthy"
                for c in rag_active:
                    if _status_rank.get(c["status"], 9) < _status_rank.get(worst, 9):
                        worst = c["status"]
            # SLO = min of active component SLOs
            active_slos = [c["slo"] for c in active if c.get("slo") is not None]
            dep_slo = min(active_slos) if active_slos else None
            deployments.append({
                "id": plat_id,
                "label": pn["label"],
                "type": pn["type"],
                "datacenter": pn["datacenter"],
                "status": worst,
                "components": dep_comps,
                "slo": dep_slo,
                "excluded_indicators": list(DEPLOYMENT_EXCLUDED_INDICATORS.get(f"{slug}:{plat_id}", [])),
            })
        deployments.sort(key=lambda d: _status_rank.get(d["status"], 9))

        # Use deployment overrides if available — resolve component_ids to full data
        if slug in DEPLOYMENT_OVERRIDES:
            deployments = []
            for ovr in DEPLOYMENT_OVERRIDES[slug]:
                d = dict(ovr)
                comp_ids_list = d.pop("component_ids", [])
                dep_comps = []
                for cid in comp_ids_list:
                    cd = _build_comp_dict(cid)
                    if cd:
                        dep_comps.append(cd)
                dep_comps.sort(key=lambda c: _status_rank.get(c["status"], 9))
                dep_id = d.get("id", "")
                dep_excl = app_excl | set(DEPLOYMENT_EXCLUDED_INDICATORS.get(f"{slug}:{dep_id}", []))
                active = [c for c in dep_comps if c["indicator_type"] not in dep_excl]
                # Status = worst of active RAG statuses; if all are no_data → no_data
                rag_active = [c for c in active if c["status"] != "no_data"]
                if not rag_active:
                    worst = "no_data"
                else:
                    worst = "healthy"
                    for c in rag_active:
                        if _status_rank.get(c["status"], 9) < _status_rank.get(worst, 9):
                            worst = c["status"]
                d["status"] = worst
                d["components"] = dep_comps
                active_slos = [c["slo"] for c in active if c.get("slo") is not None]
                d["slo"] = min(active_slos) if active_slos else None
                d["excluded_indicators"] = list(DEPLOYMENT_EXCLUDED_INDICATORS.get(f"{slug}:{dep_id}", []))
                deployments.append(d)
            deployments.sort(key=lambda d: _status_rank.get(d["status"], 9))

        # SLO data — derive from deployment SLOs (bottom-up)
        dep_slos = [d["slo"] for d in deployments if d.get("slo") is not None]
        app_slo_current = min(dep_slos) if dep_slos else None
        base_slo = APP_SLO_DATA.get(slug, {
            "target": 99.0, "current": 99.5, "error_budget": 80,
            "trend": "stable", "burn_rate": "0.2x", "breach_eta": None, "status": "healthy",
        })
        slo = dict(base_slo)
        if app_slo_current is not None:
            slo["current"] = app_slo_current
            # Derive SLO status from current vs target
            target = slo.get("target", 99.0)
            if app_slo_current < target - 0.5:
                slo["status"] = "critical"
            elif app_slo_current < target:
                slo["status"] = "warning"
            else:
                slo["status"] = "healthy"

        # Completeness score
        has_owner = bool(app.get("appOwner"))
        has_sla = bool(app.get("sla"))
        has_slo = slug in APP_SLO_DATA
        has_rto = app.get("rto", "") not in ("", "NRR")
        has_cpof = app.get("cpof") == "Yes"
        has_blast_radius = len(comp_ids) > 0
        checks = [has_owner, has_sla, has_slo, has_rto, has_cpof, has_blast_radius]
        score = round(sum(checks) / len(checks) * 100)

        completeness = {
            "has_owner": has_owner,
            "has_sla": has_sla,
            "has_slo": has_slo,
            "has_rto": has_rto,
            "has_cpof": has_cpof,
            "has_blast_radius": has_blast_radius,
            "score": score,
        }

        # Resolve team references (multi-team)
        if slug not in APP_TEAM_ASSIGNMENTS:
            # Seed from team name string on first access
            team_name = app.get("team", "")
            matched_team = next((t for t in TEAMS if t["name"] == team_name), None)
            if matched_team:
                APP_TEAM_ASSIGNMENTS[slug] = [matched_team["id"]]
        assigned_ids = APP_TEAM_ASSIGNMENTS.get(slug, [])

        results.append({
            **app,
            "id": slug,
            "incidents_30d": app["incidents"],
            "components": components,
            "deployments": deployments,
            "slo": slo,
            "completeness": completeness,
            "team_ids": assigned_ids,
            "excluded_indicators": list(APP_EXCLUDED_INDICATORS.get(slug, [])),
        })

    return results


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


# ── Teams CRUD ───────────────────────────────────────────────────────────────

class TeamCreate(BaseModel):
    name: str
    emails: list[str] = []
    teams_channels: list[str] = []

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    emails: Optional[list[str]] = None
    teams_channels: Optional[list[str]] = None

_next_team_id = 1

def _build_initial_teams():
    global _next_team_id
    names = [
        "Client Data", "Spectrum Core", "Liquidity Mgmt", "JPMAIM Platform",
        "Portfolio Mgmt", "Trading", "Middle Office", "Transaction Mgmt",
        "Guidelines", "Investment Acctg", "Ref Data", "Tech Shared Svc",
        "Connect Platform", "Party & Account", "Portfolio Holdings",
        "Service Desktop", "IPB Banking", "IPB Execute", "PBA Payments",
        "US Brokerage", "Asset Transfers", "Content", "IPB Core Banking",
        "Mutual Funds", "Core Accounting", "Work Orchestration",
        "Cross Asset Trading", "Lending", "Mortgages", "Portfolio Impl",
        "PM Toolkit", "Mobile Engineering", "Lending Platform", "Branch Tech",
        "Cards Platform", "Data Platform", "Analytics Eng", "Data Governance",
        "Electronic Trading", "FX Technology", "Syndicated Lending",
        "Treasury Tech", "Payments Core", "International Pmts",
        "Digital Platform", "API Platform", "IAM Engineering", "Observability",
        "Cloud Eng", "Network Eng", "HR Technology", "L&D Technology",
        "Container Eng", "Network Automation", "Traffic Eng",
    ]
    teams = []
    for n in names:
        slug = n.lower().replace(" ", "-").replace("&", "and")
        teams.append({
            "id": _next_team_id,
            "name": n,
            "emails": [f"{slug}@jpmchase.com", f"{slug}-oncall@jpmchase.com"],
            "teams_channels": [f"#{slug}-alerts", f"#{slug}-general"],
        })
        _next_team_id += 1
    return teams

TEAMS = _build_initial_teams()

@app.get("/api/teams")
def get_teams():
    return TEAMS

@app.get("/api/teams/{team_id}")
def get_team(team_id: int):
    team = next((t for t in TEAMS if t["id"] == team_id), None)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@app.post("/api/teams")
def create_team(payload: TeamCreate):
    global _next_team_id
    new = {"id": _next_team_id, "name": payload.name, "emails": payload.emails, "teams_channels": payload.teams_channels}
    _next_team_id += 1
    TEAMS.append(new)
    return new

@app.put("/api/teams/{team_id}")
def update_team(team_id: int, payload: TeamUpdate):
    team = next((t for t in TEAMS if t["id"] == team_id), None)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    for field in ["name", "emails", "teams_channels"]:
        val = getattr(payload, field, None)
        if val is not None:
            team[field] = val
    return team

@app.delete("/api/teams/{team_id}")
def delete_team(team_id: int):
    global TEAMS
    before = len(TEAMS)
    TEAMS = [t for t in TEAMS if t["id"] != team_id]
    if len(TEAMS) == before:
        raise HTTPException(status_code=404, detail="Team not found")
    return {"ok": True}


# ── App ↔ Team assignments (multi-team) ─────────────────────────────────────

# In-memory map: app slug → list of team IDs
# Seeded lazily on first enriched request (fallback in get_enriched_applications
# resolves app.team string → team id when no explicit assignment exists)
APP_TEAM_ASSIGNMENTS: dict[str, list[int]] = {}


class AppTeamAssignment(BaseModel):
    team_ids: list[int]


@app.get("/api/applications/{app_id}/teams")
def get_app_teams(app_id: str):
    return {"team_ids": APP_TEAM_ASSIGNMENTS.get(app_id, [])}


@app.put("/api/applications/{app_id}/teams")
def set_app_teams(app_id: str, payload: AppTeamAssignment):
    APP_TEAM_ASSIGNMENTS[app_id] = payload.team_ids
    return {"team_ids": payload.team_ids}


# ── Health Indicator Exclusions ──────────────────────────────────────────────

APP_EXCLUDED_INDICATORS: dict[str, list[str]] = {}
DEPLOYMENT_EXCLUDED_INDICATORS: dict[str, list[str]] = {}


class IndicatorExclusion(BaseModel):
    excluded_indicators: list[str]


@app.get("/api/indicator-types")
def get_indicator_types():
    return INDICATOR_TYPES


@app.put("/api/applications/{app_id}/excluded-indicators")
def set_app_excluded_indicators(app_id: str, payload: IndicatorExclusion):
    APP_EXCLUDED_INDICATORS[app_id] = payload.excluded_indicators
    return {"excluded_indicators": payload.excluded_indicators}


@app.put("/api/applications/{app_id}/deployments/{dep_id}/excluded-indicators")
def set_dep_excluded_indicators(app_id: str, dep_id: str, payload: IndicatorExclusion):
    key = f"{app_id}:{dep_id}"
    DEPLOYMENT_EXCLUDED_INDICATORS[key] = payload.excluded_indicators
    return {"excluded_indicators": payload.excluded_indicators}


# ── Contact / Send Message ───────────────────────────────────────────────────

class ContactSendRequest(BaseModel):
    type: str  # 'email' or 'teams'
    recipients: list[str]
    subject: Optional[str] = None
    message: str
    app_name: Optional[str] = None

@app.post("/api/contact/send")
def send_contact_message(payload: ContactSendRequest):
    """Mock endpoint — in production this would send via SMTP / MS Teams webhook."""
    return {
        "status": "sent",
        "type": payload.type,
        "recipients": payload.recipients,
        "message_preview": payload.message[:100],
    }


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
