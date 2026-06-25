'use client'
import { useState } from 'react'
import Link from 'next/link'
import { use } from 'react'

const BALANCE_OPTIONS = [
  { value: 3, label: '3 days before install' },
  { value: 7, label: '7 days before install' },
  { value: 14, label: '14 days before install' },
  { value: 0, label: 'On the day' },
]

export default function InstallerSchedulePage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params)
  const [date, setDate] = useState('')
  const [balanceDays, setBalanceDays] = useState(7)
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="min-h-screen bg-ws-body/5" style={{ background: '#E7EAE7' }}>
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
    <div className="min-h-screen" style={{ background: '#E7EAE7' }}>
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

        <div className="bg-white border border-ws-border rounded-tile p-5 mb-4">
          <label className="block text-sm font-semibold mb-1">Balance payment due</label>
          <p className="text-xs text-ws-muted mb-3">When should the customer pay the remaining balance? This is your default from your profile — change it per job if needed.</p>
          <div className="flex flex-col gap-2">
            {BALANCE_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="balance"
                  value={opt.value}
                  checked={balanceDays === opt.value}
                  onChange={() => setBalanceDays(opt.value)}
                  className="accent-ws-green"
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-[#EAF5EE] border border-[#CDE6D7] rounded-tile p-4 mb-5 text-sm text-ws-green-deep leading-relaxed">
          <p className="font-semibold mb-1">What WattSmart will do</p>
          <ul className="space-y-1 text-xs">
            <li>• Send this date to the customer by app, email, and SMS</li>
            <li>• If they accept: deposit is released to you, balance prompt triggered</li>
            <li>• If they decline: they'll suggest an alternative date</li>
          </ul>
        </div>

        <button
          disabled={!date}
          onClick={() => setSubmitted(true)}
          className="w-full bg-ws-green text-white rounded-btn py-3.5 font-bold text-sm hover:bg-ws-green-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Propose {date ? new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'date'} →
        </button>
      </div>
    </div>
  )
}
