import Link from 'next/link'

export default function AdminInstallersPage() {
  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <nav className="flex items-center gap-8 px-6 py-4 bg-white border-b border-ws-border">
        <span className="font-display font-extrabold text-lg tracking-tight">WattSmart</span>
        <div className="flex gap-6 text-sm text-ws-muted">
          <Link href="/admin/dashboard" className="hover:text-ws-ink">Overview</Link>
          <Link href="/admin/customers" className="hover:text-ws-ink">Customers</Link>
          <span className="text-ws-dark-green font-bold border-b-2 border-ws-green pb-1">Installers</span>
          <Link href="/admin/pipeline" className="hover:text-ws-ink">Pipeline</Link>
          <Link href="/admin/fees" className="hover:text-ws-ink">Fees</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="font-display font-extrabold text-2xl tracking-tight mb-5">Installer management</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { label: 'Flagged · 1', active: true },
            { label: 'Active · 63' },
            { label: 'Paused · 4' },
          ].map((tab) => (
            <button key={tab.label} className={`rounded-lg px-3 py-1.5 text-sm ${
              tab.active ? 'border-2 border-ws-green bg-[#F1FAF5] text-ws-dark-green font-bold' : 'border border-ws-border text-ws-muted'
            }`}>{tab.label}</button>
          ))}
        </div>

        {/* Flagged card */}
        <div className="border border-ws-border rounded-tile p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-display font-extrabold text-xl tracking-tight">Greenfield Renewables Ltd</p>
              <p className="text-xs text-ws-subtle mt-1">Applied 2 days ago · York · solar + battery</p>
            </div>
            <span className="text-xs border border-amber-200 bg-amber-50 text-amber-700 rounded-pill px-3 py-1 whitespace-nowrap">auto-flagged</span>
          </div>

          <div className="flex flex-col gap-2 mb-4">
            {[
              { label: 'MCS', value: '✓ verified', ok: true },
              { label: 'RECC', value: '✓ verified', ok: true },
              { label: 'Companies House', value: '✓ active · 9 yrs', ok: true },
              { label: 'Public-liability insurance', value: '⚠ expires 24 Jun', ok: false },
            ].map((r) => (
              <div key={r.label} className="flex justify-between text-sm">
                <span>{r.label}</span>
                <span className={`font-mono ${r.ok ? 'text-ws-dark-green' : 'text-amber-700'}`}>{r.value}</span>
              </div>
            ))}
          </div>

          <div className="bg-[#F2F6F3] rounded-lg px-4 py-3 text-xs text-ws-muted leading-relaxed mb-4">
            Your rule: flag when public-liability insurance is within 14 days of expiry. Everything else passed automatically.
          </div>

          <div className="flex gap-3">
            <button className="flex-1 bg-ws-green text-white rounded-btn py-3 font-bold text-sm hover:bg-ws-dark-green transition-colors">Approve</button>
            <button className="border-2 border-ws-border rounded-btn px-5 py-3 font-semibold text-sm text-ws-ink hover:bg-ws-border transition-colors">Decline</button>
          </div>
        </div>
      </div>
    </div>
  )
}
