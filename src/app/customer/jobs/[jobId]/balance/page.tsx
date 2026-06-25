import Link from 'next/link'

export default function PayBalancePage({ params }: { params: { jobId: string } }) {
  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Link href={`/customer/jobs/${params.jobId}`} className="text-ws-muted text-lg">←</Link>
          <h1 className="font-display font-extrabold text-2xl tracking-tight">Pay your balance</h1>
        </div>

        {/* Deadline warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-tile px-4 py-3 text-sm text-amber-700 leading-relaxed mb-4">
          ⏰ Due by <strong>5 July</strong> to keep your install on <strong>12 July</strong>. Northside set the balance due 7 days ahead — pay any time before then.
        </div>

        {/* Breakdown */}
        <div className="border border-ws-border rounded-tile p-4 mb-4">
          <div className="flex justify-between text-sm text-ws-muted">
            <span>Total job</span>
            <span>£8,990</span>
          </div>
          <div className="flex justify-between text-sm text-ws-muted mt-2">
            <span>Deposit paid</span>
            <span>−£250</span>
          </div>
          <div className="flex justify-between items-baseline mt-3 pt-3 border-t border-ws-border">
            <span className="font-bold text-sm">Balance now</span>
            <span className="font-display font-extrabold text-3xl">£8,740</span>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-[#F2F6F3] rounded-tile p-4 mb-5">
          <p className="eyebrow mb-3">How your payment works</p>
          <div className="flex flex-col gap-2 text-sm text-[#3D463F]">
            <div className="flex gap-2"><span className="text-ws-green">●</span>Paid securely via Stripe — one payment.</div>
            <div className="flex gap-2"><span className="text-ws-green">●</span>Split automatically: your installer paid instantly, WattSmart's fee taken at source.</div>
            <div className="flex gap-2"><span className="text-ws-green">●</span>We never hold the balance — and you get an instant receipt.</div>
          </div>
        </div>

        {/* CTA */}
        <button className="w-full bg-ws-green text-white rounded-btn py-4 font-bold text-base hover:bg-ws-dark-green transition-colors">
          Pay £8,740 securely
        </button>
        <p className="text-center text-xs text-ws-subtle mt-3">
          🔒 <span className="font-semibold">Stripe</span> · keep everything in one place
        </p>
      </div>
    </div>
  )
}
