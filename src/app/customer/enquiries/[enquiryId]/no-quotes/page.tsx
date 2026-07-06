import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

export default async function NoQuotesPage() {
  return (
    <div className="min-h-screen bg-ws-bg font-body text-ws-ink">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between pb-4">
          <Logo />
          <span className="w-8 h-8 rounded-full bg-ws-green-tint text-ws-dark-green flex items-center justify-center font-bold text-sm">SM</span>
        </div>

        <div className="w-16 h-16 rounded-2xl bg-[#F2F6F3] flex items-center justify-center text-3xl mt-6">📭</div>
        <h1 className="font-display font-extrabold text-3xl tracking-tight leading-tight mt-4">No quotes this time</h1>
        <p className="text-sm text-[#56635C] mt-3 leading-relaxed">
          None of the three installers we matched you with were able to quote — sometimes they're at capacity or just outside your area. It's not you, and you've paid nothing.
        </p>

        {/* Re-match offer */}
        <div className="bg-[#F1FAF5] border border-[#CDE6D7] rounded-tile p-4 mt-4">
          <p className="font-bold text-sm text-ws-dark-green">We'll widen the net for you</p>
          <p className="text-sm text-[#22302A] mt-1 leading-relaxed">
            Get in touch and we'll send the same enquiry to <strong>new certified installers</strong> — nothing to fill in again. We'll also stretch your area a little to find more.
          </p>
        </div>

        <Link
          href="/contact"
          className="block w-full text-center bg-ws-green text-white rounded-btn py-4 font-bold text-base mt-4 hover:bg-ws-dark-green transition-colors"
        >
          Ask us to widen the search →
        </Link>
        <Link href={`/get-quotes`} className="block text-center text-sm text-ws-dark-green font-semibold mt-3">
          Tweak my enquiry first
        </Link>
      </div>
    </div>
  )
}
