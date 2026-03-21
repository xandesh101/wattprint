'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface BreakdownChartProps {
  breakdown: {
    hvac: number
    water_heater: number
    plug_loads: number
    lighting: number
    cooking: number
  }
}

const COLORS = ['#F9593B', '#F77D67', '#FFCCB5', '#1F2723', '#94a3b8']
const LABELS: Record<string, string> = {
  hvac: 'HVAC',
  water_heater: 'Water Heater',
  plug_loads: 'Plug Loads',
  lighting: 'Lighting',
  cooking: 'Cooking',
}

export function BreakdownChart({ breakdown }: BreakdownChartProps) {
  const data = Object.entries(breakdown)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ name: LABELS[key] ?? key, value }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`${value}%`, '']}
          contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
