# Future API Endpoints (Not Yet Built)

These endpoints need to be created in the backend to replace hardcoded frontend data. The schemas below match the exact data structures currently used by each page.

> **Current State**: The pages listed below (Incident Zero, Customer Journey, SLO Agent) use entirely **hardcoded frontend data** — they do not call any backend API. The data structures below document what each page currently renders, so that backend endpoints can be built to match.

See [current-api.md](current-api.md) for all existing backend endpoints and their mock data details.

---

## Incident Zero Endpoints

### GET /api/incident-zero/error-budgets

Error budget status for all monitored services.

**Query params**: Standard filter params (lob, seal, cto, cbt, search)

**Response**:
```json
[
  {
    "label": "PAYMENT-GATEWAY-API",
    "budget": 12,
    "burnRate": "4.2x",
    "breachEta": "6h",
    "status": "critical",
    "sla": "99.99%",
    "incidents30d": 8
  },
  {
    "label": "DATA-PIPELINE-SERVICE",
    "budget": 55,
    "burnRate": "0.8x",
    "breachEta": "—",
    "status": "safe",
    "sla": "99.0%",
    "incidents30d": 3
  }
]
```

**Status values**: `critical` (budget ≤ 15%), `warning` (≤ 30%), `moderate` (≤ 50%), `safe` (> 50%)

**Currently mocked in**: `frontend/src/pages/IncidentZero.jsx` — `ERROR_BUDGET_SERVICES` array (8 items)

**Live integration**: Computed from SLO monitoring platform (Dynatrace/custom). `burnRate` = current error consumption rate relative to sustainable rate. `breachEta` = projected time until SLO breach at current burn rate, or `"—"` if burn rate < 1x.

---

### GET /api/incident-zero/burn-rate-alerts

Active burn rate alerts for services exceeding thresholds.

**Response**:
```json
[
  {
    "service": "EMAIL-NOTIFICATION-SVC",
    "rate": "8.1x",
    "window": "1h",
    "eta": "45 minutes to SLO breach",
    "detail": "SMTP connection failures recurring every 6 hours. Current error rate 0.99% against 0.5% budget. Third consecutive day of elevated failures.",
    "action": "Failover to secondary SMTP provider (SendGrid) and increase connection timeout to 30s."
  }
]
```

**Currently mocked in**: `frontend/src/pages/IncidentZero.jsx` — `BURN_RATE_ALERTS` array (3 items)

**Live integration**: SLO monitoring platform triggers alerts when burn rate exceeds configurable threshold (default: 3x). `detail` and `action` fields can be AI-generated via AURA.

---

### GET /api/incident-zero/timeline

Prevention activity timeline (recent events).

**Query params**: `limit` (default 20)

**Response**:
```json
[
  {
    "time": "12:34 PM",
    "event": "Burn rate alert: EMAIL-NOTIFICATION-SVC reached 8.1x (threshold: 3x)",
    "severity": "critical"
  },
  {
    "time": "12:15 PM",
    "event": "Proactive scale-up applied to REDIS-CACHE-CLUSTER (3 → 5 replicas)",
    "severity": "resolved"
  }
]
```

**Severity values**: `critical`, `warning`, `resolved`, `info`

**Currently mocked in**: `frontend/src/pages/IncidentZero.jsx` — `TIMELINE` array (7 items)

**Live integration**: Aggregated from SLO monitoring alerts, auto-remediation actions, and scheduled scans.

---

### GET /api/incident-zero/scorecard

Prevention effectiveness metrics over a rolling 30-day window.

**Response**:
```json
{
  "p1s_prevented": 7,
  "avg_lead_time": "4h",
  "auto_mitigated": 12,
  "budget_saved": "34%"
}
```

**Currently mocked in**: `frontend/src/pages/IncidentZero.jsx` — `PREVENTION_SCORECARD` object (4 fields)

**Live integration**: Computed from historical incident data vs. predicted incidents (using AURA AI trend analysis).

---

## Customer Journey Endpoints

### GET /api/journeys

List of available customer journeys.

**Response**:
```json
[
  {
    "id": "trade-execution",
    "name": "Trade Execution",
    "status": "critical",
    "step_count": 6,
    "critical_steps": 3,
    "warning_steps": 2
  },
  {
    "id": "client-login",
    "name": "Client Login",
    "status": "warning",
    "step_count": 5,
    "critical_steps": 0,
    "warning_steps": 1
  }
]
```

**Currently mocked in**: `frontend/src/pages/CustomerJourney.jsx` — `JOURNEYS` object (3 journeys: Trade Execution, Client Login, Document Delivery)

**Live integration**: Journey definitions from Business Process → Application mapping (ERMA/V12). Overall status = worst step status.

---

### GET /api/journeys/{journey_id}/steps

Detailed step-by-step health for a specific journey.

**Response**:
```json
{
  "id": "trade-execution",
  "name": "Trade Execution",
  "status": "critical",
  "steps": [
    {
      "step": "Authentication",
      "service": "AUTH-SERVICE-V2",
      "status": "healthy",
      "latency": "42ms",
      "errorRate": "0.0%"
    },
    {
      "step": "Market Data Fetch",
      "service": "MERIDIAN SERVICE-QUERY V1",
      "status": "critical",
      "latency": "3200ms",
      "errorRate": "12.4%"
    },
    {
      "step": "Payment Processing",
      "service": "PAYMENT GATEWAY API",
      "status": "critical",
      "latency": "8100ms",
      "errorRate": "9.7%"
    },
    {
      "step": "Confirmation Email",
      "service": "EMAIL-NOTIFICATION-SERVICE",
      "status": "critical",
      "latency": "—",
      "errorRate": "100%"
    }
  ]
}
```

**Field notes**:
- `service`: Maps to a component node in the knowledge graph
- `latency`: String with `ms` unit, or `"—"` when service is fully down
- `errorRate`: String with `%` suffix
- `status`: Derived from component health indicators (Dynatrace)

**Currently mocked in**: `frontend/src/pages/CustomerJourney.jsx` — `JOURNEYS` object, steps array per journey

**Live integration**: Journey step definitions from ERMA/V12 Business Process mapping. Real-time latency and error rates from Dynatrace synthetic/service monitoring.

---

## SLO Agent Endpoints

### GET /api/slo-agent/services

SLO health table for all monitored services.

**Query params**: Standard filter params (lob, seal, cto, cbt, search)

**Response**:
```json
[
  {
    "id": "payment-gateway",
    "label": "PAYMENT-GATEWAY-API",
    "target": 99.99,
    "current": 99.84,
    "budget": 12,
    "trend": "down",
    "status": "critical"
  },
  {
    "id": "auth-service",
    "label": "AUTH-SERVICE-V2",
    "target": 99.99,
    "current": 99.99,
    "budget": 95,
    "trend": "up",
    "status": "healthy"
  }
]
```

**Field notes**:
- `target`: SLO target percentage (e.g., 99.99)
- `current`: Current uptime/availability percentage
- `budget`: Remaining error budget as percentage (0-100)
- `trend`: `"up"` (improving), `"down"` (degrading), `"stable"`
- `status`: `"critical"` (budget ≤ 15%), `"warning"` (≤ 40%), `"healthy"` (> 40%)

**Currently mocked in**: `frontend/src/pages/SloAgent.jsx` — `SERVICES` array (10 items)

**Live integration**: SLO monitoring platform. `current` and `budget` are real-time values. `trend` is computed from rolling window comparison.

---

### GET /api/slo-agent/actions

Pending AI-recommended remediation actions.

**Response**:
```json
[
  {
    "id": 1,
    "service": "PAYMENT-GATEWAY-API",
    "action": "Scale database connection pool from 50 → 100 connections",
    "reason": "Error budget at 12% with accelerating burn rate. Connection pool exhaustion detected in last 3 incidents.",
    "risk": "low",
    "status": "pending_approval",
    "time": "2m ago"
  }
]
```

**Field notes**:
- `risk`: `"low"` (safe to auto-approve) or `"medium"` (requires human review)
- `status`: `"pending_approval"` — agent awaits human approval before executing
- `action` and `reason`: AI-generated by AURA based on incident patterns and SLO state

**Currently mocked in**: `frontend/src/pages/SloAgent.jsx` — `AGENT_ACTIONS` array (3 items)

**Live integration**: AURA AI generates recommended actions based on current SLO state, incident history, and infrastructure metrics.

---

### POST /api/slo-agent/actions/{action_id}/approve

Approve a pending agent action for execution.

**Response**: `{ "id": 1, "status": "approved", "executed_at": "2026-03-01T12:36:00Z" }`

**Currently mocked in**: Frontend dispatches locally — no backend call yet

---

### POST /api/slo-agent/actions/{action_id}/dismiss

Dismiss a pending action without executing.

**Response**: `{ "id": 1, "status": "dismissed" }`

**Currently mocked in**: Frontend dispatches locally — no backend call yet

---

### GET /api/slo-agent/activity

Agent activity log (recent automated and detected events).

**Response**:
```json
[
  {
    "time": "12:34 PM",
    "event": "Approved auto-scaling for REDIS-CACHE-CLUSTER (3 → 5 replicas)",
    "type": "auto"
  },
  {
    "time": "12:28 PM",
    "event": "Detected SLO burn rate spike on PAYMENT-GATEWAY-API — proposed connection pool scale-up",
    "type": "detect"
  },
  {
    "time": "11:52 AM",
    "event": "Predicted SLO breach for EMAIL-NOTIFICATION-SVC within 4h — queued SMTP failover",
    "type": "predict"
  }
]
```

**Type values**:
- `"auto"`: Automated action executed by agent
- `"detect"`: Issue detected, action proposed
- `"predict"`: Predictive alert based on trend analysis
- `"scan"`: Routine health scan result

**Currently mocked in**: `frontend/src/pages/SloAgent.jsx` — `AGENT_ACTIVITY` array (6 items)

**Live integration**: Combination of SLO agent execution logs + AURA AI detection/prediction events.

---

### GET /api/slo-agent/scorecard

Agent performance metrics over rolling 24-hour window.

**Response**:
```json
{
  "actions_taken": 14,
  "auto_approved": 9,
  "predictions": 6,
  "breaches_prevented": 3
}
```

**Currently mocked in**: `frontend/src/pages/SloAgent.jsx` — `SCORECARD` object (4 fields)

---

## AURA AI Chat Endpoint (Enhanced)

The existing `POST /api/aura/chat` endpoint already uses SSE streaming (see [current-api.md](current-api.md#aura-ai-chat-endpoint)). For production, it needs to connect to the actual AURA AI service.

### Current SSE Event Protocol

The endpoint streams Server-Sent Events with these event types:

| Event | Payload | Description |
|---|---|---|
| `meta` | `{ message_id, timestamp }` | Sent first — conversation metadata |
| `block` | `{ type, data }` | Content block (text, metrics, charts, etc.) |
| `followups` | `["question1", "question2"]` | Suggested follow-up questions |
| `done` | `{}` | Signal stream complete |

### Content Block Types

| type | data | Description |
|---|---|---|
| `"text"` | Markdown string | Narrative text with formatting |
| `"metric_cards"` | `[{ label, value, status, trend }]` | KPI metric cards |
| `"status_list"` | `[{ label, status, detail }]` | Status items with RAG indicators |
| `"chart"` | `{ chart_type, data, title }` | Inline chart data |
| `"recommendations"` | `[string]` | Action items |

### AURA Summarization Use Cases

These specialized summarization modes should be supported via context in the chat request:

**1. Home Page AURA Summary**
```json
POST /api/aura/chat
{
  "message": "executive_summary",
  "context": { "mode": "home_summary", "filters": { "lob": ["AWM"] } }
}
```
Returns: critical alerts, trend analysis, recommendations for the filtered scope.

**2. Recurring Application Issues**
```json
POST /api/aura/chat
{
  "message": "recurring_issues",
  "context": { "mode": "recurring_analysis", "seal": "16649", "window": "90d" }
}
```
Returns: count, trend, pattern analysis over the specified time window.

**3. Blast Radius Executive Summary**
```json
POST /api/aura/chat
{
  "message": "blast_radius_summary",
  "context": {
    "mode": "blast_radius",
    "seal": "88180",
    "graph_data": { "component_count": 6, "critical_count": 2, "cross_seal_deps": 3 }
  }
}
```
Returns: impact severity, incident count/trend, business-perspective executive summary.

### Migration from Mock to Live

**Currently mocked in**: `backend/main.py` — `_AURA_SCENARIOS` dict (line ~2848). Uses keyword matching to select from 11 hardcoded scenario response handlers.

**Live integration**: Replace keyword-matching `_AURA_SCENARIOS` with actual AURA AI API calls. Pass current health state, incidents, and graph context as prompt context. Stream response tokens back via SSE.
