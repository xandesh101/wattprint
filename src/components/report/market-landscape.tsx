import { TrendingUp, Zap, Sun, Thermometer, Leaf, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MarketLandscape {
  avg_us_electricity_rate_kwh: number
  yoy_rate_increase_pct: number
  residential_solar_gw_installed: number
  heat_pump_sales_growth_pct: number
  ira_credit_expiry: string
  us_grid_clean_pct: number
  highlights: string[]
}

interface MarketLandscapeProps {
  data: MarketLandscape
}

const stats = (d: MarketLandscape) => [
  {
    icon: Zap,
    label: 'Avg US electricity rate',
    value: `$${d.avg_us_electricity_rate_kwh.toFixed(2)}/kWh`,
    sub: `+${d.yoy_rate_increase_pct}% per year`,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    icon: Sun,
    label: 'Residential solar installed',
    value: `${d.residential_solar_gw_installed} GW`,
    sub: 'Cumulative US capacity',
    color: 'text-yellow-500',
    bg: 'bg-yellow-50',
  },
  {
    icon: Thermometer,
    label: 'Heat pump sales growth',
    value: `+${d.heat_pump_sales_growth_pct}%`,
    sub: 'Annual growth in US',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    icon: Leaf,
    label: 'Clean grid electricity',
    value: `${d.us_grid_clean_pct}%`,
    sub: 'of US generation',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
  },
  {
    icon: Calendar,
    label: 'IRA tax credits active',
    value: `Through ${d.ira_credit_expiry}`,
    sub: 'Federal incentive window',
    color: 'text-violet-500',
    bg: 'bg-violet-50',
  },
  {
    icon: TrendingUp,
    label: 'Rate trend',
    value: `${d.yoy_rate_increase_pct}% / yr`,
    sub: 'Why upgrades pay off',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
  },
]

export function MarketLandscape({ data }: MarketLandscapeProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Residential Energy Market Landscape</h2>
        <span className="text-xs text-muted-foreground">US market · 2025–2026</span>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stats(data).map(({ icon: Icon, label, value, sub, color, bg }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-bold leading-tight">{value}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Highlights */}
      {data.highlights?.length > 0 && (
        <Card className="border-primary/10 bg-primary/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Market Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ul className="space-y-2">
              {data.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
