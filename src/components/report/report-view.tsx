'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { EnergyScore } from './energy-score'
import { BreakdownChart } from './breakdown-chart'
import { MonthlyCostChart } from './monthly-cost-chart'
import { SavingsChart } from './savings-chart'
import { UpgradeCard } from './upgrade-card'
import { MarketLandscape } from './market-landscape'
import { MapPin, Zap, DollarSign, Leaf, Share2, Check } from 'lucide-react'

interface ParsedReport {
  energy_score: number
  energy_grade: string
  summary: string
  baseline: {
    annual_cost_usd: number
    annual_consumption_kwh: number
    annual_emissions_kg: number
    monthly_costs: number[]
    breakdown_pct: {
      hvac: number
      water_heater: number
      plug_loads: number
      lighting: number
      cooking: number
    }
  }
  upgrades: Array<{
    rank: number
    upgrade_type: string
    label: string
    upfront_cost_usd: number
    annual_savings_usd: number
    payback_years: number | null
    roi_10yr_pct: number | null
    carbon_reduction_kg: number
    priority: 'high' | 'medium' | 'low'
  }>
  incentives: {
    federal: Array<{ upgrade_type: string; name: string; amount: string; type: string }>
    state: Array<{ upgrade_type: string; name: string; amount: string; authority: string; url: string }>
  }
  utility_rebates: Array<{ program: string; amount: string; upgrade_types: string[] }>
  utility_name: string
  state: string
  zip_code: string
  market_landscape?: {
    avg_us_electricity_rate_kwh: number
    yoy_rate_increase_pct: number
    residential_solar_gw_installed: number
    heat_pump_sales_growth_pct: number
    ira_credit_expiry: string
    us_grid_clean_pct: number
    highlights: string[]
  }
  [key: string]: unknown
}

interface ReportViewProps {
  reportId: string
  address: string
  parsed: ParsedReport
  energyScore: number
  energyGrade: string
  /** For shared read-only views — hides share button */
  readOnly?: boolean
}

export function ReportView({
  reportId, address, parsed, energyScore, energyGrade, readOnly = false,
}: ReportViewProps) {
  const [sharing, setSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareToken, setShareToken] = useState<string | null>(null)

  const topUpgrade = parsed.upgrades[0]

  async function handleShare() {
    if (shareToken) {
      copyLink(shareToken)
      return
    }
    setSharing(true)
    try {
      const res = await fetch(`/api/reports/${reportId}/share`, { method: 'POST' })
      const data = await res.json()
      setShareToken(data.shareToken)
      copyLink(data.shareToken)
    } finally {
      setSharing(false)
    }
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${window.location.origin}/report/share/${token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium tracking-widest text-primary uppercase">
            <Zap className="w-3.5 h-3.5" />
            Home Energy Intelligence Report
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{address}</h1>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            {parsed.utility_name && <span>{parsed.utility_name} · </span>}
            <span>{parsed.state} {parsed.zip_code}</span>
          </div>
        </div>

        {!readOnly && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={sharing}
            className="shrink-0"
          >
            {copied
              ? <><Check className="w-4 h-4 mr-1.5 text-primary" /> Copied</>
              : sharing
              ? <><Share2 className="w-4 h-4 mr-1.5 animate-pulse" /> Sharing…</>
              : <><Share2 className="w-4 h-4 mr-1.5" /> Share</>
            }
          </Button>
        )}
      </div>

      {/* Score + Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <EnergyScore score={energyScore} grade={energyGrade} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" /> Annual Energy Cost
            </p>
            <p className="text-2xl font-bold">${parsed.baseline.annual_cost_usd.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              ${Math.round(parsed.baseline.annual_cost_usd / 12)}/mo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Annual Consumption
            </p>
            <p className="text-2xl font-bold">
              {parsed.baseline.annual_consumption_kwh.toLocaleString()} kWh
            </p>
            <p className="text-xs text-muted-foreground">
              {parsed.utility_name || 'Local utility'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5" /> Carbon Footprint
            </p>
            <p className="text-2xl font-bold">
              {(parsed.baseline.annual_emissions_kg / 1000).toFixed(1)} tCO₂e
            </p>
            <p className="text-xs text-muted-foreground">Annual greenhouse gas</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider uppercase">
              Electricity Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownChart breakdown={parsed.baseline.breakdown_pct} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider uppercase">
              Monthly Costs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyCostChart
              currentCosts={parsed.baseline.monthly_costs}
              bestUpgradeLabel={topUpgrade?.label}
            />
          </CardContent>
        </Card>
      </div>

      {/* AI Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                What the AI found
              </p>
              <p className="text-sm leading-relaxed">{parsed.summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrades */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Top Upgrade Opportunities</h2>
          <Badge variant="secondary" className="text-xs">Ranked by annual savings</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parsed.upgrades.map(upgrade => (
            <UpgradeCard key={upgrade.upgrade_type} {...upgrade} />
          ))}
        </div>
      </div>

      {/* 10-Year savings chart */}
      {topUpgrade && topUpgrade.annual_savings_usd > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider uppercase">
              10-Year Cumulative Savings — {topUpgrade.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SavingsChart
              annualSavings={topUpgrade.annual_savings_usd}
              upfrontCost={topUpgrade.upfront_cost_usd}
            />
          </CardContent>
        </Card>
      )}

      {/* Incentives */}
      {(parsed.incentives.federal.length > 0 || parsed.incentives.state.length > 0 || parsed.utility_rebates?.length > 0) && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Available Incentives</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {parsed.incentives.federal.map((inc, i) => (
              <Card key={i} className="border-emerald-200 bg-emerald-50/50">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant="outline" className="text-xs mb-1.5 border-emerald-300 text-emerald-700 bg-emerald-50">
                        Federal
                      </Badge>
                      <p className="text-sm font-medium">{inc.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{inc.upgrade_type.replace(/_/g, ' ')}</p>
                    </div>
                    <p className="text-sm font-bold text-primary shrink-0">{inc.amount}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {parsed.incentives.state.map((inc, i) => (
              <Card key={i}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant="outline" className="text-xs mb-1.5">State</Badge>
                      <p className="text-sm font-medium">{inc.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{inc.authority}</p>
                    </div>
                    <p className="text-sm font-bold text-primary shrink-0">{inc.amount}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {parsed.utility_rebates?.map((rebate, i) => (
              <Card key={i}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant="outline" className="text-xs mb-1.5">Utility</Badge>
                      <p className="text-sm font-medium">{rebate.program}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{parsed.utility_name}</p>
                    </div>
                    <p className="text-sm font-bold text-primary shrink-0">{rebate.amount}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Market Landscape */}
      {parsed.market_landscape && (
        <MarketLandscape data={parsed.market_landscape} />
      )}

      <Separator />

      <p className="text-xs text-muted-foreground text-center pb-4">
        Powered by Palmetto Energy Intelligence API. Data modeled from property records and local utility rates. Upgrade costs are industry averages.
      </p>
    </div>
  )
}
