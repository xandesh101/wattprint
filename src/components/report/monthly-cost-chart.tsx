'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface MonthlyCostChartProps {
  currentCosts: number[]
  bestUpgradeLabel?: string
  bestUpgradeCosts?: number[]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function MonthlyCostChart({ currentCosts, bestUpgradeLabel, bestUpgradeCosts }: MonthlyCostChartProps) {
  const data = MONTHS.map((month, i) => ({
    month,
    Current: +(currentCosts[i] ?? 0).toFixed(0),
    ...(bestUpgradeCosts ? { [bestUpgradeLabel ?? 'Upgraded']: +(bestUpgradeCosts[i] ?? 0).toFixed(0) } : {}),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `$${v}`}
        />
        <Tooltip
          formatter={(v) => [`$${v}`, '']}
          contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>{value}</span>}
        />
        <Bar dataKey="Current" fill="#DDDDDD" radius={[3, 3, 0, 0]} />
        {bestUpgradeCosts && (
          <Bar dataKey={bestUpgradeLabel ?? 'Upgraded'} fill="#F9593B" radius={[3, 3, 0, 0]} />
        )}
      </BarChart>
    </ResponsiveContainer>
  )
}
