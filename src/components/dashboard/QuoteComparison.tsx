'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Stars } from '@/components/ui/Stars'
import { formatCurrency } from '@/lib/utils'
import type { Quote } from '@/types'

interface EnquiryData {
  reference: string
  recommended_system_kwp?: number
  recommended_panels?: number
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

export function QuoteComparison({ enquiryId }: { enquiryId: string }) {
  const [enquiry, setEnquiry] = useState<EnquiryData | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [installer, setInstaller] = useState<InstallerData | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewTab, setReviewTab] = useState<'google' | 'trustpilot'>('google')

  useEffect(() => {
    const defaultTab = reviews.some(r => r.source === 'google') ? 'google' : 'trustpilot'
    setReviewTab(defaultTab)
  }, [reviews])
  const [depositLoading, setDepositLoading] = useState(false)
  const [paymentDone, setPaymentDone] = useState(false)

  useEffect(() => {
    fetch(`/api/quotes/${enquiryId}`)
      .then(r => r.json())
      .then(d => {
        setEnquiry(d.enquiry)
        setQuotes(d.quotes || [])
        setLoading(false)
      })
  }, [enquiryId])

  const handleSelect = async (quoteId: string) => {
    const res = await fetch('/api/quotes/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId }),
    })
    const data = await res.json()
    if (data.installer) {
      setSelected(quoteId)
      setInstaller(data.installer)
      await fetch('/api/reviews/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installerId: data.installer.id, source: 'google' }),
      }).then(r => r.json()).then(d => setReviews(d.reviews || []))
    }
  }

  const handlePayDeposit = async () => {
    if (!selected) return
    setDepositLoading(true)
    await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: selected }),
    })
    setPaymentDone(true)
    setDepositLoading(false)
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

  const selectedQuote = quotes.find(q => q.id === selected)

  const closestQuote = quotes.reduce((best, q) => {
    const diff = Math.abs((q.system_kwp || 0) - (enquiry?.recommended_system_kwp || 0))
    const bestDiff = Math.abs((best.system_kwp || 0) - (enquiry?.recommended_system_kwp || 0))
    return diff < bestDiff ? q : best
  }, quotes[0])

  return (
    <div>
      {!selected ? (
        <>
          <p className="eyebrow mb-2">Your quotes</p>
          <h1
            className="text-3xl font-bold text-ws-ink mb-2"
            style={{ fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.02em' }}
          >
            Compare your quotes.
          </h1>
          <p className="text-sm text-ws-muted mb-1">
            All three installers are MCS certified and independently verified by WattSmart. None of them can contact you directly.
          </p>
          <p className="text-xs text-ws-muted mb-8">{enquiry?.reference}</p>

          <div className="space-y-4">
            {quotes.map(q => (
              <Card key={q.id} className="relative">
                {q.id === closestQuote.id && (
                  <div
                    className="absolute -top-2.5 left-5 text-xs px-3 py-0.5 rounded-pill font-semibold"
                    style={{ background: '#EAF5EE', color: '#0E7A43', border: '1px solid rgba(21,160,90,0.3)' }}
                  >
                    Closest to your spec
                  </div>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-[11px] text-ws-muted uppercase tracking-wider font-semibold">Quote {q.label}</div>
                    <div
                      className="text-2xl font-bold text-ws-ink mt-0.5"
                      style={{ fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.02em' }}
                    >
                      {formatCurrency(q.total_price)}
                    </div>
                    <div className="text-sm text-ws-muted">Deposit: {formatCurrency(q.deposit_amount)}</div>
                  </div>
                  <Button onClick={() => handleSelect(q.id)} size="sm">Choose {q.label} →</Button>
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
        </>
      ) : (
        <>
          <div className="mb-8">
            <p className="eyebrow mb-2">Installer confirmed</p>
            <h1
              className="text-2xl font-bold text-ws-ink mb-2"
              style={{ fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.02em' }}
            >
              Here&apos;s who you&apos;ll be working with.
            </h1>
            <p className="text-sm text-ws-muted">
              We&apos;ve made the introduction. Expect to hear from them within one working day.
            </p>
          </div>

          {installer && (
            <Card className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
                  style={{ background: '#15A05A' }}
                >
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
                  <span
                    key={badge}
                    className="text-xs px-2.5 py-0.5 rounded-pill font-semibold"
                    style={{ background: '#EAF5EE', color: '#0E7A43', border: '1px solid rgba(21,160,90,0.2)' }}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </Card>
          )}

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ws-ink">Reviews</h2>
              <div className="flex border border-ws-border rounded-btn overflow-hidden">
                {(['google', 'trustpilot'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setReviewTab(tab)}
                    className="px-3 py-1.5 text-sm capitalize transition-colors font-medium"
                    style={{
                      background: reviewTab === tab ? '#15A05A' : '#fff',
                      color:      reviewTab === tab ? '#fff' : '#7C887F',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-ws-muted mb-4">Installer name removed from all reviews</p>

            {reviews.length === 0 ? (
              <div className="bg-ws-card rounded-card border border-ws-border p-6 text-center text-sm text-ws-muted">
                Newly verified installer — no reviews yet
              </div>
            ) : (
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
            )}
          </div>

          {!paymentDone && selectedQuote && (
            <div>
              <h2
                className="text-2xl font-bold text-ws-ink mb-2"
                style={{ fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.02em' }}
              >
                Secure your installation slot
              </h2>
              <p className="text-sm text-ws-muted mb-6">
                Pay your deposit to confirm your place. We hold it safely until your installation date is set.
              </p>

              <Card>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-ws-muted">Deposit</span>
                  <span className="font-semibold text-ws-ink">{formatCurrency(selectedQuote.deposit_amount)}</span>
                </div>
                <div className="flex justify-between text-sm mb-4 pb-4 border-b border-ws-border">
                  <span className="text-ws-muted">Total quote</span>
                  <span className="font-semibold text-ws-ink">{formatCurrency(selectedQuote.total_price)}</span>
                </div>

                <div className="flex items-center gap-2 mb-3 text-xs text-ws-muted">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  Secured by Stripe — fully refundable before installation is confirmed
                </div>

                <Button onClick={handlePayDeposit} loading={depositLoading} className="w-full">
                  Pay deposit & confirm →
                </Button>
              </Card>
            </div>
          )}

          {paymentDone && (
            <Card>
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-5" style={{ background: '#EAF5EE' }}>
                  <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" stroke="#15A05A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2
                  className="text-2xl font-bold text-ws-ink mb-2"
                  style={{ fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.02em' }}
                >
                  All confirmed.
                </h2>
                <p className="text-sm text-ws-muted">Your installer will be in touch soon. Good luck with your installation!</p>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
