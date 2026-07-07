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
  // Cert types from the certifications table with status='verified',
  // returned by /api/payments/reveal. Badges render only from this list.
  verified_certifications?: string[]
}

// certifications.type → customer-facing badge label. Anything not in this
// map (or not verified) never renders as a badge.
const CERT_BADGE_LABELS: Record<string, string> = {
  mcs: 'MCS certified',
  recc: 'RECC member',
  hies: 'HIES member',
  niceic: 'NICEIC registered',
  napit: 'NAPIT registered',
  ozev: 'OZEV authorised',
  trustmark: 'TrustMark registered',
}

// Pre-payment disclosure returned by /api/quotes/select (UK Consumer
// Contracts Regulations): the customer must see who they're contracting
// with, their address, terms and cancellation rights BEFORE paying.
interface DisclosureData {
  quoteId: string
  installer: {
    company_name: string
    business_address: string
    contact_name: string
    contact_email: string
    contact_phone: string
    companies_house_number: string | null
    verified_certifications: string[]
  }
  termsHref: string
  depositAmount: number
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

  // After "Choose" — disclosure step, then waiting to pay
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [disclosure, setDisclosure] = useState<DisclosureData | null>(null)
  const [ackChecked, setAckChecked] = useState(false)
  const [acknowledging, setAcknowledging] = useState(false)
  const [ackError, setAckError] = useState<string | null>(null)
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

  const INCOMPLETE_MSG =
    "We can't take a payment for this quote yet — this installer's details are incomplete. We've been alerted and will sort it out; the other quotes are still available."

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
      // 409 installer_details_incomplete: nothing changed server-side —
      // leave the customer on the list with the other quotes selectable.
      setSelectError(data.error === 'installer_details_incomplete' ? INCOMPLETE_MSG : 'Failed to select quote. Please try again.')
      return
    }

    // Selecting no longer creates a payment — show the CCR disclosure step
    // first. The PaymentIntent is only created by /api/quotes/acknowledge.
    setSelectedQuote(quote)
    setDisclosure(data)
    setDepositAmount(data.depositAmount)
    setAckChecked(false)
    setAckError(null)
  }

  const handleAcknowledge = async () => {
    if (!disclosure || !ackChecked) return
    setAcknowledging(true)
    setAckError(null)
    const res = await fetch('/api/quotes/acknowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: disclosure.quoteId }),
    })
    const data = await res.json()
    setAcknowledging(false)
    if (!res.ok) {
      if (data.error === 'installer_details_incomplete') {
        // Back to the quote list — the other quotes remain selectable.
        setSelectedQuote(null)
        setDisclosure(null)
        setSelectError(INCOMPLETE_MSG)
        return
      }
      setAckError('Something went wrong — please try again. You have not been charged.')
      return
    }
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
            {[
              // Only certs this installer verifiably holds.
              ...(installer.verified_certifications || [])
                .map(type => CERT_BADGE_LABELS[type])
                .filter((label): label is string => Boolean(label)),
              // An installer can only reach the reveal step if their account
              // is active, i.e. approved by WattSmart — so this is always true here.
              'WattSmart verified',
            ].map(badge => (
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

  // Disclosure step (UK Consumer Contracts Regulations): the installer's
  // identity, address, terms and cancellation rights, acknowledged BEFORE
  // any payment form is shown. /api/quotes/acknowledge records the
  // acknowledgement and only then returns a clientSecret.
  if (selectedQuote && disclosure) {
    const d = disclosure.installer
    const certBadges = (d.verified_certifications || [])
      .map(type => CERT_BADGE_LABELS[type])
      .filter((label): label is string => Boolean(label))

    return (
      <div>
        <div className="mb-6">
          <p className="eyebrow mb-2">Before you pay</p>
          <h1 className="text-2xl font-bold text-ws-ink mb-2" style={{ fontFamily: 'var(--font-bricolage), sans-serif', letterSpacing: '-0.02em' }}>
            Who you&apos;re dealing with.
          </h1>
          <p className="text-sm text-ws-muted mb-1">
            UK consumer law says you must see these details before paying a deposit — take a minute to read them.
          </p>
        </div>

        <Card className="mb-4">
          <h2 className="font-semibold text-ws-ink text-lg mb-3">{d.company_name}</h2>
          <div className="text-sm space-y-1.5 mb-3">
            <div>
              <span className="text-ws-muted">Business address: </span>
              <span className="text-ws-body whitespace-pre-line">{d.business_address}</span>
            </div>
            <div><span className="text-ws-muted">Contact: </span><span className="text-ws-body">{d.contact_name}</span></div>
            <div><span className="text-ws-muted">Email: </span><span className="text-ws-body">{d.contact_email}</span></div>
            <div><span className="text-ws-muted">Phone: </span><span className="text-ws-body">{d.contact_phone}</span></div>
            {d.companies_house_number && (
              <div><span className="text-ws-muted">Companies House number: </span><span className="text-ws-body">{d.companies_house_number}</span></div>
            )}
          </div>
          {certBadges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {certBadges.map(badge => (
                <span key={badge} className="text-xs px-2.5 py-0.5 rounded-pill font-semibold" style={{ background: '#EAF5EE', color: '#0E7A43', border: '1px solid rgba(21,160,90,0.2)' }}>
                  {badge}
                </span>
              ))}
            </div>
          )}
          <a
            href={disclosure.termsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm font-semibold text-ws-dark-green hover:underline"
          >
            Read {d.company_name}&apos;s terms &amp; conditions →
          </a>
        </Card>

        <Card className="mb-4">
          <h2 className="font-semibold text-ws-ink mb-2">Your right to cancel</h2>
          <ul className="text-sm text-ws-body space-y-1.5 list-disc pl-5 mb-3">
            <li>You have a 14-day cooling-off period, starting the day you pay your deposit.</li>
            <li>You can cancel by emailing <a href="mailto:hello@wattsmart.co.uk" className="text-ws-green font-medium">hello@wattsmart.co.uk</a> or from your dashboard.</li>
            <li>If you cancel within the period, you get a full refund.</li>
            <li>If you ask for work to begin within the 14 days, you may owe for work already done.</li>
            <li>Your statutory rights are unaffected.</li>
          </ul>
          <details className="text-sm">
            <summary className="cursor-pointer font-semibold text-ws-dark-green">Model cancellation form</summary>
            <div className="mt-2 border border-ws-border rounded-btn p-4 text-ws-body bg-ws-bg whitespace-pre-line text-xs leading-relaxed">
              {`To ${d.company_name}, ${d.business_address}:

I/We hereby give notice that I/We cancel my/our contract for the supply of the following service,

Ordered on [date],

Name of consumer(s),

Address of consumer(s),

Signature of consumer(s) (only if this form is notified on paper),

Date`}
            </div>
          </details>
        </Card>

        <Card>
          <label className="flex items-start gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={ackChecked}
              onChange={e => setAckChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#15A05A] flex-shrink-0"
            />
            <span className="text-sm text-ws-body">
              I&apos;ve read {d.company_name}&apos;s details and terms, and I understand my cancellation rights.
            </span>
          </label>

          <div className="flex justify-between text-sm mb-4">
            <span className="text-ws-muted">Deposit to pay next</span>
            <span className="font-semibold text-ws-ink">{formatCurrency(disclosure.depositAmount)}</span>
          </div>

          {ackError && <p className="text-xs text-[#C2603F] mb-3">{ackError}</p>}

          <Button onClick={handleAcknowledge} loading={acknowledging} disabled={!ackChecked} className="w-full">
            Continue to payment →
          </Button>
        </Card>
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
        Every installer quoting holds the certifications required for this work, checked by WattSmart before they go live. None of them can contact you directly.
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
