'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, Circle, ChevronDown, ChevronUp, Bot } from 'lucide-react'
import type { AgentStep } from '@/lib/report-agent'

interface AgentPanelProps {
  steps: AgentStep[]
  isDone: boolean
  /** When true, renders as a compact collapsible card (post-generation) */
  collapsed?: boolean
}

export function AgentPanel({ steps, isDone, collapsed = false }: AgentPanelProps) {
  const [open, setOpen] = useState(!collapsed)

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
                {steps.filter(s => s.status === 'done').length} data sources · click to expand
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
        <div className="border-t border-border px-4 py-3 space-y-0">
          {steps.length === 0 && (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
              <p className="text-sm text-muted-foreground">Connecting to Palmetto Energy Intelligence…</p>
            </div>
          )}

          {steps.map((step, i) => {
            const isActive = step.status === 'calling'
            const isDoneStep = step.status === 'done'
            // Deduplicate: show only the 'done' version if both calling+done exist for same index
            return (
              <div key={i} className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
                <div className="mt-0.5 shrink-0">
                  {isDoneStep
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    : isActive
                    ? <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    : <Circle className="w-4 h-4 text-muted-foreground/40" />
                  }
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${isActive ? 'text-foreground' : isDoneStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.label}
                  </p>
                  {step.summary && (
                    <p className="text-xs text-muted-foreground mt-0.5">{step.summary}</p>
                  )}
                </div>
              </div>
            )
          })}

          {!isDone && steps.length > 0 && (
            <div className="pt-2 pb-1">
              <p className="text-xs text-muted-foreground italic">
                AI agent analyzing data with the Palmetto Energy Intelligence API…
              </p>
            </div>
          )}

          {isDone && (
            <div className="pt-3 pb-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Report complete · all data sourced from Palmetto Energy Intelligence API
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
