import Link from 'next/link'

export default function CertLapsedPage() {
  return (
    <div className="min-h-screen" style={{ background: '#E7EAE7' }}>
      <nav className="bg-white border-b border-[#E4EAE6] px-6 py-4">
        <span className="font-display font-extrabold text-lg tracking-tight">WattSmart</span>
      </nav>

      <div className="max-w-[560px] mx-auto px-5 py-8">
        <div className="border border-ws-red-text/20 bg-ws-red-bg rounded-tile p-5 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-ws-red-text text-lg flex-shrink-0 mt-0.5">⚠</span>
            <div>
              <p className="font-semibold text-ws-red-text text-sm">Your NICEIC certification has lapsed</p>
              <p className="text-xs text-ws-red-text mt-1 leading-relaxed">
                Expired 02 Aug 2026. We've stopped sending you new job briefs for solar, battery and EV. Your in-progress jobs are unaffected — you and your customers deal directly.
              </p>
            </div>
          </div>
        </div>

        <h1 className="font-display font-extrabold text-2xl tracking-tight mb-2">Renew to resume matching</h1>
        <p className="text-sm text-ws-muted leading-relaxed mb-5">
          We've auto-notified your 2 in-progress customers. They have your contact details and carry on directly with you — the contract is between you and them.
        </p>

        <div className="border border-ws-border rounded-tile overflow-hidden mb-5 bg-white">
          <div className="px-4 py-3 bg-[#FAFBFA] border-b border-[#EDF1EE]">
            <p className="text-xs font-semibold text-ws-muted uppercase tracking-wider">Affected jobs</p>
          </div>
          {[
            { ref: '#WS-2041', product: 'Solar + battery', stage: 'Survey booked', action: 'Customer notified' },
            { ref: '#WS-2103', product: 'EV charger', stage: 'Install due 21 Aug', action: 'Customer notified' },
          ].map((j, i, arr) => (
            <div key={j.ref} className={`flex items-center justify-between px-4 py-3.5 text-sm ${i < arr.length - 1 ? 'border-b border-[#EDF1EE]' : ''}`}>
              <div>
                <p className="font-semibold">{j.ref} · {j.product}</p>
                <p className="text-xs text-ws-muted">{j.stage} · <span className="font-medium">{j.action}</span></p>
              </div>
              <span className="text-xs text-ws-muted border border-ws-border rounded-lg px-2.5 py-1">Direct</span>
            </div>
          ))}
        </div>

        <div className="bg-[#EAF5EE] border border-[#CDE6D7] rounded-tile p-4 mb-5 text-sm text-ws-green-deep">
          <p className="font-semibold mb-1">Get back to matching in 3 steps</p>
          <ol className="space-y-1 text-xs">
            <li><span className="font-bold">1</span> Renew your NICEIC registration</li>
            <li><span className="font-bold">2</span> Upload your renewed certificate using the button below</li>
            <li><span className="font-bold">3</span> Our team will verify it and re-activate your account</li>
          </ol>
        </div>

        <p className="text-xs text-ws-muted mb-5 leading-relaxed">
          You and your customers already have each other's contact details — carry on directly. You just won't be matched to new jobs until your certification is restored.
        </p>

        <div className="flex flex-col gap-2">
          <a
            href="https://www.niceic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-ws-green text-white rounded-btn py-3.5 font-bold text-sm hover:bg-ws-green-deep transition-colors"
          >
            Renew now ↗
          </a>
          <Link
            href="/installer/profile"
            className="block w-full text-center border-2 border-ws-border rounded-btn py-3.5 font-semibold text-sm text-ws-body hover:bg-[#F2F6F3] transition-colors"
          >
            Upload renewed certificate
          </Link>
        </div>
      </div>
    </div>
  )
}
