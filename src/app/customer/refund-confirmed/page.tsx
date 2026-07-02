'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

function RefundConfirmedInner() {
  const searchParams = useSearchParams()
  const refundParam = searchParams.get('refund')
  const feeParam = searchParams.get('fee')

  const hasDetails = refundParam !== null

  const refundAmount = refundParam ? parseFloat(refundParam) : null
  const feeAmount = feeParam ? parseFloat(feeParam) : null
  const showFee = feeAmount !== null && feeAmount > 0

  return (
    <div className="min-h-screen bg-ws-bg">
      <nav className="bg-white border-b border-ws-border">
        <div className="max-w-content mx-auto px-5 py-4">
          <Logo />
        </div>
      </nav>

      <main className="max-w-[420px] mx-auto px-5 py-10">
        <div className="w-12 h-12 rounded-full bg-[#EAF5EE] flex items-center justify-center mb-5 mx-auto">
          <span className="text-ws-green text-xl font-bold">✓</span>
        </div>
        <h1 className="font-display font-extrabold text-2xl tracking-tight mb-2 text-center">Your refund is confirmed</h1>
        {hasDetails ? (
          <p className="text-sm text-ws-muted leading-relaxed mb-6 text-center">
            {showFee
              ? `WattSmart has retained its 5% fee (£${feeAmount!.toFixed(2)}). Your refund of £${refundAmount!.toFixed(2)} will appear on your card within 3–5 working days.`
              : `Your full refund of £${refundAmount!.toFixed(2)} will appear on your card within 3–5 working days.`
            }
          </p>
        ) : (
          <p className="text-sm text-ws-muted leading-relaxed mb-6 text-center">
            Your refund has been processed and will appear on your card within 3–5 working days.
          </p>
        )}

        <div className="border border-ws-border rounded-tile overflow-hidden mb-5 bg-white">
          {[
            { label: 'Cancellation confirmed', detail: 'Today' },
            { label: 'Refund issued', detail: hasDetails ? `£${refundAmount!.toFixed(2)} · back to your card` : 'Back to your card' },
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
          Most banks show a refund within 3–5 working days. We&apos;ve confirmed it from our side — your bank handles the rest.
        </div>

        <Link href="/" className="block w-full text-center bg-ws-green text-white rounded-btn py-3.5 font-bold text-sm hover:bg-ws-green-deep transition-colors">
          Back to home
        </Link>
      </main>
    </div>
  )
}

export default function RefundConfirmedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ws-bg" />}>
      <RefundConfirmedInner />
    </Suspense>
  )
}
