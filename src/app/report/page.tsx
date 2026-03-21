'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Zap, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { AgentPanel } from '@/components/report/agent-panel'
import { ReportView } from '@/components/report/report-view'
import type { AgentStep } from '@/lib/report-agent'
import Link from 'next/link'

const POLL_INTERVAL = 1500 // ms

function ReportPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const address = searchParams.get('address') ?? ''

  const [steps, setSteps] = useState<AgentStep[]>([])
  const [reportJson, setReportJson] = useState<string | null>(null)
  const [reportId, setReportId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDone, setIsDone] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const started = useRef(false)
  const jobId = useRef<string | null>(null)
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!address) { router.replace('/'); return }
    if (started.current) return
    started.current = true

    const tick = setInterval(() => setElapsed(e => e + 1), 1000)

    function stop() {
      clearInterval(tick)
      if (pollTimer.current) clearTimeout(pollTimer.current)
    }

    async function poll(id: string) {
      try {
        const res = await fetch(`/api/jobs/${id}`)
        if (!res.ok) throw new Error('Job not found')
        const data = await res.json()

        setSteps(data.steps ?? [])

        if (data.error) {
          setError(data.error)
          stop()
          return
        }

        if (data.done) {
          setReportJson(data.reportJson)
          setReportId(data.reportId)
          setIsDone(true)
          stop()
          return
        }

        // Keep polling
        pollTimer.current = setTimeout(() => poll(id), POLL_INTERVAL)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
        stop()
      }
    }

    async function start() {
      try {
        const res = await fetch('/api/reports/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
        })
        if (!res.ok) throw new Error('Failed to start report generation')
        const { jobId: id } = await res.json()
        jobId.current = id
        // Start polling after a short delay for first step to appear
        pollTimer.current = setTimeout(() => poll(id), 800)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
        stop()
      }
    }

    start()
    return stop
  }, [address, router])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed: any = reportJson ? JSON.parse(reportJson) : null

  // ── Error state ──
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[#F8F8F8]">
        <div className="max-w-md w-full text-center space-y-4 bg-white border border-[#DDDDDD] rounded-lg p-8">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-[#1F2723]">Report generation failed</h2>
          <p className="text-sm text-[#1F2723]/60">{error}</p>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Try a different address
          </Link>
        </div>
      </div>
    )
  }

  // ── Generating state ──
  if (!isDone) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <header className="border-b border-[#DDDDDD] bg-white">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight text-[#1F2723]">Wattprint</span>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#F8F8F8]">
          <div className="w-full max-w-lg space-y-6">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#FEF4F2] border border-primary/20 flex items-center justify-center mx-auto">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-[#1F2723]">Generating your energy report</h2>
              <p className="text-sm text-[#1F2723]/50">{address}</p>
            </div>

            <AgentPanel steps={steps} isDone={false} />

            <p className="text-xs text-[#1F2723]/40 text-center">
              {elapsed > 0 ? `${elapsed}s elapsed. ` : ''}This takes about 60 seconds. Keep this tab open.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Report ready ──
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[#DDDDDD] bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight text-[#1F2723]">Wattprint</span>
          <span className="text-xs text-[#1F2723]/40 hidden sm:block">Home Energy Intelligence Report</span>
          <Link href="/" className="ml-auto text-xs text-[#1F2723]/50 hover:text-primary flex items-center gap-1 transition-colors font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> New report
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <AgentPanel steps={steps} isDone={true} collapsed={true} />

        {parsed && (
          <ReportView
            reportId={reportId!}
            address={address}
            parsed={parsed}
            energyScore={parsed.energy_score}
            energyGrade={parsed.energy_grade}
          />
        )}
      </div>
    </div>
  )
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <ReportPageInner />
    </Suspense>
  )
}
