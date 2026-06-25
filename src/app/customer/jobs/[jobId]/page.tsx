import Link from 'next/link'

export default function JobProgressPage({ params }: { params: { jobId: string } }) {
  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Link href="/customer/dashboard" className="text-ws-muted text-lg leading-none">←</Link>
          <h1 className="font-display font-extrabold text-2xl tracking-tight">Your install</h1>
        </div>

        {/* Job summary card */}
        <div className="flex justify-between items-center border border-ws-border rounded-tile p-4 mb-5">
          <div>
            <p className="text-xs text-ws-subtle">#WS-2041 · Northside Solar</p>
            <p className="font-bold text-sm mt-0.5">Solar + 5kWh battery</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ws-subtle">Install date</p>
            <p className="font-display font-extrabold text-lg text-ws-dark-green">12 Jul</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex flex-col">

          {/* Step 1 — done */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="w-6 h-6 rounded-full bg-ws-green text-white flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
              <span className="flex-1 w-0.5 bg-ws-green my-1" />
            </div>
            <div className="pb-5">
              <p className="font-bold text-sm">Site survey complete</p>
              <p className="text-xs text-ws-subtle mt-0.5">20 Jun</p>
              <div className="inline-flex gap-1.5 items-center mt-2 border border-ws-border rounded-lg px-2.5 py-1.5">
                <span className="text-[8px] font-bold text-ws-dark-green bg-ws-green-tint rounded px-1">PDF</span>
                <span className="text-xs font-semibold">Survey report</span>
                <span className="text-xs text-ws-dark-green font-semibold">↓</span>
              </div>
            </div>
          </div>

          {/* Step 2 — in progress */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="w-6 h-6 rounded-full border-2 border-amber-500 text-amber-500 flex items-center justify-center text-xs flex-shrink-0">◐</span>
              <span className="flex-1 w-0.5 bg-ws-border my-1" />
            </div>
            <div className="pb-5">
              <p className="font-bold text-sm">Design &amp; DNO approval (G99)</p>
              <p className="text-sm text-ws-muted mt-1 leading-relaxed">
                Northside submitted your G99 to the network operator. Approval expected in ~10 days.
              </p>
              <span className="inline-block mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">
                In progress
              </span>
            </div>
          </div>

          {/* Step 3 — balance due */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="w-6 h-6 rounded-full bg-ws-green text-white flex items-center justify-center text-xs font-bold flex-shrink-0">£</span>
              <span className="flex-1 w-0.5 bg-ws-border my-1" />
            </div>
            <div className="pb-5 flex-1">
              <p className="font-bold text-sm">Balance due before install</p>
              <div className="border-2 border-ws-green bg-[#F1FAF5] rounded-tile p-3 mt-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-ws-muted">Balance</span>
                  <span className="font-display font-extrabold text-xl">£8,740</span>
                </div>
                <p className="text-xs text-ws-dark-green mt-1">Due by <strong>5 Jul</strong> — 7 days before your install.</p>
                <Link
                  href={`/customer/jobs/${params.jobId}/balance`}
                  className="block bg-ws-green text-white rounded-btn p-3 text-center font-bold text-sm mt-3"
                >
                  Pay balance →
                </Link>
              </div>
            </div>
          </div>

          {/* Step 4 — pending */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="w-6 h-6 rounded-full bg-[#F2F6F3] text-ws-subtle flex items-center justify-center text-xs flex-shrink-0">4</span>
              <span className="flex-1 w-0.5 bg-ws-border my-1" />
            </div>
            <div className="pb-5">
              <p className="font-bold text-sm text-ws-subtle">Installation day</p>
              <p className="text-xs text-ws-subtle mt-0.5">12 Jul · ~1 day on site</p>
            </div>
          </div>

          {/* Step 5 — pending */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="w-6 h-6 rounded-full bg-[#F2F6F3] text-ws-subtle flex items-center justify-center text-xs flex-shrink-0">5</span>
            </div>
            <div>
              <p className="font-bold text-sm text-ws-subtle">Certificates &amp; sign-off</p>
              <p className="text-xs text-ws-subtle mt-0.5">MCS, electrical cert &amp; warranty land in your Documents.</p>
            </div>
          </div>

        </div>

        {/* Bottom links */}
        <div className="mt-6 flex gap-3">
          <Link href={`/customer/jobs/${params.jobId}/support`} className="text-xs text-ws-muted underline">Something's wrong?</Link>
          <Link href="/customer/dashboard" className="text-xs text-ws-dark-green font-semibold">← Dashboard</Link>
        </div>
      </div>
    </div>
  )
}
