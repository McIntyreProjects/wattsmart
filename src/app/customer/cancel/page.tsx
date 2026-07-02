'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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

function CancelPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const paymentId = searchParams.get('paymentId')
  const enquiryId = searchParams.get('enquiryId')

  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fetch the real paidAt from the server — do NOT trust the URL param (tamperable).
  const [paidAt, setPaidAt] = useState<Date | null>(null)
  const [paidAtLoading, setPaidAtLoading] = useState(true)

  useEffect(() => {
    if (!paymentId) { setPaidAtLoading(false); return }
    fetch(`/api/payments/paid-at?paymentId=${encodeURIComponent(paymentId)}`)
      .then(r => r.json())
      .then(json => {
        if (json.paidAt) setPaidAt(new Date(json.paidAt))
      })
      .catch(() => { /* leave paidAt null — defaults to full refund */ })
      .finally(() => setPaidAtLoading(false))
  }, [paymentId])

  const depositParam = searchParams.get('deposit')
  const depositAmount = depositParam ? parseFloat(depositParam) : 250
  const withinCoolingOff = paidAt
    ? (Date.now() - paidAt.getTime()) < 14 * 24 * 60 * 60 * 1000
    : true // default to full refund if unknown or still loading

  const wattsmart5pct = Math.round(depositAmount * 0.05 * 100) / 100
  const refundAmount = withinCoolingOff ? depositAmount : depositAmount - wattsmart5pct

  // Installer details from params (safe to show post-cooling-off)
  const installerName = searchParams.get('installerName') || 'Your installer'
  const installerPhone = searchParams.get('installerPhone') || null
  const installerEmail = searchParams.get('installerEmail') || null

  const handleCancel = async () => {
    if (!paymentId) {
      setError('Missing payment reference. Please go back to your dashboard.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Refund failed')
      const params = new URLSearchParams({
        refund: refundAmount.toFixed(2),
        deposit: depositAmount.toFixed(2),
        fee: withinCoolingOff ? '0' : wattsmart5pct.toFixed(2),
      })
      router.push(`/customer/refund-confirmed?${params.toString()}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (paidAtLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ws-bg">
        <p className="text-sm text-ws-muted">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ws-bg">
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
              You&apos;re within your 14-day cooling-off period — your legal right under UK consumer law — and your install isn&apos;t confirmed yet, so you get a full refund, no questions asked.
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
              <p className="text-xs text-ws-muted mt-2">Back to your card in 3–5 working days.</p>
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

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>
            )}

            <button
              onClick={handleCancel}
              disabled={loading}
              className="w-full bg-ws-green text-white rounded-btn py-3.5 font-bold text-sm hover:bg-ws-green-deep transition-colors mb-3 disabled:opacity-60"
            >
              {loading ? 'Processing…' : `Yes, cancel & refund £${refundAmount.toFixed(2)}`}
            </button>
            <Link href="/customer/dashboard" className="block text-center text-sm font-semibold text-ws-muted py-2">
              Keep my booking
            </Link>

            <p className="text-xs text-ws-muted mt-4 leading-relaxed">
              The 14-day cooling-off period is your legal right under the Consumer Contracts Regulations 2013 — it runs from the day you pay your deposit, and WattSmart handles the refund process for you. After it ends, WattSmart&apos;s 5% fee is non-refundable. Your other statutory rights (including under RECC) are never affected.
            </p>
          </div>
        ) : (
          /* After 14-day cooling-off period */
          <div>
            <h1 className="font-display font-extrabold text-2xl tracking-tight mb-1">Cancel your confirmed install?</h1>
            <p className="text-sm text-ws-muted leading-relaxed mb-6">
              You&apos;re past the 14-day cooling-off period (which runs from when you paid your deposit). You can still cancel, but you&apos;ll lose part of your deposit. Here&apos;s exactly what.
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
                <span className="text-ws-muted">Your installer&apos;s charges</span>
                <span className="text-ws-red-text">– varies</span>
              </div>
              <div className="border-t border-ws-border pt-2 flex justify-between text-xs text-ws-muted">
                <span>You&apos;ll lose at least</span>
                <span className="font-bold text-ws-red-text">£{wattsmart5pct.toFixed(2)}</span>
              </div>
            </div>

            <div className="border border-ws-amber-border bg-ws-amber-bg rounded-tile p-4 text-xs text-ws-amber-text leading-relaxed mb-5">
              You and your installer both agreed to this in WattSmart&apos;s Terms of Use when the install was confirmed. Any installer charges, and any statutory cooling-off rights, are settled directly with them.
            </div>

            <p className="text-sm font-semibold mb-2">Contact your installer</p>
            <div className="border border-ws-border rounded-tile p-4 mb-5 text-sm bg-white">
              <p className="font-bold mb-1">{installerName}</p>
              {installerPhone && <p className="text-ws-muted">✆ {installerPhone}</p>}
              {installerEmail && <p className="text-ws-muted">✉ {installerEmail}</p>}
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>
            )}

            <button
              onClick={handleCancel}
              disabled={loading}
              className="w-full border-2 border-ws-red-text text-ws-red-text rounded-btn py-3.5 font-bold text-sm hover:bg-ws-red-bg transition-colors mb-3 disabled:opacity-60"
            >
              {loading ? 'Processing…' : 'Continue to cancel'}
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

export default function CancelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ws-bg" />}>
      <CancelPageInner />
    </Suspense>
  )
}
