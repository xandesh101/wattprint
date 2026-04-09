'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, MapPin, Loader2, ArrowRight, BarChart2, DollarSign, Leaf, TrendingUp, Map, Sparkles } from 'lucide-react'

interface MapboxSuggestion {
  name: string
  place_formatted: string
  full_address?: string
}

export default function LandingPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<MapboxSuggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch(value: string) {
    setQuery(value)
    setError('')
    if (value.length < 4) { setSuggestions([]); return }
    setSearching(true)
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      const res = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(value)}&types=address&country=US&language=en&access_token=${token}&session_token=wattprint-landing`
      )
      const data = await res.json()
      setSuggestions(data.suggestions ?? [])
    } finally {
      setSearching(false)
    }
  }

  function handleSelect(s: MapboxSuggestion) {
    const full = s.full_address ?? (s.name && s.place_formatted ? `${s.name}, ${s.place_formatted}` : s.place_formatted)
    setQuery(full)
    setSuggestions([])
    setError('')
  }

  function handleGenerate() {
    if (!query) return
    if (!/^\d/.test(query.trim())) {
      setError('Please enter a full street address starting with a house number.')
      return
    }
    router.push(`/report?address=${encodeURIComponent(query)}`)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Announcement banner */}
      <div className="bg-[#1F2723] text-white text-xs py-2.5 px-6 flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="font-medium">
          Wattprint just got smarter —
        </span>
        <span className="text-white/70">live market rates and region-adjusted install costs now included in every report.</span>
      </div>

      {/* Nav */}
      <header className="border-b border-[#DDDDDD] bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight text-[#1F2723]">Wattprint</span>
          </div>
          <span className="text-sm text-[#1F2723]/50 hidden sm:block">
            Powered by Palmetto Energy Intelligence
          </span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6">

          {/* Hero section */}
          <div className="pt-20 pb-16 text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#FEF4F2] text-primary text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-full border border-primary/20">
              <Zap className="w-3 h-3" />
              Palmetto Energy Intelligence
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-[#1F2723] leading-[1.08] max-w-3xl mx-auto">
              Know your home&apos;s full<br />
              <span className="text-primary">energy story.</span> Instantly.
            </h1>

            <p className="text-lg text-[#1F2723]/60 max-w-xl mx-auto leading-relaxed">
              Wattprint&apos;s AI agent analyzes your home, models upgrade scenarios with live data, and tracks down every available incentive. No digging required.
            </p>
          </div>

          {/* Address card */}
          <div className="max-w-2xl mx-auto pb-20">
            <div className="bg-white border border-[#DDDDDD] rounded-lg shadow-sm overflow-visible">
              <div className="p-6 space-y-4">
                <p className="text-sm font-semibold text-[#1F2723]">Enter a home address to get started</p>

                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-[#1F2723]/40" />
                  <input
                    className="w-full pl-9 pr-10 py-2.5 border border-[#DDDDDD] rounded text-sm text-[#1F2723] placeholder:text-[#1F2723]/35 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white transition-all"
                    placeholder="e.g. 3032 Maryanne Ln, Pflugerville TX 78660"
                    value={query}
                    onChange={e => handleSearch(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleGenerate() }}
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-3 w-4 h-4 text-[#1F2723]/30 animate-spin" />
                  )}
                </div>

                {suggestions.length > 0 && (
                  <div className="border border-[#DDDDDD] rounded overflow-hidden bg-white shadow-md -mt-1">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        className="w-full text-left px-4 py-3 hover:bg-[#F8F8F8] transition-colors text-sm border-b border-[#DDDDDD] last:border-0"
                        onClick={() => handleSelect(s)}
                      >
                        <p className="font-medium text-[#1F2723]">{s.name}</p>
                        <p className="text-xs text-[#1F2723]/50 mt-0.5">{s.place_formatted}</p>
                      </button>
                    ))}
                  </div>
                )}

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={!query}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 rounded flex items-center justify-center gap-2 transition-all"
                >
                  Generate Energy Report
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-xs text-[#1F2723]/40 text-center">
                  No account needed. Takes about 60 seconds.
                </p>
              </div>
            </div>

            {/* Features row */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              {[
                { icon: BarChart2, label: 'Upgrade ROI', sub: 'Live Palmetto data' },
                { icon: DollarSign, label: 'All incentives', sub: 'Federal, state and utility' },
                { icon: Leaf, label: 'Carbon impact', sub: 'Annual CO₂ modeled' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="bg-[#F8F8F8] border border-[#DDDDDD] rounded p-4 text-center space-y-1.5">
                  <Icon className="w-5 h-5 text-primary mx-auto" />
                  <p className="text-sm font-semibold text-[#1F2723]">{label}</p>
                  <p className="text-xs text-[#1F2723]/50">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* What's new */}
          <div className="max-w-2xl mx-auto pb-16">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#1F2723]/40">What&apos;s new</span>
              <div className="flex-1 h-px bg-[#DDDDDD]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border border-primary/30 bg-[#FEF4F2] rounded-lg p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-[#1F2723]">Live market data</p>
                </div>
                <p className="text-xs text-[#1F2723]/60 leading-relaxed">
                  Electricity rates, solar adoption, and heat pump trends in your report now come from a live web search — not static training data.
                </p>
              </div>
              <div className="border border-primary/30 bg-[#FEF4F2] rounded-lg p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Map className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-[#1F2723]">Region-adjusted costs</p>
                </div>
                <p className="text-xs text-[#1F2723]/60 leading-relaxed">
                  Install costs for solar, heat pumps, and insulation are now adjusted for your state&apos;s labor market and permitting costs.
                </p>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="border-t border-[#DDDDDD] py-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#1F2723]/40 text-center mb-10">
              How it works
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
              {[
                { step: '01', title: 'Enter your address', body: 'Wattprint AI connects to the Palmetto Energy Intelligence API to model your home\'s energy profile.' },
                { step: '02', title: 'AI analyzes and models', body: 'The agent runs upgrade scenarios for solar, heat pumps and insulation using real building science models.' },
                { step: '03', title: 'Get your full report', body: 'See your energy score, upgrade savings, available incentives and where the energy market is headed.' },
              ].map(({ step, title, body }) => (
                <div key={step} className="space-y-3">
                  <div className="text-3xl font-bold text-primary/20">{step}</div>
                  <h3 className="font-semibold text-[#1F2723]">{title}</h3>
                  <p className="text-sm text-[#1F2723]/55 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#DDDDDD] bg-[#F8F8F8]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-[#1F2723]">Wattprint</span>
          </div>
          <p className="text-xs text-[#1F2723]/40">
            Powered by Palmetto Energy Intelligence API. © 2026
          </p>
        </div>
      </footer>

    </div>
  )
}
