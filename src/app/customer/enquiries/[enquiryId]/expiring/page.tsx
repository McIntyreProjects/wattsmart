import Link from 'next/link'

export default async function ExpiringQuotePage({ params }: { params: Promise<{ enquiryId: string }> }) {
  const { enquiryId } = await params
  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between pb-4">
          <span className="font-display font-extrabold text-lg tracking-tight">WattSmart</span>
          <span className="w-8 h-8 rounded-full bg-ws-green-tint text-ws-dark-green flex items-center justify-center font-bold text-sm">SM</span>
        </div>

        {/* Urgency warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-tile px-4 py-3 mt-4 text-sm text-amber-700 leading-relaxed">
          ⏰ <strong>Quote A expires in 2 days.</strong> Decide now, or we can ask for a fresh one so you've still got a choice.
        </div>

        {/* Expiring quote card */}
        <div className="border border-ws-border rounded-tile p-4 mt-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-ws-green text-white flex items-center justify-center font-display font-extrabold text-lg flex-shrink-0">A</span>
              <div>
                <p className="font-display font-extrabold text-base tracking-tight">Quote A</p>
                <p className="text-xs text-ws-subtle">Solar + 5kWh battery · ★ 4.8</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display font-extrabold text-xl">£8,420</p>
              <p className="text-xs text-ws-subtle">est. total</p>
            </div>
          </div>

          {/* Expiry progress bar */}
          <div className="mt-4 h-1.5 bg-amber-100 rounded-full overflow-hidden">
            <div className="w-[14%] h-full bg-amber-500 rounded-full" />
          </div>
          <div className="flex justify-between text-xs mt-1.5">
            <span className="text-ws-subtle">Held 12 days</span>
            <span className="text-amber-700 font-semibold">2 days left</span>
          </div>

          <Link href={`/customer/enquiries/${enquiryId}/breakdown/quote-a`} className="flex items-center gap-2 mt-3 pt-3 border-t border-[#EDF1EE]">
            <span className="text-xs text-ws-dark-green">≡</span>
            <span className="text-xs font-semibold">See the full breakdown</span>
            <span className="ml-auto text-xs text-ws-dark-green font-semibold">View →</span>
          </Link>
        </div>

        <Link
          href={`/customer/enquiries/${enquiryId}/deposit?quote=quote-a`}
          className="block w-full bg-ws-green text-white rounded-btn py-4 font-bold text-base mt-4 text-center hover:bg-ws-dark-green transition-colors"
        >
          Choose Quote A
        </Link>
        <button className="w-full border-2 border-ws-green text-ws-dark-green rounded-btn py-3.5 font-bold text-base mt-3 hover:bg-ws-green-tint transition-colors">
          Ask for a fresh quote instead
        </button>
        <p className="text-center text-xs text-ws-subtle mt-3">
          Don't want either right now?{' '}
          <button className="text-ws-dark-green font-semibold">Pause my enquiry</button>
        </p>
      </div>
    </div>
  )
}
