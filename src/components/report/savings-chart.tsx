'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface SavingsChartProps {
  annualSavings: number
  upfrontCost: number
}

export function SavingsChart({ annualSavings, upfrontCost }: SavingsChartProps) {
  const data = Array.from({ length: 11 }, (_, i) => ({
    year: `Yr ${i}`,
    'Cumulative Savings': +(annualSavings * i - upfrontCost).toFixed(0),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
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
          formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Cumulative Savings']}
          contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }}
        />
        <Line
          type="monotone"
          dataKey="Cumulative Savings"
          stroke="#F9593B"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4, fill: '#F9593B' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
