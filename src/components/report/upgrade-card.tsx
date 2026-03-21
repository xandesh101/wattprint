import { Badge } from '@/components/ui/badge'
import { TrendingUp, Clock, Leaf, DollarSign } from 'lucide-react'

interface UpgradeCardProps {
  rank: number
  label: string
  upgrade_type: string
  upfront_cost_usd: number
  annual_savings_usd: number
  payback_years: number | null
  roi_10yr_pct: number | null
  carbon_reduction_kg: number
  priority: 'high' | 'medium' | 'low'
}

const priorityColor: Record<string, string> = {
  high: 'bg-[#FEF4F2] text-primary border-primary/25',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-[#F8F8F8] text-[#1F2723]/60 border-[#DDDDDD]',
}

const upgradeCategory: Record<string, string> = {
  solar_5kw: 'Solar',
  solar_10kw: 'Solar',
  solar_plus_battery: 'Solar + Storage',
  heat_pump_hvac: 'HVAC',
  heat_pump_water_heater: 'Water Heating',
  insulation: 'Efficiency',
  ev_charger: 'EV',
}

export function UpgradeCard({
  rank, label, upgrade_type, upfront_cost_usd,
  annual_savings_usd, payback_years, roi_10yr_pct,
  carbon_reduction_kg, priority,
}: UpgradeCardProps) {
  const roiBarWidth = roi_10yr_pct != null
    ? Math.min(Math.max(roi_10yr_pct, 0), 200) / 200 * 100
    : 0

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
            {rank}
          </div>
          <div>
            <p className="font-semibold text-sm">{label}</p>
            <p className="text-xs text-muted-foreground">{upgradeCategory[upgrade_type] ?? upgrade_type}</p>
          </div>
        </div>
        <Badge variant="outline" className={`text-xs shrink-0 ${priorityColor[priority]}`}>
          {priority}
        </Badge>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> Annual savings
          </p>
          <p className="text-lg font-bold text-primary">
            ${annual_savings_usd.toLocaleString()}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> Payback
          </p>
          <p className="text-lg font-bold">
            {payback_years != null ? `${payback_years} yrs` : 'N/A'}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> 10-yr ROI
          </p>
          <p className="text-lg font-bold">
            {roi_10yr_pct != null ? `${roi_10yr_pct}%` : 'N/A'}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Leaf className="w-3 h-3" /> CO₂ saved
          </p>
          <p className="text-lg font-bold">
            {carbon_reduction_kg > 0
              ? `${(carbon_reduction_kg / 1000).toFixed(1)}t`
              : '—'}
          </p>
        </div>
      </div>

      {/* ROI bar */}
      {roi_10yr_pct != null && roi_10yr_pct > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>10-yr ROI</span>
            <span>{roi_10yr_pct}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${roiBarWidth}%` }}
            />
          </div>
        </div>
      )}

      {/* Install cost */}
      <p className="text-xs text-muted-foreground">
        Est. install cost: <span className="font-medium text-foreground">${upfront_cost_usd.toLocaleString()}</span>
      </p>
    </div>
  )
}
