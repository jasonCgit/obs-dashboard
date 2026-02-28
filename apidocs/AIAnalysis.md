# AI Analysis (AURA) — API Integration Guide

> AURA AI Health panel on the Dashboard home page (left column, top).

---

## Architecture Overview

```
┌──────────────────┐      ┌───────────────────────┐      ┌───────────────────┐
│  AI/ML Engine    │ ──►  │  Backend API           │ ──►  │  AIHealthPanel.jsx │
│  (LLM, anomaly   │      │  /api/ai-analysis      │      │  Alert + Trends    │
│   detection)     │      │                        │      │  + Recommendations │
└──────────────────┘      └───────────────────────┘      └───────────────────┘
```

**Current state:** Mock data in `AI_ANALYSIS` dict inside `backend/main.py` (lines 38–55).

**What to change:** Replace with output from a real AI/ML analysis pipeline.
The frontend renders three fixed sections — critical alert, trend analysis,
and recommendations — so the response shape must be preserved.

---

## Endpoint & Response Contract

### `GET /api/ai-analysis`

#### Response — `200 OK`

```jsonc
{
  "critical_alert": "GWM Collateral Management System showing cascading failures across 3 dependent services. Memory utilization at 94% on primary nodes with connection pool exhaustion detected.",
  "trend_analysis": "P1 incident volume increased 23% week-over-week, primarily driven by infrastructure instability in NA-East region. Database connection timeouts correlating with deployment window 14:00-16:00 EST.",
  "recommendations": [
    "Immediate: Scale GWM Collateral connection pool from 100 to 250 connections",
    "Short-term: Implement circuit breakers for dependent service calls",
    "Review: Memory leak investigation needed for collateral-calc-engine pods"
  ],
  "generated_at": "2025-01-15T14:30:00Z"
}
```

#### Schema

| Field             | Type     | Required | Description                                           |
|-------------------|----------|----------|-------------------------------------------------------|
| `critical_alert`  | string   | yes      | Most urgent finding — rendered with red accent         |
| `trend_analysis`  | string   | yes      | Trend narrative — rendered with blue accent            |
| `recommendations` | string[] | yes      | Ordered action items — rendered as bullet list         |
| `generated_at`    | string   | no       | ISO 8601 timestamp of when analysis was generated      |

---

## UI Rendering

The panel has a gradient blue border and a pulsing "Live" chip.
Title: **AURA** (tooltip: "Agentic, Unified Personas, Reliability, Automation").

Three sections:

| Section              | Data Field          | Label Color | Accent     |
|----------------------|---------------------|-------------|------------|
| Critical Alert       | `critical_alert`    | Red         | Red left-border  |
| Trend Analysis       | `trend_analysis`    | Blue        | Blue left-border |
| AI Recommendations   | `recommendations`   | Slate       | Blue bullet dots |

- `recommendations` renders as a bulleted list; each string is one bullet
- If `critical_alert` is empty/null, the section can be hidden

---

## What to Change

### Backend (`backend/main.py`, lines 38–55)

Replace `AI_ANALYSIS` with output from a real analysis engine:

```python
@app.get("/api/ai-analysis")
def ai_analysis():
    # Run or fetch cached AI analysis
    alert = anomaly_detector.get_critical_alert()
    trends = trend_analyzer.get_summary()
    recs = recommendation_engine.get_top_actions(limit=5)

    return {
        "critical_alert": alert,
        "trend_analysis": trends,
        "recommendations": recs,
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }
```

---

## Integration Checklist

- [ ] Wire `critical_alert` to real anomaly detection output
- [ ] Wire `trend_analysis` to real trend summarization
- [ ] Wire `recommendations` to actionable items from AI engine
- [ ] Keep recommendations as plain strings (no markdown)
- [ ] Optionally add `generated_at` for freshness indication
- [ ] Ensure response returns within a reasonable time (<2s) — cache if needed
