import Link from 'next/link'

export default function CertExpiringPage() {
  // This is rendered as a banner/overlay on the installer dashboard login
  // Also exists as a standalone page for deep-link from email
  return (
    <div className="min-h-screen" style={{ background: '#E7EAE7' }}>
      <nav className="bg-white border-b border-[#E4EAE6] px-6 py-4">
        <span className="font-display font-extrabold text-lg tracking-tight">WattSmart</span>
      </nav>

      <div className="max-w-[560px] mx-auto px-5 py-8">
        {/* Expiring banner */}
        <div className="border border-ws-amber-border bg-ws-amber-bg rounded-tile p-5 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-amber-600 text-lg flex-shrink-0 mt-0.5">⚠</span>
            <div>
              <p className="font-semibold text-ws-amber-text text-sm">Your MCS certification expires in 7 days</p>
              <p className="text-xs text-ws-amber-text mt-1 leading-relaxed">
                Expires 02 Jul 2026. Once it lapses, we'll stop sending you new job briefs until it's renewed. Your existing jobs are unaffected.
              </p>
            </div>
          </div>
        </div>

        <h1 className="font-display font-extrabold text-2xl tracking-tight mb-2">Renew before it lapses</h1>
        <p className="text-sm text-ws-muted leading-relaxed mb-6">
          This is your 7-day reminder — we send just one email, plus this banner from 30 days out. Renewing before expiry keeps you in new-job matching without interruption.
        </p>

        <div className="bg-white border border-ws-border rounded-tile p-5 mb-4">
          <p className="text-xs font-semibold text-ws-muted uppercase tracking-wider mb-3">Certification status</p>
          {[
            { label: 'MCS', cert: 'MC20045812', expiry: '02 Jul 2026', status: 'expiring', daysLeft: 7 },
            { label: 'RECC', cert: 'R/048291', expiry: '14 Nov 2026', status: 'ok', daysLeft: 142 },
            { label: 'TrustMark', cert: 'TM/28831', expiry: '31 Dec 2026', status: 'ok', daysLeft: 189 },
          ].map(c => (
            <div key={c.label} className="flex items-center justify-between py-2.5 border-b last:border-0 border-[#EDF1EE]">
              <div>
                <p className="text-sm font-semibold">{c.label} <span className="font-mono text-xs text-ws-muted">{c.cert}</span></p>
                <p className="text-xs text-ws-muted">Valid to {c.expiry}</p>
              </div>
              {c.status === 'expiring' ? (
                <span className="text-xs border border-amber-200 bg-amber-50 text-amber-700 rounded-pill px-2.5 py-1 font-semibold">
                  {c.daysLeft} days left
                </span>
              ) : (
                <span className="text-xs text-ws-green font-semibold">✓ Valid</span>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <a
            href="https://mcscertified.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-ws-green text-white rounded-btn py-3.5 font-bold text-sm hover:bg-ws-green-deep transition-colors"
          >
            Renew MCS now ↗
          </a>
          <Link
            href="/installer/profile"
            className="block w-full text-center border-2 border-ws-border rounded-btn py-3.5 font-semibold text-sm text-ws-body hover:bg-[#F2F6F3] transition-colors"
          >
            Upload renewed certificate
          </Link>
          <Link href="/installer/dashboard" className="block text-center text-sm text-ws-muted py-2 hover:text-ws-body">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
