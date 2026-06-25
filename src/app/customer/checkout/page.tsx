'use client'
import { useState } from 'react'
import { Logo } from '@/components/ui/Logo'
import Link from 'next/link'

export default function CheckoutPage() {
  const [failed, setFailed] = useState(false)
  const depositAmount = 250
  const quoteLabel = 'B'
  const totalPrice = 8990

  if (failed) {
    return (
      <div className="min-h-screen" style={{ background: '#E7EAE7' }}>
        <nav className="bg-white border-b border-ws-border">
          <div className="max-w-content mx-auto px-5 py-4"><Logo /></div>
        </nav>
        <main className="max-w-[420px] mx-auto px-5 py-10">
          <div className="w-12 h-12 rounded-full bg-ws-red-bg border border-ws-red-text/20 flex items-center justify-center mb-5">
            <span className="text-ws-red-text text-xl">!</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl tracking-tight mb-2">Payment didn't go through</h1>
          <p className="text-sm text-ws-muted leading-relaxed mb-5">
            Your bank declined the £{depositAmount} deposit. <strong>Nothing has been taken from your account.</strong>
          </p>

          <div className="border border-ws-border rounded-tile p-4 mb-4 bg-white">
            <p className="text-xs text-ws-muted font-semibold mb-1">Reason from your bank</p>
            <p className="text-sm">Card declined — issuer didn't authorise it. This is usually a quick fix; most cards work on a second try.</p>
          </div>

          <div className="bg-[#EAF5EE] border border-[#CDE6D7] rounded-tile p-4 mb-5 text-sm text-ws-green-deep">
            ✓ Quote {quoteLabel} is still held for you. We've paused the clock — 13 days left to secure it. No rush.
          </div>

          <div className="flex flex-col gap-2 mb-5">
            <button
              onClick={() => setFailed(false)}
              className="w-full bg-ws-green text-white rounded-btn py-3.5 font-bold text-sm hover:bg-ws-green-deep transition-colors"
            >
              Try payment again
            </button>
            <button className="w-full border-2 border-ws-border rounded-btn py-3.5 font-semibold text-sm text-ws-body hover:bg-[#F2F6F3] transition-colors">
              Use a different card
            </button>
            <button className="w-full border-2 border-ws-border rounded-btn py-3.5 font-semibold text-sm text-ws-body hover:bg-[#F2F6F3] transition-colors">
              Pay by bank transfer instead
            </button>
          </div>

          <p className="text-xs text-ws-muted leading-relaxed">
            Still stuck? A declined card is between you and your bank — they can authorise it, or use another method above.
          </p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#E7EAE7' }}>
      <nav className="bg-white border-b border-ws-border">
        <div className="max-w-content mx-auto px-5 py-4 flex items-center gap-4">
          <Logo />
          <Link href="/customer/dashboard" className="text-sm text-ws-muted">← Back to quotes</Link>
        </div>
      </nav>

      <main className="max-w-[420px] mx-auto px-5 py-10">
        <p className="eyebrow mb-2">Secure checkout</p>
        <h1 className="font-display font-extrabold text-2xl tracking-tight mb-1">Pay your deposit</h1>
        <p className="text-sm text-ws-muted mb-6">Choosing Quote {quoteLabel} · £{totalPrice.toLocaleString()} total</p>

        <div className="bg-white border border-ws-border rounded-tile p-4 mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-ws-muted">Deposit amount</span>
            <span className="font-bold">£{depositAmount}</span>
          </div>
          <div className="flex justify-between text-xs text-ws-muted">
            <span>Split: 95% to installer · 5% to WattSmart</span>
            <span>via Stripe</span>
          </div>
        </div>

        <div className="bg-[#EAF5EE] border border-[#CDE6D7] rounded-tile p-4 mb-5 text-xs text-ws-green-deep leading-relaxed">
          Paid through Stripe and split instantly — WattSmart never holds your money. Your 95% goes straight to your chosen installer.
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="border border-yellow-300 bg-yellow-50 rounded-tile p-3 mb-4 text-xs font-mono text-yellow-800">
            <span className="font-bold">TEST CARD</span> · 4242 4242 4242 4242 · any future expiry · any CVC
          </div>
        )}

        <div className="bg-white border border-ws-border rounded-tile p-4 mb-4">
          <label className="block text-xs font-semibold mb-2 text-ws-muted uppercase tracking-wide">Card number</label>
          <input type="text" placeholder="4242 4242 4242 4242" className="w-full border border-ws-border rounded-btn px-3 py-2.5 text-sm mb-3 focus:outline-none focus:border-ws-green" />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold mb-1.5 text-ws-muted uppercase tracking-wide">Expiry</label>
              <input type="text" placeholder="MM / YY" className="w-full border border-ws-border rounded-btn px-3 py-2.5 text-sm focus:outline-none focus:border-ws-green" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold mb-1.5 text-ws-muted uppercase tracking-wide">CVC</label>
              <input type="text" placeholder="123" className="w-full border border-ws-border rounded-btn px-3 py-2.5 text-sm focus:outline-none focus:border-ws-green" />
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2.5 mb-5">
          <input type="checkbox" id="terms" className="mt-0.5" />
          <label htmlFor="terms" className="text-xs text-ws-muted leading-relaxed">
            I confirm I've read Quote {quoteLabel}'s full spec and the installer's terms &amp; conditions.
          </label>
        </div>

        <button
          onClick={() => setFailed(true)}
          className="w-full bg-ws-green text-white rounded-btn py-4 font-bold text-sm hover:bg-ws-green-deep transition-colors mb-3"
        >
          Pay £{depositAmount} securely
        </button>

        <p className="text-xs text-ws-muted text-center leading-relaxed">
          🔒 Secured by Stripe. Fully refundable within 14 days (cooling-off). After 14 days, WattSmart's 5% is non-refundable.
        </p>
      </main>
    </div>
  )
}
