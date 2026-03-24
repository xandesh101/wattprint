'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'

interface Upgrade {
  label: string
  annual_savings_usd: number
  upfront_cost_usd: number
  rank: number
}

interface SavingsChartProps {
  upgrades: Upgrade[]
}

// Top upgrade = green. Others use distinct warm-to-cool gradient so lines are easy to tell apart.
const LINE_COLORS = ['#22c55e', '#f59e0b', '#3b82f6', '#a855f7']

export function SavingsChart({ upgrades }: SavingsChartProps) {
  const visible = upgrades.filter(u => u.annual_savings_usd > 0)

  const data = Array.from({ length: 16 }, (_, year) => {
    const point: Record<string, number | string> = { year: `Yr ${year}` }
    visible.forEach(u => {
      point[u.label] = +(u.annual_savings_usd * year - u.upfront_cost_usd).toFixed(0)
    })
    return point
  })

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="year"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(v, name) => [`$${Number(v).toLocaleString()}`, name]}
          contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }}
        />
        <Legend
          wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
          formatter={(value, entry) => (
            <span style={{ color: entry.color, fontWeight: entry.color === '#22c55e' ? 600 : 400 }}>
              {value}{entry.color === '#22c55e' ? ' ★' : ''}
            </span>
          )}
        />
        <ReferenceLine
          x="Yr 10"
          stroke="#1F2723"
          strokeWidth={1}
          strokeDasharray="4 3"
          strokeOpacity={0.35}
          label={{ value: '10 yr', position: 'top', fontSize: 10, fill: '#1F2723', opacity: 0.5 }}
        />
        {visible.map((u, i) => (
          <Line
            key={u.label}
            type="monotone"
            dataKey={u.label}
            stroke={LINE_COLORS[i] ?? '#d4d4d8'}
            strokeWidth={i === 0 ? 2.5 : 1.5}
            dot={false}
            activeDot={{ r: 4, fill: LINE_COLORS[i] ?? '#d4d4d8' }}
            strokeOpacity={i === 0 ? 1 : 0.6}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
