'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

const CANCEL_REASONS = [
  'Changed my mind',
  'Found my own installer',
  'Quotes were too expensive',
  'Timeline doesn\'t suit me',
  'Property circumstances changed',
  'Other',
]

export default function CancelPage() {
  const [reason, setReason] = useState('')
  const [confirming, setConfirming] = useState(false)

  // In production, check if within 14-day cooling-off period from DB
  const withinCoolingOff = true // TODO: derive from payment.paid_at
  const depositAmount = 250
  const wattsmart5pct = Math.round(depositAmount * 0.05 * 100) / 100
  const refundAmount = withinCoolingOff ? depositAmount : depositAmount - wattsmart5pct

  return (
    <div className="min-h-screen" style={{ background: '#E7EAE7' }}>
      <nav className="bg-white border-b border-ws-border">
        <div className="max-w-content mx-auto px-5 py-4 flex items-center gap-4">
          <Logo />
          <Link href="/customer/dashboard" className="text-sm text-ws-muted hover:text-ws-body">
            ← Back to booking
          </Link>
        </div>
      </nav>

      <main className="max-w-[420px] mx-auto px-5 py-10">
        {withinCoolingOff ? (
          /* Within 14-day cooling-off period */
          <div>
            <h1 className="font-display font-extrabold text-2xl tracking-tight mb-1">Cancel this booking?</h1>
            <p className="text-sm text-ws-muted leading-relaxed mb-6">
              You're within your 14-day cooling-off period and your install isn't confirmed yet — so you get a full refund, no questions asked.
            </p>

            <div className="border border-ws-border rounded-tile p-4 mb-5 bg-white">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-ws-muted">Deposit paid</span>
                <span className="font-semibold">£{depositAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-ws-border pt-2 flex justify-between text-sm">
                <span className="text-ws-muted">Your refund</span>
                <span className="font-bold text-ws-green">£{refundAmount.toFixed(2)}</span>
              </div>
              <p className="text-xs text-ws-muted mt-2">Back to your Visa ending 4471 in 3–5 working days.</p>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium mb-1.5">
                Help us improve <span className="text-ws-subtle font-normal">· optional</span>
              </label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full border border-ws-border rounded-btn px-3 py-2.5 text-sm bg-white appearance-none"
              >
                <option value="">Why are you cancelling? ▾</option>
                {CANCEL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="bg-[#F2F6F3] rounded-tile p-4 mb-5 text-sm">
              <p className="font-semibold mb-2">What happens</p>
              <ul className="space-y-1.5 text-ws-muted">
                <li className="flex gap-2"><span className="text-ws-green mt-0.5">●</span>Your booking is released and the installer is unmatched</li>
                <li className="flex gap-2"><span className="text-ws-green mt-0.5">●</span>No WattSmart fee at this stage — every penny comes back to you</li>
                <li className="flex gap-2"><span className="text-ws-green mt-0.5">●</span>A receipt lands in your inbox &amp; Documents</li>
              </ul>
            </div>

            <button
              onClick={() => setConfirming(true)}
              className="w-full bg-ws-green text-white rounded-btn py-3.5 font-bold text-sm hover:bg-ws-green-deep transition-colors mb-3"
            >
              Yes, cancel &amp; refund £{refundAmount.toFixed(2)}
            </button>
            <Link href="/customer/dashboard" className="block text-center text-sm font-semibold text-ws-muted py-2">
              Keep my booking
            </Link>

            <p className="text-xs text-ws-muted mt-4 leading-relaxed">
              Full refund any time within 14 days of paying your deposit — your cooling-off period. After 14 days, WattSmart's 5% is non-refundable. Your statutory rights (Consumer Contracts Regs &amp; RECC) are never affected.
            </p>
          </div>
        ) : (
          /* After 14-day cooling-off period */
          <div>
            <h1 className="font-display font-extrabold text-2xl tracking-tight mb-1">Cancel your confirmed install?</h1>
            <p className="text-sm text-ws-muted leading-relaxed mb-6">
              You're past the 14-day cooling-off period (which runs from when you paid your deposit). You can still cancel, but you'll lose part of your deposit. Here's exactly what.
            </p>

            <div className="border border-ws-border rounded-tile p-4 mb-4 bg-white text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-ws-muted">Deposit paid</span>
                <span className="font-semibold">£{depositAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-ws-muted">WattSmart fee (5%) non-refundable</span>
                <span className="text-ws-red-text">– £{wattsmart5pct.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-ws-muted">Your installer's charges</span>
                <span className="text-ws-red-text">– varies</span>
              </div>
              <div className="border-t border-ws-border pt-2 flex justify-between text-xs text-ws-muted">
                <span>You'll lose at least</span>
                <span className="font-bold text-ws-red-text">£{wattsmart5pct.toFixed(2)}</span>
              </div>
            </div>

            <div className="border border-ws-amber-border bg-ws-amber-bg rounded-tile p-4 text-xs text-ws-amber-text leading-relaxed mb-5">
              You and your installer both agreed to this in WattSmart's Terms of Use when the install was confirmed. Any installer charges, and any statutory cooling-off rights, are settled directly with them.
            </div>

            <p className="text-sm font-semibold mb-2">Contact your installer</p>
            <div className="border border-ws-border rounded-tile p-4 mb-5 text-sm bg-white">
              <p className="font-bold mb-1">Northside Solar Co.</p>
              <p className="text-ws-muted">✆ 0191 555 0142</p>
              <p className="text-ws-muted">✉ hello@northsidesolar.co.uk</p>
            </div>

            <button className="w-full border-2 border-ws-red-text text-ws-red-text rounded-btn py-3.5 font-bold text-sm hover:bg-ws-red-bg transition-colors mb-3">
              Continue to cancel
            </button>
            <Link href="/customer/dashboard" className="block text-center text-sm font-semibold text-ws-green py-2">
              Keep my install
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
