import Link from 'next/link'

export default function ApproveInstallDatePage({ params }: { params: { jobId: string } }) {
  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Link href={`/customer/jobs/${params.jobId}`} className="text-ws-muted text-lg">←</Link>
          <h1 className="font-display font-extrabold text-2xl tracking-tight">Your install</h1>
        </div>

        {/* Job card */}
        <div className="flex justify-between items-center border border-ws-border rounded-tile p-4 mb-5">
          <div>
            <p className="text-xs text-ws-subtle">#WS-2041 · Northside Solar</p>
            <p className="font-bold text-sm mt-0.5">Solar + 5kWh battery</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ws-subtle">Deposit</p>
            <p className="font-display font-extrabold text-base text-ws-dark-green">£899 held</p>
          </div>
        </div>

        {/* Action needed pill */}
        <div className="inline-flex items-center gap-2 bg-ws-green-tint text-ws-dark-green rounded-pill px-3 py-1.5 text-xs font-bold mb-3">
          Action needed
        </div>

        <h2 className="font-display font-extrabold text-xl leading-tight tracking-tight mb-2">
          Northside Solar proposed your install date
        </h2>
        <p className="text-sm text-ws-muted leading-relaxed mb-4">
          Does this work for you? Accept to lock it in, or suggest a day that suits you better.
        </p>

        {/* Date tile */}
        <div className="border border-ws-border rounded-tile p-4 flex items-center gap-4 mb-4">
          <div className="flex-shrink-0 w-14 text-center bg-ws-green-tint rounded-xl py-2.5">
            <p className="text-xs font-bold text-ws-dark-green tracking-widest">JUL</p>
            <p className="font-display font-extrabold text-2xl text-ws-dark-green leading-none">12</p>
          </div>
          <div>
            <p className="font-display font-extrabold text-base">Saturday 12 July</p>
            <p className="text-xs text-ws-subtle mt-0.5">From 8:00am · ~1 day on site</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-4">
          <button className="flex-1 bg-ws-green text-white rounded-btn py-3.5 font-bold text-sm hover:bg-ws-dark-green transition-colors">
            Accept date
          </button>
          <button className="flex-1 bg-white text-ws-dark-green border-[1.5px] border-[#CFE3D7] rounded-btn py-3.5 font-bold text-sm hover:bg-ws-green-tint transition-colors">
            Suggest another
          </button>
        </div>

        {/* Info note */}
        <div className="flex items-start gap-2 bg-[#F2F6F3] rounded-tile px-4 py-3">
          <span className="text-ws-green mt-px">→</span>
          <p className="text-xs text-ws-muted leading-relaxed">
            Accepting releases your £899 deposit to Northside and books the job. We've sent this to your email &amp; phone too.
          </p>
        </div>
      </div>
    </div>
  )
}
