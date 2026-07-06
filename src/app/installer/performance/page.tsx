'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

type Metrics = {
  jobsReceived: number
  quotesSubmitted: number
  jobsWon: number
  avgQuoteValue: number
}

export default function InstallerPerformancePage() {
  const [userRole, setUserRole] = useState<'manager' | 'member' | null>(null)
  const [companyName, setCompanyName] = useState('')
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/installers/me')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setUserRole(data.currentUserRole ?? 'member')
        setCompanyName(data.installer?.trading_name || data.installer?.company_name || '')
        setMetrics(data.metrics ?? null)
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-ws-bg font-body text-ws-ink flex items-center justify-center px-6">
        <p className="text-sm text-ws-muted">Loading…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ws-bg font-body text-ws-ink flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <p className="text-sm text-[#C2603F]">{error}</p>
          <Link href="/installer/dashboard" className="inline-block mt-5 text-sm text-ws-dark-green font-semibold hover:underline">← Back to dashboard</Link>
        </div>
      </div>
    )
  }

  if (userRole === 'member') {
    return (
      <div className="min-h-screen bg-ws-bg font-body text-ws-ink flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <p className="font-display font-extrabold text-xl tracking-tight mb-2">Access restricted</p>
          <p className="text-sm text-ws-muted">Only Managers can view performance metrics. Contact your Manager if you need access.</p>
          <Link href="/installer/dashboard" className="inline-block mt-5 text-sm text-ws-dark-green font-semibold hover:underline">← Back to dashboard</Link>
        </div>
      </div>
    )
  }

  const winRate = metrics && metrics.quotesSubmitted > 0
    ? Math.round((metrics.jobsWon / metrics.quotesSubmitted) * 100)
    : 0

  const notChosen = metrics ? Math.max(0, (metrics.quotesSubmitted ?? 0) - (metrics.jobsWon ?? 0)) : 0

  const displayMetrics = [
    { label: 'Briefs received',    value: String(metrics?.jobsReceived ?? 0),    sub: 'last 90 days' },
    { label: 'Quotes submitted',   value: String(metrics?.quotesSubmitted ?? 0),  sub: metrics?.jobsReceived ? `${Math.round(((metrics.quotesSubmitted ?? 0) / metrics.jobsReceived) * 100)}% of briefs` : '—', highlight: false },
    { label: 'Won',                value: String(metrics?.jobsWon ?? 0),          sub: `${winRate}% win rate`, highlight: true },
    { label: 'Avg. quote',         value: metrics?.avgQuoteValue ? `£${(metrics.avgQuoteValue / 1000).toFixed(1)}k` : '—', sub: 'per quote sent' },
    { label: 'Not chosen',         value: String(notChosen),                      sub: metrics?.quotesSubmitted ? `${Math.round((notChosen / metrics.quotesSubmitted) * 100)}% of quotes` : '—', red: true },
  ]

  return (
    <div className="min-h-screen bg-ws-bg font-body text-ws-ink">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-7">
          <Link href="/installer/dashboard" className="text-ws-muted text-sm">← Dashboard</Link>
          <h1 className="font-display font-extrabold text-2xl tracking-tight">Performance &amp; funds</h1>
        </div>

        <p className="text-sm text-ws-muted mb-6">Last 90 days{companyName ? ` · ${companyName}` : ''}</p>

        {/* Metrics grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {displayMetrics.map((m) => (
            <div key={m.label} className={`border rounded-tile p-4 ${m.highlight ? 'border-2 border-ws-green bg-[#F1FAF5]' : 'border-ws-border bg-white'}`}>
              <p className={`text-xs ${m.highlight ? 'text-ws-dark-green' : 'text-ws-muted'}`}>{m.label}</p>
              <p className={`font-display font-extrabold text-3xl mt-1 ${m.highlight ? 'text-ws-dark-green' : m.red ? 'text-[#B0796A]' : 'text-ws-ink'}`}>{m.value}</p>
              <p className={`text-xs mt-0.5 ${m.highlight ? 'text-ws-dark-green' : 'text-ws-subtle'}`}>{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Funds */}
        <p className="eyebrow mb-3">Funds · paid via Stripe, never held by us</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="border-2 border-[#CDE6D7] bg-[#F1FAF5] rounded-tile p-4">
            <p className="text-xs text-ws-dark-green">Paid out · this month</p>
            <p className="font-display font-extrabold text-2xl text-ws-dark-green mt-1">—</p>
            <p className="text-xs text-ws-muted mt-0.5">Stripe payouts coming soon</p>
          </div>
          <div className="border border-ws-border bg-white rounded-tile p-4">
            <p className="text-xs text-ws-muted">Awaiting balance</p>
            <p className="font-display font-extrabold text-2xl mt-1">—</p>
            <p className="text-xs text-ws-subtle mt-0.5">No pending payouts</p>
          </div>
          <div className="border border-ws-border bg-white rounded-tile p-4">
            <p className="text-xs text-ws-muted">Lifetime</p>
            <p className="font-display font-extrabold text-2xl mt-1">—</p>
            <p className="text-xs text-ws-subtle mt-0.5">Stripe not yet connected</p>
          </div>
        </div>
      </div>
    </div>
  )
}
