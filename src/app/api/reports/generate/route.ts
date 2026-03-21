import { NextResponse } from 'next/server'
import { generateReport } from '@/lib/report-agent'
import { reports } from '@/lib/report-store'
import { jobs } from '@/lib/job-store'

export const maxDuration = 300

export async function POST(req: Request) {
  const { address } = await req.json()
  if (!address || typeof address !== 'string') {
    return NextResponse.json({ error: 'address required' }, { status: 400 })
  }

  const jobId = crypto.randomUUID()
  jobs.set(jobId, { address, steps: [], done: false })

  // Fire-and-forget: run generation in background
  ;(async () => {
    const job = jobs.get(jobId)!
    try {
      const result = await generateReport(address, (step) => {
        // Replace 'calling' with 'done' for same label, or append
        if (step.status === 'done') {
          const idx = [...job.steps].reverse().findIndex(
            s => s.label === step.label && s.status === 'calling'
          )
          if (idx !== -1) {
            const realIdx = job.steps.length - 1 - idx
            job.steps[realIdx] = step
          } else {
            job.steps.push(step)
          }
        } else {
          job.steps.push(step)
        }
      })

      const reportId = crypto.randomUUID()
      reports.set(reportId, {
        address,
        reportJson: result.reportJson,
        createdAt: Date.now(),
      })

      job.reportId = reportId
      job.reportJson = result.reportJson
      job.done = true
    } catch (err) {
      job.error = err instanceof Error ? err.message : 'Report generation failed'
      job.done = true
      console.error('Report generation error:', job.error)
    }
  })()

  return NextResponse.json({ jobId })
}
