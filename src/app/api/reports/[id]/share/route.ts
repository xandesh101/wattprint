import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { reports, sharedReports } from '@/lib/report-store'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const stored = reports.get(id)

  if (!stored) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  const token = randomBytes(16).toString('hex')
  sharedReports.set(token, stored)

  return NextResponse.json({ shareToken: token })
}
