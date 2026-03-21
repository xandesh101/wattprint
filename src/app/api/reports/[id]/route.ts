import { NextResponse } from 'next/server'
import { reports } from '@/lib/report-store'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const stored = reports.get(id)

  if (!stored) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  return NextResponse.json({
    id,
    address: stored.address,
    reportJson: stored.reportJson,
  })
}
