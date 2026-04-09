// In-memory report store — suitable for demo / single-process deployments

export interface StoredReport {
  address: string
  reportJson: string
  createdAt: number
}

// Pin to globalThis so both Maps are shared across all route handlers in Next.js
// dev mode (where module isolation can give each route its own instance).
const g = globalThis as typeof globalThis & {
  __wattprint_reports?: Map<string, StoredReport>
  __wattprint_shared?: Map<string, StoredReport>
}
if (!g.__wattprint_reports) g.__wattprint_reports = new Map()
if (!g.__wattprint_shared) g.__wattprint_shared = new Map()

// reportId → report data
export const reports = g.__wattprint_reports

// shareToken → report data
export const sharedReports = g.__wattprint_shared
