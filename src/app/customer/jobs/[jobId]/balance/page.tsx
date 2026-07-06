'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// All amounts from the API are in integer PENCE — convert to pounds for display
function formatGBP(pence: number) {
  return '£' + (pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function BalanceForm({
  balanceAmount,
  jobId,
}: {
  balanceAmount: number
  jobId: string
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePay = async () => {
    if (!stripe || !elements) return
    setLoading(true)
    setError('')

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message || 'Card error')
      setLoading(false)
      return
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message || 'Payment failed')
      setLoading(false)
      return
    }

    router.push(`/customer/jobs/${jobId}?paid=balance`)
  }

  return (
    <div>
      <div className="mb-4">
        <PaymentElement />
      </div>

      {error && <p className="text-xs text-[#C2603F] mb-3">{error}</p>}

      <button
        onClick={handlePay}
        disabled={loading || !stripe}
        className="w-full bg-ws-green text-white rounded-btn py-4 font-bold text-base hover:bg-ws-dark-green transition-colors disabled:opacity-60"
      >
        {loading ? 'Processing…' : `Pay ${formatGBP(balanceAmount)} securely`}
      </button>
      <p className="text-center text-xs text-ws-subtle mt-3">
        🔒 <span className="font-semibold">Stripe</span> · keep everything in one place
      </p>
    </div>
  )
}

export default function PayBalancePage() {
  const params = useParams()
  const jobId = params.jobId as string

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [balanceAmount, setBalanceAmount] = useState<number | null>(null)
  const [totalPrice, setTotalPrice] = useState<number | null>(null)
  const [depositPaid, setDepositPaid] = useState<number | null>(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/payments/create-balance-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId }),
        })
        const data = await res.json()
        if (!res.ok) {
          setLoadError(data.error || 'Could not load payment details')
          return
        }
        setClientSecret(data.clientSecret)
        setBalanceAmount(data.balanceAmount)
        setTotalPrice(data.totalPrice)
        setDepositPaid(data.depositPaid)
      } catch {
        setLoadError('Could not connect to payment service')
      }
    }
    init()
  }, [jobId])

  return (
    <div className="min-h-screen bg-ws-bg font-body text-ws-ink">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Link href={`/customer/jobs/${jobId}`} className="text-ws-muted text-lg">←</Link>
          <h1 className="font-display font-extrabold text-2xl tracking-tight">Pay your balance</h1>
        </div>

        {loadError ? (
          <div className="bg-red-50 border border-red-200 rounded-tile px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        ) : !clientSecret ? (
          <div className="text-sm text-ws-muted py-8 text-center">Loading payment details…</div>
        ) : (
          <>
            {/* Breakdown */}
            <div className="border border-ws-border rounded-tile p-4 mb-4">
              {totalPrice !== null && (
                <div className="flex justify-between text-sm text-ws-muted">
                  <span>Total job</span>
                  <span>{formatGBP(totalPrice)}</span>
                </div>
              )}
              {depositPaid !== null && (
                <div className="flex justify-between text-sm text-ws-muted mt-2">
                  <span>Deposit paid</span>
                  <span>−{formatGBP(depositPaid)}</span>
                </div>
              )}
              {balanceAmount !== null && (
                <div className="flex justify-between items-baseline mt-3 pt-3 border-t border-ws-border">
                  <span className="font-bold text-sm">Balance now</span>
                  <span className="font-display font-extrabold text-3xl">{formatGBP(balanceAmount)}</span>
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="bg-[#F2F6F3] rounded-tile p-4 mb-5">
              <p className="eyebrow mb-3">How your payment works</p>
              <div className="flex flex-col gap-2 text-sm text-[#3D463F]">
                <div className="flex gap-2"><span className="text-ws-green">●</span>Paid securely via Stripe — one payment.</div>
                <div className="flex gap-2"><span className="text-ws-green">●</span>Split automatically: your installer paid instantly, WattSmart&apos;s fee taken at source.</div>
                <div className="flex gap-2"><span className="text-ws-green">●</span>We never hold the balance — and you get an instant receipt.</div>
              </div>
            </div>

            {/* Stripe Elements */}
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
              <BalanceForm balanceAmount={balanceAmount!} jobId={jobId} />
            </Elements>
          </>
        )}
      </div>
    </div>
  )
}
