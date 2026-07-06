'use client'

import { useState } from 'react'

export default function PayInvoiceButton({ invoiceId, amountLabel }: { invoiceId: string; amountLabel: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/installers/invoices/${invoiceId}/pay`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error || 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="mb-5">
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full bg-ws-green text-white rounded-btn px-6 py-3.5 font-bold text-sm hover:bg-ws-dark-green transition-colors disabled:opacity-60"
      >
        {loading ? 'Redirecting to secure payment…' : `Pay now — ${amountLabel}`}
      </button>
      {error && <p className="text-xs text-ws-red-text mt-2">{error}</p>}
    </div>
  )
}
