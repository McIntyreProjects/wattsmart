import Link from 'next/link'

export default function OneQuotePage({ params }: { params: { enquiryId: string } }) {
  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between pb-4">
          <span className="font-display font-extrabold text-lg tracking-tight">WattSmart</span>
          <span className="w-8 h-8 rounded-full bg-ws-green-tint text-ws-dark-green flex items-center justify-center font-bold text-sm">SM</span>
        </div>

        <h1 className="font-display font-extrabold text-3xl tracking-tight leading-tight mt-5">Your first quote's in</h1>
        <p className="text-sm text-[#56635C] mt-3 leading-relaxed">
          One installer has quoted so far. We always like you to weigh up <strong>at least two</strong> before you choose — so we're holding this one safe while we find you more.
        </p>

        {/* Held quote card */}
        <div className="border border-ws-border rounded-tile p-4 mt-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-ws-green text-white flex items-center justify-center font-display font-extrabold text-lg flex-shrink-0">A</span>
              <div>
                <p className="font-display font-extrabold text-base tracking-tight">Quote A</p>
                <p className="text-xs text-ws-subtle">Solar + 5kWh battery</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display font-extrabold text-xl">£8,420</p>
              <p className="text-xs text-ws-subtle">est. total</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 bg-[#F1FAF5] border border-[#CDE6D7] rounded-lg px-3 py-2">
            <span className="text-ws-dark-green text-xs">🔒</span>
            <span className="text-xs text-ws-dark-green font-semibold">Held for you · 14 days left</span>
          </div>
          <Link href={`/customer/enquiries/${params.enquiryId}/breakdown/quote-a`} className="flex items-center gap-2 mt-3 pt-3 border-t border-[#EDF1EE]">
            <span className="text-xs text-ws-dark-green">≡</span>
            <span className="text-xs font-semibold">See the full breakdown</span>
            <span className="ml-auto text-xs text-ws-dark-green font-semibold">View →</span>
          </Link>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 mt-4 px-0.5">
          <span className="flex-1 h-1.5 rounded-full bg-ws-green" />
          <span className="flex-1 h-1.5 rounded-full" style={{background:'repeating-linear-gradient(90deg,#CDE6D7 0 6px,transparent 6px 11px)'}} />
          <span className="text-xs text-ws-muted font-semibold whitespace-nowrap">1 of 2 min.</span>
        </div>

        {/* Get more */}
        <div className="bg-[#F1FAF5] border border-[#CDE6D7] rounded-tile p-4 mt-4">
          <p className="font-bold text-sm text-ws-dark-green">We'll get you more to compare</p>
          <p className="text-sm text-[#22302A] mt-1 leading-relaxed">
            We'll send your enquiry to <strong>two more certified installers</strong> — nothing to fill in again. Quote A stays held the whole time.
          </p>
        </div>

        <button className="w-full bg-ws-green text-white rounded-btn py-4 font-bold text-base mt-4 hover:bg-ws-dark-green transition-colors">
          See this &amp; get more quotes →
        </button>
        <Link
          href={`/customer/enquiries/${params.enquiryId}/deposit?quote=quote-a`}
          className="block w-full border-2 border-ws-green text-ws-dark-green rounded-btn py-3.5 font-bold text-base mt-3 text-center hover:bg-ws-green-tint transition-colors"
        >
          Choose Quote A now
        </Link>
        <p className="text-center text-xs text-ws-subtle mt-3">Happy with this one? You can go ahead — or hold it while we line up more.</p>
      </div>
    </div>
  )
}
