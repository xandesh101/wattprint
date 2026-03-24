# Builder Notes — Wattprint

These are the decisions I made while building this, the tradeoffs I consciously accepted, and what I learned along the way. Written as a reflection rather than a spec.

---

## What I was trying to do

I wanted to explore how far you could push the Palmetto Energy Intelligence API with an agentic AI layer on top. The question I started with was: can you turn a raw energy modeling API into something a homeowner would actually find useful, without asking them for anything other than an address? The answer turned out to be yes, with some honest caveats about data accuracy that I'll get to.

---

## Decisions I made

**No authentication.** The instinct when building anything with user data is to add accounts from the start. I pushed against that here. Every step in an onboarding flow loses roughly 30% of users, and for a demo the goal was to prove the concept end to end with zero friction. Clerk and Supabase are wired into the project and ready to go when that changes, but they're off for now.

**Agentic loop over a single structured API call.** An alternative design would be to pre-fetch everything server-side and hand it all to Claude in one go. I chose the agentic loop instead because Claude actually needs to reason over the baseline to decide which upgrades are worth modeling, it's not just formatting. A home with gas heating gets different upgrade recommendations than an all-electric home. That reasoning step is genuine and the loop is the honest way to implement it.

**MCP in a separate service.** The Palmetto tools live in a dedicated Node.js MCP server rather than inlined into the Next.js app. This added a network hop but means the tool layer can be updated, versioned, and tested independently. The same MCP server could serve Claude Desktop or other agents without touching the report generation logic. For a project meant to demonstrate real MCP architecture it felt important to do it properly rather than take the shortcut.

**Railway over Vercel.** Report generation takes 60 to 90 seconds as a background job. Vercel's serverless model would silently kill the process on HTTP response. Railway runs a persistent Node.js process and the background job completes normally. Serverless is the wrong deployment model when your core loop takes 90 seconds.

**Polling over server-sent events.** I started with SSE for real-time step updates. In Next.js development with Turbopack, SSE responses buffer until the stream closes, which defeats the purpose entirely. Polling at 1.5 second intervals is less elegant but it works identically in dev and prod, it's debuggable, and the UX difference is imperceptible at this latency.

**In-memory storage for the demo.** Reports and share tokens live in a server-side Map. They break on restart and don't survive a redeploy. I made this call deliberately to avoid adding a database dependency before validating whether sharing was even used. The production fix is straightforward — Upstash Redis KV, a couple of hours of work.

---

## Tradeoffs I accepted

**Scenario savings accuracy.** This is the biggest one. The upgrade savings numbers come from two Palmetto API calls — one baseline, one with hypothetical parameters applied — and the savings figure is the cost delta between them. But without the homeowner's real utility bills anchoring the model, the underlying baseline is a probabilistic estimate built from public records. The relative rankings (solar saves more than insulation for this home) tend to hold even when absolute dollar figures drift. But I would not want someone making a $28,000 solar decision off these numbers without running real consumption data through the calibration step first.

**Claude's training knowledge for market context.** The market landscape section (electricity rate trends, solar GW installed, heat pump adoption) comes from Claude's training data rather than a live API call. Adding real-time web search would push generation time past two minutes and introduce new failure modes. Claude's knowledge through mid-2025 is accurate enough for market context. If recency mattered more I'd cache a daily fetch rather than hit the web per report.

**Hardcoded install costs.** Upgrade costs (solar, heat pump, insulation) are national averages from my own research. They will be wrong for specific markets. The right answer is ZIP-adjusted cost data from a contractor network. I didn't have access to that so I used averages and flagged them clearly in the UI.

---

## What I learned about the Palmetto EI API

Building against the EI API for the first time was genuinely interesting. A few things stood out.

**Address-only input is a real differentiator.** Most energy APIs require some kind of property ID lookup or prior registration. Palmetto just takes a street address and returns a full energy model. For a consumer product this is the only workable UX — any API that requires a property lookup step first loses the audience before they see any value.

**End-use disaggregation is rare and valuable.** Getting back separate figures for heating, cooling, hot water, plug loads, lighting, and cooking from just an address is genuinely unusual. Most APIs return total consumption and leave you to guess at the breakdown. The disaggregation is what makes upgrade prioritisation possible — you can't tell someone their HVAC is their biggest opportunity without knowing what percentage of their bill it represents.

**The hypothetical scenario parameters are there but need better documentation.** The API accepts `consumption.hypothetical` parameters for what-if modeling — things like `hvac_heat_pump: true` or `production.panel_arrays` for solar. These are exactly what you need to model upgrade savings properly. In practice the parameter names and which fields they affect in the response took significant trial and error to discover. There's no published list of supported hypothetical keys, and if you pass an unrecognised parameter the API returns baseline costs silently — no error, no indication anything was ignored. A documented schema of supported hypothetical inputs, or even an error on unrecognised keys, would cut integration time for builders substantially.

**The wide format response is a good call.** Getting back a flat key-value object with dot-notation paths (`consumption.electricity.heating: 1234`) is easy to work with. It's much cleaner than deeply nested JSON for a data-heavy response like this.

**A trailing-12-months shorthand would go a long way.** The required `from_datetime` and `to_datetime` parameters mean the hardcoded date range in the codebase quietly ages. Adding an optional `period: trailing_12_months` parameter would be a small change that eliminates an entire category of stale-data bugs.

**Utility name not being in the response is a gap.** The API knows which utility serves a given address — it uses that information to model electricity rates. But it doesn't surface the utility name in the response. I ended up having Claude infer the utility name from context, which works but feels like the wrong place for that logic. Including `utility_name` and `utility_id` in the baseline response would make routing users to utility rebate programs much cleaner.

---

## What I'd do differently with more time

Add a short calibration step before the report runs. Even one month of real kWh usage from a utility bill would let Palmetto recalibrate the digital twin around actual consumption rather than a probabilistic estimate. The API supports this via `consumption.actuals` and it would materially improve the accuracy of every number in the report.

Validate the scenario hypothetical parameters properly. Right now if a parameter name is wrong the API returns baseline costs and the savings figure comes out as zero. I'd want to run a test suite against known addresses to confirm which hypothetical keys Palmetto actually applies before showing savings numbers to users.

Persist reports to a database. The in-memory approach was fine for the demo but share links breaking on deploy is not acceptable in production.

---
