'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, Circle, ChevronDown, ChevronUp, Bot } from 'lucide-react'
import type { AgentStep } from '@/lib/report-agent'

interface AgentPanelProps {
  steps: AgentStep[]
  isDone: boolean
  collapsed?: boolean
}

// Per-tool technical metadata surfaced for hiring / technical reviewers
const STEP_TECH: Record<string, { tool: string; api: string; detail: string }> = {
  init: {
    tool: 'McpClient.connect()',
    api: 'SSE transport',
    detail: 'Opens a persistent Server-Sent Events connection to the wattprint-mcp Node.js server, then calls tools/list to discover available MCP tools.',
  },
  get_home_baseline: {
    tool: 'get_home_baseline',
    api: 'Palmetto EI → POST /api/v0/bem/calculate',
    detail: 'Claude calls this MCP tool first — always. It fetches 12 monthly intervals with variables: "all_non_zero", returning electricity & fossil fuel consumption, costs, emissions, and end-use disaggregation (heating, cooling, hot water, plug loads, lighting, cooking).',
  },
  get_relevant_upgrades: {
    tool: 'get_relevant_upgrades',
    api: 'Local reasoning — no external API',
    detail: 'Claude passes the baseline JSON to this tool, which applies rule-based logic (consumption thresholds, fossil fuel presence, HVAC %) to return a prioritised list of upgrades. This is the reasoning step that prevents wasting API calls on irrelevant scenarios.',
  },
  run_upgrade_scenario: {
    tool: 'run_upgrade_scenario',
    api: 'Palmetto EI → POST /api/v0/bem/calculate (with hypothetical params)',
    detail: 'For each upgrade, Claude calls this tool with the address + upgrade type. The tool builds a scenario payload — e.g. production.panel_arrays for solar, consumption.hypothetical.hvac_heat_pump for heat pumps — calls Palmetto, then diffs the scenario costs against baseline to compute real savings.',
  },
  get_incentives: {
    tool: 'get_incentives',
    api: 'Rewiring America API + IRA hardcoded table',
    detail: 'Fetches federal IRA credits from a hardcoded lookup (stable through 2032) and state incentives from the Rewiring America calculator API, filtered by ZIP code and matched to the upgrade types Claude modelled.',
  },
  search_utility_rebates: {
    tool: 'search_utility_rebates',
    api: 'State rebate database',
    detail: 'Looks up utility-specific rebate programs by state. Claude infers the utility name from the address context and passes it along with the modelled upgrade types.',
  },
}

export function AgentPanel({ steps, isDone, collapsed = false }: AgentPanelProps) {
  const [open, setOpen] = useState(!collapsed)
  const [techOpen, setTechOpen] = useState(false)

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors text-left"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <Bot className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {isDone ? 'How Wattprint AI built this report' : 'Wattprint AI is working…'}
            </p>
            {isDone && (
              <p className="text-xs text-muted-foreground">
                {steps.filter(s => s.status === 'done').length} data sources · Claude claude-sonnet-4-6 · MCP agentic loop. Click to expand.
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isDone && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border divide-y divide-border/50">
          {/* Steps */}
          <div className="px-4 py-1">
            {steps.length === 0 && (
              <div className="flex items-center gap-2 py-2.5">
                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
                <p className="text-sm text-muted-foreground">Connecting to Palmetto Energy Intelligence…</p>
              </div>
            )}

            {steps.map((step, i) => {
              const isActive = step.status === 'calling'
              const isDoneStep = step.status === 'done'
              const tech = STEP_TECH[step.tool]
              return (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
                  <div className="mt-0.5 shrink-0">
                    {isDoneStep
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      : isActive
                      ? <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      : <Circle className="w-4 h-4 text-muted-foreground/40" />
                    }
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <p className={`text-sm font-medium ${isActive || isDoneStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.label}
                    </p>
                    {step.summary && (
                      <p className="text-xs text-muted-foreground">{step.summary}</p>
                    )}
                    {tech && isDoneStep && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="font-mono text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                          {tech.tool}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">→</span>
                        <span className="text-[10px] text-muted-foreground/80">{tech.api}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {!isDone && steps.length > 0 && (
              <p className="text-xs text-muted-foreground italic py-2">
                Working through the Palmetto Energy Intelligence API now...
              </p>
            )}
          </div>

          {/* Technical architecture — shown when done */}
          {isDone && (
            <div className="px-4 py-3 bg-muted/30">
              <button
                className="flex items-center justify-between w-full text-left"
                onClick={() => setTechOpen(v => !v)}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Report complete · All energy data from Palmetto EI API
                  </p>
                </div>
                <span className="text-[10px] text-primary font-medium ml-3 shrink-0">
                  {techOpen ? 'Hide' : 'Technical details ↓'}
                </span>
              </button>

              {techOpen && (
                <div className="mt-4 space-y-4">
                  {/* Stack */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Stack</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { label: 'AI Model', value: 'Claude Sonnet 4.6' },
                        { label: 'Tool Protocol', value: 'MCP over SSE' },
                        { label: 'MCP Server', value: 'Node.js + Express' },
                        { label: 'Energy API', value: 'Palmetto EI v0' },
                      ].map(item => (
                        <div key={item.label} className="bg-background border border-border rounded-lg px-3 py-2">
                          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{item.label}</p>
                          <p className="text-xs font-semibold mt-0.5">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Architecture flow */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Agentic Architecture</p>
                    <pre className="text-[10px] leading-5 font-mono text-muted-foreground bg-background border border-border rounded-lg px-4 py-3 overflow-x-auto whitespace-pre">
{`Claude Sonnet 4.6  (agentic tool-use loop — Claude decides which tools to call and in what order)
  │
  └─ MCP Client  (SSE transport over HTTP → wattprint-mcp service)
       │
       ├─ get_home_baseline        → Palmetto EI  POST /api/v0/bem/calculate
       │                              variables: all_non_zero · group_by: month
       │
       ├─ get_relevant_upgrades    → Local rule engine  (no API — Claude reasons over baseline)
       │
       ├─ run_upgrade_scenario ×N  → Palmetto EI  POST /api/v0/bem/calculate
       │     solar                    production.panel_arrays: [{capacity: 5|10, tilt: 20}]
       │     heat pump HVAC           consumption.hypothetical: {hvac_heat_pump: true, efficiency: 3.5}
       │     heat pump water heater   consumption.hypothetical: {water_heater_type: "heat_pump"}
       │     insulation               consumption.hypothetical: {ceiling_insulation: 49}
       │                              → baseline cost − scenario cost = real savings delta
       │
       ├─ get_incentives           → Rewiring America API  (state) + IRA table  (federal)
       │
       └─ search_utility_rebates   → State rebate database

Claude then synthesises all tool outputs into a structured JSON report in one final pass.`}
                    </pre>
                  </div>

                  {/* Why MCP */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Why MCP</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      The Palmetto tools live in a separate <span className="font-mono bg-muted px-1 rounded">wattprint-mcp</span> service rather than inlined into the Next.js app.
                      This means the tool layer can be updated, versioned, and tested independently — and the same MCP server
                      could serve Claude Desktop, other agents, or future clients without touching the report generation logic.
                      Claude uses the MCP tool schemas to decide autonomously which upgrades are worth modelling for each home,
                      rather than always running a fixed set of scenarios.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
