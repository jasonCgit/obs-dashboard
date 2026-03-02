# SRE Outcome Measures — Executive Report Framework

## Overview

An executive SRE report should answer one question: **"Is our technology getting more reliable, and is our investment in SRE paying off?"**

Structure the report around six pillars:

1. Stability & Reliability
2. Time to Signal Disappearance
3. Proactive Prevention (AIOps360 Value)
4. Toil Reduction & Efficiency
5. Alert Quality & Noise Reduction
6. Resiliency & Compliance

---

## Pillar 1: Stability & Reliability (The Baseline Story)

| Measure | What It Tells Executives | How to Measure |
|---|---|---|
| **Incident Volume Trending** (P1/P2/P3 by month) | "Are we breaking less?" | ServiceNow — count incidents by priority per period, filter by SEAL/LOB. Extend to 90d/180d windows. |
| **MTTR by Priority** | "When things break, do we fix them faster?" | ServiceNow — `resolution_time - opened_time` per incident. Compute from ticket timestamps rather than manual tracking. |
| **SLO Attainment Rate** | "Are we meeting our promises?" | % of applications meeting their SLO target in a given month. Report as: "87% of critical apps met SLO this month, up from 82%." |
| **Repeat/Recurring Incidents (30d/90d)** | "Are we fixing root causes or just symptoms?" | ServiceNow — trend `recurring_30d` over time. A declining number is a powerful story. |

**Executive visual**: Sparkline trends per quarter. Green = improving, red = degrading. One-page view.

---

## Pillar 2: Time to Signal Disappearance (Best Original Metric)

This metric is better than MTTR because it is **automated and honest** — measured directly from monitoring data, not manual ticket updates.

### Percentile Bands (Avoid Averages)

| Band | Definition | What It Means |
|---|---|---|
| 50th percentile | Signals resolved in X minutes | Half our issues resolve this fast |
| 75th percentile | Signals resolved in Y minutes | Most issues resolve within this window |
| 90th percentile | Signals resolved in Z hours | Tail-end outliers — where to focus improvement |

### How to Measure

Track indicator health state transitions (green/amber/red) per component:

- `t_start` = timestamp when indicator goes red/amber
- `t_end` = timestamp when indicator returns to green
- `duration = t_end - t_start`

Aggregate by percentile bands rather than averages. This avoids the "average of 5 minutes and 5 hours = misleadingly fine" problem.

### What You Need

A state-change event log for health indicators. If Dynatrace provides historical state data, you can compute this retroactively. If not, start recording transitions now to establish a baseline.

---

## Pillar 3: Proactive Prevention (The AIOps360 Value Story)

This pillar ties AIOps360 investment directly to measurable outcomes.

| Measure | What It Tells Executives | How to Measure |
|---|---|---|
| **AIOps360-Triggered Fixes** | "AI caught this before users did" | Label JIRAs with `AIOps360-triggered` when a fix originates from anomaly detection. Count per month. Make it a process, not optional. |
| **Proactive vs Reactive Incident Ratio** | "Are we finding problems before they become incidents?" | `(anomalies detected that did NOT become P1/P2) / (total anomalies detected)`. Higher = better. Correlate AURA anomaly detections with ServiceNow incidents in a time window. |
| **Incidence Reduction per Onboarded SEAL** | "Does onboarding to AIOps360 actually reduce incidents?" | Before/after comparison: avg monthly incidents 6 months before onboarding vs 6 months after, per SEAL. This is the most compelling proof of value. |
| **Coverage Rate** | "How much of our estate is protected?" | `(SEALs onboarded to AIOps360) / (total SEALs)` and `(Dynatrace-monitored components) / (total components)`. |

---

## Pillar 4: Toil Reduction & Efficiency

| Measure | What It Tells Executives | How to Measure |
|---|---|---|
| **ZeroTouch Automation Saves** | "How many hours did automation save?" | Track manual task time before automation x number of executions. Example: auto-remediated restart that used to take 15 min x 40 times/month = 10 hours saved/month. |
| **Tickets Deflected by Self-Service** | "Are we reducing the load on support teams?" | Reduction in low-priority service tickets after tooling rollout. |
| **Mean Time to Acknowledge (MTTA)** | "Are we responding faster?" | ServiceNow — `acknowledged_time - opened_time`. Faster MTTA means tools are surfacing problems effectively. |

---

## Pillar 5: Alert Quality & Noise Reduction

| Measure | What It Tells Executives | How to Measure |
|---|---|---|
| **Alert Volume Trend** | "Are we drowning in noise?" | Total alerts per week/month from AURA/Dynatrace. Trending down = AURA filtering is working. |
| **Signal-to-Noise Ratio** | "Of the alerts we send, how many are actionable?" | `(alerts that led to action) / (total alerts)`. Requires classifying alerts as actioned vs dismissed. |
| **AURA Filtering Effectiveness** | "Is AI actually helping?" | `(raw alerts from Dynatrace) - (alerts surfaced after AURA filtering) = noise suppressed`. Report as: "AURA filtered 60% of noise, saving SREs X hours of triage." |

---

## Pillar 6: Resiliency & Compliance

| Measure | What It Tells Executives | How to Measure |
|---|---|---|
| **Resiliency Gaps Found & Closed** | "Are we hardening before failures?" | Count of proactively identified gaps (from blast radius analysis, dependency review) vs count remediated. Trend the backlog. |
| **FARM/M&O Compliance Score** | "Are we meeting corporate standards?" | % of apps passing corporate control checks. Track improvement quarter over quarter. |
| **RTO Achievement Rate** | "Could we actually recover in time?" | During DR tests or real incidents: `(actual recovery time) / (stated RTO)`. |

---

## Executive Report Layout

```
+-----------------------------------------------------------+
|  SRE QUARTERLY OUTCOME REPORT - Q1 2026                   |
+-----------------------------------------------------------+
|                                                           |
|  HEADLINE METRICS (traffic-light indicators)              |
|  +----------+ +----------+ +----------+ +----------+      |
|  | P1s: 12  | | MTTR: 45m| | SLO Met: | |Coverage: |     |
|  | down 25% | | down 18% | | 91%      | | 78%      |     |
|  | GREEN    | | GREEN    | | AMBER    | | AMBER    |      |
|  +----------+ +----------+ +----------+ +----------+      |
|                                                           |
|  STABILITY TREND (12-month sparklines)                    |
|  P1/P2 Incidents  ........####   down, trending down      |
|  Signal Duration  ........####   down, resolving faster   |
|  Recurring Issues ........####   down, fewer repeats      |
|                                                           |
|  AIOPS360 VALUE                                           |
|  - 47 proactive fixes this quarter (vs 31 last quarter)   |
|  - 3 P1s prevented by early anomaly detection             |
|  - Onboarded SEALs show 34% fewer incidents on avg        |
|                                                           |
|  TOIL & EFFICIENCY                                        |
|  - 280 hours saved via ZeroTouch automations              |
|  - Alert noise reduced 42% by AURA filtering              |
|  - MTTA improved from 12min to 7min                       |
|                                                           |
|  BY LOB BREAKDOWN                                         |
|  LOB    | Incidents | SLO | Coverage | Resiliency         |
|  AWM    |   GREEN   | GRN |  AMBER   |   GREEN            |
|  CCB    |   AMBER   | GRN |  GREEN   |   AMBER            |
|  CIB    |   GREEN   | AMB |  AMBER   |   GREEN            |
|                                                           |
|  ACTION ITEMS                                             |
|  1. Increase Dynatrace coverage for CCB (currently 62%)   |
|  2. Address 5 open resiliency gaps in CIB Payments        |
|  3. Onboard 12 remaining critical SEALs to AIOps360      |
+-----------------------------------------------------------+
```

---

## Readiness Assessment: What You Can Measure Today vs. What Needs Building

| Measure | Available Now | What's Needed |
|---|---|---|
| Incident counts by priority | Partially (mock `p1_30d`, `p2_30d`) | Live ServiceNow integration |
| SLO attainment | Yes (computed in enrichment) | Real SLO targets from monitoring |
| Coverage (Dynatrace/UOP) | Partially (completeness scores exist) | Actual onboarding data |
| Signal disappearance duration | No | Health indicator state-change logging |
| AIOps360-triggered fixes | No | JIRA labeling process + query |
| Alert volume/noise | No | AURA/Dynatrace alert event stream |
| ZeroTouch time saves | No | Automation execution logging |
| Resiliency gap tracking | No | Gap register + remediation tracking |
| MTTR (automated) | No | ServiceNow timestamp calculation |
| Recurring incidents | Partially (`recurring_30d` field) | ServiceNow correlation logic |

### Recommended Starting Point (Day 1)

Start with what you can get from **ServiceNow** (incidents, MTTR, recurring) and your **existing dashboard** (SLO attainment, coverage). Those 4-5 metrics alone tell a strong baseline story. Then build toward the more creative measures (signal disappearance, proactive detection ratio) as you instrument the data sources.
