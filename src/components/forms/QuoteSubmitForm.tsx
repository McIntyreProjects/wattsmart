'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface Props {
  jobId: string
  products: string[]
}

export function QuoteSubmitForm({ jobId, products }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    panelCount: '', systemKwp: '', batteryKwh: '',
    panelBrand: '', inverterBrand: '',
    totalPrice: '', depositAmount: '',
    estimatedInstallTimeframe: '', additionalNotes: '',
  })

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const hasSolar   = products.includes('solar')
  const hasBattery = products.includes('battery')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (form.depositAmount && form.totalPrice && parseFloat(form.depositAmount) >= parseFloat(form.totalPrice)) {
      setError('Deposit must be less than the total price.')
      setLoading(false)
      return
    }
    const res = await fetch('/api/quotes/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, ...form }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Failed to submit')
    else router.push('/installer/dashboard')
    setLoading(false)
  }

  function Field({ label, id, type = 'text', placeholder, required = false }: {
    label: string; id: keyof typeof form; type?: string; placeholder?: string; required?: boolean
  }) {
    return (
      <div>
        <label className="block text-sm font-semibold text-ws-ink mb-1.5">
          {label} {!required && <span className="text-ws-muted font-normal">(optional)</span>}
        </label>
        <input
          type={type}
          value={form[id]}
          onChange={e => set(id, e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full border border-ws-border rounded-btn px-4 py-3 text-sm text-ws-ink placeholder:text-ws-muted focus:outline-none focus:border-ws-green bg-white"
        />
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="font-semibold text-ws-ink text-[15px]">Submit your quote</h2>

      {hasSolar && (
        <>
          <Field label="Number of panels"   id="panelCount"    type="number" required />
          <Field label="System size (kWp)"  id="systemKwp"     type="number" placeholder="e.g. 4.2" required />
          <Field label="Panel brand/model"  id="panelBrand"    placeholder="e.g. LG NeON 2" />
          <Field label="Inverter brand"     id="inverterBrand" placeholder="e.g. SolarEdge SE5000" />
        </>
      )}

      {hasBattery && (
        <Field label="Battery size (kWh)" id="batteryKwh" type="number" placeholder="e.g. 10" />
      )}

      <Field label="Total price (inc. VAT)"       id="totalPrice"                  type="number" placeholder="e.g. 8500" required />
      <Field label="Deposit amount"                id="depositAmount"               type="number" placeholder="e.g. 2000" required />
      <Field label="Estimated install timeframe"   id="estimatedInstallTimeframe"   placeholder="e.g. 4–6 weeks from survey" required />

      <div>
        <label className="block text-sm font-semibold text-ws-ink mb-1.5">
          Notes for client <span className="text-ws-muted font-normal">(optional)</span>
        </label>
        <textarea
          value={form.additionalNotes}
          onChange={e => set('additionalNotes', e.target.value)}
          rows={3}
          placeholder="Anything the customer should know…"
          className="w-full border border-ws-border rounded-btn px-4 py-3 text-sm text-ws-ink placeholder:text-ws-muted focus:outline-none focus:border-ws-green bg-white resize-none"
        />
      </div>

      {error && <p className="text-ws-red-text text-sm">{error}</p>}

      <Button type="submit" loading={loading} className="w-full">
        Submit quote →
      </Button>
    </form>
  )
}
