import { NextResponse } from 'next/server'
import { jobs } from '@/lib/job-store'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const job = jobs.get(id)

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  return NextResponse.json({
    steps: job.steps,
    done: job.done,
    reportId: job.reportId,
    reportJson: job.reportJson,
    error: job.error,
  })
}
