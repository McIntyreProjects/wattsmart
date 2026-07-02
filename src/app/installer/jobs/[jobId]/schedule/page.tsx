'use client'
import { useState } from 'react'
import Link from 'next/link'
import { use } from 'react'

export default function InstallerSchedulePage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params)
  const [date, setDate] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  if (submitted) {
    return (
      <div className="min-h-screen bg-ws-bg">
        <div className="max-w-[560px] mx-auto px-5 py-10 text-center">
          <div className="w-12 h-12 rounded-full bg-[#EAF5EE] flex items-center justify-center mx-auto mb-4">
            <span className="text-ws-green text-xl">✓</span>
          </div>
          <h2 className="font-display font-extrabold text-xl tracking-tight mb-2">Date proposed</h2>
          <p className="text-sm text-ws-muted mb-5">WattSmart will send it to the customer by app, email, and SMS. You'll be notified when they respond.</p>
          <Link href="/installer/dashboard" className="text-sm font-semibold text-ws-green">← Back to dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ws-bg">
      <nav className="bg-white border-b border-[#E4EAE6] px-6 py-4 flex items-center gap-4">
        <span className="font-display font-extrabold text-lg tracking-tight">WattSmart</span>
        <Link href="/installer/dashboard" className="text-sm text-ws-muted hover:text-ws-body">← Dashboard</Link>
      </nav>

      <div className="max-w-[560px] mx-auto px-5 py-8">
        <p className="eyebrow mb-1">Job #{jobId} · Solar</p>
        <h1 className="font-display font-extrabold text-2xl tracking-tight mb-1">Propose an install date</h1>
        <p className="text-sm text-ws-muted mb-6">Pick a date and WattSmart will send it to the customer for approval. You can only propose one date at a time — if they decline, they'll suggest an alternative.</p>

        <div className="bg-white border border-ws-border rounded-tile p-5 mb-4">
          <label className="block text-sm font-semibold mb-2">Proposed install date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full border border-ws-border rounded-btn px-3.5 py-2.5 text-sm focus:outline-none focus:border-ws-green"
          />
        </div>

        <div className="bg-[#EAF5EE] border border-[#CDE6D7] rounded-tile p-4 mb-5 text-sm text-ws-green-deep leading-relaxed">
          <p className="font-semibold mb-1">What WattSmart will do</p>
          <ul className="space-y-1 text-xs">
            <li>• Send this date to the customer by app, email, and SMS</li>
            <li>• If they accept: deposit is released to you and installation is confirmed</li>
            <li>• If they decline: they'll suggest an alternative date</li>
          </ul>
        </div>

        {submitError && (
          <p className="text-xs text-[#C2603F] mb-3">{submitError}</p>
        )}
        <button
          disabled={!date || submitting}
          onClick={async () => {
            setSubmitting(true)
            setSubmitError('')
            try {
              const res = await fetch(`/api/installers/jobs/${jobId}/schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proposedDate: date }),
              })
              const json = await res.json()
              if (!res.ok) {
                setSubmitError(json.error || 'Failed to propose date')
                return
              }
              setSubmitted(true)
            } catch {
              setSubmitError('Something went wrong — please try again')
            } finally {
              setSubmitting(false)
            }
          }}
          className="w-full bg-ws-green text-white rounded-btn py-3.5 font-bold text-sm hover:bg-ws-green-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? 'Proposing…' : `Propose ${date ? new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'date'} →`}
        </button>
      </div>
    </div>
  )
}
