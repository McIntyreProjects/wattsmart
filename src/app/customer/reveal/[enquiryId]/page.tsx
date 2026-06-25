import Link from 'next/link'

export default function InstallerRevealPage({ params }: { params: { enquiryId: string } }) {
  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Confirmation pill */}
        <div className="w-full text-center text-xs font-bold text-ws-dark-green bg-ws-green-tint rounded-pill py-2 px-4 mb-5">
          ✓ Deposit secured · meet your installer
        </div>

        {/* Installer card */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-tile bg-ws-green text-white flex items-center justify-center font-display font-extrabold text-xl flex-shrink-0">
            NS
          </div>
          <div>
            <h1 className="font-display font-extrabold text-2xl tracking-tight leading-tight">Northside Solar Co.</h1>
            <p className="text-xs text-ws-subtle mt-1">Durham · est. 2011 · was "Quote B"</p>
          </div>
        </div>

        {/* Cert badges */}
        <div className="flex gap-2 flex-wrap mb-5">
          {['✓ MCS', '✓ RECC', '✓ TrustMark', '★ 4.9 (340)'].map((badge) => (
            <span
              key={badge}
              className="text-xs border border-[#CDE6D7] bg-[#F1FAF5] text-ws-dark-green rounded-pill px-3 py-1 font-semibold"
            >
              {badge}
            </span>
          ))}
        </div>

        {/* What happens next */}
        <div className="border border-ws-border rounded-tile p-4 mb-4">
          <p className="font-bold text-sm mb-3">What happens next</p>
          <div className="flex flex-col gap-3">
            {[
              'They call you within one working day',
              'Book your free site survey',
              'Date confirmed → your deposit is released',
            ].map((step, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-ws-green text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm text-[#22302A] leading-relaxed">
                  {i === 0 ? <><strong>one working day</strong></> : null}
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Message CTA */}
        <button className="w-full bg-ws-green text-white rounded-btn py-3.5 font-bold text-sm mb-3 hover:bg-ws-dark-green transition-colors">
          Message Northside Solar
        </button>

        {/* Refund link */}
        <p className="text-center text-xs text-ws-subtle">
          Changed your mind?{' '}
          <Link href={`/customer/enquiries/${params.enquiryId}/refund`} className="text-ws-dark-green font-semibold">
            Refund my deposit
          </Link>
        </p>
      </div>
    </div>
  )
}
