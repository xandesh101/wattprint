import type { AgentStep } from './report-agent'

export interface Job {
  address: string
  steps: AgentStep[]
  done: boolean
  reportId?: string
  reportJson?: string
  error?: string
}

export const jobs = new Map<string, Job>()
