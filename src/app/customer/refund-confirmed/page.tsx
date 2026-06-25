import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

export default function RefundConfirmedPage() {
  return (
    <div className="min-h-screen" style={{ background: '#E7EAE7' }}>
      <nav className="bg-white border-b border-ws-border">
        <div className="max-w-content mx-auto px-5 py-4">
          <Logo />
        </div>
      </nav>

      <main className="max-w-[420px] mx-auto px-5 py-10">
        <div className="w-12 h-12 rounded-full bg-[#EAF5EE] flex items-center justify-center mb-5">
          <span className="text-ws-green text-xl font-bold">✓</span>
        </div>
        <h1 className="font-display font-extrabold text-2xl tracking-tight mb-2">Your refund is confirmed</h1>
        <p className="text-sm text-ws-muted leading-relaxed mb-6">
          WattSmart has returned its 5% (£12.50) to your Visa ending 4471; your installer returns their 95% (£237.50) within 14 days.
        </p>

        <div className="border border-ws-border rounded-tile overflow-hidden mb-5 bg-white">
          {[
            { label: 'Cancellation confirmed', detail: 'Today · 9:32am', done: true },
            { label: 'Refund issued', detail: 'Today · 9:33am · to Visa ending 4471', done: true },
          ].map((step, i, arr) => (
            <div key={step.label} className={`flex items-start gap-3 px-4 py-3.5 ${i < arr.length - 1 ? 'border-b border-[#EDF1EE]' : ''}`}>
              <span className="w-5 h-5 rounded-full bg-[#EAF5EE] flex items-center justify-center text-ws-green text-xs flex-shrink-0 mt-0.5">✓</span>
              <div>
                <p className="text-sm font-semibold">{step.label}</p>
                <p className="text-xs text-ws-muted">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#F2F6F3] rounded-tile p-4 mb-6 text-sm text-ws-muted leading-relaxed">
          Most banks show a refund within 3–5 working days. We've confirmed it from our side — your bank handles the rest.<br /><br />
          A confirmation email and receipt are in your inbox — and saved to Documents.
        </div>

        <Link href="/" className="block w-full text-center bg-ws-green text-white rounded-btn py-3.5 font-bold text-sm hover:bg-ws-green-deep transition-colors">
          Back to home
        </Link>
      </main>
    </div>
  )
}
