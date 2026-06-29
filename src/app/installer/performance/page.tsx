'use client'
import Link from 'next/link'

export default function InstallerPerformancePage() {
  const userRole = 'member' // TODO: replace with real role from auth context

  if (userRole === 'member') {
    return (
      <div className="min-h-screen bg-ws-body font-body text-ws-ink flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <p className="font-display font-extrabold text-xl tracking-tight mb-2">Access restricted</p>
          <p className="text-sm text-ws-muted">Only Managers can view and manage the team. Contact your Manager if you need access.</p>
          <Link href="/installer/dashboard" className="inline-block mt-5 text-sm text-ws-dark-green font-semibold hover:underline">← Back to dashboard</Link>
        </div>
      </div>
    )
  }

  const metrics = [
    { label: 'Briefs received', value: '52', sub: 'last 90 days' },
    { label: 'Quotes submitted', value: '41', sub: '79% of briefs', highlight: false },
    { label: 'Won', value: '13', sub: '31% win rate', highlight: true },
    { label: 'Completed', value: '9', sub: '4 in progress' },
    { label: 'Avg. quote', value: '£8.6k', sub: 'per quote sent' },
    { label: 'Not chosen', value: '28', sub: '68% of quotes', red: true },
  ]

  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-7">
          <Link href="/installer/dashboard" className="text-ws-muted text-sm">← Dashboard</Link>
          <h1 className="font-display font-extrabold text-2xl tracking-tight">Performance &amp; funds</h1>
        </div>

        <p className="text-sm text-ws-muted mb-6">Last 90 days · Northside Solar Co.</p>

        {/* Metrics grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {metrics.map((m) => (
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
            <p className="font-display font-extrabold text-2xl text-ws-dark-green mt-1">£24,180</p>
            <p className="text-xs text-ws-muted mt-0.5">after 5% fee</p>
          </div>
          <div className="border border-ws-border bg-white rounded-tile p-4">
            <p className="text-xs text-ws-muted">Awaiting balance</p>
            <p className="font-display font-extrabold text-2xl mt-1">£7,686</p>
            <p className="text-xs text-ws-subtle mt-0.5">1 job · after 5% · due 5 Jul</p>
          </div>
          <div className="border border-ws-border bg-white rounded-tile p-4">
            <p className="text-xs text-ws-muted">Lifetime</p>
            <p className="font-display font-extrabold text-2xl mt-1">£142k</p>
            <p className="text-xs text-ws-subtle mt-0.5">63 jobs</p>
          </div>
        </div>
      </div>
    </div>
  )
}
