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

## 12. Open Questions

1. **Accuracy disclosure** — What language should accompany upgrade cost estimates? They're industry averages, not quotes. "Estimated install cost" language is used today but may need a more explicit disclaimer.

2. **Scope of "relevant upgrades"** — The current agent models up to 5 upgrades. Are there home profiles where this misses important opportunities (e.g., EV charger for a home with an EV)?

3. **Agent loop determinism** — Claude occasionally skips a tool call or calls them out of order. The system prompt enforces sequence, but should we add explicit validation of tool call order?

4. **MCP server scaling** — The MCP server holds one SSE connection per active report. At scale, this needs connection pooling or a stateless architecture.

5. **Palmetto EI API coverage** — What % of US addresses return a valid baseline? Rural addresses, newly-built homes, and condos may have lower coverage. No data on this yet.

6. **Competitive moat** — The core report logic can be replicated by anyone with a Palmetto API key. The moat is UX, distribution, and integrations. What's the fastest path to a distribution partnership (MLS, title company, mortgage lender)?
