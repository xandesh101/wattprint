// In-memory report store — suitable for demo / single-process deployments

export interface StoredReport {
  address: string
  reportJson: string
  createdAt: number
}

// reportId → report data
export const reports = new Map<string, StoredReport>()

// shareToken → report data
export const sharedReports = new Map<string, StoredReport>()
