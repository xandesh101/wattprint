import Anthropic from '@anthropic-ai/sdk'
import { createMcpClient } from './mcp-client'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface AgentStep {
  tool: string
  status: 'calling' | 'done'
  label: string
  summary?: string
}

const TOOL_LABELS: Record<string, string> = {
  get_home_baseline: 'Analyzing home energy profile',
  get_relevant_upgrades: 'Identifying upgrade opportunities',
  run_upgrade_scenario: 'Modeling upgrade scenario',
  get_incentives: 'Fetching available incentives',
  search_utility_rebates: 'Searching utility rebate programs',
  web_search: 'Fetching live market data',
}

function getToolLabel(name: string, input: Record<string, unknown>): string {
  if (name === 'run_upgrade_scenario' && input.upgrade_type) {
    const labels: Record<string, string> = {
      solar_5kw: 'Rooftop Solar (5kW)',
      solar_10kw: 'Rooftop Solar (10kW)',
      solar_plus_battery: 'Solar + Battery',
      heat_pump_hvac: 'Heat Pump HVAC',
      heat_pump_water_heater: 'Heat Pump Water Heater',
      insulation: 'Insulation & Air Sealing',
      ev_charger: 'EV Charger (Level 2)',
    }
    const type = String(input.upgrade_type)
    return `Modeling scenario: ${labels[type] ?? type}`
  }
  return TOOL_LABELS[name] ?? name
}

function extractSummary(toolName: string, result: string): string {
  try {
    const data = JSON.parse(result)
    if (toolName === 'get_home_baseline') {
      const kwh = data.annual_consumption_kwh ?? data.annual_kwh
      const cost = data.annual_cost_usd ?? (data.annual_cost_electricity_usd != null
        ? (data.annual_cost_electricity_usd + (data.annual_cost_gas_usd ?? 0))
        : null)
      if (kwh && cost) return `${Math.round(kwh).toLocaleString()} kWh/yr · $${Math.round(cost).toLocaleString()}/yr`
      if (kwh) return `${Math.round(kwh).toLocaleString()} kWh annual consumption`
    }
    if (toolName === 'get_relevant_upgrades') {
      const count = Array.isArray(data) ? data.length : (data.upgrades?.length ?? '?')
      return `${count} upgrade opportunities identified`
    }
    if (toolName === 'run_upgrade_scenario') {
      const savings = data.annual_savings_usd ?? data.savings_usd
      if (savings != null) return `Saves $${Math.round(savings).toLocaleString()}/year`
    }
    if (toolName === 'get_incentives') {
      const federal = data.federal?.length ?? 0
      const state = data.state?.length ?? 0
      return `${federal} federal · ${state} state incentives found`
    }
    if (toolName === 'search_utility_rebates') {
      const count = Array.isArray(data) ? data.length : (data.rebates?.length ?? 0)
      return `${count} utility rebate program${count !== 1 ? 's' : ''} found`
    }
  } catch {
    // result wasn't JSON — that's fine
  }
  if (toolName === 'web_search') return 'Live market data retrieved'
  return 'Complete'
}

const SYSTEM_PROMPT = `You are Wattprint's energy intelligence agent. Your job is to analyze a home's energy profile and generate a detailed Home Energy Intelligence Report.

You have tools available. Use them in this exact order:
1. get_home_baseline — ALWAYS call this first with the address
2. get_relevant_upgrades — call immediately after baseline, pass baseline result as JSON string
3. run_upgrade_scenario — call once per upgrade from step 2 (max 5 calls). Pass: address (exact same address as baseline), annual_cost_electricity_usd (from baseline), annual_cost_gas_usd (from baseline), annual_emissions_kg (use annual_emissions_kg_co2 from baseline), electricity_rate_per_kwh (from baseline)
4. get_incentives — call once after all scenarios, with zip code and comma-separated upgrade types
5. search_utility_rebates — call once with state, utility name, and upgrade types
6. web_search — run exactly 2 searches to get CURRENT market statistics for the market_landscape section:
   - Search 1: "US average residential electricity rate cents per kWh 2025"
   - Search 2: "US residential solar installations gigawatts 2024 2025 heat pump sales growth"
   Use the numbers you find in these searches — NOT your training data — for all numeric fields in market_landscape.

After all tool calls are complete, generate a structured JSON report with this exact shape:
{
  "energy_score": <0-100 integer>,
  "energy_grade": <"A"|"B"|"C"|"D"|"F">,
  "summary": "<2-3 sentence plain English summary>",
  "baseline": {
    "annual_cost_usd": <number>,
    "annual_consumption_kwh": <number>,
    "annual_emissions_kg": <number>,
    "monthly_costs": [<12 numbers>],
    "breakdown_pct": { "hvac": <n>, "water_heater": <n>, "plug_loads": <n>, "lighting": <n>, "cooking": <n> }
  },
  "upgrades": [
    {
      "rank": <1,2,3...>,
      "upgrade_type": "<type>",
      "label": "<human readable name>",
      "upfront_cost_usd": <number>,
      "annual_savings_usd": <number>,
      "payback_years": <number|null>,
      "roi_10yr_pct": <number|null>,
      "carbon_reduction_kg": <number>,
      "priority": "<high|medium|low>"
    }
  ],
  "incentives": {
    "federal": [{ "upgrade_type": "<type>", "name": "<name>", "amount": "<amount>", "type": "<type>" }],
    "state": [{ "upgrade_type": "<type>", "name": "<name>", "amount": "<amount>", "authority": "<authority>", "url": "<url>" }]
  },
  "utility_rebates": [{ "program": "<name>", "amount": "<amount>", "upgrade_types": ["<type>"] }],
  "utility_name": "<utility name>",
  "state": "<2-letter state>",
  "zip_code": "<zip>",
  "market_landscape": {
    "avg_us_electricity_rate_kwh": <current national average in USD from your web search — do not guess>,
    "yoy_rate_increase_pct": <annual electricity rate increase % from your web search>,
    "residential_solar_gw_installed": <cumulative US residential solar GW installed from your web search>,
    "heat_pump_sales_growth_pct": <recent annual growth % in US heat pump sales from your web search>,
    "ira_credit_expiry": "2032",
    "us_grid_clean_pct": <approximate % of US electricity from clean sources from your web search>,
    "highlights": [
      "<cite a specific stat with source from your web search about US electricity rates or solar>",
      "<factual stat relevant to this home's state from your web search or known regional data>",
      "<factual stat about home upgrade ROI or payback trends from your web search>",
      "<factual stat about carbon or emissions from US residential sector>"
    ]
  }
}

Energy score calculation:
- Start at 100
- Subtract 15 if annual cost > $3000
- Subtract 10 if annual cost > $2000
- Subtract 20 if home uses fossil fuel heating
- Subtract 10 if HVAC > 45% of usage
- Subtract 5 if emissions > 5000 kg CO2/year
- Grade: 85-100=A, 70-84=B, 55-69=C, 40-54=D, <40=F

Rank upgrades by annual_savings_usd descending. Label them clearly:
- solar_5kw → "Rooftop Solar (5kW)"
- solar_10kw → "Rooftop Solar (10kW)"
- heat_pump_hvac → "Heat Pump HVAC"
- heat_pump_water_heater → "Heat Pump Water Heater"
- solar_plus_battery → "Solar + Battery Storage"
- insulation → "Insulation & Air Sealing"
- ev_charger → "EV Charger (Level 2)"

Return ONLY the JSON object. No markdown, no explanation.`

export interface ReportResult {
  reportJson: string
  energyScore: number
  energyGrade: string
}

export async function generateReport(
  address: string,
  onStep?: (step: AgentStep) => void
): Promise<ReportResult> {
  onStep?.({ tool: 'init', status: 'calling', label: 'Connecting to energy data APIs' })
  const mcpClient = await createMcpClient()
  onStep?.({ tool: 'init', status: 'done', label: 'Connecting to energy data APIs', summary: 'Palmetto Energy Intelligence API ready' })

  try {
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: `Generate a Home Energy Intelligence Report for: ${address}` },
    ]

    while (true) {
      const response = await anthropic.messages.create(
        {
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          tools: [
            ...mcpClient.tools.map(t => ({
              name: t.name,
              description: t.description,
              input_schema: t.input_schema,
            })),
            {
              type: 'web_search_20250305' as const,
              name: 'web_search',
              max_uses: 3,
            },
          ],
          messages,
        },
        { headers: { 'anthropic-beta': 'web-search-2025-03-05' } }
      )

      messages.push({ role: 'assistant', content: response.content })

      if (response.stop_reason === 'end_turn') {
        const textBlock = response.content.find(b => b.type === 'text')
        if (!textBlock || textBlock.type !== 'text') {
          throw new Error('No text in final response')
        }

        let reportJson = textBlock.text.trim()

        const fenceMatch = reportJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
        if (fenceMatch) {
          reportJson = fenceMatch[1].trim()
        } else {
          const jsonMatch = reportJson.match(/\{[\s\S]*\}/)
          if (jsonMatch) reportJson = jsonMatch[0]
        }

        const parsed = JSON.parse(reportJson)

        return {
          reportJson,
          energyScore: parsed.energy_score,
          energyGrade: parsed.energy_grade,
        }
      }

      if (response.stop_reason === 'tool_use') {
        const toolResults: Anthropic.ToolResultBlockParam[] = []

        for (const block of response.content) {
          if (block.type !== 'tool_use') continue

          // web_search is executed server-side by Anthropic — skip client dispatch
          if (block.name === 'web_search') continue

          const input = block.input as Record<string, unknown>
          const label = getToolLabel(block.name, input)

          onStep?.({ tool: block.name, status: 'calling', label })

          const result = await mcpClient.callTool(block.name, input)

          onStep?.({
            tool: block.name,
            status: 'done',
            label,
            summary: extractSummary(block.name, result),
          })

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result,
          })
        }

        // Only push tool results if there are client-side tools to report back
        // (web_search results are handled server-side and don't appear here)
        if (toolResults.length > 0) {
          messages.push({ role: 'user', content: toolResults })
        }
      }
    }
  } finally {
    await mcpClient.close()
  }
}
