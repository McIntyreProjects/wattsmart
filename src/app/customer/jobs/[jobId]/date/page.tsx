'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface JobDateInfo {
  reference: string
  installerName: string
  proposedDate: string | null
  depositAmount: number | null
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return {
    month: d.toLocaleString('en-GB', { month: 'short' }).toUpperCase(),
    day: d.getDate(),
    full: d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
  }
}

export default function ApproveInstallDatePage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string

  const [info, setInfo] = useState<JobDateInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showSuggest, setShowSuggest] = useState(false)
  const [suggestedDate, setSuggestedDate] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/customer/jobs/${jobId}/date-info`)
        if (!res.ok) throw new Error('Failed to load job')
        const data = await res.json()
        setInfo(data)
      } catch {
        setError('Could not load install date details.')
      } finally {
        setLoading(false)
      }
    }
    fetchJob()
  }, [jobId])

  async function handleAccept() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/customer/jobs/${jobId}/date`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Failed to accept date')
      }
      router.push(`/customer/jobs/${jobId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  async function handleSuggest() {
    if (!suggestedDate) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/customer/jobs/${jobId}/date`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suggest', suggestedDate }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Failed to send suggestion')
      }
      router.push(`/customer/jobs/${jobId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  const dateDisplay = info?.proposedDate ? formatDate(info.proposedDate) : null

  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Link href={`/customer/jobs/${jobId}`} className="text-ws-muted text-lg">←</Link>
          <h1 className="font-display font-extrabold text-2xl tracking-tight">Your install</h1>
        </div>

        {loading && (
          <p className="text-sm text-ws-muted">Loading…</p>
        )}

        {!loading && error && !info && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {!loading && info && (
          <>
            {/* Job card */}
            <div className="flex justify-between items-center border border-ws-border rounded-tile p-4 mb-5">
              <div>
                <p className="text-xs text-ws-subtle">{info.reference} · {info.installerName}</p>
              </div>
              {info.depositAmount !== null && (
                <div className="text-right">
                  <p className="text-xs text-ws-subtle">Deposit</p>
                  <p className="font-display font-extrabold text-base text-ws-dark-green">
                    £{info.depositAmount.toLocaleString('en-GB')} held
                  </p>
                </div>
              )}
            </div>

            {dateDisplay ? (
              <>
                {/* Action needed pill */}
                <div className="inline-flex items-center gap-2 bg-ws-green-tint text-ws-dark-green rounded-pill px-3 py-1.5 text-xs font-bold mb-3">
                  Action needed
                </div>

                <h2 className="font-display font-extrabold text-xl leading-tight tracking-tight mb-2">
                  {info.installerName} proposed your install date
                </h2>
                <p className="text-sm text-ws-muted leading-relaxed mb-4">
                  Does this work for you? Accept to lock it in, or suggest a day that suits you better.
                </p>

                {/* Date tile */}
                <div className="border border-ws-border rounded-tile p-4 flex items-center gap-4 mb-4">
                  <div className="flex-shrink-0 w-14 text-center bg-ws-green-tint rounded-xl py-2.5">
                    <p className="text-xs font-bold text-ws-dark-green tracking-widest">{dateDisplay.month}</p>
                    <p className="font-display font-extrabold text-2xl text-ws-dark-green leading-none">{dateDisplay.day}</p>
                  </div>
                  <div>
                    <p className="font-display font-extrabold text-base">{dateDisplay.full}</p>
                    <p className="text-xs text-ws-subtle mt-0.5">From 8:00am · ~1 day on site</p>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-600 mb-3">{error}</p>
                )}

                {!showSuggest ? (
                  <>
                    {/* Actions */}
                    <div className="flex gap-3 mb-4">
                      <button
                        onClick={handleAccept}
                        disabled={submitting}
                        className="flex-1 bg-ws-green text-white rounded-btn py-3.5 font-bold text-sm hover:bg-ws-dark-green transition-colors disabled:opacity-50"
                      >
                        {submitting ? 'Confirming…' : 'Accept date'}
                      </button>
                      <button
                        onClick={() => setShowSuggest(true)}
                        disabled={submitting}
                        className="flex-1 bg-white text-ws-dark-green border-[1.5px] border-[#CFE3D7] rounded-btn py-3.5 font-bold text-sm hover:bg-ws-green-tint transition-colors disabled:opacity-50"
                      >
                        Suggest another
                      </button>
                    </div>

                    {/* Info note */}
                    <div className="flex items-start gap-2 bg-[#F2F6F3] rounded-tile px-4 py-3">
                      <span className="text-ws-green mt-px">→</span>
                      <p className="text-xs text-ws-muted leading-relaxed">
                        Accepting locks in your install date and notifies {info.installerName}.
                        {info.depositAmount !== null && ` Your £${info.depositAmount.toLocaleString('en-GB')} deposit is already held.`}
                      </p>
                    </div>
                  </>
                ) : (
                  /* Suggest another date form */
                  <div className="border border-ws-border rounded-tile p-4">
                    <p className="font-bold text-sm mb-3">Suggest a different date</p>
                    <input
                      type="date"
                      value={suggestedDate}
                      onChange={e => setSuggestedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full border border-ws-border rounded-btn px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-ws-green"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleSuggest}
                        disabled={submitting || !suggestedDate}
                        className="flex-1 bg-ws-green text-white rounded-btn py-3 font-bold text-sm hover:bg-ws-dark-green transition-colors disabled:opacity-50"
                      >
                        {submitting ? 'Sending…' : 'Send suggestion'}
                      </button>
                      <button
                        onClick={() => setShowSuggest(false)}
                        disabled={submitting}
                        className="flex-1 bg-white text-ws-muted border border-ws-border rounded-btn py-3 font-bold text-sm hover:bg-[#F2F6F3] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="border border-ws-border rounded-tile p-4">
                <p className="text-sm text-ws-muted">No install date has been proposed yet. Your installer will be in touch soon.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
