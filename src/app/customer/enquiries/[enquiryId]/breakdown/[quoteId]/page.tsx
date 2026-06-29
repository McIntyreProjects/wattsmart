import Link from 'next/link'

export default async function QuoteBreakdownPage({ params }: { params: Promise<{ enquiryId: string; quoteId: string }> }) {
  const { enquiryId, quoteId } = await params
  const quoteLabel = quoteId === 'quote-a' ? 'A' : 'B'

  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-5">
          <Link href={`/customer/quotes/${enquiryId}`} className="text-ws-muted text-lg">←</Link>
          <h1 className="font-display font-extrabold text-2xl tracking-tight">Quote {quoteLabel} · breakdown</h1>
        </div>

        {/* Anonymity notice */}
        <div className="flex items-center gap-2 bg-[#F2F2EE] rounded-xl px-3 py-2.5 mb-4">
          <span className="text-sm">🔒</span>
          <p className="text-xs text-ws-muted leading-relaxed">Names, logos &amp; contact details removed — you'll meet them once you choose.</p>
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: 'Total inc VAT', value: '£8,990' },
            { label: 'Earliest start', value: '2 wk' },
            { label: 'Saving/yr', value: '£640' },
          ].map((m) => (
            <div key={m.label} className="border border-ws-border rounded-tile p-3">
              <p className="text-xs text-ws-subtle">{m.label}</p>
              <p className="font-display font-extrabold text-lg mt-0.5">{m.value}</p>
            </div>
          ))}
        </div>

        {/* What's included */}
        <p className="eyebrow mb-2">What's included</p>
        <div className="border border-ws-border rounded-tile overflow-hidden mb-5">
          {[
            { name: 'AIKO Neostar 455W panels', qty: '10×' },
            { name: 'Anker SOLIX 5kWh battery', qty: '1×' },
            { name: 'GivEnergy 5kW hybrid inverter', qty: '1×' },
            { name: 'Roof mounting, rails & scaffolding', qty: 'incl.' },
            { name: 'MCS certificate + DNO (G99)', qty: 'incl.' },
          ].map((item, i, arr) => (
            <div
              key={item.name}
              className={`flex justify-between items-center gap-3 px-4 py-3 text-sm ${i < arr.length - 1 ? 'border-b border-[#EDF1EE]' : ''}`}
            >
              <span className="text-[#22302A]">{item.name}</span>
              <span className="font-display font-extrabold text-sm whitespace-nowrap">{item.qty}</span>
            </div>
          ))}
        </div>

        {/* Warranties */}
        <p className="eyebrow mb-2">Warranties</p>
        <div className="flex gap-2 flex-wrap mb-5">
          {['12 yr workmanship', '25 yr panels', '10 yr battery'].map((w) => (
            <span key={w} className="text-xs border border-[#CDE6D7] bg-[#F1FAF5] text-ws-dark-green rounded-lg px-2.5 py-1.5 font-semibold">
              {w}
            </span>
          ))}
        </div>

        {/* Terms */}
        <p className="eyebrow mb-2">Terms</p>
        <div className="border border-ws-border rounded-tile p-4 mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ws-dark-green uppercase tracking-wider">This installer's terms</span>
            <span className="text-xs font-bold text-ws-subtle bg-[#F2F2EE] rounded px-1.5 py-0.5">anonymised</span>
          </div>
          <p className="text-xs text-ws-subtle mt-0.5">For the install &amp; supply of goods</p>
          <div className="flex flex-col gap-2.5 text-sm text-[#3D463F] leading-relaxed mt-3">
            <div className="flex gap-2"><span className="text-ws-green">●</span><span><strong>Guarantee:</strong> 12-yr insurance-backed workmanship; snags fixed within 14 days.</span></div>
            <div className="flex gap-2"><span className="text-ws-green">●</span><span><strong>Equipment:</strong> supplied as itemised; any substitution only with your agreement.</span></div>
            <div className="flex gap-2"><span className="text-ws-green">●</span><span><strong>Aftercare:</strong> free system health-check at 12 months.</span></div>
            <div className="flex gap-2"><span className="text-ws-green">●</span><span><strong>Balance:</strong> due by the installer's deadline before install — pay any time before it.</span></div>
          </div>
          <p className="text-xs text-ws-dark-green font-semibold mt-3">Read full terms →</p>
          <div className="flex gap-2 mt-3 pt-3 border-t border-[#EDF1EE] text-xs text-ws-subtle leading-relaxed">
            <span>ⓘ</span>
            <span>Deposits, payments &amp; your data are covered separately by <span className="text-ws-dark-green font-semibold">WattSmart's service terms</span>.</span>
          </div>
        </div>

        <Link
          href={`/customer/checkout`}
          className="block w-full bg-ws-green text-white rounded-btn py-4 font-bold text-base text-center hover:bg-ws-dark-green transition-colors"
        >
          Choose Quote {quoteLabel}
        </Link>
        <Link href={`/customer/quotes/${enquiryId}`} className="block text-center text-sm text-ws-dark-green font-semibold mt-3">
          ← Back to compare
        </Link>
      </div>
    </div>
  )
}
