import Link from 'next/link'
import { use } from 'react'

export default function AdminFeeCapturePage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params)

  return (
    <div className="min-h-screen" style={{ background: '#E7EAE7' }}>
      <nav className="flex items-center gap-8 px-6 py-4 bg-white border-b border-ws-border">
        <span className="font-display font-extrabold text-lg tracking-tight">WattSmart</span>
        <Link href="/admin/fees" className="text-sm text-ws-muted hover:text-ws-body">← Fees</Link>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-8">
        <p className="eyebrow mb-1">Fee to capture</p>
        <h1 className="font-display font-extrabold text-2xl tracking-tight mb-1">Job #{jobId} · Greenfield heat pump</h1>
        <p className="text-sm text-ws-muted mb-5">Customer paid the balance off-platform · installer self-reported the amount</p>

        <div className="border border-ws-amber-border bg-ws-amber-bg rounded-tile px-4 py-3 text-xs text-ws-amber-text mb-5 leading-relaxed">
          Most fees never reach this screen — 5% of the deposit and 5% of the balance are taken at source through Stripe. This appears only when a customer pays the balance off-platform.
        </div>

        <div className="bg-white border border-ws-border rounded-tile p-5 mb-4">
          <p className="text-xs font-semibold text-ws-muted uppercase tracking-wider mb-3">How we corroborated it</p>
          {[
            { label: 'Customer marked the job complete', date: '12 Jul', ok: true },
            { label: 'Agreed install date has passed', date: '12 Jul', ok: true },
            { label: 'Deposit was released to the installer', date: null, ok: true },
            { label: 'No balance seen via Stripe → paid off-platform', date: null, ok: true },
          ].map(c => (
            <div key={c.label} className="flex items-center gap-2 py-2 border-b last:border-0 border-[#EDF1EE] text-sm">
              <span className="text-ws-green">✓</span>
              <span>{c.label}</span>
              {c.date && <span className="text-xs text-ws-muted ml-auto">{c.date}</span>}
            </div>
          ))}
        </div>

        <div className="bg-white border border-ws-border rounded-tile p-5 mb-4">
          <p className="text-xs font-semibold text-ws-muted uppercase tracking-wider mb-3">Cross-check</p>
          {[
            { label: 'Quote total', value: '£8,990' },
            { label: 'Less deposit paid', value: '£250' },
            { label: 'Expected balance', value: '~£8,740' },
            { label: 'Reported balance', value: '£8,740 ✓' },
          ].map(r => (
            <div key={r.label} className="flex justify-between text-sm py-1.5 border-b last:border-0 border-[#EDF1EE]">
              <span className="text-ws-muted">{r.label}</span>
              <span className={`font-semibold ${r.value.includes('✓') ? 'text-ws-green' : ''}`}>{r.value}</span>
            </div>
          ))}
        </div>

        <div className="bg-[#EAF5EE] border border-[#CDE6D7] rounded-tile p-4 mb-5">
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="font-semibold">Signals agree — fee auto-confirmed</span>
            <span className="text-xs text-ws-green font-mono">✓</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-ws-muted">Fee due · 5% of £8,740</span>
            <span className="font-display font-extrabold text-2xl text-ws-green">£437.00</span>
          </div>
          <p className="text-xs text-ws-green-deep mt-2">✓ Invoice sent</p>
        </div>

        <p className="text-xs text-ws-muted leading-relaxed">
          ⚖ If the reported figure came in low, or the customer hadn't confirmed completion, this wouldn't auto-invoice — it would route to your attention queue for a look. Never silently trusted.
        </p>
      </div>
    </div>
  )
}
