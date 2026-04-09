import type { AgentStep } from './report-agent'

export interface Job {
  address: string
  steps: AgentStep[]
  done: boolean
  reportId?: string
  reportJson?: string
  error?: string
}

// Pin to globalThis so the Map is shared across all route handlers in Next.js
// dev mode (where module isolation can give each route its own instance).
const g = globalThis as typeof globalThis & { __wattprint_jobs?: Map<string, Job> }
if (!g.__wattprint_jobs) g.__wattprint_jobs = new Map()
export const jobs = g.__wattprint_jobs
