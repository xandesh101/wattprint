import { notFound } from 'next/navigation'
import { sharedReports } from '@/lib/report-store'
import { ReportView } from '@/components/report/report-view'
import { Zap } from 'lucide-react'
import Link from 'next/link'

export default async function SharedReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const stored = sharedReports.get(token)

  if (!stored) notFound()

  const parsed = JSON.parse(stored.reportJson)

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[#DDDDDD] bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight text-[#1F2723]">Wattprint</span>
          <span className="text-xs text-[#1F2723]/40 ml-1">· Shared Report</span>
          <Link
            href="/"
            className="ml-auto text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Generate your own report →
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <ReportView
          reportId={token}
          address={stored.address}
          parsed={parsed}
          energyScore={parsed.energy_score}
          energyGrade={parsed.energy_grade}
          readOnly={true}
        />
      </div>
    </div>
  )
}
