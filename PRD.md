# Wattprint — Product Requirements Document

**Version:** 1.0
**Status:** MVP Shipped
**Last updated:** March 2026

---

## 1. Background & Problem

Residential energy costs have risen ~4% annually for a decade. The Inflation Reduction Act (IRA) created the largest federal clean-energy incentive program in US history — yet most homeowners have no clear picture of their home's energy profile, what upgrades would save them the most money, or which incentives they qualify for.

The information exists. Palmetto's Energy Intelligence (EI) API can model any US home's energy consumption, simulate upgrade scenarios with real building-science models, and surface utility and government rebate programs. The gap is the last mile: turning raw API data into a clear, actionable story for a homeowner or their real estate agent.

**The core insight:** A homeowner doesn't need a dashboard of energy metrics. They need a single answer to a single question — *"What should I do with my home, and how much will it save me?"* — backed by real data and delivered without friction.

---

## 2. Opportunity

| Signal | Detail |
|---|---|
| US residential energy spend | ~$1,400/household/year avg |
| IRA incentive window | Active through 2032 — strong urgency |
| Electricity rate trend | +4.2%/yr — payback periods improving annually |
| Residential solar installs | 50+ GW cumulative, accelerating |
| Heat pump adoption | +23% YoY sales growth |
| Real estate market | Energy efficiency increasingly factored into home valuation |

The opportunity is a two-sided market: **homeowners** want to understand and reduce their energy bill; **real estate professionals** want to differentiate listings and advise buyers on total cost of ownership. Palmetto's EI API is uniquely positioned to power both.

---

## 3. Goals

### MVP Goals (this release)
- Demonstrate that Palmetto's EI API can power an end-to-end consumer product with zero friction (no account required)
- Show a full agentic AI workflow using the EI API: baseline → upgrade scenarios → incentives → report
- Give homeowners a clear, ranked list of upgrade opportunities with real ROI numbers
- Surface the full incentive stack (federal IRA + state + utility rebates) automatically

### What success looks like at MVP
- User enters an address → gets a complete, credible energy report in under 90 seconds
- Report is shareable with a single click
- Agent panel shows the AI's work transparently — builds trust in the output

---

## 4. Success Metrics

| Metric | MVP Target | North Star |
|---|---|---|
| Report completion rate | >80% of initiated reports complete | >95% |
| Time to report | <90s p50 | <60s p50 |
| Share rate | >20% of completed reports shared | >40% |
| Report return visits | — | >30% (via share links) |
| Top upgrade accuracy | Validated against Palmetto EI | Validated + user-confirmed |

**Not tracking at MVP:** conversion, revenue, retention — this is a zero-auth demo. Tracking infrastructure is a Phase 2 decision.

---

## 5. User Personas

### Persona A — "The Curious Homeowner" (primary)
- **Who:** 35-55yo homeowner, paying attention to energy bills, vaguely aware of IRA credits
- **Job to be done:** Understand if solar or a heat pump makes sense for *their specific home*, not a generic calculator
- **Pain:** Generic online calculators feel unreliable; contractor quotes require scheduling; nothing tells them what they qualify for
- **Key need:** Trustworthy, address-specific numbers with zero friction

### Persona B — "The Real Estate Agent" (secondary)
- **Who:** Buyer's agent or listing agent advising on total cost of ownership
- **Job to be done:** Differentiate their advice with data; help buyers understand a home before closing
- **Pain:** No tool gives them a quick, shareable energy assessment they can send to a client
- **Key need:** One-click share link they can drop in an email or Slack

### Persona C — "The Energy-Aware Buyer" (secondary)
- **Who:** Home buyer evaluating a property; skeptical of rising utility costs
- **Job to be done:** Understand the energy cost profile of a home they're considering before making an offer
- **Key need:** A report they can read without expertise; upgrade ROI framed in years, not percentages

---

## 6. Scope: What We Built vs. What We Deferred

### Built (MVP)
| Feature | Rationale |
|---|---|
| No-auth, address-only entry | Eliminates the #1 drop-off point. Every account step loses ~30% of users |
| Agentic AI report generation | Claude orchestrates 5 Palmetto EI tool calls — the intelligence layer that stitches raw API data into a narrative |
| Live agent transparency panel | Shows users what the AI is doing in real time; builds trust and demonstrates the technology |
| Ranked upgrade scenarios | Solar, HVAC, water heater, insulation — sorted by annual savings, sourced from Palmetto's building models |
| Full incentive stack | Federal IRA credits + state programs + utility rebates in one place |
| Market landscape section | Contextualizes the report in the national energy market — makes the data feel current and relevant |
| Shareable report links | Enables the agent/buyer use case and creates organic distribution |

### Explicitly deferred
| Feature | Why deferred | When to revisit |
|---|---|---|
| User accounts / report history | Adds friction; not needed for core value | Phase 2, if retention becomes a metric |
| Property management (multiple homes) | Agents need this; homeowners don't | Phase 2 |
| Contractor marketplace / request quotes | High-value monetization path; requires ops infrastructure | Phase 3 |
| PDF export | Useful for agents; not core to the AI story | Phase 2 |
| Comparison mode (two addresses) | Buyer use case; complex UI | Phase 2 |
| Push notifications / report refresh | Requires auth + async infra | Phase 2 |
| White-label / API access | Enterprise channel; significant BD work | Phase 3 |

---

## 7. Feature Requirements

### F1 — Address Entry (P0)
- Mapbox Searchbox autocomplete for US residential addresses only
- Validation: must start with a street number (Palmetto EI requires a specific address, not a city)
- Error messaging if Palmetto cannot model the address
- One CTA: "Generate Energy Report" — no account gate, no email capture

**Tradeoff:** We chose Mapbox over Google Places. Mapbox has a more generous free tier for autocomplete and returns `full_address` in a format Palmetto handles cleanly. The cost of a wrong mapping is a failed API call with a confusing error — mitigated by street-number validation before submit.

### F2 — Agentic Report Generation (P0)
The AI agent (Claude claude-sonnet-4-6) calls 5 Palmetto EI tools in a deterministic sequence:

1. `get_home_baseline` — energy profile for the address
2. `get_relevant_upgrades` — which upgrades make sense for this home
3. `run_upgrade_scenario` × N — model each upgrade's savings (max 5)
4. `get_incentives` — federal/state credits by zip + upgrade type
5. `search_utility_rebates` — utility-specific programs

Claude then synthesizes all tool outputs into a structured JSON report with energy score, upgrade rankings, incentive breakdown, and market context.

**Tradeoff: MCP vs. direct API calls.** We use the Model Context Protocol (MCP) to expose Palmetto's tools to Claude rather than hardcoding API calls in the agent loop. This adds a network hop but makes the tool layer independently testable, swappable, and extensible. If Palmetto adds a new EI endpoint tomorrow, we add a tool to the MCP server without touching the agent logic.

**Tradeoff: Agentic loop vs. single structured call.** An alternative design would have Claude make one call with all the data pre-fetched and synthesized in the API route. We chose the agentic loop because (a) Claude decides which upgrades to model based on the baseline — this is a reasoning step, not just formatting; (b) it produces the tool-call trace that powers the transparency panel; (c) it's architecturally honest about how the product works.

### F3 — Agent Transparency Panel (P0)
- Real-time display of each tool call as it executes
- Shows tool name in plain English (not API names), with a human-readable summary of the result
- Animates from spinner → checkmark as each step completes
- Collapses to a "How this was built" disclosure after the report loads
- Framed as user transparency, not technical detail

**Rationale:** Energy reports from opaque "AI" tools feel untrustworthy. Showing the source of every number — "Found 14,230 kWh annual consumption from Palmetto EI" — gives users reason to believe the output. This is especially important for a no-auth product where there's no relationship capital built up.

### F4 — Report (P0)
- Energy score (0–100) and grade (A–F) with scoring methodology
- Baseline: annual cost, consumption (kWh), carbon footprint
- Breakdown chart: HVAC / water heater / plug loads / lighting / cooking
- Monthly cost chart (12 months)
- Upgrade cards: ranked by annual savings, showing upfront cost, payback years, 10-yr ROI, CO₂ reduction
- 10-year cumulative savings chart for top upgrade
- Incentive cards: federal (IRA), state, utility — separated by type

### F5 — Market Landscape Section (P1)
- 6 key market stats: US avg electricity rate, YoY rate increase, residential solar GW, heat pump growth, IRA expiry, clean grid %
- 4 AI-generated highlights contextualized to the home's state/region
- Generated by Claude from training knowledge — zero added latency, sourced from same final response pass as the report JSON

**Tradeoff: AI-generated vs. live data.** Live web search would add 10–20 seconds to an already 60–90 second generation time and introduce failure modes (search API errors, scraped content hallucinations). Claude's training data through mid-2025 is accurate enough for market context. If recency matters in a future release, a cached daily fetch is the right architecture — not real-time search per report.

### F6 — Share (P1)
- "Share" button generates a unique token and stores the report in server memory
- Token URL is immediately copyable
- Shared view is read-only (no share button, no agent panel)
- CTA on shared view: "Generate your own report" back to the landing page

**Tradeoff: In-memory vs. database.** For MVP, we store reports in a server-side `Map`. This means shares break on server restart and don't work across multiple instances. The right production solution is a database (Supabase, PlanetScale) or a KV store (Upstash Redis). We deferred this because (a) the demo context is single-instance; (b) adding a database dependency before validating share usage would be premature infrastructure.

---

## 8. Technical Architecture

```
Browser
  │
  ├─ GET /                    Landing page (Next.js, client component)
  ├─ POST /api/reports/generate  → starts background job, returns { jobId }
  ├─ GET /api/jobs/[id]          → polls job state (steps, done, reportJson)
  ├─ POST /api/reports/[id]/share → generates share token
  └─ GET /report/share/[token]   → read-only shared report

Next.js App (Railway — persistent Node.js process)
  │
  └─ report-agent.ts (agentic loop)
       │
       └─ MCP Client (SSE transport)
            │
            └─ wattprint-mcp (Railway — separate service)
                 │
                 ├─ get_home_baseline       → Palmetto EI API
                 ├─ get_relevant_upgrades   → Palmetto EI API
                 ├─ run_upgrade_scenario    → Palmetto EI API
                 ├─ get_incentives          → Palmetto EI API
                 └─ search_utility_rebates  → Palmetto EI API
```

### Key infrastructure decisions

**Railway over Vercel.** The report generation job runs for 60–90 seconds as a background process after the HTTP response is sent. Vercel's serverless model terminates the process on response — the background job would be silently killed. Railway runs a persistent Node.js process where background tasks complete normally. For a product where the core loop takes 90 seconds, serverless is the wrong deployment model.

**Polling over SSE.** We initially implemented server-sent events for real-time step updates. In Next.js development (Turbopack), SSE responses are buffered — events only arrive when the stream closes, defeating the purpose. In production, SSE works but requires careful configuration across CDN and load balancers. Polling at 1.5s intervals is simpler, more debuggable, and works identically in dev and prod. The UX impact is minimal (steps appear ~1.5s after they complete rather than immediately).

**MCP over direct tool calls.** The Palmetto EI tools live in a separate `wattprint-mcp` service rather than inlined into the Next.js app. This separation means: (a) the tool layer can be updated, versioned, and tested independently; (b) the same MCP server could serve other clients (Claude Desktop, other agents); (c) it demonstrates real-world MCP architecture rather than a toy integration.

---

## 9. Key Tradeoffs Log

| Decision | Option A (chosen) | Option B (not chosen) | Reason |
|---|---|---|---|
| Auth model | No-auth for MVP | Clerk + Supabase (had it built) | Auth = friction. The demo audience needs zero barriers. Added complexity outweighed value before product-market fit. |
| Report delivery | Async job + polling | Synchronous blocking request | 60-90s blocking requests timeout on most infra and show blank screens. Polling gives live feedback. |
| Data freshness | Claude's training knowledge for market stats | Live web search per report | Web search adds 10-20s + failure modes. Training knowledge is accurate enough for context. |
| Upgrade selection | Agent-driven (Claude picks from baseline) | Static list (always model same 5 upgrades) | Agent-driven is more accurate and demonstrates the intelligence layer. Static would be faster but produce worse reports for edge-case homes. |
| State management | In-memory Maps | Database (Supabase/Redis) | Zero infrastructure dependencies for MVP. Share links break on restart — acceptable for demo, must fix before production. |
| MCP transport | SSE (separate server) | stdio (in-process) | SSE allows the MCP server to run separately and be updated independently. stdio would require restarting the whole app to update tools. |
| Hosting | Railway (persistent) | Vercel (serverless) | Serverless kills background jobs on response. Background job is core to the architecture. |

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Palmetto EI API returns no data for an address | Medium | High | Error state with clear messaging and "try a different address" CTA. Address validation catches city-only searches. |
| Report generation > 90 seconds | Medium | Medium | Railway has no timeout. Elapsed timer keeps user informed. Worst case: user refreshes and tries again. |
| In-memory share links break on deploy | High | Low | Explicitly documented as MVP limitation. Fix: Upstash Redis KV, ~2 hours of work. |
| Claude produces malformed JSON | Low | High | Regex extraction strips markdown fences before JSON.parse. Try/catch surfaces errors cleanly. |
| Palmetto API rate limits | Unknown | High | No mitigation at MVP volume. Monitor in production; add request queuing if needed. |
| MCP server connection failure | Low | High | Error surfaces to user within 5 seconds. Root cause: MCP server down — Railway has automatic restarts. |

---

## 11. Roadmap

### Phase 1 — MVP (shipped)
- No-auth report generation via Palmetto EI API
- Agentic AI with transparency panel
- Upgrade scenarios, incentives, market landscape
- Shareable links
- Palmetto-inspired design system

### Phase 2 — Retain & Expand (next 60 days if validated)
- User accounts (email only, passwordless) — unlocks saved reports and history
- Multi-property support (agent use case)
- PDF export of report
- Persistent share links (Upstash Redis or Supabase)
- Real-time electricity rate injection (where available from utility APIs)
- Report refresh: re-run report when rates or models update

### Phase 3 — Monetize & Scale
- Pro tier: unlimited reports, agent branding, bulk address uploads
- Contractor marketplace: "Get quotes for your top upgrade" → lead generation
- White-label API: let real estate platforms embed Wattprint reports
- Integrations: Zillow, Redfin listing data pre-fill; MLS data partnership

---

## 12. Palmetto Energy Intelligence API — Evaluation

This section reflects direct experience building on `POST /api/v0/bem/calculate` — the single endpoint that powers all of Wattprint's energy data.

The following reflects direct experience as a builder on the EI API. The intent is to surface the gaps between the current v0 capability and a production-ready platform — which I believe represents the most important near-term product opportunity for the Platform team.

---

### What the API does exceptionally well

**1. Address-only input is a genuine superpower.**
No property ID lookup, no pre-registration, no building spec questionnaire. Pass a street address and get a full energy model back. For a consumer product, this is the only workable UX. Any API that requires a prior property lookup step loses most of the audience.

**2. The `variables: 'all_non_zero'` flag eliminates guesswork.**
Instead of having to enumerate every field you want, you request all non-zero variables and get a rich flat object back. This made initial exploration fast and meant we didn't miss available fields. It's the right default for a data discovery API.

**3. End-use disaggregation is rare and valuable.**
The response breaks consumption down by end-use: `consumption.electricity.heating`, `consumption.electricity.cooling`, `consumption.electricity.hot_water`, `consumption.electricity.plug_loads`, `consumption.electricity.lighting`, `consumption.electricity.cooking_range`. Most energy APIs return only total consumption. Disaggregation is what makes upgrade prioritization possible — you can't tell someone to replace their HVAC if you don't know what percentage HVAC is of their bill.

**4. Fossil fuel tracking is first-class.**
`consumption.fossil_fuel`, `costs.fossil_fuel`, `emissions.fossil_fuel` are returned alongside electric equivalents. This is critical for gas-home analysis and electrification modeling. Many energy APIs are electric-only.

**5. Emissions data is built in.**
`emissions.electricity` and `emissions.fossil_fuel` in kg CO₂ — no secondary lookup required. Clean and directly usable for carbon reporting.

**6. Monthly granularity with `group_by: 'month'` is chart-ready.**
12 monthly intervals come back cleanly and map directly to a bar chart without any post-processing. The `group_by: 'year'` alternative collapses to a single row for quick annual totals.

**7. The `interval_format: 'wide'` is machine-friendly.**
A flat key-value structure with dot-notation paths (`{"consumption.electricity.heating": 1234}`) is easy to iterate, sum, and map. Avoids deeply nested JSON traversal.

---

### Where the API has room to grow (V0 honest feedback)

**1. Scenario modeling is not actually in the API — we built it ourselves.**
The `run_upgrade_scenario` tool in Wattprint's MCP server doesn't call Palmetto. It's pure client-side math using industry-average COPs, peak sun hours, and static upgrade costs. We prepared `scenarioPayload()` in `palmetto.ts` using the `consumption.hypothetical` and `production` request parameters, but the response field mapping for scenario outputs was ambiguous enough that we fell back to our own formulas.

This is the biggest gap. The API *can* accept hypothetical scenario parameters (e.g., `heating_fuel: 'Electric'`, `heat_pump: true`, `pv_arrays`), but the response fields for scenario savings aren't documented clearly enough to trust for production without significant trial and error. A first-class `POST /scenarios/calculate` endpoint with explicit before/after cost fields would let us eliminate all our hardcoded approximations and use real building-science outputs for every home.

**2. Upgrade costs and install estimates are missing.**
`UPGRADE_COSTS` in Wattprint is a hardcoded table: `solar_5kw: $15,000`, `heat_pump_hvac: $12,000`, etc. These are national averages and will be wrong for any specific market. If the API returned ZIP-code-adjusted cost estimates — even ranges — the ROI and payback calculations would be materially more accurate. Palmetto has contractor network data that could power this.

**3. Incentive data isn't part of the API.**
Federal incentives are a hardcoded IRA lookup table we maintain ourselves. State incentives call the Rewiring America API (a separate third-party service with its own key and auth). Utility rebates are a static 7-state table we wrote manually. A unified `GET /incentives?zip={zip}&upgrades={types}` endpoint from Palmetto would eliminate three separate data sources and keep incentive data current without developer maintenance.

**4. No address validation endpoint.**
Before running a full `bem/calculate` (which takes 5–15 seconds and costs an API call), there's no cheap way to check if Palmetto has coverage for an address. Adding a lightweight `POST /addresses/validate` that returns `{supported: true/false, coverage_confidence: 'high'|'medium'|'low'}` would let us fail fast with a clear user message instead of burning a full calculation on an unsupported address.

**5. The date range is hardcoded and must be manually maintained.**
`from_datetime` and `to_datetime` are required parameters. There's no `"latest 12 months"` shorthand. In Wattprint, we hardcode `2024-01-01` to `2025-01-01` — meaning the data ages without any flag or error. An optional `period: 'trailing_12_months'` parameter would solve this entirely.

**6. Field discovery requires trial and error.**
The wide-format response is developer-friendly once you know the field names, but there's no published schema for what `variables: 'all_non_zero'` can return. Building Wattprint required running calls against known addresses and logging raw responses to discover fields like `costs.fossil_fuel`, `emissions.electricity`, and `consumption.electricity.cooking_range`. An OpenAPI spec or even a reference response object in documentation would cut integration time significantly.

**7. Utility name is not in the response.**
We know the utility from `utility_name` in the report — but that field comes from Claude's inference, not the API. The `bem/calculate` response doesn't include the serving utility. For routing customers to utility rebate programs, this is a meaningful gap. `utility_name` and `utility_id` in the baseline response would remove the need to ask the agent to guess.

**8. No property characteristics in the response.**
The model infers building specs from the address (square footage, construction year, HVAC type, insulation grade, etc.) but doesn't expose them. Showing users the model's assumptions — and letting them correct them — would increase trust and accuracy. Even a `model_inputs` object in the response with the inferred specs would be valuable.

**9. V0 means no stability guarantees.**
The endpoint is `/api/v0/bem/calculate`. V0 signals pre-production stability. Breaking changes to response field names or structure could silently break Wattprint's output (charts, scores, upgrade rankings) without any version error. A changelog, deprecation notices, or even a `/api/v1` path when the schema stabilizes would make it production-safe.

**10. No async / webhook option for long calculations.**
All calculations are synchronous and take 5–15 seconds. At scale, this means holding open HTTP connections per user. A `POST /calculations` that returns a job ID and lets you poll or webhook on completion would enable better infra design — especially for batch processing (e.g., an agent running reports on 50 listings simultaneously).

---

### Summary scorecard

| Capability | Rating | Notes |
|---|---|---|
| Address-only input | ★★★★★ | Best possible DX for consumer products |
| End-use disaggregation | ★★★★★ | Rare, essential, well-structured |
| Fossil fuel + emissions | ★★★★☆ | Complete; emissions factor transparency would add ★ |
| Monthly granularity | ★★★★★ | Chart-ready out of the box |
| Scenario modeling | ★★☆☆☆ | Parameters exist but docs + field mapping incomplete |
| Upgrade costs | ★☆☆☆☆ | Not in API; must be approximated |
| Incentive data | ★☆☆☆☆ | Not in API; requires separate integrations |
| Address validation | ★☆☆☆☆ | No lightweight pre-check available |
| Documentation / field schema | ★★☆☆☆ | Field discovery by trial and error |
| Stability / versioning | ★★☆☆☆ | V0 carries real breakage risk in production |

**Bottom line:** The Palmetto EI API's core — address-based energy modeling with end-use disaggregation — is genuinely differentiated and immediately usable. The gap is everything *around* the baseline: scenarios, costs, incentives, and validation. Closing those gaps would make it a complete platform rather than a powerful but partial primitive. For V0, the baseline quality is impressive; the path to V1 is clear.

The fastest path to defensibility is distribution partnerships — MLS integrations, title companies, mortgage lenders — which Palmetto's existing B2B network is uniquely positioned to unlock.
