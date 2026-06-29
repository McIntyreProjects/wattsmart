'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface Props {
  jobId: string
  enquiryId: string
}

type PaymentScenario = 'wattsmart' | 'direct' | null

export function JobCompleteForm({ jobId, enquiryId }: Props) {
  const [scenario, setScenario] = useState<PaymentScenario>(null)
  const [finalAmount, setFinalAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const markComplete = async () => {
    const res = await fetch(`/api/installers/jobs/${jobId}/complete`, { method: 'POST' })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || 'Failed to mark job complete')
    }
  }

  const handleWattSmart = async () => {
    setLoading(true)
    setError('')
    try {
      await markComplete()
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleDirect = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(finalAmount)
    if (!amount || amount <= 0) {
      setError('Please enter a valid job value')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payments/report-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enquiryId, finalAmount: amount }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to report payment')
      }
      await markComplete()
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="bg-ws-green-tint border border-ws-green/30 rounded-card p-5">
        <p className="font-semibold text-ws-green-deep mb-1">Job marked as complete</p>
        <p className="text-sm text-ws-muted">
          {scenario === 'direct'
            ? 'Thanks — we\'ve logged the final job value and will send a fee invoice to your registered email within 24 hours.'
            : 'Great work. The job has been closed out successfully.'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-ws-card rounded-card border border-ws-border p-5">
      <h2 className="font-semibold text-ws-ink mb-1">Job completion</h2>
      <p className="text-sm text-ws-muted mb-5">How did the customer pay the remaining balance?</p>

      {!scenario && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => setScenario('wattsmart')}
            className="flex-1 rounded-lg border border-ws-border bg-ws-surface p-4 text-left hover:border-ws-green/50 hover:bg-ws-green-tint transition-colors"
          >
            <p className="font-medium text-ws-ink text-sm">Through WattSmart</p>
            <p className="text-xs text-ws-muted mt-0.5">The customer paid online via the WattSmart platform</p>
          </button>
          <button
            onClick={() => setScenario('direct')}
            className="flex-1 rounded-lg border border-ws-border bg-ws-surface p-4 text-left hover:border-ws-green/50 hover:bg-ws-green-tint transition-colors"
          >
            <p className="font-medium text-ws-ink text-sm">Directly to me</p>
            <p className="text-xs text-ws-muted mt-0.5">The customer paid you directly (bank transfer, cash, etc.)</p>
          </button>
        </div>
      )}

      {scenario === 'wattsmart' && (
        <div>
          <p className="text-sm text-ws-body mb-4">
            Great — we already have the payment on record. Click below to close out this job.
          </p>
          {error && <p className="text-sm text-ws-red-text mb-3">{error}</p>}
          <div className="flex gap-3">
            <Button onClick={handleWattSmart} loading={loading}>Mark job complete</Button>
            <button onClick={() => setScenario(null)} className="text-sm text-ws-muted hover:text-ws-body">Back</button>
          </div>
        </div>
      )}

      {scenario === 'direct' && (
        <form onSubmit={handleDirect}>
          <p className="text-sm text-ws-body mb-4">
            Enter the total value of the job (including VAT if applicable). We&apos;ll calculate the WattSmart fee and send you an invoice.
          </p>
          <label className="block text-sm font-medium text-ws-ink mb-1.5">
            Final job value (£)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={finalAmount}
            onChange={e => setFinalAmount(e.target.value)}
            placeholder="e.g. 8500"
            className="w-full max-w-xs rounded-lg border border-ws-border bg-ws-surface px-3 py-2 text-sm text-ws-ink placeholder:text-ws-muted focus:outline-none focus:ring-2 focus:ring-ws-green/40 mb-4"
            required
          />
          {finalAmount && parseFloat(finalAmount) > 0 && (
            <div className="text-xs text-ws-muted mb-4 bg-ws-surface rounded-lg border border-ws-border p-3 max-w-xs">
              Estimated fee: £{Math.max(parseFloat(finalAmount) * 0.05, 75).toFixed(2)}
              <span className="block mt-0.5">(5% of job value, min £75, minus deposit fee already collected)</span>
            </div>
          )}
          {error && <p className="text-sm text-ws-red-text mb-3">{error}</p>}
          <div className="flex gap-3 items-center">
            <Button type="submit" loading={loading}>Submit &amp; mark complete</Button>
            <button type="button" onClick={() => setScenario(null)} className="text-sm text-ws-muted hover:text-ws-body">Back</button>
          </div>
        </form>
      )}
    </div>
  )
}
