# Wattprint: Product Requirements Document

**Version:** 1.1
**Status:** Post-MVP iteration
**Last updated:** March 2026

---

## What changed in v1.1

Since the initial MVP shipped, we made three categories of improvements.

**Real scenario modeling.** The `run_upgrade_scenario` MCP tool previously used hardcoded formulas — national average peak sun hours, fixed COP values, static emissions factors. We replaced all of that with actual Palmetto EI API calls. Solar upgrades now pass `production.panel_arrays` with capacity, tilt, and azimuth. Heat pump HVAC passes `consumption.hypothetical.hvac_heat_pump: true`. The tool calls Palmetto twice — once for baseline, once for the scenario — and diffs the cost response to get real savings. The EV charger is the one exception: it retains a formula because the API models added home consumption rather than savings versus public charging rates. We also corrected the Solar + Battery install cost estimate from $24,000 to $34,000 to properly reflect battery hardware.

**Report UI refinements.** The 10-year savings chart became a 15-year chart showing all modelled upgrades simultaneously. The top choice plots in green; the others use distinct colors so users can compare trajectories. A vertical reference line marks the 10-year point. The upgrade cards were cleaned up: ROI percentage and the progress bar were removed since the chart communicates that story better. Each card now shows a system size note for solar (5kW array, 10kW array, 8kW solar + battery storage). A floating side nav with IntersectionObserver tracking lets users see all report sections before scrolling.

**Agent panel technical depth.** Each completed step in the agent panel now surfaces the exact MCP tool name and the API it called. A collapsible technical section shows the full agentic architecture: the Claude model, MCP over SSE, the wattprint-mcp Node.js service, and a diagram of each tool call with its Palmetto API parameters. This was added for technical and hiring audiences who want to understand how the system actually works.

---

## 1. Background & Problem

Residential energy costs have risen roughly 4% annually for a decade. The Inflation Reduction Act created the largest federal clean-energy incentive program in US history, yet most homeowners have no clear picture of their home's energy profile, what upgrades would save them money, or which incentives they qualify for.

The information exists. Palmetto's Energy Intelligence API can model any US home's energy consumption, simulate upgrade scenarios using real building-science models, and surface utility and government rebate data. The gap is the last mile: turning raw API output into a clear, actionable story for a homeowner or their real estate agent.

The core insight is that a homeowner does not need a dashboard of energy metrics. They need a single answer to a single question: what should I do with my home, and how much will it save me? Backed by real data and delivered without friction.

---

## 2. Opportunity

| Signal | Detail |
|---|---|
| US residential energy spend | ~$1,400/household/year avg |
| IRA incentive window | Active through 2032, strong urgency |
| Electricity rate trend | +4.2%/yr; payback periods improving annually |
| Residential solar installs | 50+ GW cumulative, accelerating |
| Heat pump adoption | +23% YoY sales growth |
| Real estate market | Energy efficiency increasingly factored into home valuation |

The opportunity is a two-sided market: homeowners want to understand and reduce their energy bill; real estate professionals want to differentiate listings and advise buyers on total cost of ownership. Palmetto's EI API is uniquely positioned to power both.

---

## 3. Goals

The MVP set out to demonstrate that Palmetto's EI API can power an end-to-end consumer product with zero friction. It showed a full agentic AI workflow (baseline → upgrade scenarios → incentives → report), gave homeowners a ranked list of upgrade opportunities with real payback numbers, and surfaced the full incentive stack automatically.

Success at MVP meant a user could enter an address and receive a complete, credible energy report in under 90 seconds, share it with one click, and trust it because the agent panel showed every data source in real time.

The v1.1 work sharpened the data quality (real scenario modeling) and the presentation (cleaner cards, better chart, technical transparency for technical audiences).

---

## 4. Success Metrics

| Metric | MVP Target | North Star |
|---|---|---|
| Report completion rate | >80% of initiated reports | >95% |
| Time to report | <90s p50 | <60s p50 |
| Share rate | >20% of completed reports | >40% |
| Report return visits | n/a | >30% via share links |
| Upgrade accuracy | Validated against Palmetto EI | Validated + user-confirmed |

Not tracking at this stage: conversion, revenue, or retention. This is a zero-auth demo. Tracking infrastructure is a Phase 2 decision.

---

## 5. User Personas

**The Curious Homeowner** (primary) is 35 to 55 years old, paying attention to energy bills, and vaguely aware of IRA credits. They want to know if solar or a heat pump makes sense for their specific home, not a generic calculator. Generic tools feel unreliable; contractor quotes require scheduling. They need trustworthy, address-specific numbers with zero friction.

**The Real Estate Agent** (secondary) is a buyer's or listing agent advising on total cost of ownership. They want to differentiate their advice with data. They need a shareable assessment they can drop in an email or Slack thread.

**The Energy-Aware Buyer** (secondary) is evaluating a property and skeptical of rising utility costs. They want to understand the energy profile of a home before making an offer, framed in years to payback, not percentages.

---

## 6. What We Built

**No-auth, address-only entry.** Every account step loses roughly 30% of users. Removing auth entirely was the right call for a zero-friction demo.

**Agentic AI report generation.** Claude claude-sonnet-4-6 orchestrates 5 MCP tools in sequence. It decides which upgrades to model based on the baseline result — that reasoning step is what separates this from a static calculator.

**Real Palmetto EI scenario modeling.** As of v1.1, upgrade savings come from actual Palmetto API calls with scenario parameters, not formulas. The tool diffs baseline costs against scenario costs to compute real savings per home.

**Agent transparency panel.** Shows every tool call in real time. In v1.1 it also surfaces MCP tool names, API sources, and a collapsible architecture diagram for technical reviewers.

**15-year cumulative savings chart.** All modelled upgrades plotted simultaneously. Top choice in green. A reference line marks the 10-year point for context.

**Full incentive stack.** Federal IRA credits from a hardcoded table (stable through 2032), state programs from the Rewiring America API, and utility rebates from a state-level database.

**Shareable report links.** One click generates a unique token and a read-only view.

**Deferred to Phase 2:** user accounts and report history, multi-property support, PDF export, persistent share links (currently in-memory), real-time electricity rate data, and contractor marketplace.

---

## 7. Feature Notes

### Address Entry
Mapbox Searchbox autocomplete for US residential addresses. Validation requires a street number because Palmetto needs a specific address, not a city. We chose Mapbox over Google Places for the more generous free tier and cleaner address format compatibility with Palmetto.

### Agentic Report Generation
The five tools run in a consistent sequence: get_home_baseline, get_relevant_upgrades, run_upgrade_scenario (once per upgrade, max 5), get_incentives, search_utility_rebates. Claude synthesizes all outputs into a structured JSON report in one final pass.

MCP over direct API calls was a deliberate choice. The tool layer is independently testable, swappable, and extensible. Adding a new Palmetto capability means adding a tool to the MCP server without touching the agent logic.

The agentic loop rather than a single structured call was also deliberate. Claude decides which upgrades to model based on the baseline — this is a reasoning step. It also produces the tool-call trace that powers the transparency panel, and it is architecturally honest about how the system works.

### Report
Energy score (0 to 100, A through F), baseline metrics, end-use breakdown chart, monthly cost chart, upgrade cards (annual savings, payback, CO₂ reduced, system size note for solar), 15-year cumulative savings chart with all upgrades, and incentive cards separated by federal, state, and utility. Upgrade cards no longer show ROI percentage since the savings chart communicates that story more clearly over a realistic time horizon.

### Market Landscape
Six key market statistics and four AI-generated highlights contextualised to the home's state. Generated from Claude's training knowledge in the same final pass as the report JSON, so it adds zero latency. Live web search would add 10 to 20 seconds and introduce failure modes — Claude's training data through mid-2025 is accurate enough for market context.

### Share
One-click share generates a unique token stored in server memory. The shared view is read-only. Note: share links break on server restart — the production fix is Upstash Redis, roughly two hours of work.

---

## 8. Technical Architecture

```
Browser
  │
  ├─ GET /                       Landing page
  ├─ POST /api/reports/generate  → starts background job, returns { jobId }
  ├─ GET /api/jobs/[id]          → polls job state every 1.5s
  ├─ POST /api/reports/[id]/share → generates share token
  └─ GET /report/share/[token]   → read-only shared report

Next.js App (Railway, persistent Node.js process)
  │
  └─ report-agent.ts (agentic loop — Claude claude-sonnet-4-6)
       │
       └─ MCP Client (SSE transport)
            │
            └─ wattprint-mcp (Railway, separate Node.js/Express service)
                 │
                 ├─ get_home_baseline       → Palmetto EI POST /api/v0/bem/calculate
                 ├─ get_relevant_upgrades   → Local rule engine (no external API)
                 ├─ run_upgrade_scenario    → Palmetto EI POST /api/v0/bem/calculate
                 │                             (production.panel_arrays for solar;
                 │                              consumption.hypothetical for heat pumps / insulation)
                 ├─ get_incentives          → Rewiring America API + IRA hardcoded table
                 └─ search_utility_rebates  → State rebate database
```

Railway over Vercel because report generation runs for 60 to 90 seconds as a background process. Vercel's serverless model would silently kill it on response.

Polling over SSE because SSE in Next.js dev (Turbopack) buffers responses until the stream closes, defeating the purpose. Polling at 1.5s is simpler, more debuggable, and behaves identically in dev and prod.

MCP in a separate service rather than inlined so the tool layer can be updated independently and potentially serve other clients (Claude Desktop, other agents) without touching report generation logic.

---

## 9. Key Tradeoffs

| Decision | Chosen | Not chosen | Reason |
|---|---|---|---|
| Scenario modeling | Palmetto EI hypothetical API | Hardcoded formulas | Real API gives home-specific deltas. Formulas were national averages that ignored local electricity rates and building characteristics. |
| Auth model | No-auth | Clerk + Supabase | Auth is friction. Every step loses ~30% of users. Removed it entirely for the demo. |
| Report delivery | Async job + polling | Synchronous request | 90-second blocking requests timeout on most infrastructure. Polling gives live feedback. |
| Market data | Claude training knowledge | Live web search | Web search adds 10 to 20 seconds and failure modes. Training data through mid-2025 is accurate enough. |
| Upgrade selection | Agent-driven | Static list | Claude reasons over the baseline to decide which upgrades to model. Static lists produce worse reports for edge-case homes. |
| State management | In-memory Maps | Database | Zero infrastructure dependencies for the demo. Known limitation for production. |
| MCP transport | SSE, separate server | stdio, in-process | SSE lets the MCP server update independently. stdio requires restarting the whole app. |
| Hosting | Railway (persistent) | Vercel (serverless) | Serverless kills background jobs on HTTP response. |

---

## 10. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Palmetto returns no data for an address | Medium | High | Error state with clear messaging and try-again CTA. |
| Report generation exceeds 90 seconds | Medium | Medium | No Railway timeout. Elapsed timer keeps the user informed. |
| Share links break on server restart | High | Low | Known MVP limitation. Fix is Upstash Redis KV. |
| Claude produces malformed JSON | Low | High | Regex strips markdown fences before JSON.parse. Try/catch surfaces errors cleanly. |
| Palmetto API rate limits at scale | Unknown | High | No mitigation at current volume. Add request queuing if needed. |
| MCP server connection failure | Low | High | Error surfaces within 5 seconds. Railway auto-restarts the service. |
| Scenario hypothetical params silently ignored | Medium | Medium | If Palmetto does not recognise a hypothetical field, it returns baseline costs and the savings delta is zero. We surface the data_source field in each scenario result so this is detectable. |

---

## 11. Roadmap

**Phase 1 (shipped and iterated):** No-auth report generation, agentic AI with transparency panel, real Palmetto EI scenario modeling, upgrade scenarios and incentives, 15-year savings chart, shareable links.

**Phase 2 (next 60 days if validated):** User accounts (passwordless email), multi-property support, PDF export, persistent share links via Upstash Redis, real-time electricity rate injection, report refresh when models update.

**Phase 3 (monetise and scale):** Pro tier with unlimited reports and agent branding, contractor marketplace for lead generation, white-label API for real estate platforms, Zillow and Redfin integrations.

---

## 12. Palmetto Energy Intelligence API: Builder Evaluation

This section reflects direct experience building on `POST /api/v0/bem/calculate`. It is intended to surface the gaps between the current v0 capability and a production-ready platform.

### What the API does exceptionally well

Address-only input is a genuine superpower. No property ID lookup, no pre-registration, no building spec questionnaire. Pass a street address and get a full energy model back. For a consumer product, this is the only workable UX.

The `variables: all_non_zero` flag eliminates guesswork. Instead of enumerating every field, you get a rich flat object of everything non-zero. This made exploration fast and meant we did not miss available fields.

End-use disaggregation is rare and valuable. The response breaks consumption down by end-use: heating, cooling, hot water, plug loads, lighting, cooking. Most energy APIs return only total consumption. Disaggregation is what makes upgrade prioritisation possible.

Fossil fuel tracking is first-class. `consumption.fossil_fuel`, `costs.fossil_fuel`, and `emissions.fossil_fuel` sit alongside electric equivalents. Critical for gas-home analysis and electrification modelling.

Monthly granularity with `group_by: month` is chart-ready. Twelve monthly intervals map directly to a bar chart without post-processing.

### Where the API has room to grow

**Scenario modeling documentation is the biggest gap.** In v1.0 we fell back to hardcoded formulas because the hypothetical parameter names and response field mapping were not documented clearly enough to trust in production. In v1.1 we worked through the documentation and the sample code Palmetto shared, mapped the right parameters per upgrade type, and switched to real API calls. The savings numbers are now materially more accurate. That said, some hypothetical parameters (water heater type, insulation R-values) may or may not be recognised by the API — the response gives no indication when a hypothetical is silently ignored. A first-class scenario endpoint with explicit before/after cost fields, or even a list of supported hypothetical keys, would remove this ambiguity entirely.

**Upgrade costs are not in the API.** Install costs in Wattprint are hardcoded national averages. If Palmetto returned ZIP-adjusted cost estimates, payback and ROI calculations would be materially more accurate.

**Incentive data is not in the API.** Federal credits are a hardcoded IRA table. State incentives call the Rewiring America API. Utility rebates are a manually maintained 7-state table. A unified incentive endpoint from Palmetto would eliminate three separate data sources.

**No address validation endpoint.** There is no cheap way to check coverage before running a full calculation that takes 5 to 15 seconds and costs an API call. A lightweight validation call would allow faster, cleaner error handling.

**Date ranges are hardcoded.** `from_datetime` and `to_datetime` are required. There is no trailing-12-months shorthand, so the data ages silently without any flag or error.

**Field discovery requires trial and error.** There is no published schema for what `all_non_zero` can return. Building Wattprint required running calls against known addresses and logging raw responses to discover available fields. An OpenAPI spec or reference response would cut integration time significantly.

**Utility name is not in the response.** The serving utility comes from Claude's inference, not from Palmetto. This is a meaningful gap for routing users to utility rebate programs.

### Scorecard

| Capability | Rating | Notes |
|---|---|---|
| Address-only input | ★★★★★ | Best possible DX for consumer products |
| End-use disaggregation | ★★★★★ | Rare, essential, well-structured |
| Fossil fuel and emissions | ★★★★☆ | Complete; emissions factor transparency would add a star |
| Monthly granularity | ★★★★★ | Chart-ready out of the box |
| Scenario modeling | ★★★☆☆ | Parameters work once you find them; silent failure on unrecognised fields is the remaining gap |
| Upgrade costs | ★☆☆☆☆ | Not in API; must be approximated |
| Incentive data | ★☆☆☆☆ | Not in API; requires separate integrations |
| Address validation | ★☆☆☆☆ | No lightweight pre-check available |
| Documentation and field schema | ★★☆☆☆ | Field discovery by trial and error; sample code from Palmetto helped unblock scenario modeling |
| Stability and versioning | ★★☆☆☆ | V0 carries real breakage risk in production |

The Palmetto EI API's core capability, address-based energy modeling with end-use disaggregation, is genuinely differentiated and immediately usable. The gap is everything around the baseline: scenario documentation, costs, incentives, and validation. Closing those gaps would make it a complete platform rather than a powerful but partial primitive.

The fastest path to defensibility is distribution partnerships: MLS integrations, title companies, and mortgage lenders, which Palmetto's existing B2B network is uniquely positioned to unlock.
