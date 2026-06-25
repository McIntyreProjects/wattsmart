import Link from 'next/link'

export default function RefundDepositPage({ params }: { params: { enquiryId: string } }) {
  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/customer/dashboard" className="text-ws-muted text-lg">←</Link>
          <h1 className="font-display font-extrabold text-2xl tracking-tight">Refund my deposit</h1>
        </div>

        {/* Job card */}
        <div className="border border-ws-border rounded-tile p-4 mb-5">
          <p className="text-xs text-ws-subtle">#WS-2041 · Northside Solar</p>
          <p className="font-bold text-sm mt-0.5">Solar + 5kWh battery</p>
          <div className="flex justify-between mt-3 pt-3 border-t border-[#EDF1EE]">
            <span className="text-xs text-ws-subtle">Deposit paid</span>
            <span className="font-display font-extrabold text-base text-ws-dark-green">£899</span>
          </div>
        </div>

        {/* Reassurance */}
        <div className="bg-[#F1FAF5] border border-[#CDE6D7] rounded-tile p-4 mb-5">
          <p className="font-bold text-sm text-ws-dark-green">Your deposit is fully refundable</p>
          <p className="text-sm text-[#22302A] mt-1 leading-relaxed">
            Your install date hasn't been confirmed yet, so your £899 is still fully refundable. The refund goes back to your original payment method — usually 5–10 days depending on your bank.
          </p>
        </div>

        {/* Reason (optional) */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-ws-muted mb-2">Reason (optional — helps us improve)</label>
          <select className="w-full border border-ws-border rounded-btn px-4 py-3 text-sm text-ws-ink bg-white focus:outline-none focus:border-ws-green appearance-none">
            <option value="">Choose a reason</option>
            <option>I found a better option elsewhere</option>
            <option>The price didn't work for me</option>
            <option>My circumstances changed</option>
            <option>I wasn't ready to commit</option>
            <option>Something else</option>
          </select>
        </div>

        <button className="w-full bg-ws-green text-white rounded-btn py-4 font-bold text-base hover:bg-ws-dark-green transition-colors">
          Refund my £899 deposit
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-ws-border" />
          <span className="text-xs text-ws-subtle">or</span>
          <div className="flex-1 h-px bg-ws-border" />
        </div>

        {/* Keep comparing paths */}
        <p className="text-xs text-ws-subtle text-center mb-3">Not sure yet? You still have options.</p>
        <div className="flex gap-3">
          <Link href={`/customer/quotes/${params.enquiryId}`} className="flex-1 border border-ws-border rounded-btn py-3 text-center text-sm font-semibold text-ws-ink hover:bg-ws-border transition-colors">
            Back to compare
          </Link>
          <Link href="/customer/dashboard" className="flex-1 border border-ws-border rounded-btn py-3 text-center text-sm font-semibold text-ws-ink hover:bg-ws-border transition-colors">
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
