import Link from 'next/link'

export default function NoQuotesPage({ params }: { params: { enquiryId: string } }) {
  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between pb-4">
          <span className="font-display font-extrabold text-lg tracking-tight">WattSmart</span>
          <span className="w-8 h-8 rounded-full bg-ws-green-tint text-ws-dark-green flex items-center justify-center font-bold text-sm">SM</span>
        </div>

        <div className="w-16 h-16 rounded-2xl bg-[#F2F6F3] flex items-center justify-center text-3xl mt-6">📭</div>
        <h1 className="font-display font-extrabold text-3xl tracking-tight leading-tight mt-4">No quotes this time</h1>
        <p className="text-sm text-[#56635C] mt-3 leading-relaxed">
          None of the three installers we matched you with were able to quote — sometimes they're at capacity or just outside your area. It's not you, and you've paid nothing.
        </p>

        {/* What happened */}
        <div className="border border-ws-border rounded-tile p-4 mt-5">
          <p className="eyebrow mb-3">What happened</p>
          <div className="flex flex-col gap-2.5 text-sm text-[#3D463F]">
            <div className="flex justify-between"><span>Installer A</span><span className="text-ws-subtle">Timed out · 14 days</span></div>
            <div className="flex justify-between"><span>Installer B</span><span className="text-red-600">Couldn't take it on</span></div>
            <div className="flex justify-between"><span>Installer C</span><span className="text-ws-subtle">Timed out · 14 days</span></div>
          </div>
        </div>

        {/* Re-match offer */}
        <div className="bg-[#F1FAF5] border border-[#CDE6D7] rounded-tile p-4 mt-4">
          <p className="font-bold text-sm text-ws-dark-green">We'll widen the net for you</p>
          <p className="text-sm text-[#22302A] mt-1 leading-relaxed">
            Send the same enquiry to <strong>three new certified installers</strong> — nothing to fill in again. We'll also stretch your area a little to find more.
          </p>
        </div>

        <button className="w-full bg-ws-green text-white rounded-btn py-4 font-bold text-base mt-4 hover:bg-ws-dark-green transition-colors">
          Send to 3 new installers →
        </button>
        <Link href={`/get-quotes`} className="block text-center text-sm text-ws-dark-green font-semibold mt-3">
          Tweak my enquiry first
        </Link>
      </div>
    </div>
  )
}
