'use client'

import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Stars } from '@/components/ui/Stars'
import { formatCurrency } from '@/lib/utils'
import type { Quote } from '@/types'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface EnquiryData {
  reference: string
  recommended_system_kwp?: number
}

interface InstallerData {
  id: string
  company_name: string
  contact_name: string
  contact_email: string
  contact_phone: string
}

interface Review {
  id: string
  source: string
  rating: number
  review_text_anonymised: string
  reviewer_date: string
}

// Inner form rendered inside <Elements> — has access to stripe/elements hooks
function DepositForm({
  depositAmount,
  onSuccess,
}: {
  depositAmount: number
  onSuccess: (installer: InstallerData) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
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

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message || 'Payment failed')
      setLoading(false)
      return
    }

    // Payment authorised — now reveal the installer
    const res = await fetch('/api/payments/reveal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntentId: paymentIntent?.id }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok || !data.installer) {
      setError(data.error || 'Something went wrong after payment')
      return
    }

    onSuccess(data.installer)
  }

  return (
    <Card>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-ws-muted">Deposit to pay now</span>
        <span className="font-semibold text-ws-ink">{formatCurrency(depositAmount)}</span>
      </div>
      <div className="flex items-center gap-2 mb-4 text-xs text-ws-muted">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        Processed securely by Stripe — change your mind within 14 days for a full refund, your legal right under UK consumer law
      </div>

      <div className="mb-4">
        <PaymentElement />
      </div>

      {error && <p className="text-xs text-[#C2603F] mb-3">{error}</p>}

      <Button onClick={handlePay} loading={loading} className="w-full">
        Pay {formatCurrency(depositAmount)} & confirm →
      </Button>
    </Card>
  )
}

export function QuoteComparison({ enquiryId }: { enquiryId: string }) {
  const [enquiry, setEnquiry] = useState<EnquiryData | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)

  // After "Choose" — waiting to pay
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [depositAmount, setDepositAmount] = useState(0)
  const [selecting, setSelecting] = useState<string | null>(null)
  const [selectError, setSelectError] = useState<string | null>(null)

  // After payment — show installer
  const [installer, setInstaller] = useState<InstallerData | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewTab, setReviewTab] = useState<'google' | 'trustpilot'>('google')

  useEffect(() => {
    fetch(`/api/quotes/${enquiryId}`)
      .then(r => r.json())
      .then(d => {
        setEnquiry(d.enquiry)
        setQuotes(d.quotes || [])
        setLoading(false)
      })
  }, [enquiryId])

  const handleSelect = async (quote: Quote) => {
    setSelecting(quote.id)
    setSelectError(null)
    const res = await fetch('/api/quotes/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: quote.id }),
    })
    const data = await res.json()
    setSelecting(null)
    if (!res.ok) {
      setSelectError('Failed to select quote. Please try again.')
      return
    }

    setSelectedQuote(quote)
    setClientSecret(data.clientSecret)
    setDepositAmount(data.depositAmount)
  }

  const handlePaymentSuccess = async (revealedInstaller: InstallerData) => {
    setInstaller(revealedInstaller)
    // Fetch reviews once installer is known
    const r = await fetch('/api/reviews/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ installerId: revealedInstaller.id, source: 'google' }),
    })
    const d = await r.json()
    setReviews(d.reviews || [])
    setReviewTab(d.reviews?.some((rv: Review) => rv.source === 'google') ? 'google' : 'trustpilot')
  }

  if (loading) {
    return <p className="text-ws-muted py-16 text-center text-sm">Loading quotes…</p>
  }

  if (!quotes.length) {
    return (
      <div className="py-16 text-center">
        <p className="text-ws-body mb-1 font-medium">Your quotes aren&apos;t ready yet.</p>
        <p className="text-sm text-ws-muted">Installers have 5 days to submit. We&apos;ll email you when they&apos;re in.</p>
      </div>
    )
  }

  // Post-payment: installer revealed
  if (installer) {
    return (
      <div>
        <div className="mb-8">
          <p className="eyebrow mb-2">All confirmed</p>
          <h1 className="text-2xl font-bold text-ws-ink mb-2" style={{ fontFamily: 'var(--font-bricolage), sans-serif', letterSpacing: '-0.02em' }}>
            Here&apos;s who you&apos;ll be working with.
          </h1>
          <p className="text-sm text-ws-muted">Your deposit is paid securely through WattSmart. Expect to hear from them within three working days.</p>
        </div>

        <Card className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white" style={{ background: '#15A05A' }}>
              {installer.company_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-ws-ink">{installer.company_name}</div>
              <div className="text-sm text-ws-muted">{installer.contact_name}</div>
            </div>
          </div>
          <div className="text-sm space-y-1.5">
            <div><span className="text-ws-muted">Email: </span><a href={`mailto:${installer.contact_email}`} className="text-ws-green font-medium">{installer.contact_email}</a></div>
            <div><span className="text-ws-muted">Phone: </span><a href={`tel:${installer.contact_phone}`} className="text-ws-green font-medium">{installer.contact_phone}</a></div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-ws-border">
            {['MCS certified', 'RECC member', 'WattSmart verified'].map(badge => (
              <span key={badge} className="text-xs px-2.5 py-0.5 rounded-pill font-semibold" style={{ background: '#EAF5EE', color: '#0E7A43', border: '1px solid rgba(21,160,90,0.2)' }}>
                {badge}
              </span>
            ))}
          </div>
        </Card>

        {reviews.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ws-ink">Reviews</h2>
              <div className="flex border border-ws-border rounded-btn overflow-hidden">
                {(['google', 'trustpilot'] as const).map(tab => (
                  <button key={tab} onClick={() => setReviewTab(tab)} className="px-3 py-1.5 text-sm capitalize transition-colors font-medium" style={{ background: reviewTab === tab ? '#15A05A' : '#fff', color: reviewTab === tab ? '#fff' : '#7C887F' }}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-ws-muted mb-4">Installer name removed from all reviews</p>
            <div className="space-y-3">
              {reviews.filter(r => r.source === reviewTab).map(review => (
                <Card key={review.id}>
                  <div className="flex items-center justify-between mb-2">
                    <Stars rating={review.rating} />
                    <span className="text-xs text-ws-muted">{new Date(review.reviewer_date).toLocaleDateString('en-GB')}</span>
                  </div>
                  <p className="text-sm text-ws-body leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: (review.review_text_anonymised || '')
                        .replace(/\[installer name removed\]/g, '<span class="pill-redacted">[installer name removed]</span>')
                    }}
                  />
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Awaiting payment: show Stripe form
  if (selectedQuote && clientSecret) {
    return (
      <div>
        <div className="mb-6">
          <p className="eyebrow mb-2">Secure your slot</p>
          <h1 className="text-2xl font-bold text-ws-ink mb-2" style={{ fontFamily: 'var(--font-bricolage), sans-serif', letterSpacing: '-0.02em' }}>
            Pay your deposit.
          </h1>
          <p className="text-sm text-ws-muted mb-1">
            Your installer&apos;s identity is revealed once payment is confirmed. You have full cooling-off rights before installation.
          </p>
        </div>

        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
          <DepositForm depositAmount={depositAmount} onSuccess={handlePaymentSuccess} />
        </Elements>
      </div>
    )
  }

  // Default: quote list
  const closestQuote = quotes.reduce((best, q) => {
    const diff = Math.abs((q.system_kwp || 0) - (enquiry?.recommended_system_kwp || 0))
    const bestDiff = Math.abs((best.system_kwp || 0) - (enquiry?.recommended_system_kwp || 0))
    return diff < bestDiff ? q : best
  }, quotes[0])

  return (
    <div>
      <p className="eyebrow mb-2">Your quotes</p>
      <h1 className="text-3xl font-bold text-ws-ink mb-2" style={{ fontFamily: 'var(--font-bricolage), sans-serif', letterSpacing: '-0.02em' }}>
        Compare your quotes.
      </h1>
      <p className="text-sm text-ws-muted mb-1">
        Every installer quoting is MCS certified and independently verified by WattSmart. None of them can contact you directly.
      </p>
      <p className="text-xs text-ws-muted mb-8">{enquiry?.reference}</p>

      {selectError && (
        <p className="text-xs text-[#C2603F] mb-4">{selectError}</p>
      )}

      <div className="space-y-4">
        {quotes.map(q => (
          <Card key={q.id} className="relative">
            {q.id === closestQuote.id && (
              <div className="absolute -top-2.5 left-5 text-xs px-3 py-0.5 rounded-pill font-semibold" style={{ background: '#EAF5EE', color: '#0E7A43', border: '1px solid rgba(21,160,90,0.3)' }}>
                Closest to your spec
              </div>
            )}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[11px] text-ws-muted uppercase tracking-wider font-semibold">Quote {q.label}</div>
                <div className="text-2xl font-bold text-ws-ink mt-0.5" style={{ fontFamily: 'var(--font-bricolage), sans-serif', letterSpacing: '-0.02em' }}>
                  {formatCurrency(q.total_price)}
                </div>
                <div className="text-sm text-ws-muted">Deposit: {formatCurrency(q.deposit_amount)}</div>
              </div>
              <Button onClick={() => handleSelect(q)} size="sm" loading={selecting === q.id} disabled={!!selecting}>
                Choose {q.label} →
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
              {q.panel_count && <div><span className="text-ws-muted">Panels: </span><span className="text-ws-body">{q.panel_count}</span></div>}
              {q.system_kwp  && <div><span className="text-ws-muted">System: </span><span className="text-ws-body">{q.system_kwp} kWp</span></div>}
              {q.battery_kwh && <div><span className="text-ws-muted">Battery: </span><span className="text-ws-body">{q.battery_kwh} kWh</span></div>}
              <div><span className="text-ws-muted">Timeframe: </span><span className="text-ws-body">{q.estimated_install_timeframe}</span></div>
              {q.panel_brand    && <div><span className="text-ws-muted">Panels: </span><span className="text-ws-body">{q.panel_brand}</span></div>}
              {q.inverter_brand && <div><span className="text-ws-muted">Inverter: </span><span className="text-ws-body">{q.inverter_brand}</span></div>}
            </div>

            {q.additional_notes && (
              <p className="mt-3 text-sm text-ws-muted border-t border-ws-border pt-3">{q.additional_notes}</p>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
